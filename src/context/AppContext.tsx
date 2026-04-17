import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Currency, Expense, mockExpenses } from "@/lib/expenses";
import { AppNotification, buildNotifications } from "@/lib/notifications";

export type ViewMode = 'monthly' | 'annual';

interface AppCtx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  expenses: Expense[];
  addExpense: (e: Expense) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  // Notifications
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearDismissed: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

const recalc = (e: Expense): Expense => {
  const total = e.base_rate * e.quantity;
  return {
    ...e,
    total_amount: total,
    vat_amount: e.includes_vat ? +(total * 0.05).toFixed(2) : 0,
  };
};

const READ_KEY = "ledgerly:notif:read";
const DISMISSED_KEY = "ledgerly:notif:dismissed";

const loadSet = (key: string): Set<string> => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
};

const saveSet = (key: string, set: Set<string>) => {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* ignore */ }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>('OMR');
  const [view, setView] = useState<ViewMode>('monthly');
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadSet(READ_KEY));
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => loadSet(DISMISSED_KEY));

  useEffect(() => saveSet(READ_KEY, readIds), [readIds]);
  useEffect(() => saveSet(DISMISSED_KEY, dismissedIds), [dismissedIds]);

  const notifications = useMemo(() => {
    const all = buildNotifications(expenses, currency);
    return all.filter(n => !dismissedIds.has(n.id));
  }, [expenses, currency, dismissedIds]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !readIds.has(n.id)).length,
    [notifications, readIds],
  );

  const markRead = useCallback((id: string) => {
    setReadIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev); next.add(id); return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      return next;
    });
  }, [notifications]);

  const dismiss = useCallback((id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev); next.add(id); return next;
    });
  }, []);

  const clearDismissed = useCallback(() => setDismissedIds(new Set()), []);

  const value = useMemo<AppCtx>(() => ({
    currency, setCurrency, view, setView, expenses,
    addExpense: (e: Expense) => setExpenses(prev => [e, ...prev]),
    updateExpense: (id: string, patch: Partial<Expense>) =>
      setExpenses(prev => prev.map(e => (e.id === id ? recalc({ ...e, ...patch }) : e))),
    deleteExpense: (id: string) => setExpenses(prev => prev.filter(e => e.id !== id)),
    notifications, unreadCount, markRead, markAllRead, dismiss, clearDismissed,
  }), [currency, view, expenses, notifications, unreadCount, markRead, markAllRead, dismiss, clearDismissed]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be inside AppProvider");
  return c;
};

// Re-export so views can import from a single place
export type { AppNotification } from "@/lib/notifications";
