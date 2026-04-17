import { LayoutDashboard, Receipt, FlaskConical, Wallet, Bell } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Analytics", url: "/", icon: LayoutDashboard },
  { title: "Expense Ledger", url: "/ledger", icon: Receipt },
  { title: "What-If Sandbox", url: "/sandbox", icon: FlaskConical },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Wallet className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.4} />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-[15px] font-semibold tracking-tight">Ledgerly</span>
              <span className="text-[11px] text-muted-foreground">Spend Intelligence</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink
                        to={item.url}
                        end
                        className={`group relative flex items-center gap-3 rounded-lg px-3 transition-all ${
                          active
                            ? "bg-gradient-to-r from-primary/15 to-primary/5 text-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                        }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-gradient-primary" />
                        )}
                        <item.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                        {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="rounded-lg bg-sidebar-accent/60 p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
              <span className="text-xs font-medium">Sync up to date</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Last reconciled 2 min ago</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
