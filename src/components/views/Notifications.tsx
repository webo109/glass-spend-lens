import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { AppNotification, NotifSeverity } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle, AlertTriangle, Info, CheckCircle2, X, ArrowRight, Inbox, RotateCcw,
} from "lucide-react";

const SEV: Record<NotifSeverity, { icon: React.ElementType; label: string; color: string; ring: string; chip: string }> = {
  critical: { icon: AlertCircle,   label: "Critical", color: "text-expense", ring: "bg-expense/15", chip: "border-expense/30 bg-expense/10 text-expense" },
  warning:  { icon: AlertTriangle, label: "Warning",  color: "text-warning", ring: "bg-warning/15", chip: "border-warning/30 bg-warning/10 text-warning" },
  info:     { icon: Info,          label: "Info",     color: "text-info",    ring: "bg-info/15",    chip: "border-info/30 bg-info/10 text-info" },
  success:  { icon: CheckCircle2,  label: "Resolved", color: "text-success", ring: "bg-success/15", chip: "border-success/30 bg-success/10 text-success" },
};

const FILTERS: { value: "all" | NotifSeverity; label: string }[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
  { value: "success", label: "Resolved" },
];

const fmtFull = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

const NotifCard = ({ n, onDismiss, onRead }: { n: AppNotification; onDismiss: () => void; onRead: () => void }) => {
  const sev = SEV[n.severity];
  const Icon = sev.icon;
  return (
    <div
      className="glass group relative flex gap-4 rounded-xl p-4 transition hover:border-primary/30"
      onMouseEnter={onRead}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${sev.ring}`}>
        <Icon className={`h-5 w-5 ${sev.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{n.title}</h3>
            <Badge variant="outline" className={`text-[10px] ${sev.chip}`}>{sev.label}</Badge>
          </div>
          <button
            onClick={onDismiss}
            className="opacity-0 transition group-hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground/80">{fmtFull(n.timestamp)}</span>
          {n.action_label && n.action_route && (
            <Link
              to={n.action_route}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-glow hover:text-primary"
            >
              {n.action_label} <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export const Notifications = () => {
  const { notifications, unreadCount, markRead, markAllRead, dismiss, clearDismissed } = useApp();
  const [filter, setFilter] = useState<"all" | NotifSeverity>("all");

  const filtered = useMemo(
    () => filter === "all" ? notifications : notifications.filter(n => n.severity === filter),
    [notifications, filter],
  );

  const counts = useMemo(() => {
    const c: Record<NotifSeverity, number> = { critical: 0, warning: 0, info: 0, success: 0 };
    notifications.forEach(n => { c[n.severity] += 1; });
    return c;
  }, [notifications]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"} across your spend.`
              : "Live alerts about renewals, FX exposure, VAT, and scenario impact."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearDismissed} className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3.5 w-3.5" /> Restore dismissed
          </Button>
          <Button onClick={markAllRead} disabled={unreadCount === 0} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(Object.keys(SEV) as NotifSeverity[]).map((s) => {
          const sev = SEV[s];
          const Icon = sev.icon;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`glass flex items-center gap-3 rounded-xl p-3 text-left transition hover:border-primary/30 ${
                filter === s ? "ring-1 ring-primary/40" : ""
              }`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${sev.ring}`}>
                <Icon className={`h-4 w-4 ${sev.color}`} />
              </div>
              <div>
                <p className="num text-lg font-semibold leading-none">{counts[s]}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{sev.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-primary/50 bg-primary/15 text-foreground"
                  : "border-border/50 bg-card/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-2xl p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <Inbox className="h-6 w-6 text-success" />
          </div>
          <h3 className="font-display text-lg font-semibold">No notifications</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {filter === "all"
              ? "Everything looks healthy. New alerts will appear here as renewals approach or thresholds are crossed."
              : `No ${filter} notifications right now. Try a different filter.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((n) => (
            <NotifCard
              key={n.id}
              n={n}
              onRead={() => markRead(n.id)}
              onDismiss={() => dismiss(n.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
