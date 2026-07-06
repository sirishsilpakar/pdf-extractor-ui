import React, { useState, useRef, useEffect } from "react";
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
  TriangleAlert,
  AlertCircle,
} from "lucide-react";
import type { ExtractionResult, ExtractionResultDetail } from "@/types";
import { cn } from "@/lib/utils";
import { FileViewerModal } from "./FileViewerModal";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAllRunIds } from "@/hooks/queries/useRuns";
import { useResultTree, useResultDirectoryFiles } from "@/hooks/queries/useResults";

import { useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "@/utils/format";

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
  const dt = format.relativeTime(r.processed_at);
  const confPct = format.percent(r.confidence);
  const highConf = r.confidence !== null && r.confidence !== undefined && r.confidence >= 0.85;

  return (
    <div className="flex items-center gap-3 pl-4 pr-6 py-2 hover:bg-secondary/20 transition-colors group h-[52px]">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex-1 text-sm font-medium truncate flex items-center gap-2 cursor-help">
            <span className="truncate">{fname}</span>
            {showRunInfo && r.run_id && (
              <span className="text-[10px] text-muted-foreground/50 font-normal shrink-0">
                {r.run_id === "no-run" ? "Direct" : `Run #${r.run_number ?? r.run_id.slice(0, 8)}`}
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="text-xs max-w-[400px] break-all">
          {r.rel_path}
          {r.error_message && (
            <div className="mt-1 text-destructive/85 font-mono text-[10px] border-t border-border/20 pt-1">
              Error: {r.error_message}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
      <Badge
        variant="outline"
        className={cn(
          "rounded-md text-[9px] uppercase font-bold tracking-wider shrink-0 h-5 w-14 flex items-center justify-center text-center",
          r.method === "error" && "border-destructive/30 bg-destructive/10 text-destructive"
        )}
      >
        {r.method || "?"}
      </Badge>
      <span
        className={cn(
          "text-[11px] shrink-0 w-12 text-right",
          r.method === "error" ? "text-muted-foreground font-normal" : "font-semibold",
          r.method !== "error" && (highConf ? "text-success" : "text-destructive")
        )}
      >
        {r.method === "error" ? "-" : (confPct || "-")}
      </span>
      <span className="text-[11px] text-muted-foreground shrink-0 w-16 text-right">
        {r.method === "error" ? "-" : format.chars(r.char_count)}
      </span>
      {dt && (
        <span className="text-[11px] text-muted-foreground shrink-0 hidden lg:block opacity-60 w-16 text-right">
          {dt}
        </span>
      )}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-16 justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg hover:bg-primary hover:text-white"
              onClick={() => onView(r)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" align="center" className="text-xs">
            View text
          </TooltipContent>
        </Tooltip>
        {r.method !== "error" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={getDownloadUrl(r.id)}
                download={`${fname}.txt`}
                className="inline-flex items-center justify-center h-7 w-7 rounded-lg transition-colors hover:bg-primary hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="text-xs">
              Download .txt
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center h-7 w-7 text-destructive cursor-help">
                <AlertCircle className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" align="end" className="text-xs max-w-[250px] font-normal">
              {r.error_message || r.flags?.replace(/_/g, " ") || "File extraction failed"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

const DirectoryItem = ({
  runId,
  runNumber,
  directory,
  count,
  onView,
  getDownloadUrl,
  showRunInfo,
}: {
  runId: string;
  runNumber?: number | null;
  directory: string;
  count: number;
  onView: (r: ExtractionResult) => void;
  getDownloadUrl: (id: number) => string;
  showRunInfo?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useResultDirectoryFiles(expanded ? runId : null, directory, 5);

  const allItems = data ? data.pages.flatMap((p) => p.items) : [];

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: hasNextPage ? allItems.length + 1 : allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52, // Matches FileRow h-[52px]
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // If scrolled within 100px of the bottom, fetch next page
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-6 py-3 bg-secondary/20 hover:bg-secondary/40 transition-colors text-left border-b border-border/10"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <FolderOpen className="h-4 w-4 text-primary shrink-0 opacity-70" />
        <span className="font-semibold text-xs flex-1 text-muted-foreground truncate flex items-center gap-2">
          {directory || "(root)"}
          {showRunInfo && runId && (
            <span className="text-[10px] text-muted-foreground/50 font-normal hidden sm:inline-block">
              {runId === "no-run" ? "Direct" : `Run #${runNumber ?? runId.slice(0, 8)}`}
            </span>
          )}
        </span>
        <span className="text-[10px] text-muted-foreground font-medium bg-secondary/80 px-2 py-0.5 rounded-full">
          {count}
        </span>
      </button>

      {expanded && (
        <div className="bg-background/20 relative">
          {isLoading && (
            <div className="p-4 text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading files...
            </div>
          )}

          <div
            ref={parentRef}
            className="max-h-[240px] overflow-y-auto pl-6 border-l border-border/10 ml-8 mr-2 py-1"
            onScroll={handleScroll}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualItems.map((virtualRow) => {
                const isLoaderRow = virtualRow.index > allItems.length - 1;
                const item = allItems[virtualRow.index];

                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {isLoaderRow ? (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Fetching more...
                      </div>
                    ) : (
                      item && <FileRow r={item} onView={onView} getDownloadUrl={getDownloadUrl} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface Props {
  runFilter: string | null;
  onRunFilterChange: (id: string | null) => void;
  onGetDetail: (id: number) => Promise<ExtractionResultDetail | null>;
  getDownloadUrl: (id: number) => string;
}

export function ResultsPanel({ runFilter, onRunFilterChange, onGetDetail, getDownloadUrl }: Props) {
  const [viewingResult, setViewingResult] = useState<ExtractionResult | null>(null);
  const [viewingDetail, setViewingDetail] = useState<ExtractionResultDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [treePage, setTreePage] = useState(1);

  const queryClient = useQueryClient();

  const {
    data: fetchedRunIdsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAllRunIds();
  const availableRuns = fetchedRunIdsData ? fetchedRunIdsData.pages.flatMap((p) => p.items) : [];

  // Reset tree page when filter changes
  useEffect(() => {
    setTreePage(1);
  }, [runFilter]);

  const { data: tree, isLoading, isError, error } = useResultTree(runFilter, treePage, 20);

  const directories = tree?.directories ?? [];
  const files = tree?.topLevelFiles ?? [];
  const { page, pages, total } = tree?.pagination ?? {};

  const handleView = async (result: ExtractionResult) => {
    setViewingResult(result);
    setViewingDetail(null);
    setIsLoadingDetail(true);
    setDetailError(false);
    try {
      const detail = await onGetDetail(result.id);
      if (detail) {
        setViewingDetail(detail);
      } else {
        setDetailError(true);
      }
    } catch (e) {
      console.error("Failed to load result text detail", e);
      setDetailError(true);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <FileViewerModal
        open={!!viewingResult}
        onOpenChange={(open) => {
          if (!open) {
            setViewingResult(null);
            setViewingDetail(null);
            setIsLoadingDetail(false);
            setDetailError(false);
          }
        }}
        fileName={viewingResult?.filename ?? ""}
        detail={viewingDetail}
        isLoading={isLoadingDetail}
        isError={detailError}
        downloadUrl={viewingResult ? getDownloadUrl(viewingResult.id) : ""}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 shrink-0">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight leading-none">Extracted Files</h2>
          {total && (
            <span className="text-xs text-muted-foreground font-medium bg-secondary px-2 py-0.5 rounded-full leading-none">
              {total} files
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {availableRuns.length > 0 && (
            <div className="flex items-center gap-2 bg-secondary/30 px-2 py-1 rounded-xl border border-border/50">
              <span className="text-[10px] uppercase font-bold text-muted-foreground ml-1">
                Run:
              </span>
              <Select
                value={runFilter || "all"}
                onValueChange={(val) => onRunFilterChange(val === "all" ? null : val)}
              >
                <SelectTrigger className="h-6 text-xs bg-transparent border-none shadow-none focus:ring-0 px-1 py-0 gap-1 w-auto [&>svg]:opacity-50">
                  <SelectValue placeholder="All Runs" />
                </SelectTrigger>
                <SelectContent align="end" className="max-h-[300px]">
                  <SelectItem value="all">All Runs</SelectItem>
                  {availableRuns.map((run) => (
                    <SelectItem key={run.run_id} value={run.run_id}>
                      {run.run_id === "no-run" ? "Direct" : `Run #${run.run_number}`}
                    </SelectItem>
                  ))}
                  {hasNextPage && (
                    <div
                      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-primary font-medium"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isFetchingNextPage) fetchNextPage();
                      }}
                    >
                      {isFetchingNextPage ? "Loading..." : "Show more"}
                    </div>
                  )}
                </SelectContent>
              </Select>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["results"] });
            }}
            className="gap-2 rounded-xl h-8 hover:bg-primary hover:text-white"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="glass rounded-2xl overflow-hidden border border-border/50"
            >
              <div className="px-4 py-6 bg-primary/5 border-b border-border/30 space-y-2">
                <div className="h-5 w-48 bg-muted/20 animate-pulse rounded" />
                <div className="h-3 w-24 bg-muted/20 animate-pulse rounded" />
              </div>
            </div>
          ))
        ) : isError ? (
          <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 min-h-[300px] border-destructive/20 text-center" role="alert">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <TriangleAlert className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base text-destructive">Failed to Load Extracted Files</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {error instanceof Error ? error.message : "An unexpected error occurred while loading results."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["results"] });
              }}
              className="gap-2 rounded-xl h-8 hover:bg-primary hover:text-white"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden border border-border/50 flex flex-col divide-y divide-border/30">
            {directories.map((dir) => (
              <DirectoryItem
                key={`${dir.run_id}-${dir.path}`}
                runId={dir.run_id}
                runNumber={dir.run_number}
                directory={dir.path}
                count={dir.count}
                onView={handleView}
                getDownloadUrl={getDownloadUrl}
                showRunInfo={!!dir.has_duplicate}
              />
            ))}

            {files && files.length > 0 && (
              <div className="divide-y divide-border/10 bg-background/20">
                {files.map((file) => (
                  <FileRow
                    key={file.id}
                    r={file}
                    onView={handleView}
                    getDownloadUrl={getDownloadUrl}
                    showRunInfo={!!file.has_duplicate}
                  />
                ))}
              </div>
            )}

            {directories.length === 0 && files.length === 0 && (
              <div className="p-12 flex flex-col items-center justify-center gap-4">
                <ClipboardList className="h-8 w-8 text-muted-foreground opacity-50" />
                <p className="font-medium text-muted-foreground">No extracted files found.</p>
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between p-4">
                <p className="text-xs text-muted-foreground">
                  Showing page {page} of {pages} ({total} files)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={page <= 1}
                    onClick={() => setTreePage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={page >= pages}
                    onClick={() => setTreePage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
