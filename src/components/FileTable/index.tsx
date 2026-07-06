import { useCallback, useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { PDFFile, PendingFile, PaginationState, SortItem, SortField } from "@/types";
import { FileTableEmpty } from "./FileTableEmpty";
import { FileTableRow } from "./FileTableRow";

interface FileTableProps {
  files: PDFFile[];
  pendingFiles: PendingFile[];
  selectedFiles: Set<string>;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  dropFiles: (e: React.DragEvent) => void;
  // Optional server-side pagination
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  isScanning?: boolean;
  scannedCount?: number;
  // Optional server-side sorting
  sortConfig?: SortItem[];
  onSortChange?: (config: SortItem[]) => void;
  isError?: boolean;
  errorMessage?: string;
}

export function FileTable({
  files,
  pendingFiles,
  selectedFiles,
  onRemove,
  onRetry,
  dropFiles,
  pagination: serverPagination,
  onPageChange: serverOnPageChange,
  isLoading,
  isScanning = false,
  scannedCount = 0,
  sortConfig,
  onSortChange,
  isError = false,
  errorMessage = "An error occurred while loading files.",
}: FileTableProps & { isLoading?: boolean }) {
  const [localSortConfig, setLocalSortConfig] = useState<SortItem[]>([]);
  const pageSize = serverPagination?.size || 10;

  const currentPage = serverPagination?.page;

  const activeSortConfig = onSortChange ? sortConfig : localSortConfig;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dropFiles(e);
  }, [dropFiles]);

  const sortedFiles = useMemo(() => {
    if (onSortChange || !activeSortConfig || activeSortConfig.length === 0) return files;
    return [...files].sort((a, b) => {
      for (const item of activeSortConfig) {
        let diff = 0;
        const dirMultiplier = item.direction === "asc" ? 1 : -1;
        
        if (item.key === "progress") {
          const aVal = a.progress || 0;
          const bVal = b.progress || 0;
          diff = aVal - bVal;
        } else if (item.key === "size") {
          const aVal = a.size || 0;
          const bVal = b.size || 0;
          diff = aVal - bVal;
        } else {
          const aVal = String(a[item.key] || "");
          const bVal = String(b[item.key] || "");
          diff = aVal.localeCompare(bVal);
        }
        
        if (diff !== 0) {
          return diff * dirMultiplier;
        }
      }
      return 0;
    });
  }, [files, activeSortConfig, onSortChange]);

  const allItems = useMemo(() => [
    ...pendingFiles.map(pf => ({ ...pf, isPending: true })),
    ...sortedFiles.map(f => ({ ...f, isPending: false }))
  ], [pendingFiles, sortedFiles]);

  if (isError) {
    return (
      <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 min-h-[300px] border-destructive/20 text-center" role="alert">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-base text-destructive">Failed to Load Files</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  if (isScanning) {
    return (
      <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 min-h-[300px]" role="status" aria-busy="true">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-base">Scanning Directory...</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Searching for PDF files in the directory. Please wait.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mt-2">
            Found {scannedCount} PDF(s) so far
          </div>
        </div>
      </div>
    );

  }

  if (!isLoading && files.length === 0 && pendingFiles.length === 0) {
    return <FileTableEmpty handleDrop={handleDrop} />;
  }

  const totalPages = serverPagination?.pages || Math.ceil(allItems.length / pageSize);
  const pagedItems = serverPagination ? allItems : allItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getSortDirection = (key: SortField) => {
    const item = activeSortConfig?.find(s => s.key === key);
    return item?.direction || null;
  };

  const renderSortIndicator = (key: SortField) => {
    if (!activeSortConfig) return null;
    const idx = activeSortConfig.findIndex(s => s.key === key);
    if (idx === -1) return null;
    
    const item = activeSortConfig[idx];
    const arrow = item.direction === "asc" ? "↑" : "↓";
    const rank = activeSortConfig.length > 1 ? ` (${idx + 1})` : "";
    return (
      <span className="text-primary font-bold text-xs select-none">
        {arrow}{rank}
      </span>
    );
  };

  const toggleSort = (key: SortField, isShift: boolean) => {
    const currentList = activeSortConfig || [];
    const existingIndex = currentList.findIndex(s => s.key === key);
    
    let nextList: SortItem[] = [];
    
    if (isShift) {
      if (existingIndex !== -1) {
        const item = currentList[existingIndex];
        if (item.direction === "asc") {
          nextList = currentList.map((s, idx) => idx === existingIndex ? { ...s, direction: "desc" as const } : s);
        } else {
          nextList = currentList.filter((_, idx) => idx !== existingIndex);
        }
      } else {
        nextList = [...currentList, { key, direction: "asc" as const }];
      }
    } else {
      if (existingIndex !== -1 && currentList.length === 1) {
        const item = currentList[existingIndex];
        if (item.direction === "asc") {
          nextList = [{ key, direction: "desc" as const }];
        } else {
          nextList = [];
        }
      } else {
        nextList = [{ key, direction: "asc" as const }];
      }
    }

    if (onSortChange) {
      onSortChange(nextList);
    } else {
      setLocalSortConfig(nextList);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="glass rounded-2xl overflow-x-auto"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Table role="table" className="table-fixed w-full">
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent" role="row">
              <TableHead
                role="columnheader"
                className="w-28 cursor-pointer hover:text-primary transition-colors"
                onClick={(e) => toggleSort("status", e.shiftKey)}
                aria-sort={
                  getSortDirection("status") === "asc"
                    ? "ascending"
                    : getSortDirection("status") === "desc"
                      ? "descending"
                      : "none"
                }
              >
                <div className="flex items-center gap-1 select-none">
                  Status {renderSortIndicator("status")}
                </div>
              </TableHead>
              <TableHead
                role="columnheader"
                className="cursor-pointer hover:text-primary transition-colors min-w-[200px]"
                onClick={(e) => toggleSort("name", e.shiftKey)}
                aria-sort={
                  getSortDirection("name") === "asc"
                    ? "ascending"
                    : getSortDirection("name") === "desc"
                      ? "descending"
                      : "none"
                }
              >
                <div className="flex items-center gap-1 select-none">
                  File Name {renderSortIndicator("name")}
                </div>
              </TableHead>
              <TableHead
                role="columnheader"
                className="w-28 cursor-pointer hover:text-primary transition-colors"
                onClick={(e) => toggleSort("method", e.shiftKey)}
                aria-sort={
                  getSortDirection("method") === "asc"
                    ? "ascending"
                    : getSortDirection("method") === "desc"
                      ? "descending"
                      : "none"
                }
              >
                <div className="flex items-center gap-1 select-none">
                  Method {renderSortIndicator("method")}
                </div>
              </TableHead>
              <TableHead
                role="columnheader"
                className="w-24 cursor-pointer hover:text-primary transition-colors"
                onClick={(e) => toggleSort("size", e.shiftKey)}
                aria-sort={
                  getSortDirection("size") === "asc"
                    ? "ascending"
                    : getSortDirection("size") === "desc"
                      ? "descending"
                      : "none"
                }
              >
                <div className="flex items-center gap-1 select-none">
                  Size {renderSortIndicator("size")}
                </div>
              </TableHead>
              <TableHead
                role="columnheader"
                className="w-32 cursor-pointer hover:text-primary transition-colors"
                onClick={(e) => toggleSort("progress", e.shiftKey)}
                aria-sort={
                  getSortDirection("progress") === "asc"
                    ? "ascending"
                    : getSortDirection("progress") === "desc"
                      ? "descending"
                      : "none"
                }
              >
                <div className="flex items-center gap-1 select-none">
                  Progress {renderSortIndicator("progress")}
                </div>
              </TableHead>
              <TableHead role="columnheader" className="w-20">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody role="rowgroup">
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-border/20">
                  <TableCell className="w-28">
                    <div className="h-6 w-20 bg-muted/20 animate-pulse rounded-lg" />
                  </TableCell>
                  <TableCell className="min-w-[200px]">
                    <div className="h-6 w-full max-w-[200px] bg-muted/20 animate-pulse rounded-lg" />
                  </TableCell>
                  <TableCell className="w-28">
                    <div className="h-6 w-16 bg-muted/20 animate-pulse rounded-lg" />
                  </TableCell>
                  <TableCell className="w-24">
                    <div className="h-6 w-12 bg-muted/20 animate-pulse rounded-lg" />
                  </TableCell>
                  <TableCell className="w-32">
                    <div className="h-2 w-full bg-muted/20 animate-pulse rounded-full" />
                  </TableCell>
                  <TableCell className="w-20">
                    <div className="h-8 w-8 bg-muted/20 animate-pulse rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              pagedItems.map((item) => {
                const key =
                  "isPending" in item && item.isPending
                    ? (item as PendingFile).id
                    : (item as PDFFile).id;
                return (
                  <FileTableRow
                    key={key}
                    item={item as (PDFFile | PendingFile) & { isPending: boolean }}
                    isSelected={selectedFiles.has(key)}
                    onRemove={onRemove}
                    onRetry={onRetry}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Showing page {currentPage} of {totalPages} ({serverPagination?.total} file
            {serverPagination?.total > 1 ? "s" : ""})
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => serverOnPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-xl h-8 px-3 text-xs"
              aria-label="Previous page"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => serverOnPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-xl h-8 px-3 text-xs"
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
