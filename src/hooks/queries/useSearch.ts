import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import type { SearchResult, PaginationState } from "@/types";

export function useSearch(query: string, page: number, size: number) {
  return useQuery({
    queryKey: ["search", query, page, size],
    queryFn: async () => {
      if (!query.trim()) return null;
      try {
        const data = await fetcher<{ results: Record<string, unknown>[]; total: number; pages: number }>(`/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);
        return {
          items: (data.results || []).map((r: Record<string, unknown>) => ({
            resultId: r.result_id,
            file: r.file,
            relPath: r.rel_path,
            snippet: r.snippet,
            pageNo: r.page_no,
          })) as SearchResult[],
          pagination: {
            page: page,
            size: size,
            total: data.total || 0,
            pages: data.pages || 1,
          } as PaginationState,
        };
      } catch (e: unknown) {
        const error = e as { message?: string };
        // Special case for 503 Empty Index
        if (error.message && error.message.includes("503")) {
          return { items: [], pagination: null, error: "empty_index" };
        }
        throw e;
      }
    },
    enabled: query.trim().length > 0,
  });
}

export function useReindexSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetcher("/search/reindex", { method: "POST" }),
    onSuccess: () => {
      // Could invalidate search queries, though reindex takes time
      // For now use 5 seconds delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["search"] })
      }, 5000);
    }
  });
}
