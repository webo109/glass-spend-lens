import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Expense, formatMoney, convert } from "@/lib/expenses";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QuickAddDialog } from "@/components/QuickAddDialog";
import { EditExpenseDialog } from "@/components/EditExpenseDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Filter, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const StatusBadge = ({ s }: { s: Expense["status"] }) => {
  const map = {
    active: "border-success/30 bg-success/10 text-success",
    paused: "border-warning/30 bg-warning/10 text-warning",
    cancelled: "border-expense/30 bg-expense/10 text-expense",
  } as const;
  return <Badge variant="outline" className={`capitalize ${map[s]}`}>{s}</Badge>;
};

const TypeBadge = ({ t }: { t: Expense["type"] }) => {
  const map = {
    subscription: "border-primary/30 bg-primary/10 text-primary-glow",
    one_time: "border-info/30 bg-info/10 text-info",
    scenario: "border-accent/30 bg-accent/10 text-accent",
  } as const;
  return <Badge variant="outline" className={`capitalize ${map[t]}`}>{t.replace("_", " ")}</Badge>;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const Ledger = () => {
  const { expenses, currency } = useApp();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return expenses.filter(e =>
      e.name.toLowerCase().includes(s) ||
      e.vendor?.toLowerCase().includes(s) ||
      e.category.toLowerCase().includes(s)
    );
  }, [expenses, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Expense Ledger</h1>
          <p className="mt-1 text-sm text-muted-foreground">All recorded expenses. Costs shown in original currency.</p>
        </div>
        <QuickAddDialog />
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="flex flex-col items-stretch gap-3 border-b border-border/40 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, vendor, category…"
              className="h-9 border-border/50 bg-card/40 pl-9"
            />
          </div>
          <button className="flex items-center gap-1.5 rounded-md border border-border/50 bg-card/40 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
          <div className="text-xs text-muted-foreground">
            <span className="num font-semibold text-foreground">{filtered.length}</span> of {expenses.length} entries
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-[11px] uppercase tracking-wider">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider">Type</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wider">Cost</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wider">VAT (5%)</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider">Cycle</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wider">Next Renewal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id} className="border-border/30 transition hover:bg-card/40">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{e.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {e.vendor} · {e.category} · {e.base_rate} × {e.quantity}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell><TypeBadge t={e.type} /></TableCell>
                  <TableCell className="num text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-semibold">{formatMoney(e.total_amount, e.currency)}</span>
                      <span className="text-[10px] text-muted-foreground">
                        ≈ {formatMoney(convert(e.total_amount, e.currency, currency), currency)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="num text-right text-muted-foreground">
                    {e.vat_amount > 0 ? formatMoney(e.vat_amount, e.currency) : "—"}
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{e.billing_cycle.replace("_", " ")}</TableCell>
                  <TableCell><StatusBadge s={e.status} /></TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {e.billing_cycle === "one_time" ? "—" : fmtDate(e.next_renewal)}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    No expenses match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
