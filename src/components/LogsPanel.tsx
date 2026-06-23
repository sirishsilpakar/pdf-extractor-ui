import { useEffect, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { FileDown, Terminal } from "lucide-react";
import type { LogEntry } from "@/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { API_BASE } from "@/lib/api";

const typeColors: Record<LogEntry["type"], string> = {
  info: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
};

const typePrefix: Record<LogEntry["type"], string> = {
  info: "INFO",
  success: " OK ",
  warning: "WARN",
  error: " ERR",
};

interface Props {
  logs: LogEntry[];
  autoscroll: boolean;
  onToggleAutoscroll: () => void;
}

export function LogsPanel({ logs, autoscroll, onToggleAutoscroll }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const currentRunId = useAppStore((state) => state.currentRunId);
  
  const rowVirtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24, // Approximate height of one log row
    overscan: 10,
  });

  useEffect(() => {
    if (autoscroll && logs.length > 0) {
      rowVirtualizer.scrollToIndex(logs.length - 1, { align: "end" });
    }
  }, [logs.length, autoscroll, rowVirtualizer]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 20;
    if (!isAtBottom && autoscroll) {
      onToggleAutoscroll();
    }
  }, [autoscroll, onToggleAutoscroll]);

  return (
    <div
      className="glass rounded-2xl flex flex-col overflow-hidden"
      style={{ height: 220 }}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="font-semibold text-sm">Activity Log</h3>
          <span className="text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
            ({logs.length} entries)
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!autoscroll && (
             <Button
                variant="ghost"
                size="sm"
                className="rounded-xl gap-1 text-[10px] h-6 px-2 text-white bg-primary animate-pulse hover:bg-primary hover:text-white"
                onClick={onToggleAutoscroll}
                aria-label="Resume auto-scroll"
              >
                Resume Auto-scroll
              </Button>
           )}

          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl gap-1 text-xs h-7 hover:bg-primary hover:text-white"
            onClick={async () => {
              if (currentRunId) {
                try {
                  const res = await fetch(`${API_BASE}/runs/${currentRunId}/log`);
                  if (res.ok) {
                    const text = await res.text();
                    const blob = new Blob([text], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `run-${currentRunId}-log.txt`;
                    a.click();
                    return;
                  }
                } catch (e) {
                  console.error("Failed to fetch full run log, falling back to local logs", e);
                }
              }
              const text = logs
                .map(
                  (l) =>
                    `[${l.timestamp.toLocaleTimeString()}] [${
                      typePrefix[l.type]
                    }] ${l.message}`
                )
                .join("\n");
              const blob = new Blob([text], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `logs-${new Date().getTime()}.txt`;
              a.click();
            }}
            aria-label="Export logs to file"
          >
            <FileDown className="h-3 w-3" aria-hidden="true" /> Export
          </Button>
        </div>
      </div>
      <div 
        ref={parentRef}
        className="flex-1 px-4 py-2 overflow-y-auto no-scrollbar"
        onScroll={handleScroll}
        aria-live="polite"
        role="log"
      >
        <div 
          style={{ 
            height: `${rowVirtualizer.getTotalSize()}px`, 
            width: '100%', 
            position: 'relative' 
          }}
          className="font-mono-logs text-xs"
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const log = logs[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="flex gap-2 py-0.5 items-center"
              >
                <span className="text-muted-foreground/60 shrink-0">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className={cn("shrink-0 font-semibold", typeColors[log.type])}>
                  [{typePrefix[log.type]}]
                </span>
                <span className={cn(typeColors[log.type], "truncate")}>{log.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

