import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetcher, API_BASE } from "@/lib/api";
import type {
  ExtractionResult,
  ExtractionResultDetail,
  PaginationState,
  ResultTreeResponse,
} from "@/types";

export function useResults(runId: string | null, page: number, size: number) {
  return useQuery({
    queryKey: ["results", runId, page, size],
    queryFn: async () => {
      let url = `/results?page=${page}&size=${size}`;
      if (runId) {
        url += `&run_id=${encodeURIComponent(runId)}`;
      }
      const data = await fetcher<{
        items: ExtractionResult[];
        page: number;
        size: number;
        total: number;
        pages: number;
      }>(url);
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

export function useResultTree(runId: string | null, page: number = 1, size: number = 50) {
  return useQuery({
    queryKey: ["results", "tree", runId, page, size],
    queryFn: async () => {
      const url = runId
        ? `/results/tree?run_id=${encodeURIComponent(runId)}&page=${page}&size=${size}`
        : `/results/tree?page=${page}&size=${size}`;
      const data = await fetcher<ResultTreeResponse>(url);
      return {
        directories: data.directories ?? [],
        directoriesTotal: data.directories_total ?? 0,
        topLevelFiles: data.top_level_files ?? [],
        topLevelFilesTotal: data.top_level_files_total ?? 0,
        pagination: {
          page: data.page,
          size: data.size,
          total: data.total ?? 0,
          pages: data.pages ?? 1,
        } as PaginationState,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

export function useResultDirectoryFiles(
  runId: string | null,
  directory: string | null,
  size: number = 50,
) {
  return useInfiniteQuery({
    queryKey: ["results", "directory-files", "infinite", runId, directory, size],
    queryFn: async ({ pageParam = 1 }) => {
      if (!runId) return { items: [], nextCursor: undefined };
      const dirParam = directory !== null ? `&directory=${encodeURIComponent(directory)}` : "";
      const data = await fetcher<{
        items: ExtractionResult[];
        page: number;
        size: number;
        total: number;
        pages: number;
      }>(`/results?page=${pageParam}&size=${size}&run_id=${encodeURIComponent(runId)}${dirParam}`);
      return {
        items: data.items || [],
        nextCursor: data.page < data.pages ? data.page + 1 : undefined,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!runId && directory !== null, // Only fetch when a specific directory is selected
  });
}
