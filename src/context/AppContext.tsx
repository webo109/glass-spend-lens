import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Currency, Expense } from "@/lib/expenses";
import { AppNotification, buildNotifications } from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type ViewMode = 'monthly' | 'annual';

interface AppCtx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  expenses: Expense[];
  loading: boolean;
  addExpense: (e: Omit<Expense, 'id'> | Expense) => Promise<void>;
  updateExpense: (id: string, patch: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  // Notifications
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  clearDismissed: () => Promise<void>;
}

const Ctx = createContext<AppCtx | null>(null);

const recalc = (e: Partial<Expense> & { base_rate: number; quantity: number; includes_vat: boolean }) => {
  const total = e.base_rate * e.quantity;
  return {
    total_amount: total,
    vat_amount: e.includes_vat ? +(total * 0.05).toFixed(2) : 0,
  };
};

// Map DB row → Expense (numerics come as strings)
const fromRow = (r: any): Expense => ({
  id: r.id,
  name: r.name,
  vendor: r.vendor ?? undefined,
  category: r.category,
  type: r.type,
  currency: r.currency,
  base_rate: Number(r.base_rate),
  quantity: r.quantity,
  total_amount: Number(r.total_amount),
  vat_amount: Number(r.vat_amount),
  includes_vat: r.includes_vat,
  billing_cycle: r.billing_cycle,
  status: r.status,
  next_renewal: r.next_renewal,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<Currency>('OMR');
  const [view, setView] = useState<ViewMode>('monthly');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Load expenses + notification state when user logs in
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setReadIds(new Set());
      setDismissedIds(new Set());
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    (async () => {
      const [{ data: ex, error: exErr }, { data: ns, error: nsErr }] = await Promise.all([
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('notification_state').select('*').eq('user_id', user.id),
      ]);

      if (!active) return;

      if (exErr) toast.error(`Failed to load expenses: ${exErr.message}`);
      else setExpenses((ex ?? []).map(fromRow));

      if (nsErr) toast.error(`Failed to load notifications: ${nsErr.message}`);
      else {
        setReadIds(new Set((ns ?? []).filter(n => n.is_read).map(n => n.notification_id)));
        setDismissedIds(new Set((ns ?? []).filter(n => n.is_dismissed).map(n => n.notification_id)));
      }

      setLoading(false);
    })();

    // Realtime sync for shared expenses
    const channel = supabase
      .channel('expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
        setExpenses(prev => {
          if (payload.eventType === 'INSERT') {
            const row = fromRow(payload.new);
            if (prev.some(e => e.id === row.id)) return prev;
            return [row, ...prev];
          }
          if (payload.eventType === 'UPDATE') {
            const row = fromRow(payload.new);
            return prev.map(e => e.id === row.id ? row : e);
          }
          if (payload.eventType === 'DELETE') {
            return prev.filter(e => e.id !== (payload.old as any).id);
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const notifications = useMemo(() => {
    const all = buildNotifications(expenses, currency);
    return all.filter(n => !dismissedIds.has(n.id));
  }, [expenses, currency, dismissedIds]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !readIds.has(n.id)).length,
    [notifications, readIds],
  );

  const addExpense = useCallback(async (e: Omit<Expense, 'id'> | Expense) => {
    if (!user) return;
    const { id: _ignore, ...rest } = e as Expense;
    const totals = recalc(rest);
    const { data, error } = await supabase.from('expenses').insert({
      ...rest,
      ...totals,
      created_by: user.id,
    } as any).select().single();
    if (error) {
      toast.error(`Add failed: ${error.message}`);
      return;
    }
    if (data) {
      const row = fromRow(data);
      setExpenses(prev => prev.some(x => x.id === row.id) ? prev : [row, ...prev]);
    }
  }, [user]);

  const updateExpense = useCallback(async (id: string, patch: Partial<Expense>) => {
    const current = expenses.find(e => e.id === id);
    if (!current) return;
    const merged = { ...current, ...patch };
    const totals = recalc(merged);
    const { id: _, ...payload } = { ...merged, ...totals };
    const { data, error } = await supabase.from('expenses').update(payload as any).eq('id', id).select().single();
    if (error) {
      toast.error(`Update failed: ${error.message}`);
      return;
    }
    if (data) {
      const row = fromRow(data);
      setExpenses(prev => prev.map(e => e.id === row.id ? row : e));
    }
  }, [expenses]);

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const upsertNotifState = useCallback(async (
    notification_id: string,
    patch: { is_read?: boolean; is_dismissed?: boolean },
  ) => {
    if (!user) return;
    const { error } = await supabase.from('notification_state').upsert(
      { user_id: user.id, notification_id, ...patch },
      { onConflict: 'user_id,notification_id' },
    );
    if (error) toast.error(`Notification sync failed: ${error.message}`);
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    setReadIds(prev => { if (prev.has(id)) return prev; const n = new Set(prev); n.add(id); return n; });
    await upsertNotifState(id, { is_read: true });
  }, [upsertNotifState]);

  const markAllRead = useCallback(async () => {
    const ids = notifications.map(n => n.id);
    setReadIds(prev => { const n = new Set(prev); ids.forEach(i => n.add(i)); return n; });
    if (!user || ids.length === 0) return;
    const rows = ids.map(notification_id => ({ user_id: user.id, notification_id, is_read: true }));
    const { error } = await supabase.from('notification_state').upsert(rows, { onConflict: 'user_id,notification_id' });
    if (error) toast.error(`Sync failed: ${error.message}`);
  }, [notifications, user]);

  const dismiss = useCallback(async (id: string) => {
    setDismissedIds(prev => { const n = new Set(prev); n.add(id); return n; });
    await upsertNotifState(id, { is_dismissed: true, is_read: true });
  }, [upsertNotifState]);

  const clearDismissed = useCallback(async () => {
    setDismissedIds(new Set());
    if (!user) return;
    const { error } = await supabase
      .from('notification_state')
      .update({ is_dismissed: false })
      .eq('user_id', user.id)
      .eq('is_dismissed', true);
    if (error) toast.error(`Restore failed: ${error.message}`);
  }, [user]);

  const value = useMemo<AppCtx>(() => ({
    currency, setCurrency, view, setView, expenses, loading,
    addExpense, updateExpense, deleteExpense,
    notifications, unreadCount, markRead, markAllRead, dismiss, clearDismissed,
  }), [currency, view, expenses, loading, addExpense, updateExpense, deleteExpense,
       notifications, unreadCount, markRead, markAllRead, dismiss, clearDismissed]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be inside AppProvider");
  return c;
};

export type { AppNotification } from "@/lib/notifications";
