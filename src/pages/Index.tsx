import { useState, useEffect, useMemo } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { ProcessingDashboard } from "@/components/ProcessingDashboard";
import { FileTable } from "@/components/FileTable";
import { LogsPanel } from "@/components/LogsPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SearchPanel } from "@/components/SearchPanel";
import { RunsPanel } from "@/components/RunsPanel";
import { ResultsPanel } from "@/components/ResultsPanel";
import { ReprocessModal } from "@/components/ReprocessModal";
import { useAppStore } from "@/store/useAppStore";
import { getFilesFromDataTransfer } from "@/lib/fileDrop";
import { hashFile } from "@/lib/hashing";
import { useSSE } from "@/hooks/useSSE";
import {
  useJobStatus,
  useJobFiles,
  useCancelJob,
  useStartJob,
} from "@/hooks/queries/useJob";
import { useRuns, useRunLog } from "@/hooks/queries/useRuns";
import {
  useResults,
  useResultDetail,
  getDownloadUrl,
} from "@/hooks/queries/useResults";
import { useSearch, useReindexSearch } from "@/hooks/queries/useSearch";
import { API_BASE, BATCH_SSE_URL, fetcher } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { FilesListItem, PaginationState } from "@/types";

const Index = () => {
  const store = useAppStore();
  useSSE();

  const [resultsPage, setResultsPage] = useState(1);
  const [runsPage, setRunsPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [filesPage, setFilesPage] = useState(1);
  const [batchId, setBatchId] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  // Reset page on filter/query change
  useEffect(() => {
    setResultsPage(1);
  }, [store.resultsRunFilter]);
  useEffect(() => {
    setSearchPage(1);
  }, [store.searchQuery]);

  // Queries
  const { data: jobStatus } = useJobStatus();
  const { data: jobFiles, isPending: isFilesLoading } = useJobFiles(
    filesPage,
    10,
    store.isProcessing,
  );
  const { data: runsData, isPending: isRunsLoading } = useRuns(runsPage, 10);
  const {
    data: resultsData,
    isPending: isResultsLoading,
    refetch: refetchResults,
  } = useResults(store.resultsRunFilter, resultsPage, 10);
  const { data: searchData, isPending: isSearchLoading } = useSearch(
    store.searchQuery,
    searchPage,
    10,
  );

  const {
    data: batchStatusData,
    isPending: isBatchStatusPending,
    error: batchStatusError,
  } = useQuery({
    queryKey: ["batchStatus", batchId, page, size],
    enabled: !!batchId,
    queryFn: async () => {
      const url = `/batches/${batchId}/files?page=${page}&size=${size}`;
      const data = await fetcher<{
        items: FilesListItem[];
        page: number;
        size: number;
        total: number;
        pages: number;
      }>(url);
      return {
        items: (data.items || []) as FilesListItem[],
        pagination: {
          page: page,
          size: size,
          total: data.total || 0,
          pages: data.pages || 1,
        } as PaginationState,
      };
    },
    placeholderData: (prev) => prev,
  });

  // Mutations
  const { mutate: cancelJob } = useCancelJob();
  const { mutate: startJob } = useStartJob();
  const { mutate: reindexSearch } = useReindexSearch();

  // After we get job status done from Batch processing stream
  const pendingFiles = useMemo(() => {
    if (!batchStatusData?.items?.length) return [];
    return batchStatusData.items.map((f) => ({
      id: f.content_hash,
      name: f.name,
      hash: f.content_hash,
      size: f.size_bytes,
      relPath: f.rel_path,
      isAlreadyRegistered: true,
    }));
  }, [batchStatusData]);

  // Helper actions that were previously in store
  const handleAddFiles = async (fileList: FileList | File[]) => {
    const newFiles = Array.from(fileList).filter((f) =>
      f.name.toLowerCase().endsWith(".pdf"),
    );
    if (newFiles.length === 0) return;

    const entries = newFiles.map((f) => {
      const absPath = (f as File & { path?: string }).path || "";
      const relPath = f.webkitRelativePath || f.name;
      return {
        file: f,
        id: crypto.randomUUID(),
        hash: null as string | null,
        relPath,
        absPath,
      };
    });

    store.setPendingFiles((prev) => [...prev, ...entries]);
    store.setCurrentView("dashboard");
    store.setTotalFiles(entries.length);
    store.setCompletedFiles(0);
    store.setOverallProgress(0);
    store.addLog(
      `Added ${entries.length} file(s). Calculating hashes...`,
      "info",
    );

    for (const entry of entries) {
      const hash = await hashFile(entry.file as File);
      entry.hash = hash;
      store.setPendingFiles((prev) =>
        prev.map((p) => (p.id === entry.id ? { ...p, hash } : p)),
      );
    }
    store.addLog(`Hashing completed for ${entries.length} files.`, "success");
  };

  const handleRegisterPath = async (path: string) => {
    try {
      const res = await fetch(`${API_BASE}/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) {
        const err = await res.json();
        store.addLog(
          `Path registration failed: ${err.detail || res.statusText}`,
          "error",
        );
        return;
      }
      const data = await res.json();
      if (data.batch_id) {
        getBatchStatusStream();
      }
    } catch (e) {
      store.addLog(`Failed to register path: ${e}`, "error");
    }
  };

  const getBatchStatusStream = () => {
    const eventSource = new EventSource(BATCH_SSE_URL);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.scan_status === "done") {
        setBatchId(data.batch_id);
        store.addLog(`Batch ready to process`, "info");
      }
    };
    eventSource.onerror = () => {
      store.addLog(`Event stream failed for batch processing.`, "success");
      eventSource.close();
    };
    return () => {
      eventSource.close();
    };
  };

  const handleStartProcessing = async (
    force = false,
    skipDuplicates = false,
  ) => {
    // 0. Duplicate Check
    if (!force && !skipDuplicates) {
      const hashes = store.pendingFiles
        .map((p) => p.hash)
        .filter(Boolean) as string[];
      if (hashes.length > 0) {
        try {
          const checkRes = await fetch(`${API_BASE}/upload/check-hashes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hashes }),
          });
          const checkData = await checkRes.json();
          // API returns already_processed as a dict, we want the keys
          const alreadyHashes = Object.keys(checkData.already_processed || {});

          if (alreadyHashes.length > 0) {
            store.setReprocessData({
              hashes,
              alreadyHashes,
              totalItems: store.pendingFiles.length,
              alreadyCount: alreadyHashes.length,
            });
            store.setShowReprocessModal(true);
            return; // STOP HERE: wait for user decision in modal
          }
        } catch (e) {
          console.error("Duplicate check failed:", e);
        }
      }
    }

    // 1. Separate files to upload vs references
    const filesToUpload = store.pendingFiles.filter(
      (pf) => !pf.isReference && pf.file,
    );
    let uploadedIds: string[] = [];

    if (filesToUpload.length > 0) {
      store.addLog(`Uploading ${filesToUpload.length} files...`, "info");
      try {
        const formData = new FormData();
        filesToUpload.forEach((pf) => {
          // Send as 'files', using the webkitRelativePath if available to preserve structure
          formData.append(
            "files",
            pf.file as Blob,
            pf.relPath || pf.file!.name,
          );
        });

        const res = await fetch(`${API_BASE}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        uploadedIds = data.map((f: { file_id: string }) => f.file_id);
        store.addLog("Upload complete.", "success");
      } catch (e) {
        const error = e as Error;
        store.addLog(`Upload failed: ${error.message}`, "error");
        return;
      }
    }

    // 2. Prepare selected_files payload for references
    const selectedFilesPayload: Record<string, string[]> = {};
    if (store.registeredRefIds.length > 0) {
      const refPending = store.pendingFiles.filter((pf) => pf.isReference);
      for (const pf of refPending) {
        if (pf.refId) {
          if (!selectedFilesPayload[pf.refId]) {
            selectedFilesPayload[pf.refId] = [];
          }
          if (pf.relPath) {
            selectedFilesPayload[pf.refId].push(pf.relPath);
          }
        }
      }
    }

    // 3. Start Job
    startJob({
      file_ids: [...uploadedIds, ...store.registeredRefIds],
      selected_files:
        Object.keys(selectedFilesPayload).length > 0
          ? selectedFilesPayload
          : null,
      force,
    });

    // Clear pending files to UI transition into dashboard
    store.setPendingFiles([]);
    store.setRegisteredRefIds([]);
    store.setRegisteredPaths([]);
    store.addLog("Pipeline started successfully!", "success");
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <ReprocessModal
        open={store.showReprocessModal}
        onOpenChange={store.setShowReprocessModal}
        alreadyCount={store.reprocessData?.alreadyCount || 0}
        totalCount={store.reprocessData?.totalItems || 0}
        onSkip={() => {
          store.setShowReprocessModal(false);
          handleStartProcessing(false, true);
        }}
        onReprocess={() => {
          store.setShowReprocessModal(false);
          handleStartProcessing(true);
        }}
        onCancel={() => {
          store.setShowReprocessModal(false);
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          currentView={store.currentView}
          onViewChange={store.setCurrentView}
          stats={{
            total: store.totalFiles,
            completed: store.completedFiles,
            failed: 0,
          }}
        />

        <main className="flex-1 no-scrollbar overflow-y-auto">
          <AppHeader
            globalSearch={store.globalSearch}
            onGlobalSearchChange={store.setGlobalSearch}
            onSearchSubmit={(v) => {
              store.setCurrentView("search");
              store.setSearchQuery(v);
            }}
            onAddPath={handleRegisterPath}
          />

          <div className="p-4 space-y-6 pb-20">
            {store.currentView === "dashboard" && (
              <>
                <ProcessingDashboard
                  overallProgress={store.overallProgress}
                  totalFiles={store.totalFiles}
                  completedFiles={store.completedFiles}
                  processingFile={store.processingFile}
                  isProcessing={store.isProcessing}
                  onCancel={() => cancelJob()}
                  onStart={() => handleStartProcessing()}
                  eventErr={false}
                />

                <FileTable
                  files={store.isProcessing ? jobFiles?.items || [] : []}
                  pendingFiles={batchId ? pendingFiles : store.pendingFiles}
                  pagination={
                    batchStatusData?.pagination || {
                      page: 1,
                      size: 10,
                      total: 0,
                      pages: 1,
                    }
                  }
                  onPageChange={(p) => {
                    setPage(p);
                  }}
                  selectedFiles={store.selectedFiles}
                  isLoading={isFilesLoading && store.isProcessing}
                  onRemove={store.removePendingFile}
                  onRetry={() => {}}
                  dropFiles={async (e) => {
                    if (e.dataTransfer.items) {
                      const files = await getFilesFromDataTransfer(
                        e.dataTransfer.items,
                      );
                      if (files.length > 0) handleAddFiles(files);
                    } else if (e.dataTransfer.files) {
                      handleAddFiles(e.dataTransfer.files);
                    }
                  }}
                />

                <LogsPanel
                  logs={store.logs}
                  autoscroll={store.logsAutoscroll}
                  onToggleAutoscroll={() =>
                    store.setLogsAutoscroll(!store.logsAutoscroll)
                  }
                />
              </>
            )}

            {store.currentView === "runs" && (
              <RunsPanel
                runs={runsData?.items || []}
                pagination={
                  runsData?.pagination || {
                    page: 1,
                    size: 10,
                    total: 0,
                    pages: 1,
                  }
                }
                isLoading={isRunsLoading}
                onPageChange={setRunsPage}
                onViewResults={(runId) => {
                  store.setResultsRunFilter(runId);
                  store.setCurrentView("results");
                }}
                onLoadRunLog={async (id) => {
                  try {
                    const res = await fetch(`${API_BASE}/runs/${id}/log`);
                    if (res.ok) return await res.text();
                    return "Log not available or failed to load.";
                  } catch (e) {
                    console.error("Failed to load run log", e);
                    return "Failed to load log.";
                  }
                }}
              />
            )}

            {store.currentView === "results" && (
              <ResultsPanel
                results={resultsData?.items || []}
                pagination={
                  resultsData?.pagination || {
                    page: 1,
                    size: 10,
                    total: 0,
                    pages: 1,
                  }
                }
                runFilter={store.resultsRunFilter}
                isLoading={isResultsLoading}
                onRunFilterChange={store.setResultsRunFilter}
                onPageChange={setResultsPage}
                onRefresh={() => refetchResults()}
                onGetDetail={async (id) => {
                  try {
                    return await fetcher(`/results/${id}`);
                  } catch (e) {
                    console.error("Failed to fetch result detail", e);
                    return null;
                  }
                }}
                getDownloadUrl={getDownloadUrl}
              />
            )}

            {store.currentView === "search" && (
              <SearchPanel
                query={store.searchQuery}
                results={
                  store.searchQuery.trim() ? searchData?.items || [] : []
                }
                pagination={
                  store.searchQuery.trim()
                    ? searchData?.pagination || {
                        page: 1,
                        size: 10,
                        total: 0,
                        pages: 1,
                      }
                    : { page: 1, size: 10, total: 0, pages: 1 }
                }
                isLoading={isSearchLoading}
                onSearch={(q, p) => {
                  if (q !== store.searchQuery) store.setSearchQuery(q);
                  if (p !== undefined) setSearchPage(p);
                }}
                onReindex={() => reindexSearch()}
                onGetDetail={async (id) => {
                  try {
                    return await fetcher(`/results/${id}`);
                  } catch (e) {
                    console.error("Failed to fetch result detail", e);
                    return null;
                  }
                }}
                getDownloadUrl={getDownloadUrl}
              />
            )}

            {store.currentView === "settings" && (
              <div className="glass rounded-2xl p-6">
                <h2 className="font-semibold mb-4 text-lg">System Settings</h2>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configure the PDF extraction pipeline settings in the panel
                    on the right.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        <SettingsPanel
          settings={store.settings}
          applyAll={false}
          onUpdate={store.updateSetting}
          onAllUpdate={() => {}}
        />
      </div>
    </div>
  );
};

export default Index;
