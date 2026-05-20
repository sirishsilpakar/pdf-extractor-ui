import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { SSE_URL } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { SSEEvent, SSEStateUpdateEvent, PDFFile, SSEFileProgressEvent } from "@/types";
import { toast } from "@/components/ui/sonner";

export function useSSE() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const handleStateUpdate = useCallback((data: SSEStateUpdateEvent) => {
    const state = useAppStore.getState();
    const running = data.status === "running";
    
    state.setIsProcessing(running);
    
    if (running || (data.total && data.total > 0)) {
      const total = data.total || 0;
      const done = data.done || 0;
      const calculatedProgress = total > 0 ? Math.floor((done / total) * 100) : 0;
      const serverProgress = data.progress_pct !== undefined ? data.progress_pct : calculatedProgress;
      
      // If we just started a new run (status changed to running), reset progress
      if (running && !state.isProcessing) {
        state.setOverallProgress(0);
      }
      
      // Only update progress if it's a significant leap forward, completion, or status change
      const currentProgress = state.overallProgress;
      if (serverProgress === 100 || serverProgress >= currentProgress || !running) {
        state.setOverallProgress(serverProgress);
      }
      
      state.setTotalFiles(total);
      state.setCompletedFiles(done);
      state.setCurrentRunId(data.run_id || null);
      if (data.current_file) state.setProcessingFile(data.current_file);
    }

    if (running) {
      queryClient.invalidateQueries({ queryKey: ["job-files"] });
    } else {
      // Job just finished or is idle
      queryClient.invalidateQueries({ queryKey: ["runs"] });
      queryClient.invalidateQueries({ queryKey: ["results"] });

      if (data.status === "done") {
        toast.success("Extraction is completed", { 
          action : { 
            label: "View results", 
            onClick: () => {
              state.setCurrentView("results");
              state.setResultsRunFilter(data.run_id);
            } 
          }, 
          duration: 5000
        }); 
        state.setPendingFiles([]);
        state.setTotalFiles(0);
        state.setCompletedFiles(0);
        state.setOverallProgress(0);
      }
    }
  }, [queryClient]);

  const connectSSE = useCallback(() => {
    abortControllerRef.current?.abort();
    const es = new EventSource(SSE_URL);

    es.onopen = () => {
      useAppStore.getState().addLog("Connected to server updates", "success");
    };

    es.onmessage = (event) => {
      let data: SSEEvent;
      try { data = JSON.parse(event.data); } catch { return; }

      const state = useAppStore.getState();

      switch (data.type) {
        case "state_update":   
          handleStateUpdate(data); 
          break;
        case "log":            
          state.addLog(data.message, data.level || "info"); 
          break;
        case "file_progress": {
          const progressData = data as SSEFileProgressEvent;
          // Update the cache for the individual file progress
          queryClient.setQueriesData({ queryKey: ["job-files"] }, (oldData: unknown) => {
            const castedData = oldData as { items: PDFFile[] } | undefined;
            if (!castedData || !castedData.items) return oldData;
            return {
              ...castedData,
              items: castedData.items.map((item: PDFFile) => {
                if (item.name === progressData.file) {
                  return { 
                    ...item, 
                    progress: progressData.pct,
                    method: progressData.method,
                    status: "processing",
                    currentPage: progressData.page,
                    totalPages: progressData.total_pages
                  } as PDFFile;
                }
                return item;
              })
            };
          });

          // Also estimate a live update for the overall progress
          const totalFiles = state.totalFiles;
          const completedFiles = state.completedFiles;
          if (totalFiles > 0) {
            const basePct = (completedFiles / totalFiles) * 100;
            const partialPct = (progressData.pct / 100) * (1 / totalFiles) * 100;
            const newProgress = Math.min(99, Math.round(basePct + partialPct));
            if (newProgress >= state.overallProgress) {
              state.setOverallProgress(newProgress);
            }
          }

          if (progressData.pct === 100) {
            queryClient.invalidateQueries({ queryKey: ["job-files"] });
            queryClient.invalidateQueries({ queryKey: ["results"] });
          }
          break;
        }
      }
    };

    es.onerror = () => {
      console.warn("SSE connection lost, reconnecting...");
    };

    abortControllerRef.current = { abort: () => es.close() };
  }, [queryClient, handleStateUpdate]);

  useEffect(() => {
    connectSSE();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [connectSSE]);
}
