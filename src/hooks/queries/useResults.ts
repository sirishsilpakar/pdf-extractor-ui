import { useQuery } from "@tanstack/react-query";
import { fetcher, API_BASE } from "@/lib/api";
import type { ExtractionResult, ExtractionResultDetail, PaginationState } from "@/types";

export function useResults(runId: string | null, page: number, size: number) {
  return useQuery({
    queryKey: ["results", runId, page, size],
    queryFn: async () => {
      let url = `/results?page=${page}&size=${size}`;
      if (runId) {
        url += `&run_id=${encodeURIComponent(runId)}`;
      }
      const data = await fetcher<{ items: ExtractionResult[]; page: number; size: number; total: number; pages: number }>(url);
      return {
        items: (data.items || []) as ExtractionResult[],
        pagination: {
          page: data.page || page,
          size: data.size || size,
          total: data.total || 0,
          pages: data.pages || 1,
        } as PaginationState,
      };
    },
  });
}

export function useResultDetail(id: number | null) {
  return useQuery({
    queryKey: ["result", id],
    queryFn: () => fetcher<ExtractionResultDetail>(`/results/${id}`),
    enabled: id !== null,
  });
}

export function getDownloadUrl(id: number) {
  return `${API_BASE}/results/${id}/download`;
}
