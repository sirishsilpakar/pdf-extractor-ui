import { useQuery } from "@tanstack/react-query";
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

export function useRunFiles(runId: string | null, page: number, size: number) {
  return useQuery({
    queryKey: ["run-files", runId, page, size],
    queryFn: async () => {
      if (!runId) return null;
      const data = await fetcher<{ items: Record<string, unknown>[]; page: number; size: number; total: number; pages: number }>(`/runs/${encodeURIComponent(runId)}/files?page=${page}&size=${size}`);
      return {
        items: data.items || [],
        pagination: {
          page: data.page || page,
          size: data.size || size,
          total: data.total || 0,
          pages: Math.ceil((data.total || 0) / size) || 1,
        } as PaginationState,
      };
    },
    enabled: !!runId,
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
