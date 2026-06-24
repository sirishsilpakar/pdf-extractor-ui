export type FileStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'idle' | 'done' | 'error' | 'cancelled';

export type ExtractMethod = 'direct' | 'ocr' | 'error' | 'undefined';

export type StateUpdater<T> = T | ((prev: T) => T);

export type Setter<T> = (value: StateUpdater<T>) => void;

export interface PDFFile {
  id: string;
  name: string;
  size: number;
  status: FileStatus;
  progress: number;
  addedAt: Date;
  method: ExtractMethod;
  hash?: string;
  fileId?: string;
  charCount?: number;
  confidence?: number;
  processedAt?: Date;
  relPath?: string;
  runId?: string;
  totalPages?: number;
  currentPage?: number;
}

export interface Run {
  id: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled' | 'unknown';
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  directFiles: number;
  ocrFiles: number;
  startedAt: Date;
  elapsedSeconds: number;
  etaSeconds: number | null;
  progressPct: number;
  outputDir?: string;
  runNumber?: number;
}

export interface PaginationState {
  page: number;
  size: number;
  total: number;
  pages: number;
}

export interface ProcessingSettings {
  removeHeader: boolean;
  removeFooter: boolean;
  removePageNumbers: boolean;
  removeNumericValues: boolean;
  enableLemmatization: boolean;
  applyTextFormatting: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

/** Record returned by GET /api/v1/results (list item, no full content) */
export interface ExtractionResult {
  id: number;
  rel_path: string;
  filename: string;
  method: string;
  confidence: number | null;
  char_count: number;
  page_count: number | null;
  processed_at: string | null;
  run_id: string | null;
  run_number?: number | null;
  txt_path?: string;
  has_duplicate?: boolean;
}

/** Full record returned by GET /api/v1/results/{id} — includes extracted text */
export interface ExtractionResultDetail extends ExtractionResult {
  content: string;
  txt_path: string;
}

/** Search result returned by GET /api/v1/search — snippet already has <mark> tags */
export interface SearchResult {
  resultId: number;
  file: string;
  relPath: string;
  snippet: string;
  pageNo: number;
}

export type NavView = 'dashboard' | 'files' | 'activity' | 'search' | 'settings' | 'runs' | 'results';

export interface AbortController {
  abort: () => void;
}

export type RegisteredPath = {
  batchId: string;
  path: string;
  pdfCount: number;
  alreadyProcessedCount: number;
  isFolder: boolean;
  status: string;
  filesScanned?: number;
};

export interface PendingFile {
  id: string;
  hash: string | null;
  file?: File;
  absPath?: string;
  name?: string;
  size?: number;
  isPathReference?: boolean;
  isAlreadyProcessed?: boolean;
  relPath?: string;
  batchId?: string;
  method?: string;
}

export type ReprocessModalData = {
  fileHashes? : string[],
  processedFileHashes?: string[],
  totalFilesCount: number;
  processedFilesCount: number;
}

export interface FilesListItem {
  batch_id?: string;
  content_hash: string;
  is_processed: boolean;
  name: string;
  rel_path: string;
  size_bytes: number;
  method?: string;
}

export interface SSEStateUpdateEvent {
  type: 'state_update';
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled' | 'done';
  done: number;
  total: number;
  progress_pct: number;
  elapsed?: number;
  eta_seconds?: number | null;
  run_id?: string;
  current_file?: string;
}

export interface SSELogEvent {
  type: 'log';
  message: string;
  level: LogEntry['type'];
}

export interface SSEFileProgressEvent {
  type: 'file_progress';
  file: string;
  method?: ExtractMethod;
  pct: number;
  page?: number;
  total_pages?: number;
  status?: FileStatus;
}

export type SSEEvent = SSEStateUpdateEvent | SSELogEvent | SSEFileProgressEvent;

export interface ResultTreeDirectory {
  run_id: string;
  run_number?: number | null;
  path: string;
  count: number;
  has_duplicate?: boolean;
}

export interface ResultTreeResponse {
  directories: ResultTreeDirectory[];
  directories_total: number;
  top_level_files: ExtractionResult[];
  top_level_files_total: number;
  page: number;
  size: number;
  pages: number;
  total: number;
}

export type SortField = "name" | "status" | "progress" | "method" | "size";

export interface SortItem {
  key: SortField;
  direction: "asc" | "desc";
}
