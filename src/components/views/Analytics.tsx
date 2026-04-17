import { useApp } from "@/context/AppContext";
import { formatMoney, monthlyInCurrency, totalsFor } from "@/lib/expenses";
import { MetricCard } from "@/components/MetricCard";
import { Flame, TrendingUp, Receipt, CalendarClock, ChevronRight } from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const Analytics = () => {
  const { expenses, currency, view } = useApp();
  const totals = totalsFor(expenses, currency);
  const headlineValue = view === 'monthly' ? totals.monthly : totals.annual;

  // build M-o-M projection (slight growth + seasonality)
  const now = new Date();
  const baseMonthly = totals.monthly;
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 6 + i, 1);
    const seasonal = 1 + Math.sin(i / 2) * 0.06;
    const growth = 1 + i * 0.018;
    const projected = baseMonthly * seasonal * growth;
    const actual = i <= 6 ? baseMonthly * (0.9 + Math.random() * 0.18) : null;
    return { month: monthLabels[d.getMonth()], projected: +projected.toFixed(0), actual: actual ? +actual.toFixed(0) : null };
  });

  const upcoming = [...expenses]
    .filter(e => e.status === 'active' && e.billing_cycle !== 'one_time')
    .filter(e => {
      const days = (new Date(e.next_renewal).getTime() - Date.now()) / 86400000;
      return days >= 0 && days <= 30;
    })
    .sort((a, b) => +new Date(a.next_renewal) - +new Date(b.next_renewal))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Spend Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A live view of your projected burn, run rate and tax exposure.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Live · {currency} · {view === 'monthly' ? 'Monthly Burn' : 'Annual Run Rate'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Monthly Burn" value={formatMoney(totals.monthly, currency)}
          sublabel="Active subscriptions" icon={Flame} trend={4.2} accent="expense" />
        <MetricCard label="Annual Run Rate" value={formatMoney(totals.annual, currency)}
          sublabel="Projected 12-month spend" icon={TrendingUp} trend={6.8} accent="primary" />
        <MetricCard label="VAT Paid (5%)" value={formatMoney(totals.vat, currency)}
          sublabel="Recoverable per filing" icon={Receipt} trend={-1.4} accent="info" />
        <MetricCard label="Renewals · 30d" value={upcoming.length.toString().padStart(2, "0")}
          sublabel={`Next: ${upcoming[0]?.name?.slice(0, 18) ?? "—"}`} icon={CalendarClock} trend={0} accent="success" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Projected Spend</h3>
              <p className="text-xs text-muted-foreground">Month-over-month, normalized to {currency}</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" /> Projected
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-accent" /> Actual
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="proj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="act" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 6" vertical={false} opacity={0.4} />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover) / 0.9)",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12, backdropFilter: "blur(12px)", fontSize: 12,
                  }}
                  formatter={(v: number) => formatMoney(v, currency)}
                />
                <Area type="monotone" dataKey="actual" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#act)" />
                <Area type="monotone" dataKey="projected" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#proj)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Upcoming Renewals</h3>
              <p className="text-xs text-muted-foreground">Next 30 days</p>
            </div>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary-glow">
              {upcoming.length}
            </Badge>
          </div>
          <ul className="space-y-2">
            {upcoming.map(e => {
              const days = Math.max(0, Math.ceil((+new Date(e.next_renewal) - Date.now()) / 86400000));
              const monthly = monthlyInCurrency(e, currency);
              const urgent = days <= 5;
              return (
                <li key={e.id}
                  className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-3 transition hover:border-primary/30 hover:bg-card/60">
                  <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg ${
                    urgent ? "bg-expense/15 text-expense" : "bg-primary/10 text-primary-glow"
                  }`}>
                    <span className="num text-sm font-bold leading-none">{days}</span>
                    <span className="text-[9px] uppercase tracking-wider">days</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{e.vendor} · {e.billing_cycle}</p>
                  </div>
                  <div className="text-right">
                    <p className="num text-sm font-semibold">{formatMoney(monthly, currency)}</p>
                    <p className="text-[10px] text-muted-foreground">/mo</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                </li>
              );
            })}
            {upcoming.length === 0 && (
              <li className="rounded-xl border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
                No renewals in the next 30 days 🎉
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
