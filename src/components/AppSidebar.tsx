import {
  LayoutDashboard,
  Files,
  Search,
  Settings,
  PanelRight,
  Terminal
} from "lucide-react";
import type { NavView } from "@/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems: { id: NavView; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "files", label: "Files", icon: Files },
  { id: "activity", label: "Activity Log", icon: Terminal },
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
              className="h-5 w-5 mx-2 my-2 mb-4 cursor-pointer"
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
            title={item.label}
          >
            <item.icon
              className={`${sidebarCollapsed ? "h-4 w-4" : "h-4 w-4"}`}
            />
            {sidebarCollapsed ? "" : item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-border/50">
        {sidebarCollapsed ? (
          <div className="p-2 border-b border-slate-800">
            <div className="space-y-2">
              <div className="flex items-center justify-center cursor-pointer">
                <div
                  className="size-8 bg-slate-800/50 rounded flex items-center justify-center"
                  title={`Total: ${stats.total}`}
                >
                  <span className="text-xs font-bold text-slate-300">
                    {stats.total}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center cursor-pointer">
                <div
                  className="size-8 bg-green-500/20 rounded flex items-center justify-center"
                  title={`Completed: ${stats.completed}`}
                >
                  <span className="text-xs font-bold text-green-400">
                    {stats.completed}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center cursor-pointer">
                <div
                  className="size-8 bg-red-500/20 rounded flex items-center justify-center"
                  title={`Processing: ${stats.failed}`}
                >
                  <span className="text-xs font-bold text-red-400">
                    {stats.failed}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </aside>
  );
}
