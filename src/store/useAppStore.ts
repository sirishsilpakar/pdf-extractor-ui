import { useState, useCallback, useRef, useEffect } from "react";
import type {
  PDFFile,
  ProcessingSettings,
  LogEntry,
  SearchResult,
  NavView,
  AbortController,
} from "@/types";

const MOCK_FILES: PDFFile[] = [
  // {
  //   id: "1",
  //   name: "annual-report-2025.pdf",
  //   size: 4523000,
  //   status: "queued",
  //   method: "direct",
  //   progress: 100,
  //   addedAt: new Date(),
  //   extractedText:
  //     "The annual report covers financial performance, market analysis, and strategic initiatives for the fiscal year 2025. Revenue growth exceeded expectations at 23% year-over-year.",
  // },
  // {
  //   id: "2",
  //   name: "annual-report-2025.pdf",
  //   size: 4523000,
  //   status: "processing",
  //   method: "direct",
  //   progress: 100,
  //   addedAt: new Date(),
  //   extractedText:
  //     "The annual report covers financial performance, market analysis, and strategic initiatives for the fiscal year 2025. Revenue growth exceeded expectations at 23% year-over-year.",
  // },
  // {
  //   id: "3",
  //   name: "annual-report-2025.pdf",
  //   size: 4523000,
  //   status: "completed",
  //   method: "direct",
  //   progress: 100,
  //   addedAt: new Date(),
  //   extractedText:
  //     "The annual report covers financial performance, market analysis, and strategic initiatives for the fiscal year 2025. Revenue growth exceeded expectations at 23% year-over-year.",
  // },
  // {
  //   id: "4",
  //   name: "annual-report-2025.pdf",
  //   size: 4523000,
  //   status: "failed",
  //   method: "ocr",
  //   progress: 100,
  //   addedAt: new Date(),
  //   extractedText:
  //     "The annual report covers financial performance, market analysis, and strategic initiatives for the fiscal year 2025. Revenue growth exceeded expectations at 23% year-over-year.",
  // },
];

const MOCK_LOGS: LogEntry[] = [];

const defaultSettings: ProcessingSettings = {
  removeHeader: true,
  removeFooter: true,
  removePageNumbers: false,
  removeNumericValues: false,
  enableLemmatization: false,
  applyToAll: true,
};

export function useAppStore() {
  const [files, setFiles] = useState<PDFFile[]>(MOCK_FILES);
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);
  const [settings, setSettings] = useState<ProcessingSettings>(defaultSettings);
  const [currentView, setCurrentView] = useState<NavView>("dashboard");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [logsAutoscroll, setLogsAutoscroll] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [completedFiles, setCompletedFiles] = useState<number>(0);
  const [processingFile, setProcessingFile] = useState<string>("");
  const [inputDir, setInputDir] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const [eventErr, setEventErr] = useState<boolean>(false);
  console.log("This runs on every reload?");
  // const totalFiles = files.length;
  // const completedFiles = files.filter((f) => f.status === "completed").length;
  const failedFiles = files.filter((f) => f.status === "failed").length;
  // const processingFile = files.find((f) => f.status === "processing");
  // const overallProgress =
  //   totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;

  useEffect(() => {
    const savedJobId = localStorage.getItem("job_id");
    if (!savedJobId) return;

    checkAndReattach(savedJobId);
  }, []);
  const addLog = useCallback(
    (message: string, type: LogEntry["type"] = "info") => {
      setLogs((prev) => [
        ...prev,
        {
          id: String(Date.now() + Math.random()),
          timestamp: new Date(),
          message,
          type,
        },
      ]);
    },
    [],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSelectedFiles((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }, []);

  const retryFile = useCallback(
    (id: string) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: "queued" as const, progress: 0 } : f,
        ),
      );
      addLog(`Retrying file...`, "info");
    },
    [addLog],
  );

  const addFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    // setting error false here
    // set true when event fails
    // this stops the elappsed timer
    setEventErr(false);
    const files = Array.from(event.target.files);
    const filePath = files[0].webkitRelativePath.split("/")[0];
    setInputDir(filePath);
    const pdfFiles = files.filter((file) =>
      file.name.toLowerCase().endsWith(".pdf"),
    );
    const newFiles: PDFFile[] = pdfFiles.map((file) => ({
      id: String(Date.now() + Math.random()),
      name: file.name,
      size: Math.floor(Math.random() * 5000000) + 100000,
      status: "queued" as const,
      progress: 0,
      method: "undefined",
      addedAt: new Date(),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    setTotalFiles(pdfFiles.length);
    addLog(`Added ${pdfFiles.length} file(s) to queue`, "info");
  };

  const pauseProcessing = useCallback(() => {
    setIsPaused(true);
    addLog("Processing paused", "warning");
  }, [addLog]);

  const resumeProcessing = useCallback(() => {
    setIsPaused(false);
    addLog("Processing resumed", "info");
  }, [addLog]);

  const cancelProcessing = useCallback(() => {
    setIsProcessing(false);
    setIsPaused(false);
    addLog("Processing cancelled", "error");
  }, [addLog]);

  const checkAndReattach = async (jobId: string) => {
    console.log("Hello yo call vako ho?");
    const res = await fetch(`http://localhost:8000/extract/status/${jobId}`);
    if (!res.ok) {
      localStorage.removeItem("job_id"); // stale job_id, clean up
      return;
    }

    const job = await res.json();

    if (job.status === "running" || job.status === "queued") {
      // Reattach — buffer replay handles missed events
      streamExtraction(jobId);
    } else if (job.status === "completed") {
      // Restore completed UI state
      // setOverallProgress(100)
    } else if (job.status === "failed") {
      // Show error state
      console.error("Job failed:", job.error);
    }
  };

  const startExtraction = async (payload) => {
    try {
      const response = await fetch("http://localhost:8000/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        addLog(`${err.detail || "Failed to submit job"}`, "error");
        throw new Error(err.detail || "Failed to submit job");
      }

      const { job_id, queue_position } = await response.json();
      localStorage.setItem("job_id", job_id);

      if (queue_position > 1) {
        addLog(`Queued at position ${queue_position}`, "info");
      }

      streamExtraction(job_id);
    } catch (e) {
      console.error("Extraction failed:", e);
    }
  };

  const streamExtraction = (jobId: string) => {
    // Abort any existing stream before starting a new one
    abortControllerRef.current?.abort();

    const es = new EventSource(`http://localhost:8000/extract/stream/${jobId}`);

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === "completed") {
        addLog("Text extraction is completed", "success");
        es.close();
      } else if (data.status === "error") {
        if (!data.file_path) {
          updateFileStatusFailed();
        } else {
          updateFileStatus(data.file_path, "error", data);
        }
        addLog(`${data.message}`, "error");
        setEventErr(true);
        es.close();
      } else if (data.status === "started") {
        // Job picked up from queue, pipeline is now running
        addLog(`Processing started`, "info");
        updateFileStatusProcessing();
      } else {
        // Processing progress event
        setOverallProgress(data.percentage ?? 0);
        setTotalFiles(data.total);
        setCompletedFiles(data.current);
        setProcessingFile(data.file_path);
        addLog(`Processing started for ${data.file_path}`, "info");
        updateFileStatus(data.file_path, "completed", data);
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects — Last-Event-ID is sent automatically
      // so your backend buffer replay kicks in seamlessly
      console.warn("SSE connection lost, reconnecting...");
    };
    // Store so we can close on unmount or new job
    abortControllerRef.current = {
      abort: () => {
        es.close();
      },
    };
  };

  const updateFileStatus = (
    fileNameFromBackend,
    newStatus,
    backendResponse,
  ) => {
    setFiles((prevFiles) =>
      prevFiles.map(
        (file) =>
          file.name === fileNameFromBackend
            ? {
                ...file,
                status: newStatus,
                method: backendResponse.method,
                progress: 100,
              } // Update matching file
            : file, // Keep other files as they are
      ),
    );
    addLog(`Processing completed for ${fileNameFromBackend}`, "info");
  };

  const updateFileStatusFailed = () => {
    setFiles((prevFiles) =>
      prevFiles.map((f) => ({
        ...f,
        status: "failed",
      })),
    );
  };

  const updateFileStatusProcessing = () => {
    setFiles((prevFiles) =>
      prevFiles.map((f) => ({
        ...f,
        status: "processing",
      })),
    );
  };

  const startProcessing = useCallback(async () => {
    setIsProcessing(true);
    setIsPaused(false);
    await startExtraction({
      input_directory: inputDir,
      workers: 0,
      enable_page_ocr: false,
      page_ocr_workers: 0,
      force: false,
      no_ocr: false,
      fast: false,
      removeHeader: false,
      removeFooter: false,
      removePageNumber: false,
      removeNumerics: false,
      lemma: false,
    });
    setIsProcessing(false);

    // const firstQueued = files.find((f) => f.status === "queued");
    // if (firstQueued) {
    //   setFiles((prev) =>
    //     prev.map((f) =>
    //       f.id === firstQueued.id ? { ...f, status: "processing" as const } : f,
    //     ),
    //   );
    //   addLog(`Processing started for ${firstQueued.name}`, "info");
    // }
  }, [inputDir]);

  const searchResults: SearchResult[] = searchQuery
    ? files
        .filter((f) =>
          f.extractedText?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .map((f) => {
          const idx = f
            .extractedText!.toLowerCase()
            .indexOf(searchQuery.toLowerCase());
          const start = Math.max(0, idx - 40);
          const end = Math.min(
            f.extractedText!.length,
            idx + searchQuery.length + 40,
          );
          return {
            fileId: f.id,
            fileName: f.name,
            snippet: f.extractedText!.slice(start, end),
            matchIndex: idx,
          };
        })
    : [];

  const updateSetting = useCallback(
    <K extends keyof ProcessingSettings>(
      key: K,
      value: ProcessingSettings[K],
    ) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return {
    files,
    logs,
    settings,
    currentView,
    selectedFiles,
    isProcessing,
    isPaused,
    searchQuery,
    globalSearch,
    logsAutoscroll,
    totalFiles,
    completedFiles,
    failedFiles,
    processingFile,
    overallProgress,
    searchResults,
    eventErr,
    setCurrentView,
    removeFile,
    retryFile,
    addFiles,
    pauseProcessing,
    resumeProcessing,
    cancelProcessing,
    startProcessing,
    setSearchQuery,
    setGlobalSearch,
    setLogsAutoscroll,
    updateSetting,
  };
}
