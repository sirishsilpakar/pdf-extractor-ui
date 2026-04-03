import { Trash2, RotateCcw, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PDFFile } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback } from 'react';

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

const statusConfig: Record<PDFFile['status'], { label: string; className: string }> = {
  queued: { label: 'Queued', className: 'bg-secondary text-secondary-foreground' },
  processing: { label: 'Processing', className: 'bg-primary/20 text-primary border-primary/30' },
  completed: { label: 'Completed', className: 'bg-success/20 text-success border-success/30' },
  failed: { label: 'Failed', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

interface Props {
  files: PDFFile[];
  selectedFiles: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onAddFiles: (names: string[]) => void;
}

export function FileTable({ files, selectedFiles, onToggleSelect, onSelectAll, onRemove, onRetry, onAddFiles }: Props) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const names = Array.from(e.dataTransfer.files).map(f => f.name);
    if (names.length) onAddFiles(names);
  }, [onAddFiles]);

  if (files.length === 0) {
    return (
      <div
        className="glass rounded-2xl p-12 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border/50 cursor-pointer hover:border-primary/40 transition-colors"
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="w-16 h-16 rounded-2xl bg-secondary/80 flex items-center justify-center">
          <Upload className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium">No files uploaded yet</p>
          <p className="text-sm text-muted-foreground mt-1">Drag & drop PDF files here, or use the import buttons above</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={() => onAddFiles(['sample-document.pdf'])}>
          Add Sample File
        </Button>
      </div>
    );
  }

  return (
    <div
      className="glass rounded-2xl overflow-hidden"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox
                checked={selectedFiles.size === files.length && files.length > 0}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>File Name</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="w-24">Size</TableHead>
            <TableHead className="w-32">Progress</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {files.map(file => (
              <motion.tr
                key={file.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn(
                  'border-border/30 transition-colors',
                  file.status === 'processing' && 'bg-primary/5',
                  selectedFiles.has(file.id) && 'bg-secondary/50'
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedFiles.has(file.id)}
                    onCheckedChange={() => onToggleSelect(file.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm truncate">{file.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('rounded-lg text-xs font-medium', statusConfig[file.status].className)}>
                    {statusConfig[file.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatSize(file.size)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={file.progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-8 text-right">{file.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {file.status === 'failed' && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => onRetry(file.id)}>
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive" onClick={() => onRemove(file.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
