export type FileStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface PDFFile {
  id: string;
  name: string;
  size: number;
  status: FileStatus;
  progress: number;
  addedAt: Date;
  extractedText?: string;
}

export interface ProcessingSettings {
  removeHeader: boolean;
  removeFooter: boolean;
  removePageNumbers: boolean;
  removeNumericValues: boolean;
  enableLemmatization: boolean;
  applyToAll: boolean;
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

export type NavView = 'dashboard' | 'files' | 'search' | 'settings';
