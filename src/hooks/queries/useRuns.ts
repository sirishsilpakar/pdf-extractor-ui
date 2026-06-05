import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import type { Run, PaginationState, ExtractionResult } from "@/types";

export function useRuns(page: number, size: number) {
  return useQuery({
    queryKey: ["runs", page, size],
    queryFn: async () => {
      const data = await fetcher<{ items: Record<string, unknown>[]; page: number; size: number; total: number; pages: number }>(`/runs?page=${page}&size=${size}`);
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

export interface RunTreeDirectory {
  run_id: string;
  run_number?: number | null;
  path: string;
  count: number;
  has_duplicate?: boolean;
}

export interface RunIdItem {
  run_id: string;
  run_number: number;
}

export interface RunTreeResponse {
  directories: RunTreeDirectory[];
  directories_total: number;
  top_level_files: ExtractionResult[];
  top_level_files_total: number;
  page: number;
  size: number;
  pages: number;
  total: number;
}

export function useRunTree(runId: string | null, page: number = 1, size: number = 50) {
  return useQuery({
    queryKey: ["run-tree", runId, page, size],
    queryFn: async () => {
      const url = runId 
        ? `/results/tree?run_id=${encodeURIComponent(runId)}&page=${page}&size=${size}`
        : `/results/tree?page=${page}&size=${size}`;
      return await fetcher<RunTreeResponse>(url);
    },
    // Removed `enabled: !!runId` because we now want to fetch the global tree if runId is null
  });
}

export function useRunFiles(runId: string | null, directory: string | null, size: number = 50) {
  return useInfiniteQuery({
    queryKey: ["run-files-infinite", runId, directory, size],
    queryFn: async ({ pageParam = 1 }) => {
      if (!runId) return { items: [], nextCursor: undefined };
      const dirParam = directory !== null ? `&directory=${encodeURIComponent(directory)}` : "";
      const data = await fetcher<{ items: ExtractionResult[]; page: number; size: number; total: number; pages: number }>(
        `/results?page=${pageParam}&size=${size}&run_id=${encodeURIComponent(runId)}${dirParam}`
      );
      return {
        items: data.items || [],
        nextCursor: data.page < data.pages ? data.page + 1 : undefined,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!runId && directory !== null, // Only fetch when a specific directory is selected
  });
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
    queryKey: ["run-ids-infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await fetcher<{ items: RunIdItem[]; page: number; size: number; total: number; pages: number }>(`/runs/ids?page=${pageParam}&size=20`);
      return {
        items: data.items || [],
        nextCursor: data.page < data.pages ? data.page + 1 : undefined,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
