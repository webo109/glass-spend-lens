import { Search, Sparkles, LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context/AppContext";
import { Currency } from "@/lib/expenses";
import { ViewMode } from "@/context/AppContext";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SegToggle = <T extends string>({
  value, onChange, options, label,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) => (
  <div className="flex items-center gap-2">
    <span className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:inline">
      {label}
    </span>
    <div className="relative inline-flex items-center rounded-full border border-border/60 bg-card/40 p-0.5 backdrop-blur-md">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`relative z-10 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active && (
              <span className="absolute inset-0 -z-10 rounded-full bg-gradient-primary shadow-glow" />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  </div>
);

export const TopBar = () => {
  const { currency, setCurrency, view, setView } = useApp();
  const { user, signOut } = useAuth();
  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/40 bg-background/60 px-4 backdrop-blur-xl md:px-6">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <div className="relative hidden md:block md:w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search vendors, expenses…"
          className="h-9 border-border/50 bg-card/40 pl-9 text-sm backdrop-blur-md focus-visible:ring-primary/40"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <SegToggle<Currency>
          label="Currency"
          value={currency}
          onChange={setCurrency}
          options={[{ value: 'OMR', label: 'OMR' }, { value: 'USD', label: 'USD' }]}
        />
        <div className="hidden h-6 w-px bg-border/60 md:block" />
        <SegToggle<ViewMode>
          label="View"
          value={view}
          onChange={setView}
          options={[{ value: 'monthly', label: 'Monthly Burn' }, { value: 'annual', label: 'Run Rate' }]}
        />

        <div className="hidden h-6 w-px bg-border/60 md:block" />

        <NotificationsPopover />

        <button className="hidden items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-glow transition hover:bg-primary/20 md:flex">
          <Sparkles className="h-3.5 w-3.5" /> AI Insights
        </button>

        {user && (
          <>
            <div className="hidden h-6 w-px bg-border/60 md:block" />
            <div className="hidden items-center gap-2 md:flex">
              <span className="max-w-[140px] truncate text-xs text-muted-foreground" title={user.email ?? ""}>
                {user.email}
              </span>
            </div>
            <Button
              variant="ghost" size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
