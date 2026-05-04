import React from "react";
import { Upload } from "lucide-react";

interface FileTableEmptyProps {
  handleDrop: (e: React.DragEvent) => void;
}

export const FileTableEmpty = React.memo(({ handleDrop }: FileTableEmptyProps) => {
  return (
    <div
      className="glass rounded-2xl p-12 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border/50"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="w-16 h-16 rounded-2xl bg-secondary/80 flex items-center justify-center" aria-hidden="true">
        <Upload className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="font-medium">No files uploaded yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Drag & drop PDF files here, or use the import buttons above
        </p>
      </div>
    </div>
  );
});

FileTableEmpty.displayName = "FileTableEmpty";
