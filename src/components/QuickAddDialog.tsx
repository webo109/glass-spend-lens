import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useApp } from "@/context/AppContext";
import { Currency, Expense, ExpenseType, BillingCycle } from "@/lib/expenses";
import { toast } from "sonner";

export const QuickAddDialog = () => {
  const { addExpense } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ExpenseType>("subscription");
  const [currency, setCurrency] = useState<Currency>("OMR");
  const [baseRate, setBaseRate] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [includesVat, setIncludesVat] = useState(true);

  const reset = () => {
    setName(""); setType("subscription"); setCurrency("OMR");
    setBaseRate(""); setQuantity("1"); setBilling("monthly"); setIncludesVat(true);
  };

  const submit = async () => {
    const rate = parseFloat(baseRate);
    const qty = parseInt(quantity, 10);
    if (!name || isNaN(rate) || isNaN(qty)) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const total = rate * qty;
    const expense = {
      name, vendor: "—", category: "Custom",
      type, currency,
      base_rate: rate, quantity: qty,
      total_amount: total,
      vat_amount: includesVat ? +(total * 0.05).toFixed(2) : 0,
      includes_vat: includesVat,
      billing_cycle: (type === "one_time" ? "one_time" : billing) as Expense["billing_cycle"],
      status: "active" as Expense["status"],
      next_renewal: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    await addExpense(expense as Expense);
    toast.success(`Added "${name}"`);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
          <Plus className="h-4 w-4" /> Quick Add
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Expense</DialogTitle>
          <DialogDescription>Record a new subscription or one-off purchase.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. Vercel Pro" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ExpenseType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="one_time">One-Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
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
              <Label htmlFor="rate">Base Rate</Label>
              <Input id="rate" type="number" step="0.01" placeholder="0.00" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="qty">Quantity</Label>
              <Input id="qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
          </div>

          {type === "subscription" && (
            <div className="grid gap-1.5">
              <Label>Billing Cycle</Label>
              <Select value={billing} onValueChange={(v) => setBilling(v as BillingCycle)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 bg-card/40 p-3">
            <Checkbox checked={includesVat} onCheckedChange={(v) => setIncludesVat(!!v)} />
            <div className="text-sm">
              <p className="font-medium">Includes 5% VAT</p>
              <p className="text-xs text-muted-foreground">Adds VAT line item to this expense.</p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            Add Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
