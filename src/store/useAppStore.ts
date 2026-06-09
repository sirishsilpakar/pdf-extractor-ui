import { create } from "zustand";
import type {
  ProcessingSettings,
  LogEntry,
  NavView,
  PendingFile,
} from "@/types";

const defaultSettings: ProcessingSettings = {
  removeHeader: true,
  removeFooter: true,
  removePageNumbers: true,
  removeNumericValues: true,
  enableLemmatization: false,
  applyTextFormatting: true,
};

interface UIState {
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
  logsAutoscroll: boolean;
  setLogsAutoscroll: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  resultsRunFilter: string | null;
  setResultsRunFilter: (runId: string | null) => void;
}

interface SelectionState {
  selectedFiles: Set<string>;
  toggleFileSelection: (id: string) => void;
  clearFileSelection: () => void;
}

interface SettingsState {
  settings: ProcessingSettings;
  updateSetting: <K extends keyof ProcessingSettings>(key: K, value: ProcessingSettings[K]) => void;
  extractionOutputDir: string;
  setExtractionOutputDir: (path: string) => void;
}

interface LogState {
  logs: LogEntry[];
  addLog: (message: string, type?: LogEntry["type"]) => void;
  clearLogs: () => void;
}

interface PendingFilesState {
  pendingFiles: PendingFile[];
  setPendingFiles: (files: PendingFile[] | ((prev: PendingFile[]) => PendingFile[])) => void;
  removePendingFile: (id: string) => void;
  registeredRefIds: string[];
  setRegisteredRefIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  registeredPaths: { id: string; path: string; pdfCount: number; alreadyProcessedCount: number }[];
  setRegisteredPaths: (paths: { id: string; path: string; pdfCount: number; alreadyProcessedCount: number }[] | ((prev: { id: string; path: string; pdfCount: number; alreadyProcessedCount: number }[]) => { id: string; path: string; pdfCount: number; alreadyProcessedCount: number }[])) => void;
}

interface ReprocessState {
  showReprocessModal: boolean;
  setShowReprocessModal: (val: boolean) => void;
  reprocessData: { hashes: string[]; alreadyHashes: string[]; totalItems: number; alreadyCount: number } | null;
  setReprocessData: (data: { hashes: string[]; alreadyHashes: string[]; totalItems: number; alreadyCount: number } | null) => void;
}

interface SSEState {
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  overallProgress: number;
  setOverallProgress: (val: number) => void;
  totalFiles: number;
  setTotalFiles: (val: number) => void;
  completedFiles: number;
  setCompletedFiles: (val: number) => void;
  processingFile: string;
  setProcessingFile: (val: string) => void;
  currentRunId: string | null;
  setCurrentRunId: (val: string | null) => void;

  /** True when the user chose to skip already processed files for the current job. */
  skipProcessedFiles: boolean;
  setSkipProcessedFiles: (val: boolean) => void;

  elapsedSeconds: number;
  setElapsedSeconds: (val: number) => void;

  etaSeconds: number | null;
  setEtaSeconds: (val: number | null) => void;
}

type AppState = UIState & SelectionState & SettingsState & LogState & PendingFilesState & ReprocessState & SSEState;

export const useAppStore = create<AppState>((set, get) => ({
  // UI State
  currentView: "dashboard",
  setCurrentView: (view) => set({ currentView: view }),
  logsAutoscroll: true,
  setLogsAutoscroll: (val) => set({ logsAutoscroll: val }),
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  globalSearch: "",
  setGlobalSearch: (q) => set({ globalSearch: q }),
  resultsRunFilter: null,
  setResultsRunFilter: (runId) => set({ resultsRunFilter: runId }),

  // Selection State
  selectedFiles: new Set(),
  toggleFileSelection: (id) => set((state) => {
    const newSet = new Set(state.selectedFiles);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    return { selectedFiles: newSet };
  }),
  clearFileSelection: () => set({ selectedFiles: new Set() }),

  // Settings State
  settings: defaultSettings,
  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),
  extractionOutputDir:
    typeof window !== "undefined" ? localStorage.getItem("extractionOutputDir") || "" : "",
  setExtractionOutputDir: (path) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("extractionOutputDir", path);
    }
    set({ extractionOutputDir: path });
  },

  // Log State
  logs: [],
  addLog: (message, type = "info") => set((state) => ({
    logs: [
      ...state.logs,
      { id: String(Date.now() + Math.random()), timestamp: new Date(), message, type },
    ].slice(-500),
  })),
  clearLogs: () => set({ logs: [] }),

  // Pending Files
  pendingFiles: [],
  setPendingFiles: (filesOrFn) => set((state) => ({
    pendingFiles: typeof filesOrFn === "function" ? filesOrFn(state.pendingFiles) : filesOrFn
  })),
  removePendingFile: (id) => set((state) => ({
    pendingFiles: state.pendingFiles.filter((f) => f.id !== id),
    registeredPaths: state.registeredPaths.filter((p) => {
      if (p.id === id) {
        // Also remove from ref ids
        set({ registeredRefIds: state.registeredRefIds.filter(rid => rid !== p.id) });
        return false;
      }
      return true;
    })
  })),
  registeredRefIds: [],
  setRegisteredRefIds: (idsOrFn) => set((state) => ({
    registeredRefIds: typeof idsOrFn === "function" ? idsOrFn(state.registeredRefIds) : idsOrFn
  })),
  registeredPaths: [],
  setRegisteredPaths: (pathsOrFn) => set((state) => ({
    registeredPaths: typeof pathsOrFn === "function" ? pathsOrFn(state.registeredPaths) : pathsOrFn
  })),

  // Reprocess State
  showReprocessModal: false,
  setShowReprocessModal: (val) => set({ showReprocessModal: val }),
  reprocessData: null,
  setReprocessData: (data) => set({ reprocessData: data }),

  // SSE State
  isProcessing: false,
  setIsProcessing: (val) => set({ isProcessing: val }),
  overallProgress: 0,
  setOverallProgress: (val) => set({ overallProgress: val }),
  totalFiles: 0,
  setTotalFiles: (val) => set({ totalFiles: val }),
  completedFiles: 0,
  setCompletedFiles: (val) => set({ completedFiles: val }),
  processingFile: "",
  setProcessingFile: (val) => set({ processingFile: val }),
  currentRunId: null,
  setCurrentRunId: (val) => set({ currentRunId: val }),
  skipProcessedFiles: false,
  setSkipProcessedFiles: (val) => set({ skipProcessedFiles: val }),
  elapsedSeconds: 0,
  setElapsedSeconds: (val) => set({ elapsedSeconds: val }),
  etaSeconds: null,
  setEtaSeconds: (val) => set({ etaSeconds: val }),
}));
