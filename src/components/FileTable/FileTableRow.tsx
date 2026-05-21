import React from "react";
import { Trash2, RotateCcw, FileText, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TableCell } from "@/components/ui/table";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PDFFile, PendingFile } from "@/types";

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

const statusConfig: Record<string, { label: string; className: string }> = {
  queued: { label: "Queued", className: "bg-secondary text-secondary-foreground" },
  processing: { label: "Processing", className: "bg-primary/20 text-primary border-primary/30" },
  completed: { label: "Completed", className: "bg-success/20 text-success border-success/30" },
  failed: { label: "Failed", className: "bg-destructive/20 text-destructive border-destructive/30" },
  idle: { label: "Idle", className: "bg-secondary text-secondary-foreground" },
  done: { label: "Done", className: "bg-success/20 text-success border-success/30" },
  error: { label: "Error", className: "bg-destructive/20 text-destructive border-destructive/30" },
  cancelled: { label: "Cancelled", className: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" },
};

interface FileTableRowProps {
  item: (PDFFile | PendingFile) & { isPending: boolean };
  isSelected: boolean;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export const FileTableRow = React.memo(
  React.forwardRef<HTMLTableRowElement, FileTableRowProps>(
    ({ item, isSelected, onRemove, onRetry }, ref) => {
      if (item.isPending) {
        const pf = item as PendingFile;
        const status = pf.hash ? "ready" : "hashing";
        const name = pf.file ? pf.file.name : (pf.name || "Unknown");
        const size = pf.file ? pf.file.size : (pf.size || 0);

        return (
          <motion.tr
            ref={ref}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border-border/30 bg-secondary/10"
            role="row"
          >
            <TableCell role="cell">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-lg text-[10px] font-medium",
                  status === "ready" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                )}
              >
                {status === "ready" ? "Ready" : "Hashing..."}
              </Badge>
            </TableCell>
            <TableCell role="cell">
              <div className="flex items-center gap-2">
                {pf.isReference ? (
                  <FolderOpen className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                )}
                <span className="font-medium text-sm truncate max-w-[300px]">{name}</span>
              </div>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground italic" role="cell">
              {pf.isReference ? "Reference" : "Pending"}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground" role="cell">
              {pf.size ? formatSize(pf.size) : "-" }
            </TableCell>
            <TableCell role="cell">
              <div className="flex items-center gap-2">
                <Progress value={0} className="h-1.5 flex-1" aria-label="File hash progress" />
              </div>
            </TableCell>
            <TableCell role="cell">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-transparent"
                onClick={() => onRemove(pf.id)}
                aria-label="Remove pending file"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TableCell>
          </motion.tr>
        );
      }

      const file = item as PDFFile;
      const statusInfo = statusConfig[file.status] || { label: file.status, className: "bg-secondary" };

      return (
        <motion.tr
          ref={ref}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className={cn(
            "border-border/30 transition-colors",
            file.status === "processing" && "bg-primary/5",
            isSelected && "bg-secondary/50",
          )}
          role="row"
        >
          <TableCell role="cell">
            <Badge variant="outline" className={cn("rounded-lg text-[10px] font-medium", statusInfo.className)}>
              {statusInfo.label}
            </Badge>
          </TableCell>
          <TableCell role="cell">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="font-medium text-sm truncate max-w-[300px]">{file.name}</span>
            </div>
          </TableCell>
          <TableCell role="cell">
            <span className="text-xs font-medium uppercase text-muted-foreground">{file.method}</span>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground" role="cell">
            {formatSize(file.size)}
          </TableCell>
          <TableCell role="cell">
            <div className="flex items-center gap-2">
              <Progress value={file.progress} className="h-1.5 flex-1" aria-label={`Processing progress: ${file.progress}%`} />
              <span className="text-xs text-muted-foreground w-8 text-right">{file.progress}%</span>
            </div>
          </TableCell>
          <TableCell role="cell">
            <div className="flex items-center gap-1">
              {file.status === "failed" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => onRetry(file.id)}
                  aria-label="Retry processing file"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(file.id)}
                aria-label="Remove processed file"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </TableCell>
        </motion.tr>
      );
    }
  )
);

FileTableRow.displayName = "FileTableRow";
