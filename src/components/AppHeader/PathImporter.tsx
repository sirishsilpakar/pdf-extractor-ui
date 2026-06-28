import { FileUp, FolderUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openFile, openFolder } from "@/lib/electron";
import { useState } from "react";

interface PathImporterProps {
  onAddPath: (path: string) => void;
}

export function PathImporter({ onAddPath }: PathImporterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const onImportFiles = async (mode: "single" | "multiple") => {
    if (isOpen) return;
  
    setIsOpen(true);
    try {
      if (mode === "single") {
        const path = await openFile();
        if (path) {
          onAddPath(path);
        }
      } else if (mode === "multiple") {
        const path = await openFolder();
        if (path) {
          onAddPath(path);
        }
      }
    } catch (error) {
      console.error("Failed to open the file explorer:", error)
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 md:flex-nowrap">
      <Button
        variant="outline"
        size="sm"
        className="bg-inherit rounded-xl gap-1.5 text-xs hover:bg-primary hover:text-white"
        onClick={() => onImportFiles("single")}
        disabled={isOpen}
        aria-label="Import File Button"
      >
        <FileUp className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Import File</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-inherit rounded-xl gap-1.5 text-xs hover:bg-primary hover:text-white"
        onClick={() => onImportFiles("multiple")}
        disabled={isOpen}
        aria-label="Import Folder Button"
      >
        <FolderUp className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Import Folder</span>
      </Button>
    </div>
  );
}
