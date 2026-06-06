import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import type { PDFFile, PaginationState } from "@/types";

export function useJobStatus() {
  return useQuery({
    queryKey: ["job-status"],
    queryFn: () => fetcher<{ status: string; done: number; total: number; progress_pct: number }>("/job/status"),
  });
}

export function useJobFiles(
  page: number,
  size: number,
  enabled: boolean,
  skipProcessedFiles: boolean,
) {
  return useQuery({
    queryKey: ["job-files", page, size],
    queryFn: async () => {
      const skipParam = skipProcessedFiles ? "&skip_processed=true" : ""
      const data = await fetcher<{
        items: Record<string, unknown>[]
        page: number
        size: number
        total: number
        pages: number
      }>(`/job/files?page=${page}&size=${size}${skipParam}`)
      const items: PDFFile[] = data.items.map((f: Record<string, unknown>) => ({
        id: f.id || f.name,
        name: f.name,
        size: f.size_bytes || 0,
        status: f.status || "queued",
        progress: f.progress_pct || 0,
        addedAt: new Date(),
        method: f.method || "undefined",
        totalPages: f.total_pages,
        currentPage: f.current_page,
        relPath: f.rel_path,
        runId: f.run_id,
      }));
      return {
        items,
        pagination: {
          page: data.page || page,
          size: data.size || size,
          total: data.total || 0,
          pages: data.pages || 1,
        } as PaginationState,
      };
    },
    enabled,
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetcher("/job/cancel", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-status"] });
    },
  });
}

export function useStartJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      batch_id: string
      file_ids: string[]
      selected_files: Record<string, string[]> | null
      force: boolean
      output_dir?: string
    }) =>
      fetcher("/job/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-status"] });
      queryClient.invalidateQueries({ queryKey: ["runs"] });
    },
  });
}
