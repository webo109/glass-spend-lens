import { Bell, AlertCircle, AlertTriangle, Info, CheckCircle2, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/context/AppContext";
import { AppNotification } from "@/lib/notifications";
import { useState } from "react";

const SEV: Record<AppNotification["severity"], { icon: React.ElementType; color: string; ring: string }> = {
  critical: { icon: AlertCircle,    color: "text-expense",  ring: "bg-expense/15"  },
  warning:  { icon: AlertTriangle,  color: "text-warning",  ring: "bg-warning/15"  },
  info:     { icon: Info,           color: "text-info",     ring: "bg-info/15"     },
  success:  { icon: CheckCircle2,   color: "text-success",  ring: "bg-success/15"  },
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const future = diff < 0;
  if (mins < 60) return future ? `in ${mins}m` : `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return future ? `in ${hrs}h` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return future ? `in ${days}d` : `${days}d ago`;
};

export const NotificationsPopover = () => {
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-expense px-1 text-[10px] font-bold text-expense-foreground shadow-glow">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="glass-strong w-[380px] overflow-hidden rounded-xl border-border/40 p-0"
      >
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div>
            <p className="font-display text-sm font-semibold">Notifications</p>
            <p className="text-[11px] text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost" size="sm"
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={markAllRead}
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[420px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <p className="text-sm font-medium">You're all clear</p>
              <p className="text-xs text-muted-foreground">No alerts about renewals, FX, or VAT right now.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/30">
              {notifications.slice(0, 8).map((n) => {
                const sev = SEV[n.severity];
                const Icon = sev.icon;
                return (
                  <li
                    key={n.id}
                    className="group relative flex gap-3 px-4 py-3 transition hover:bg-card/40"
                    onMouseEnter={() => markRead(n.id)}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${sev.ring}`}>
                      <Icon className={`h-3.5 w-3.5 ${sev.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-medium leading-snug">{n.title}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                          className="opacity-0 transition group-hover:opacity-100"
                          aria-label="Dismiss"
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{n.body}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                          {timeAgo(n.timestamp)}
                        </span>
                        {n.action_label && n.action_route && (
                          <Link
                            to={n.action_route}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-glow hover:text-primary"
                          >
                            {n.action_label} <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <div className="border-t border-border/40 px-4 py-2.5">
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            View all notifications <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};
