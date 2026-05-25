import React, { useState, useRef, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FolderOpen,
  RefreshCw,
  X,
  Loader2,
} from "lucide-react";
import type { ExtractionResult, ExtractionResultDetail, PaginationState, Run } from "@/types";
import { cn } from "@/lib/utils";
import { FileViewerModal } from "./FileViewerModal";
import { useRunTree, useRunFiles, useAllRunIds, useRun } from "@/hooks/queries/useRuns";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FileRow = ({
  r,
  onView,
  getDownloadUrl,
  showRunInfo,
}: {
  r: ExtractionResult;
  onView: (r: ExtractionResult) => void;
  getDownloadUrl: (id: number) => string;
  showRunInfo?: boolean;
}) => {
  const fname =
    r.rel_path
      .replace(/\.pdf$/i, "")
      .split("/")
      .pop() || r.filename;
  const highConf = r.confidence !== null && r.confidence !== undefined && r.confidence >= 0.85;

  return (
    <div className="flex items-center gap-3 px-10 py-2 hover:bg-secondary/20 transition-colors group h-[52px]">
      <span
        className="flex-1 text-sm font-medium truncate flex items-center gap-2"
        title={r.rel_path}
      >
        <span>{fname}</span>
        {showRunInfo && r.run_id && (
          <span className="text-[10px] text-muted-foreground/50 font-normal shrink-0">
            {r.run_id === "no-run" ? "Direct" : `Run #${r.run_id.slice(0, 8)}`}
          </span>
        )}
      </span>
      <Badge
        variant="outline"
        className="rounded-md text-[9px] uppercase font-bold tracking-wider shrink-0 h-5"
      >
        {r.method || "?"}
      </Badge>
      {confPct && (
        <span
          className={cn(
            "text-[11px] font-semibold shrink-0 w-12 text-right",
            highConf ? "text-success" : "text-destructive",
          )}
        >
          {confPct}
        </span>
      )}
      <span className="text-[11px] text-muted-foreground shrink-0 w-16 text-right">
        {r.char_count}
      </span>
      {dt && (
        <span className="text-[11px] text-muted-foreground shrink-0 hidden lg:block opacity-60 w-16 text-right">
          {dt}
        </span>
      )}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-16 justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg hover:bg-primary hover:text-white"
          onClick={() => onView(r)}
          title="View text"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <a
          href={getDownloadUrl(r.id)}
          download={`${fname}.txt`}
          title="Download .txt"
          className="inline-flex items-center justify-center h-7 w-7 rounded-lg transition-colors hover:bg-primary hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
};
interface Props {
  results: ExtractionResult[];
  pagination: PaginationState;
  runFilter: string | null;
  onRunFilterChange: (id: string | null) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onGetDetail: (id: number) => Promise<ExtractionResultDetail | null>;
  getDownloadUrl: (id: number) => string;
  isLoading?: boolean;
}

export function ResultsPanel({ results, pagination, runFilter, onRunFilterChange, onPageChange, onRefresh, onGetDetail, getDownloadUrl, isLoading }: Props) {
  const [collapsedRuns, setCollapsedRuns] = useState<Set<string>>(new Set());
  const [collapsedDirs, setCollapsedDirs] = useState<Set<string>>(new Set());
  const [viewingResult, setViewingResult] = useState<ExtractionResult | null>(null);
  const [viewingDetail, setViewingDetail] = useState<ExtractionResultDetail | null>(null);

  // Group by Run ID then by Directory
  const runGroups: Record<string, { timestamp: number, date: string, dirs: Record<string, ExtractionResult[]> }> = {};
  const allRunIds = new Set<string>();

  useEffect(() => {
    if (runFilter) {
      setCollapsedRuns(new Set());
    } else {
      const runIDs = new Set<string>();
      results.forEach((r) => {
        runIDs.add(r.run_id)
      })
      setCollapsedRuns(runIDs);
    }
  }, [results, runFilter])

  results.forEach(r => {
    const runId = r.run_id || "no-run";
    allRunIds.add(runId);

    // Apply filter
    if (runFilter && runId !== runFilter) return;

    const rawDate = r.processed_at ? new Date(r.processed_at) : new Date(0);
    const dateStr = rawDate.toLocaleDateString() + " " + rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (!runGroups[runId]) {
      runGroups[runId] = { timestamp: rawDate.getTime(), date: dateStr, dirs: {} };
    } else if (rawDate.getTime() > runGroups[runId].timestamp) {
      runGroups[runId].timestamp = rawDate.getTime();
      runGroups[runId].date = dateStr;
    }
    
    const parts = r.rel_path.split("/");
    parts.pop();
    const dir = parts.join("/") || "(root)";
    
    if (!runGroups[runId].dirs[dir]) {
      runGroups[runId].dirs[dir] = [];
    }
    runGroups[runId].dirs[dir].push(r);
  });

  const handleView = async (result: ExtractionResult) => {
    setViewingResult(result);
    setViewingDetail(null);
    const detail = await onGetDetail(result.id);
    setViewingDetail(detail);
  };

  const toggleRun = (runId: string) => {
    setCollapsedRuns(prev => {
      const next = new Set(prev);
      if (next.has(runId)) next.delete(runId);
      else next.add(runId);
      return next;
    });
  };

  const toggleDir = (dirKey: string) => {
    setCollapsedDirs(prev => {
      const next = new Set(prev);
      if (next.has(dirKey)) next.delete(dirKey);
      else next.add(dirKey);
      return next;
    });
  };

  if (!isLoading && results.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Extracted Files</h2>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2 rounded-xl">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
        <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border/50">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">No extracted files yet. Run the pipeline first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FileViewerModal
        open={!!viewingResult}
        onOpenChange={(open) => { if (!open) { setViewingResult(null); setViewingDetail(null); } }}
        fileName={viewingResult?.filename || ""}
        detail={viewingDetail}
        downloadUrl={viewingResult ? getDownloadUrl(viewingResult.id) : ""}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Extracted Files</h2>
          <span className="text-xs text-muted-foreground font-medium bg-secondary/60 px-2 py-0.5 rounded-full">
            {pagination.total} files
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {allRunIds.size > 0 && (
            <div className="flex items-center gap-2 bg-secondary/30 px-2 py-1 rounded-xl border border-border/50">
              <span className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Run:</span>
              <select 
                className="bg-transparent border-none text-xs font-medium focus:ring-0 cursor-pointer outline-none"
                value={runFilter || ""}
                onChange={(e) => onRunFilterChange(e.target.value || null)}
              >
                <option value="">All Runs</option>
                {Array.from(allRunIds).sort().map(id => (
                  <option key={id} value={id}>{id === "no-run" ? "Direct" : id.slice(0, 8) + "…"}</option>
                ))}
              </select>
              {runFilter && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onRunFilterChange(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2 rounded-xl h-8 hover:bg-primary hover:text-white">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="glass rounded-2xl overflow-hidden border border-border/50">
              <div className="px-4 py-6 bg-primary/5 border-b border-border/30 space-y-2">
                <div className="h-5 w-48 bg-muted/20 animate-pulse rounded" />
                <div className="h-3 w-24 bg-muted/20 animate-pulse rounded" />
              </div>
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-10 w-full bg-muted/10 animate-pulse rounded-lg" />
                ))}
              </div>
            </div>
          ))
        ) : (
          Object.entries(runGroups).sort((a, b) => b[1].timestamp - a[1].timestamp).map(([runId, group]) => (
          <div key={runId} className="glass rounded-2xl overflow-hidden border border-border/50">
            {/* Run Header */}
            <button
              onClick={() => toggleRun(runId)}
              className="w-full flex items-center gap-3 px-4 py-4 bg-primary/5 hover:bg-primary/10 transition-colors text-left border-b border-border/30"
            >
              {collapsedRuns.has(runId)
                ? <ChevronRight className="h-5 w-5 text-primary shrink-0" />
                : <ChevronDown className="h-5 w-5 text-primary shrink-0" />
              }
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">Run: {runId === "no-run" ? "Direct Uploads" : runId.slice(0, 8)}</span>
                  <p className="text-[10px] text-muted-foreground">
                    {(runFilter && runId === runFilter) ? pagination.total : Object.values(group.dirs).flat().length} {Object.values(group.dirs).flat().length > 1 ? 'files' : 'file'} in this run
                  </p>
                </div>
                <Badge variant="outline" className="bg-primary/50 text-[10px] capitalize text-white">
                  {formatDistanceToNow(group.date, {
                    addSuffix: true,
                    includeSeconds: true,
                  })}
                </Badge>
              </div>
            </button>

            {!collapsedRuns.has(runId) && (
              <div className="divide-y divide-border/30">
                {Object.keys(group.dirs).sort().map(dir => {
                  const dirKey = `${runId}-${dir}`;
                  return (
                    <div key={dir}>
                      {/* Directory header */}
                      <button
                        onClick={() => toggleDir(dirKey)}
                        className="w-full flex items-center gap-2.5 px-6 py-3 bg-secondary/20 hover:bg-secondary/40 transition-colors text-left"
                      >
                        {collapsedDirs.has(dirKey)
                          ? <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        }
                        <FolderOpen className="h-4 w-4 text-primary shrink-0 opacity-70" />
                        <span className="font-semibold text-xs flex-1 text-muted-foreground">{dir}/</span>
                        <span className="text-[10px] text-muted-foreground font-medium bg-secondary/80 px-2 py-0.5 rounded-full">
                          {group.dirs[dir].length}
                        </span>
                      </button>

                      {/* Files in directory */}
                      {!collapsedDirs.has(dirKey) && (
                        <div className="divide-y divide-border/10 bg-background/20">
                          {group.dirs[dir].map(r => {
                            const fname = r.rel_path.replace(/\.pdf$/i, "").split("/").pop() || r.filename;
                            const dt = r.processed_at ? new Date(r.processed_at).toLocaleTimeString() : null;
                            const confPct = r.confidence !== null && r.confidence !== undefined
                              ? (r.confidence * 100).toFixed(1) + "%"
                              : null;
                            const highConf = r.confidence !== null && r.confidence !== undefined && r.confidence >= 0.85;

                            return (
                              <div key={r.id} className="flex items-center gap-3 px-10 py-2.5 hover:bg-secondary/20 transition-colors group">
                                {/* Filename */}
                                <span className="flex-1 text-sm font-medium truncate" title={r.rel_path}>
                                  {fname}
                                </span>

                                {/* Method badge */}
                                <Badge
                                  variant="outline"
                                  className="rounded-md text-[9px] uppercase font-bold tracking-wider shrink-0 h-5"
                                >
                                  {r.method || "?"}
                                </Badge>

                                {/* Confidence */}
                                {confPct && (
                                  <span className={cn(
                                    "text-[11px] font-semibold shrink-0",
                                    highConf ? "text-success" : "text-destructive"
                                  )}>
                                    {confPct}
                                  </span>
                                )}

                                {/* Char count */}
                                <span className="text-[11px] text-muted-foreground shrink-0">
                                  {(r.char_count || 0).toLocaleString()} ch
                                </span>

                                {/* Time */}
                                {dt && (
                                  <span className="text-[11px] text-muted-foreground shrink-0 hidden lg:block opacity-60">
                                    {dt}
                                  </span>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg hover:bg-primary hover:text-white"
                                    onClick={() => handleView(r)}
                                    title="View text"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <a
                                    href={getDownloadUrl(r.id)}
                                    download={`${fname}.txt`}
                                    title="Download .txt"
                                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg transition-colors hover:bg-primary hover:text-white"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between px-2 py-2">
          <p className="text-xs text-muted-foreground">
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-xl"
            >
              Previous
            </Button>
            <Button
              variant="outline" size="sm"
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
