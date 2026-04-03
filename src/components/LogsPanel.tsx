import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Pause, Play, Terminal } from 'lucide-react';
import type { LogEntry } from '@/types';
import { cn } from '@/lib/utils';

const typeColors: Record<LogEntry['type'], string> = {
  info: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-destructive',
};

const typePrefix: Record<LogEntry['type'], string> = {
  info: 'INFO',
  success: ' OK ',
  warning: 'WARN',
  error: ' ERR',
};

interface Props {
  logs: LogEntry[];
  autoscroll: boolean;
  onToggleAutoscroll: () => void;
}

export function LogsPanel({ logs, autoscroll, onToggleAutoscroll }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoscroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, autoscroll]);

  return (
    <div className="glass rounded-2xl flex flex-col overflow-hidden" style={{ height: 220 }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-sm">Activity Log</h3>
          <span className="text-xs text-muted-foreground">({logs.length} entries)</span>
        </div>
        {/* <Button variant="ghost" size="sm" className="rounded-xl gap-1 text-xs h-7" onClick={onToggleAutoscroll}>
          {autoscroll ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {autoscroll ? 'Pause' : 'Resume'}
        </Button> */}
      </div>
      <ScrollArea className="flex-1 px-4 py-2">
        <div className="space-y-0.5 font-mono-logs text-xs">
          {logs.map(log => (
            <div key={log.id} className="flex gap-2 py-0.5">
              <span className="text-muted-foreground/60 shrink-0">{log.timestamp.toLocaleTimeString()}</span>
              <span className={cn('shrink-0 font-semibold', typeColors[log.type])}>[{typePrefix[log.type]}]</span>
              <span className={cn(typeColors[log.type])}>{log.message}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
