import { LayoutDashboard, Files, Search, Settings } from 'lucide-react';
import type { NavView } from '@/types';
import { cn } from '@/lib/utils';

const navItems: { id: NavView; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'files', label: 'Files', icon: Files },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface AppSidebarProps {
  currentView: NavView;
  onViewChange: (v: NavView) => void;
  stats: { total: number; completed: number; failed: number };
}

export function AppSidebar({ currentView, onViewChange, stats }: AppSidebarProps) {
  return (
    <aside className="w-56 border-r border-border/50 glass flex flex-col shrink-0">
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              currentView === item.id
                ? 'bg-primary text-primary-foreground shadow-glow'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-border/50">
        <div className="glass rounded-xl p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Stats</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-semibold">{stats.total}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Done</span><span className="font-semibold text-success">{stats.completed}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Failed</span><span className="font-semibold text-destructive">{stats.failed}</span></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
