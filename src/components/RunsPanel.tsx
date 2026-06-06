import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  History,
  X,
  Download,
  ExternalLink,
  CircleCheckBig,
  Send,
  FileText,
  Clock4,
  FileMinus,
  FolderDown,
  ScanLine,
  TriangleAlert,
  Ban,
  FileCog,
  FolderOpen
} from "lucide-react";
import type { Run, PaginationState } from "@/types";
import { isElectronAvailable, openPath } from "../lib/electron";
import { ensureChildDir } from "@/lib/fs";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns"

interface Props {
  runs: Run[];
  pagination: PaginationState;
  onViewResults: (runId: string) => void;
  onLoadRunLog: (runId: string) => Promise<string | null>;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

function fmtDuration(secs: number) {
  if (!secs) return "—";
  const s = Math.round(secs);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

function getRunPath(outputDir: string, runId: string): string {
  if (!outputDir) return "";
  return ensureChildDir(outputDir, runId);
}

export function RunsPanel({
  runs,
  pagination,
  onViewResults,
  onLoadRunLog,
  onPageChange,
  isLoading,
}: Props) {
  const [viewingLog, setViewingLog] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [loadingLog, setLoadingLog] = useState(false);

  const handleLoadLog = async (runId: string) => {
    setLoadingLog(true);
    const content = await onLoadRunLog(runId);
    if (content) {
      setViewingLog({ id: runId, content });
    }
    setLoadingLog(false);
  };

  if (!isLoading && runs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Extraction History
          </h2>
        </div>
        <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border/50">
          <History className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">
            No runs yet. Start an extraction to see run history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Log Viewer Modal */}
      {viewingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-strong w-full max-w-4xl max-h-[85vh] rounded-2xl border border-border/50 flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-secondary/10">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary font-mono text-[10px]"
                >
                  LOG
                </Badge>
                <h3 className="font-semibold text-sm">
                  Activity Log for Run {viewingLog.id.slice(0, 8)}…
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-inherit rounded-xl h-8 gap-2 text-xs hover:bg-primary hover:text-white"
                  onClick={() => {
                    const blob = new Blob([viewingLog.content], {
                      type: "text/plain",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `run-${viewingLog.id}-log.txt`;
                    a.click();
                  }}
                >
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl hover:bg-primary hover:text-white"
                  onClick={() => setViewingLog(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-black/40 font-mono text-[11px] leading-relaxed no-scrollbar whitespace-pre-wrap selection:bg-primary/30">
              {viewingLog.content}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-1">
        <History className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">
          Extraction History
        </h2>
      </div>

      {/* Run cards */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="glass rounded-2xl border border-border/50 p-4 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-muted/20 animate-pulse rounded" />
                  <div className="h-4 w-16 bg-muted/20 animate-pulse rounded-full" />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div
                      key={j}
                      className="bg-secondary/40 rounded-xl p-3 h-14 animate-pulse"
                    />
                  ))}
                </div>
                <div className="h-2 w-full bg-muted/20 animate-pulse rounded-full" />
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-muted/20 animate-pulse rounded-xl" />
                  <div className="h-8 w-24 bg-muted/20 animate-pulse rounded-xl" />
                </div>
              </div>
            ))
          : runs.map((run) => {
              const done = run.completedFiles;
              const direct = run.directFiles || 0;
              const ocr = run.ocrFiles || 0;
              const failed = run.failedFiles || 0;
              const total = run.totalFiles || 1;

              const directPct = Math.round((direct / total) * 100);
              const failedPct = Math.round((failed / total) * 100);
              const ocrPct = 100 - directPct - failedPct;

              const statusInfo = {
                running: {
                  label: "Processing...",
                  color: "bg-primary/10 text-primary border-primary/30",
                  icon: <FileCog width={12} height={12} className="mr-2" />
                },
                completed: {
                  label: "Completed",
                  color: "bg-success/10 text-success border-success/30",
                  icon: <CircleCheckBig width={12} height={12} className="mr-2" />
                },
                failed: {
                  label: "Failed",
                  color: "bg-destructive/10 text-destructive border-destructive/30",
                  icon: <Ban width={12} height={12} className="mr-2" />
                },
                cancelled: {
                  label: "Cancelled",
                  color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
                  icon: <TriangleAlert width={12} height={12} className="mr-2" />
                },
                done: { 
                  label: "Done", 
                  color: "bg-green-500/10 text-green-700 border-success/30",
                  icon: <CircleCheckBig width={12} height={12} className="mr-2" />
                },
              }[run.status] ?? {
                label: run.status.toUpperCase(),
                color: "bg-green-50 text-green-700",
              };

              return (
                <div
                  key={run.id}
                  className="rounded-2xl border border-border p-4 space-y-3"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <span
                        className="text-xs text-muted-foreground flex items-center"
                        title={run.id}
                      >
                        <Send className="text-primary bg-primary/10 mr-2 p-1.5 rounded" />
                        <span className="mr-1 font-bold">Run ID:</span>
                        <span className="font-mono font-bold">
                          {run.id.slice(0, 8)}…
                        </span>
                      </span>
                      <Badge
                        className={cn(
                          "pointer-events-none rounded-md text-xs font-medium",
                          statusInfo.color,
                        )}
                      >
                        {statusInfo.icon ? statusInfo.icon : "" }
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(run.startedAt, {
                        addSuffix: true,
                        includeSeconds: true,
                      })}
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      {
                        label: "Duration",
                        value: fmtDuration(run.elapsedSeconds),
                        icon: <Clock4 height={40} width={40} className="text-primary rounded-sm bg-primary/10 mr-2 p-2"/>,
                      },
                      {
                        label: "Files",
                        value: `${run.completedFiles} / ${total}`,
                        sub: failed > 0 ? `${failed} failed` : undefined,
                        icon: <FileMinus height={40} width={40} className="text-primary rounded-sm bg-primary/10 mr-2 p-2"/>,
                      },
                      { 
                        label: "Direct", 
                        value: String(direct),
                        icon: <FolderDown height={40} width={40} className="text-primary rounded-sm bg-primary/10 mr-2 p-2"/>,
                      },
                      { 
                        label: "OCR",
                        value: String(ocr),
                        icon: <ScanLine height={40} width={40} className="text-amber-500 rounded-sm bg-amber-500/10 mr-2 p-2"/>,
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-secondary/40 rounded-xl p-3 flex"
                      >
                        <div className="mr-2">
                          {s.icon}
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            {s.label}
                          </p>
                          <p className="font-bold text-lg">
                            {s.value}
                          </p>
                          {s.sub && (
                            <p className="text-[10px] text-destructive mt-0.5">
                              {s.sub}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Multi-segment progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium px-0.5">
                      <div className="flex gap-8">
                        <span className="text-blue-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />{" "}
                          Direct {directPct}%
                        </span>
                        <span className="text-amber-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{" "}
                          OCR {ocrPct}%
                        </span>
                        {failedPct > 0 && (
                          <span className="text-destructive flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />{" "}
                            Failed {failedPct}%
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        Total {total} files
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/60 overflow-hidden flex shadow-inner">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${directPct}%` }}
                        title={`Direct: ${direct}`}
                      />
                      <div
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${ocrPct}%` }}
                        title={`OCR: ${ocr}`}
                      />
                      <div
                        className="h-full bg-destructive transition-all duration-500"
                        style={{ width: `${failedPct}%` }}
                        title={`Failed: ${failed}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    {isElectronAvailable() && run.outputDir && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-w-[140px] h-[34px] bg-inherit rounded-md gap-2 flex-1sm:flex-none hover:bg-primary hover:text-white"
                        onClick={() => openPath(getRunPath(run.outputDir!, run.id))}
                      >
                        <FolderOpen className="h-3.5 w-3.5" /> Open Folder
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-[140px] h-[34px] bg-inherit rounded-md gap-2 flex-1sm:flex-none hover:bg-primary hover:text-white"
                      onClick={() => handleLoadLog(run.id)}
                      disabled={loadingLog}
                    >
                      <FileText className="h-3.5 w-3.5" /> View Log
                    </Button>
                    <Button
                      size="sm"
                      className="min-w-[140px] h-[34px] rounded-md gap-2 flex-1sm:flex-none hover:bg-white hover:text-primary hover:border-primary hover:border-2"
                      onClick={() => onViewResults(run.id)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View Results
                    </Button>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-xs text-muted-foreground">
            Showing page {pagination.page} of {pagination.pages} (
            {pagination.total} runs)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-xl"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="rounded-xl"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
