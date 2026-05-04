export type FileStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type ExtractMethod = 'direct' | 'ocr' | 'error' | 'undefined';

export interface PDFFile {
  id: string;
  batchId: string;
  name: string;
  size: number;
  status: FileStatus;
  progress: number;
  addedAt: Date;
  method: ExtractMethod;
  extractedText?: string;
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

export interface SearchResult {
  fileId: string;
  fileName: string;
  snippet: string;
  matchIndex: number;
}

export type NavView = 'dashboard' | 'files' | 'activity' | 'search' | 'settings';

  // const updateFileStatus = (fileNameFromBackend, newStatus, newMethod) => {
export interface FileStatusUpdate {
  fileNameFromBackend: string;
  newStatus: string;
  newMethod: ExtractMethod;
  progress?: number;
}

export interface AbortController {
  abort: () => void;
}