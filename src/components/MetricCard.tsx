import { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  sublabel?: string;
  icon: LucideIcon;
  trend?: number; // percentage
  accent?: "primary" | "expense" | "success" | "info";
}

const accentMap = {
  primary: "from-primary/25 to-primary/5 text-primary-glow",
  expense: "from-expense/25 to-expense/5 text-expense",
  success: "from-success/25 to-success/5 text-success",
  info: "from-info/25 to-info/5 text-info",
};

export const MetricCard = ({ label, value, sublabel, icon: Icon, trend, accent = "primary" }: MetricCardProps) => {
  const trendUp = (trend ?? 0) >= 0;
  return (
    <div className="glass group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-elevated">
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl ${accentMap[accent]}`} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${accentMap[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="relative mt-3 flex items-baseline gap-2">
        <div className="num font-display text-3xl font-semibold tracking-tight">{value}</div>
      </div>
      <div className="relative mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{sublabel}</p>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${trendUp ? "text-success" : "text-expense"}`}>
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
};
