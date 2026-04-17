import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useApp } from "@/context/AppContext";
import { BillingCycle, Currency, Expense, ExpenseType, Status } from "@/lib/expenses";
import { toast } from "sonner";

interface Props {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const toDateInput = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export const EditExpenseDialog = ({ expense, open, onOpenChange }: Props) => {
  const { updateExpense } = useApp();
  const [form, setForm] = useState<Expense | null>(expense);

  useEffect(() => setForm(expense), [expense]);

  if (!form) return null;

  const set = <K extends keyof Expense>(k: K, v: Expense[K]) =>
    setForm(prev => (prev ? { ...prev, [k]: v } : prev));

  const save = () => {
    if (!form.name.trim() || isNaN(form.base_rate) || isNaN(form.quantity)) {
      toast.error("Please fill in all required fields.");
      return;
    }
    updateExpense(form.id, form);
    toast.success(`Updated "${form.name}"`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Expense</DialogTitle>
          <DialogDescription>Update details. Totals and VAT recalculate automatically.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="e-name">Name</Label>
            <Input id="e-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="e-vendor">Vendor</Label>
              <Input id="e-vendor" value={form.vendor ?? ""} onChange={(e) => set("vendor", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="e-cat">Category</Label>
              <Input id="e-cat" value={form.category} onChange={(e) => set("category", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v as ExpenseType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="one_time">One-Time</SelectItem>
                  <SelectItem value="scenario">Scenario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => set("currency", v as Currency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OMR">OMR — Omani Rial</SelectItem>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="e-rate">Base Rate</Label>
              <Input
                id="e-rate" type="number" step="0.01"
                value={form.base_rate}
                onChange={(e) => set("base_rate", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="e-qty">Quantity</Label>
              <Input
                id="e-qty" type="number" min="1"
                value={form.quantity}
                onChange={(e) => set("quantity", parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Billing Cycle</Label>
              <Select value={form.billing_cycle} onValueChange={(v) => set("billing_cycle", v as BillingCycle)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="one_time">One-Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as Status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.billing_cycle !== "one_time" && (
            <div className="grid gap-1.5">
              <Label htmlFor="e-renew">Next Renewal</Label>
              <Input
                id="e-renew" type="date"
                value={toDateInput(form.next_renewal)}
                onChange={(e) => set("next_renewal", new Date(e.target.value).toISOString())}
              />
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 bg-card/40 p-3">
            <Checkbox checked={form.includes_vat} onCheckedChange={(v) => set("includes_vat", !!v)} />
            <div className="text-sm">
              <p className="font-medium">Includes 5% VAT</p>
              <p className="text-xs text-muted-foreground">Recalculates VAT line on save.</p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
