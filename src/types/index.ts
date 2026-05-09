export type FileStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'idle' | 'done' | 'error' | 'cancelled';

export type ExtractMethod = 'direct' | 'ocr' | 'error' | 'undefined';

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
}

/** Full record returned by GET /api/v1/results/{id} — includes extracted text */
export interface ExtractionResultDetail extends ExtractionResult {
  content: string;
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

export interface PendingFile {
  id: string;
  hash: string | null;
  file?: File;
  absPath?: string;
  name?: string;
  size?: number;
  isReference?: boolean;
  isAlreadyRegistered?: boolean;
  relPath?: string;
  refId?: string;
}

export interface SSEStateUpdateEvent {
  type: 'state_update';
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  done: number;
  total: number;
  progress_pct: number;
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
  pct: number;
  page?: number;
  total_pages?: number;
}

export type SSEEvent = SSEStateUpdateEvent | SSELogEvent | SSEFileProgressEvent;