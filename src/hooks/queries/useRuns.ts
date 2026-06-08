import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import type { Run, PaginationState } from "@/types";

export function useRuns(page: number, size: number) {
  return useQuery({
    queryKey: ["runs", page, size],
    queryFn: async () => {
      const data = await fetcher<{
        items: Record<string, unknown>[];
        page: number;
        size: number;
        total: number;
        pages: number;
      }>(`/runs?page=${page}&size=${size}`);
      const items: Run[] = data.items.map((r: Record<string, unknown>) => ({
        id: r.run_id || r.id || String(Math.random()),
        status: r.status || "unknown",
        totalFiles: r.total_files || 0,
        completedFiles: r.done_files || r.completed_files || 0,
        failedFiles: r.failed_files || 0,
        directFiles: r.direct_files || 0,
        ocrFiles: r.ocr_files || 0,
        startedAt: r.started_at ? new Date(r.started_at as string) : new Date(),
        elapsedSeconds: r.elapsed_seconds || 0,
        etaSeconds: r.eta_seconds || null,
        progressPct: r.progress_pct || 0,
        outputDir: (r.output_dir as string) || undefined,
        runNumber: (r.run_number as number) || undefined,
      }));
      return {
        items,
        pagination: {
          page: data.page || page,
          size: data.size || size,
          total: data.total || 0,
          pages: Math.ceil((data.total || 0) / size) || 1,
        } as PaginationState,
      };
    },
  });
}

export function useRun(runId: string | null) {
  return useQuery({
    queryKey: ["run", runId],
    queryFn: async () => {
      if (!runId) return null;
      const r = await fetcher<Record<string, unknown>>(`/runs/${encodeURIComponent(runId)}`);
      return {
        id: r.run_id || r.id || String(Math.random()),
        status: r.status || "unknown",
        totalFiles: r.total_files || 0,
        completedFiles: r.done_files || r.completed_files || 0,
        failedFiles: r.failed_files || 0,
        directFiles: r.direct_files || 0,
        ocrFiles: r.ocr_files || 0,
        startedAt: r.started_at ? new Date(r.started_at as string) : new Date(),
        elapsedSeconds: r.elapsed_seconds || 0,
        etaSeconds: r.eta_seconds || null,
        progressPct: r.progress_pct || 0,
        runNumber: (r.run_number as number) || undefined,
      } as Run;
    },
    enabled: !!runId,
  });
}

export interface RunIdItem {
  run_id: string;
  run_number: number;
}

export function useRunLog(runId: string | null) {
  return useQuery({
    queryKey: ["run-log", runId],
    queryFn: async () => {
      if (!runId) return null;
      const res = await fetcher<string>(`/runs/${encodeURIComponent(runId)}/log`);
      return res;
    },
    enabled: !!runId,
  });
}

export function useAllRunIds() {
  return useInfiniteQuery({
    queryKey: ["results", "run-ids", "infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await fetcher<{
        items: RunIdItem[];
        page: number;
        size: number;
        total: number;
        pages: number;
      }>(`/runs/ids?page=${pageParam}&size=20`);
      return {
        items: data.items || [],
        nextCursor: data.page < data.pages ? data.page + 1 : undefined,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
