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
import { AnimatePresence } from "framer-motion";
import type { PDFFile, PendingFile, PaginationState } from "@/types";
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
}: FileTableProps & { isLoading?: boolean }) {
  const [sortConfig, setSortConfig] = useState<{ key: "name" | "status"; direction: "asc" | "desc" } | null>(null);
  const pageSize = serverPagination?.size || 10;

  const currentPage = serverPagination?.page;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dropFiles(e);
  }, [dropFiles]);

  const sortedFiles = useMemo(() => {
    if (!sortConfig) return files;
    return [...files].sort((a, b) => {
      const aVal = String(a[sortConfig.key] || "");
      const bVal = String(b[sortConfig.key] || "");
      return sortConfig.direction === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }, [files, sortConfig]);

  const allItems = useMemo(() => [
    ...pendingFiles.map(pf => ({ ...pf, isPending: true })),
    ...sortedFiles.map(f => ({ ...f, isPending: false }))
  ], [pendingFiles, sortedFiles]);

  if (!isLoading && files.length === 0 && pendingFiles.length === 0) {
    return <FileTableEmpty handleDrop={handleDrop} />;
  }

  const totalPages = serverPagination?.pages || Math.ceil(allItems.length / pageSize);
  const pagedItems = serverPagination ? allItems : allItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key: "name" | "status") => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === "asc") return { key, direction: "desc" };
        return null;
      }
      return { key, direction: "asc" };
    });
  };

  return (
    <div className="space-y-4">
      <div
        className="glass rounded-2xl overflow-x-auto"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Table role="table">
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent" role="row">
              <TableHead 
                role="columnheader"
                className="w-28 cursor-pointer hover:text-primary transition-colors" 
                onClick={() => toggleSort("status")}
                aria-sort={sortConfig?.key === "status" ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}
              >
                <div className="flex items-center gap-1">
                  Status {sortConfig?.key === "status" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </div>
              </TableHead>
              <TableHead 
                role="columnheader"
                className="cursor-pointer hover:text-primary transition-colors min-w-[200px]" 
                onClick={() => toggleSort("name")}
                aria-sort={sortConfig?.key === "name" ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}
              >
                <div className="flex items-center gap-1">
                  File Name {sortConfig?.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </div>
              </TableHead>
              <TableHead role="columnheader" className="w-28">Method</TableHead>
              <TableHead role="columnheader" className="w-24">Size</TableHead>
              <TableHead role="columnheader" className="w-32">Progress</TableHead>
              <TableHead role="columnheader" className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody role="rowgroup">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-border/20">
                  <TableCell><div className="h-6 w-20 bg-muted/20 animate-pulse rounded-lg" /></TableCell>
                  <TableCell><div className="h-6 w-full max-w-[200px] bg-muted/20 animate-pulse rounded-lg" /></TableCell>
                  <TableCell><div className="h-6 w-16 bg-muted/20 animate-pulse rounded-lg" /></TableCell>
                  <TableCell><div className="h-6 w-12 bg-muted/20 animate-pulse rounded-lg" /></TableCell>
                  <TableCell><div className="h-2 w-full bg-muted/20 animate-pulse rounded-full" /></TableCell>
                  <TableCell><div className="h-8 w-8 bg-muted/20 animate-pulse rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : (
              <AnimatePresence mode="popLayout">
                {pagedItems.map((item) => {
                  const key = 'isPending' in item && item.isPending ? (item as PendingFile).id : (item as PDFFile).id;
                  return (
                    <FileTableRow 
                      key={key} 
                      item={item as (PDFFile | PendingFile) & { isPending: boolean }} 
                      isSelected={selectedFiles.has(key)} 
                      onRemove={onRemove} 
                      onRetry={onRetry} 
                    />
                  );
                })}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Showing page {currentPage} of {totalPages} ({allItems.length} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => serverOnPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-xl h-8 px-3 text-xs"
              aria-label="Previous page"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => serverOnPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-xl h-8 px-3 text-xs"
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
    </div>
  );
}
