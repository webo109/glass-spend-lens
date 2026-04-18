import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Currency, Expense, formatMoney, monthlyInCurrency, totalsFor, convert } from "@/lib/expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, FlaskConical, ArrowUpRight, Wand2, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";

interface Draft {
  id: string;
  name: string;
  currency: Currency;
  base_rate: number;
  quantity: number;
  billing: 'monthly' | 'annual';
  includes_vat: boolean;
}

const draftToExpense = (d: Draft): Expense => {
  const total = d.base_rate * d.quantity;
  return {
    id: d.id, name: d.name, category: "Scenario", type: "scenario",
    currency: d.currency, base_rate: d.base_rate, quantity: d.quantity,
    total_amount: total, vat_amount: d.includes_vat ? +(total * 0.05).toFixed(2) : 0,
    includes_vat: d.includes_vat, billing_cycle: d.billing,
    status: "active", next_renewal: new Date().toISOString(),
  };
};

export const Sandbox = () => {
  const { expenses, currency, addExpense } = useApp();
  const baseline = totalsFor(expenses, currency);

  const [drafts, setDrafts] = useState<Draft[]>([
    { id: "d1", name: "Mobile Lines (Sales)", currency: "OMR", base_rate: 12, quantity: 5, billing: "monthly", includes_vat: true },
  ]);

  const [form, setForm] = useState<Omit<Draft, "id">>({
    name: "", currency: "OMR", base_rate: 0, quantity: 1, billing: "monthly", includes_vat: true,
  });

  const [promoteDraft, setPromoteDraft] = useState<Draft | null>(null);

  const add = () => {
    if (!form.name || form.base_rate <= 0 || form.quantity <= 0) return;
    setDrafts(prev => [...prev, { ...form, id: `d-${Date.now()}` }]);
    setForm({ name: "", currency: "OMR", base_rate: 0, quantity: 1, billing: "monthly", includes_vat: true });
  };

  const remove = (id: string) => setDrafts(prev => prev.filter(d => d.id !== id));

  const confirmPromote = async () => {
    if (!promoteDraft) return;
    const d = promoteDraft;
    const total = d.base_rate * d.quantity;
    await addExpense({
      name: d.name,
      category: "Planned",
      type: "subscription",
      currency: d.currency,
      base_rate: d.base_rate,
      quantity: d.quantity,
      total_amount: total,
      vat_amount: d.includes_vat ? +(total * 0.05).toFixed(2) : 0,
      includes_vat: d.includes_vat,
      billing_cycle: d.billing,
      status: "planned",
      next_renewal: new Date().toISOString(),
    });
    setDrafts(prev => prev.filter(x => x.id !== d.id));
    setPromoteDraft(null);
    toast.success(`"${d.name}" added to ledger as Planned`);
  };

  const draftsMonthly = useMemo(
    () => drafts.reduce((s, d) => s + monthlyInCurrency(draftToExpense(d), currency), 0),
    [drafts, currency]
  );

  const newMonthly = baseline.monthly + draftsMonthly;
  const newAnnual = newMonthly * 12;
  const delta = newMonthly - baseline.monthly;
  const deltaPct = baseline.monthly ? (delta / baseline.monthly) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
            <Wand2 className="h-3 w-3" /> Sandbox Mode
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">What-If Scenario Estimator</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stack hypothetical expenses on top of your live baseline to forecast impact instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Form + Drafts */}
        <div className="space-y-4 lg:col-span-3">
          <div className="glass rounded-2xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-accent" />
              <h3 className="font-display text-lg font-semibold">Add Draft Expense</h3>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="grid gap-1.5 md:col-span-2">
                <Label>Name</Label>
                <Input placeholder="e.g. Add 5 mobile lines" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="grid gap-1.5">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v as Currency })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OMR">OMR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label>Billing</Label>
                <Select value={form.billing} onValueChange={(v) => setForm({ ...form, billing: v as 'monthly' | 'annual' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label>Base Rate</Label>
                <Input type="number" step="0.01" value={form.base_rate || ""}
                  onChange={(e) => setForm({ ...form, base_rate: parseFloat(e.target.value) || 0 })} />
              </div>

              <div className="grid gap-1.5">
                <Label>Quantity</Label>
                <Input type="number" min="1" value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} />
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 bg-card/40 p-2.5 md:col-span-2">
                <Checkbox checked={form.includes_vat} onCheckedChange={(v) => setForm({ ...form, includes_vat: !!v })} />
                <span className="text-sm">Apply 5% VAT</span>
              </label>
            </div>

            <Button onClick={add} className="mt-4 w-full gap-1.5 bg-gradient-accent text-accent-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> Add to scenario
            </Button>
          </div>

          <div className="glass rounded-2xl p-5">
            <h3 className="mb-3 font-display text-lg font-semibold">
              Drafts <span className="text-sm font-normal text-muted-foreground">({drafts.length})</span>
            </h3>
            <ul className="space-y-2">
              {drafts.map(d => {
                const monthly = monthlyInCurrency(draftToExpense(d), currency);
                return (
                  <li key={d.id} className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                      <FlaskConical className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {d.base_rate} {d.currency} × {d.quantity} · {d.billing}{d.includes_vat ? " · +VAT" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="num text-sm font-semibold">{formatMoney(monthly, currency)}</p>
                      <p className="text-[10px] text-muted-foreground">/mo</p>
                    </div>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setPromoteDraft(d)}
                      className="h-7 gap-1 border-info/30 bg-info/10 px-2 text-[11px] text-info hover:bg-info/20 hover:text-info"
                    >
                      <ArrowUpCircle className="h-3.5 w-3.5" /> Add to Ledger
                    </Button>
                    <button onClick={() => remove(d.id)}
                      className="rounded-md p-1.5 text-muted-foreground transition hover:bg-expense/10 hover:text-expense">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
              {drafts.length === 0 && (
                <li className="rounded-xl border border-dashed border-border/40 p-8 text-center text-sm text-muted-foreground">
                  No drafts yet. Add one above to see the impact.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="glass-strong sticky top-20 rounded-2xl p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Scenario Impact</p>
            <h3 className="mt-1 font-display text-lg font-semibold">Live Forecast</h3>

            <div className="mt-5 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Baseline (actual)</span>
                <span className="num text-sm font-medium">{formatMoney(baseline.monthly, currency)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Drafts</span>
                <span className="num text-sm font-medium text-accent">+ {formatMoney(draftsMonthly, currency)}</span>
              </div>
              <div className="my-3 h-px bg-border/60" />

              <div className="rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-glow">Projected Monthly</p>
                <p className="num mt-1 font-display text-3xl font-bold tracking-tight">{formatMoney(newMonthly, currency)}</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  <ArrowUpRight className="h-3.5 w-3.5 text-expense" />
                  <span className="font-semibold text-expense">+{formatMoney(delta, currency)}</span>
                  <span className="text-muted-foreground">({deltaPct.toFixed(1)}% increase)</span>
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between rounded-lg bg-card/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">New Annual Run Rate</span>
                <span className="num text-sm font-semibold">{formatMoney(newAnnual, currency)}</span>
              </div>
              <div className="flex items-baseline justify-between rounded-lg bg-card/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">12-mo delta vs baseline</span>
                <span className="num text-sm font-semibold text-expense">+{formatMoney(delta * 12, currency)}</span>
              </div>
            </div>

            <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
              Forecast is normalized to <span className="font-semibold text-foreground">{currency}</span> using current FX.
              Drafts do not affect the live ledger.
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={!!promoteDraft} onOpenChange={(o) => !o && setPromoteDraft(null)}>
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle>Add to Expense Ledger?</AlertDialogTitle>
            <AlertDialogDescription>
              Move this draft to your Expense Ledger as a Planned expense?
              {promoteDraft && (
                <span className="mt-3 block rounded-lg border border-info/20 bg-info/5 p-3 text-foreground">
                  <span className="block text-sm font-medium">{promoteDraft.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {promoteDraft.base_rate} {promoteDraft.currency} × {promoteDraft.quantity} · {promoteDraft.billing}
                    {promoteDraft.includes_vat ? " · +5% VAT" : ""}
                  </span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPromote}
              className="bg-info text-info-foreground hover:bg-info/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
