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
import { toast } from "@/components/ui/sonner";
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
import { FilesListItem, NavView, PaginationState, ProcessingSettings } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen, Trash2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { isElectronAvailable, openFolder } from "@/lib/electron";

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      store.setCurrentView(localStorage.getItem('view') as NavView)
    }
  }, [])

  // Queries
  const { data: jobFiles, isPending: isFilesLoading } = useJobFiles(
    filesPage,
    10,
    store.isProcessing,
    store.skipProcessedFiles
  );
  const { data: runsData, isPending: isRunsLoading } = useRuns(runsPage, 10);
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
    queryKey: ["batchStatus", batchId, page, size, store.skipProcessedFiles],
    enabled: !!batchId,
    queryFn: async () => {
      // Forward the skip decision so the endpoint returns only the files
      // the pipeline will actually process, giving the correct total count
      const skipParam = store.skipProcessedFiles ? "&skip_processed=true" : "";
      const url = `/batches/${batchId}/files?page=${page}&size=${size}${skipParam}`;
      const data = await fetcher<{
        items: FilesListItem[];
        page: number;
        size: number;
        total: number;
        pages: number;
      }>(url);
      store.setTotalFiles(data.total);
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

  const [dirError, setDirError] = useState<string | null>(null);

  const handleValidateDir = async (
    path: string,
    showToast = true,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!path.trim()) {
      setDirError(null);
      return { ok: true };
    }
    try {
      await fetcher("/job/validate-directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      setDirError(null);
      return { ok: true };
    } catch (err: any) {
      setDirError(err.message);
      if (showToast) {
        toast.error("Directory not writable", {
          description: err.message,
        });
      }
      return { ok: false, error: err.message };
    }
  };

  // After we get job status done from Batch processing stream
  const pendingFiles = useMemo(() => {
    if (!batchStatusData?.items?.length) return [];
    const data = batchStatusData.items.map((f) => ({
      id: f.content_hash,
      name: f.name,
      hash: f.content_hash,
      size: f.size_bytes,
      relPath: f.rel_path,
      isAlreadyRegistered: true,
    }));
    store.setPendingFiles(data);
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
        size: f.size,
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

      store.setCurrentView("dashboard");

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
        store.setTotalFiles(0);
        store.setCompletedFiles(0);
        store.setOverallProgress(0);
        store.setSkipProcessedFiles(false);
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
    // Validate output directory before starting job
    if (store.extractionOutputDir) {
      const validation = await handleValidateDir(store.extractionOutputDir, false);
      if (!validation.ok) {
        toast.error("Fix the output directory in settings", {
          description: validation.error || "The target folder is not writable.",
        });
        return;
      }
    }

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

    // Record the skip decision so the query can filter
    // the file list to only the files actually queued for processing
    store.setSkipProcessedFiles(skipDuplicates);

    // 3. Start Job
    startJob(
      {
        batch_id: batchId,
        file_ids: [...uploadedIds, ...store.registeredRefIds],
        selected_files:
          Object.keys(selectedFilesPayload).length > 0
            ? selectedFilesPayload
            : null,
        force,
        output_dir: store.extractionOutputDir ?? "",
        settings: store.settings,
      },
      {
        onSuccess: () => {
          // Clear pending files to UI transition into dashboard
          store.setPendingFiles([]);
          store.setRegisteredRefIds([]);
          store.setRegisteredPaths([]);
          setBatchId("");
          store.addLog("Pipeline started successfully!", "success");
        },
        onError: (error: any) => {
          store.addLog(`Failed to start job: ${error.message}`, "error");
          toast.error("Failed to start job", {
            description: error.message,
          });
        },
      }
    );
  };

  const activeKeys: (keyof ProcessingSettings)[] = [
    "removeHeader",
    "removeFooter",
    "removePageNumbers",
    "removeNumericValues",
    "applyTextFormatting",
  ];
  const applyAll = activeKeys.every((key) => store.settings[key]);
  const handleAllUpdate = (checked: boolean) => {
    activeKeys.forEach((key) => {
      store.updateSetting(key, checked);
    });
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
          store.setSkipProcessedFiles(false);
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          currentView={store.currentView}
          onViewChange={(v) => {
              localStorage.setItem('view', v)
              store.setCurrentView(v);
          }}
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
                  pendingFilesCount={store.pendingFiles.length}
                  isProcessing={store.isProcessing}
                  elapsedSeconds={store.elapsedSeconds}
                  etaSeconds={store.etaSeconds}
                  onCancel={() => {
                    cancelJob();
                    store.setSkipProcessedFiles(false);
                  }}
                  onStart={() => handleStartProcessing()}
                  eventErr={false}
                />

                <FileTable
                  files={store.isProcessing ? jobFiles?.items || [] : []}
                  pendingFiles={store.pendingFiles}
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
                      const hasFolder = Array.from(e.dataTransfer.items).some(
                        (item) => item.webkitGetAsEntry()?.isDirectory,
                      );
                      if (hasFolder) {
                        toast.error(
                          "Folders are not supported. Please upload PDF files only.",
                        );
                        return;
                      }
                      const files = await getFilesFromDataTransfer(e.dataTransfer.items);
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
                runFilter={store.resultsRunFilter}
                onRunFilterChange={store.setResultsRunFilter}
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
              <div className="glass rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <FolderOpen className="h-5 w-5" />
                    </span>
                    Extraction Output Directory
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Configure where the extracted text files will be saved on your system.
                  </p>
                </div>

                <div className="space-y-4 max-w-2xl bg-secondary/20 p-4 rounded-xl border border-border/40">
                  <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Storage Resolution</p>
                      <p className="mt-0.5 text-muted-foreground">
                        If left blank, files will be saved to the default <code className="px-1.5 py-0.5 rounded bg-secondary-foreground/10 text-foreground font-mono">extracted_files</code> directory.
                        Providing an absolute path will write files directly to that folder.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Target Folder Path
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="e.g. /Users/username/extracted_files"
                        value={store.extractionOutputDir}
                        onChange={(e) => {
                          store.setExtractionOutputDir(e.target.value);
                          if (dirError) setDirError(null);
                        }}
                        onBlur={async (e) => {
                          await handleValidateDir(e.target.value);
                        }}
                        className={cn(
                          "font-mono text-sm bg-background/50",
                          dirError && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {isElectronAvailable() && (
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            const selectedPath = await openFolder();
                            if (selectedPath) {
                              store.setExtractionOutputDir(selectedPath);
                              const res = await handleValidateDir(selectedPath);
                              if (res.ok) {
                                toast.success("Output directory updated", {
                                  description: selectedPath,
                                });
                              }
                            }
                          }}
                          className="gap-1.5 shrink-0"
                        >
                          <FolderOpen className="h-4 w-4" />
                          Select
                        </Button>
                      )}
                      {store.extractionOutputDir && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            store.setExtractionOutputDir("");
                            setDirError(null);
                            toast.success("Reset to default output directory");
                          }}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          title="Reset to default"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {dirError && (
                      <p className="text-xs text-destructive font-medium mt-1">
                        {dirError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs text-muted-foreground">
                    Other processing settings (like header/footer removal) are configured using the control panel on the right.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        <SettingsPanel
          settings={store.settings}
          applyAll={applyAll}
          onUpdate={store.updateSetting}
          onAllUpdate={handleAllUpdate}
        />
      </div>
    </div>
  );
};

export default Index;
