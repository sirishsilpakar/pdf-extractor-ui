import {
  LayoutDashboard,
  Files,
  Search,
  Settings,
  PanelRight,
} from "lucide-react";
import type { NavView } from "@/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems: { id: NavView; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "files", label: "Files", icon: Files },
  { id: "search", label: "Search", icon: Search },
  { id: "settings", label: "Settings", icon: Settings },
];

interface AppSidebarProps {
  currentView: NavView;
  onViewChange: (v: NavView) => void;
  stats: { total: number; completed: number; failed: number };
}

export function AppSidebar({
  currentView,
  onViewChange,
  stats,
}: AppSidebarProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  return (
    <aside
      className={`${sidebarCollapsed ? "w-16" : "w-56"} border-r border-border/50 glass flex flex-col shrink-0`}
    >
      <nav className="flex-1 p-3 space-y-1">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 mr-4 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  P
                </span>
              </div>
              <span className="font-semibold text-lg tracking-tight">
                PDF Textract
              </span>
            </div>
          )}
          {sidebarCollapsed ? (
            <PanelRight
              className="h-5 w-5 mx-2 mb-7 cursor-pointer"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          ) : (
            <PanelRight
              className="h-5 w-5 mb-3 cursor-pointer"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          )}
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              `w-full flex items-center ${sidebarCollapsed ? "px-2.5 py-2 rounded-md" : "gap-3 px-3 py-2.5 rounded-xl text-sm font-medium"} transition-none`,
              currentView === item.id
                ? "bg-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/80",
            )}
          >
            <item.icon
              className={`${sidebarCollapsed ? "h-4 w-4" : "h-4 w-4"}`}
            />
            {sidebarCollapsed ? "" : item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-border/50">
        <div className="glass rounded-xl p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quick Stats
          </p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Done</span>
              <span className="font-semibold text-success">
                {stats.completed}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Failed</span>
              <span className="font-semibold text-destructive">
                {stats.failed}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
