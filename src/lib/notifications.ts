import { Expense, monthlyInCurrency, Currency } from "@/lib/expenses";

export type NotifSeverity = "critical" | "warning" | "info" | "success";
export type NotifKind =
  | "renewal_due"
  | "renewal_overdue"
  | "paused_sub"
  | "cancelled_active"
  | "high_vat"
  | "fx_exposure"
  | "large_one_time"
  | "scenario_pending";

export interface AppNotification {
  id: string;             // stable id derived from kind + expense
  kind: NotifKind;
  severity: NotifSeverity;
  title: string;
  body: string;
  timestamp: string;      // ISO
  expense_id?: string;
  action_label?: string;
  action_route?: string;
}

const daysBetween = (iso: string) => {
  const target = new Date(iso).getTime();
  const now = Date.now();
  return Math.round((target - now) / 86400000);
};

const fmtMoney = (n: number, c: Currency) =>
  `${c} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const buildNotifications = (
  expenses: Expense[],
  currency: Currency,
): AppNotification[] => {
  const out: AppNotification[] = [];

  for (const e of expenses) {
    // Renewals
    if (e.status === "active" && e.billing_cycle !== "one_time") {
      const days = daysBetween(e.next_renewal);
      if (days < 0) {
        out.push({
          id: `overdue-${e.id}`,
          kind: "renewal_overdue",
          severity: "critical",
          title: `${e.name} renewal overdue`,
          body: `Renewal date passed ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago. Confirm payment status.`,
          timestamp: e.next_renewal,
          expense_id: e.id,
          action_label: "Open in Ledger",
          action_route: "/ledger",
        });
      } else if (days <= 7) {
        out.push({
          id: `due-${e.id}`,
          kind: "renewal_due",
          severity: "warning",
          title: `${e.name} renews in ${days} day${days === 1 ? "" : "s"}`,
          body: `${fmtMoney(e.total_amount + e.vat_amount, e.currency)} will be charged on ${new Date(e.next_renewal).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}.`,
          timestamp: e.next_renewal,
          expense_id: e.id,
          action_label: "Review",
          action_route: "/ledger",
        });
      }
    }

    // Paused subscriptions still on books
    if (e.status === "paused") {
      out.push({
        id: `paused-${e.id}`,
        kind: "paused_sub",
        severity: "info",
        title: `${e.name} is paused`,
        body: `${e.vendor ?? "Vendor"} subscription paused — decide whether to resume or cancel.`,
        timestamp: new Date().toISOString(),
        expense_id: e.id,
        action_label: "Manage",
        action_route: "/ledger",
      });
    }

    // Cancelled but recently active
    if (e.status === "cancelled") {
      const days = daysBetween(e.next_renewal);
      if (days >= -14) {
        out.push({
          id: `cancelled-${e.id}`,
          kind: "cancelled_active",
          severity: "success",
          title: `${e.name} cancelled`,
          body: `Recurring charge stopped. Estimated savings ${fmtMoney(monthlyInCurrency({ ...e, status: "active" }, currency), currency)}/mo.`,
          timestamp: e.next_renewal,
          expense_id: e.id,
        });
      }
    }

    // Large one-time purchases
    if (e.type === "one_time" && e.total_amount >= 1000) {
      out.push({
        id: `onetime-${e.id}`,
        kind: "large_one_time",
        severity: "info",
        title: `Large purchase logged: ${e.name}`,
        body: `${fmtMoney(e.total_amount, e.currency)} one-time expense recorded.`,
        timestamp: new Date().toISOString(),
        expense_id: e.id,
      });
    }
  }

  // FX exposure: significant USD-denominated active monthly spend
  const usdMonthly = expenses
    .filter(e => e.status === "active" && e.currency === "USD")
    .reduce((s, e) => s + monthlyInCurrency(e, "USD"), 0);
  if (usdMonthly > 2000) {
    out.push({
      id: "fx-exposure",
      kind: "fx_exposure",
      severity: "warning",
      title: "USD exposure rising",
      body: `Monthly USD-denominated spend now ${fmtMoney(usdMonthly, "USD")}. Consider an FX hedge review.`,
      timestamp: new Date().toISOString(),
      action_label: "View Analytics",
      action_route: "/",
    });
  }

  // VAT load summary
  const vatMonthly = expenses
    .filter(e => e.status === "active" && e.includes_vat)
    .reduce((s, e) => s + monthlyInCurrency({ ...e, total_amount: e.vat_amount, vat_amount: 0 }, currency), 0);
  if (vatMonthly > 50) {
    out.push({
      id: "vat-load",
      kind: "high_vat",
      severity: "info",
      title: "VAT obligations updated",
      body: `Active expenses generating ~${fmtMoney(vatMonthly, currency)}/mo in 5% VAT.`,
      timestamp: new Date().toISOString(),
      action_label: "Open Analytics",
      action_route: "/",
    });
  }

  // Sort: critical first, then warning, info, success; newest within
  const order: Record<NotifSeverity, number> = { critical: 0, warning: 1, info: 2, success: 3 };
  out.sort((a, b) => {
    if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity];
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return out;
};
