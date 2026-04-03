import { useState, useCallback, useRef, useEffect } from "react";
import type {
  PDFFile,
  ProcessingSettings,
  LogEntry,
  SearchResult,
  NavView,
} from "@/types";

const MOCK_FILES: PDFFile[] = [
  {
    id: "1",
    name: "annual-report-2025.pdf",
    size: 4523000,
    status: "completed",
    progress: 100,
    addedAt: new Date(),
    extractedText:
      "The annual report covers financial performance, market analysis, and strategic initiatives for the fiscal year 2025. Revenue growth exceeded expectations at 23% year-over-year.",
  },
  {
    id: "2",
    name: "research-paper.pdf",
    size: 1230000,
    status: "processing",
    progress: 67,
    addedAt: new Date(),
    extractedText:
      "Machine learning approaches to natural language processing have evolved significantly.",
  },
  {
    id: "3",
    name: "invoice-batch-q4.pdf",
    size: 890000,
    status: "queued",
    progress: 0,
    addedAt: new Date(),
  },
  {
    id: "4",
    name: "contract-draft-v3.pdf",
    size: 2100000,
    status: "failed",
    progress: 34,
    addedAt: new Date(),
  },
  {
    id: "5",
    name: "meeting-notes-dec.pdf",
    size: 340000,
    status: "queued",
    progress: 0,
    addedAt: new Date(),
  },
];

const MOCK_LOGS: LogEntry[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 30000),
    message: "Processing started for annual-report-2025.pdf",
    type: "info",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 25000),
    message: "Extracting page 1 of 24...",
    type: "info",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 20000),
    message: "Removing headers detected on pages 1-24",
    type: "info",
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 15000),
    message: "Text extraction complete for annual-report-2025.pdf",
    type: "success",
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 10000),
    message: "Processing started for research-paper.pdf",
    type: "info",
  },
  {
    id: "6",
    timestamp: new Date(Date.now() - 8000),
    message: "Extracting page 5 of 12...",
    type: "info",
  },
  {
    id: "7",
    timestamp: new Date(Date.now() - 5000),
    message: "Warning: Low contrast text detected on page 7",
    type: "warning",
  },
  {
    id: "8",
    timestamp: new Date(Date.now() - 2000),
    message: "Failed to process contract-draft-v3.pdf: corrupted file",
    type: "error",
  },
];

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
  const [processingFile, setProcessingFile] = useState<string>("No file");

  // const totalFiles = files.length;
  // const completedFiles = files.filter((f) => f.status === "completed").length;
  const failedFiles = files.filter((f) => f.status === "failed").length;
  // const processingFile = files.find((f) => f.status === "processing");
  // const overallProgress =
  //   totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;

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

  // Simulated processing
  useEffect(() => {
    if (!isProcessing || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setFiles((prev) => {
        const processing = prev.find((f) => f.status === "processing");
        if (processing) {
          const newProgress = Math.min(
            processing.progress + Math.random() * 8,
            100,
          );
          if (newProgress >= 100) {
            addLog(
              `Text extraction complete for ${processing.name}`,
              "success",
            );
            const nextQueued = prev.find((f) => f.status === "queued");
            if (nextQueued) {
              addLog(`Processing started for ${nextQueued.name}`, "info");
            }
            return prev.map((f) => {
              if (f.id === processing.id)
                return { ...f, status: "completed" as const, progress: 100 };
              if (f.id === nextQueued?.id)
                return { ...f, status: "processing" as const, progress: 2 };
              return f;
            });
          }
          if (Math.random() > 0.7) {
            addLog(
              `Extracting page ${Math.floor(newProgress / 10)} of ${processing.name}...`,
              "info",
            );
          }
          return prev.map((f) =>
            f.id === processing.id
              ? { ...f, progress: Math.round(newProgress) }
              : f,
          );
        }
        return prev;
      });
    }, 1200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isProcessing, isPaused, addLog]);

  const toggleFileSelection = useCallback((id: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAllFiles = useCallback(() => {
    setSelectedFiles((prev) =>
      prev.size === files.length ? new Set() : new Set(files.map((f) => f.id)),
    );
  }, [files]);

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

  const addFiles = useCallback(
    (names: string[]) => {
      const newFiles: PDFFile[] = names.map((name) => ({
        id: String(Date.now() + Math.random()),
        name,
        size: Math.floor(Math.random() * 5000000) + 100000,
        status: "queued" as const,
        progress: 0,
        addedAt: new Date(),
      }));
      setFiles((prev) => [...prev, ...newFiles]);
      addLog(`Added ${names.length} file(s) to queue`, "info");
    },
    [addLog],
  );

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
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "processing"
          ? { ...f, status: "queued" as const, progress: 0 }
          : f,
      ),
    );
    addLog("Processing cancelled", "error");
  }, [addLog]);
  const startProcessing = useCallback(async () => {
    setIsProcessing(true);
    setIsPaused(false);
    await startExtraction({
      input_directory: "test-input",
      output_dir: "extracted_files",
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
    // const firstQueued = files.find((f) => f.status === "queued");
    // if (firstQueued) {
    //   setFiles((prev) =>
    //     prev.map((f) =>
    //       f.id === firstQueued.id ? { ...f, status: "processing" as const } : f,
    //     ),
    //   );
    //   addLog(`Processing started for ${firstQueued.name}`, "info");
    // }
    setIsProcessing(false)
  }, []);

  const startExtraction = async (payload) => {
    const response = await fetch("http://localhost:8000/extract/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode the chunk (looks like "data: {"status":"processing"...}\n\n")
      const chunk = decoder.decode(value, { stream: true });

      // Parse out the JSON data
      const lines = chunk
        .split("\n")
        .filter((line) => line.startsWith("data: "));
      for (const line of lines) {
        const data = JSON.parse(line.replace("data: ", ""));
        if (data.status === "completed") {
          console.log("Done!");
        } else {
          setOverallProgress(data.percentage && data.percentage);
          setTotalFiles(data.total);
          setCompletedFiles(data.current);
          setProcessingFile(data.file_path);
          console.log("Progress:", data);
        }
      }
    }
  };

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
    setCurrentView,
    toggleFileSelection,
    selectAllFiles,
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
