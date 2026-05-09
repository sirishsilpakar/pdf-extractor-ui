import { useRef, useState } from "react";
import { FileUp, FolderUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PathImporterProps {
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddPath: (path: string) => void;
}

export function PathImporter({ handleFileChange, onAddPath }: PathImporterProps) {
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const multFileInputRef = useRef<HTMLInputElement>(null);
  const [localPath, setLocalPath] = useState("");

  const onImportFiles = (mode: "single" | "multiple") => {
    if (mode === "single") {
      singleFileInputRef.current?.click();
    } else if (mode === "multiple") {
      multFileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 md:flex-nowrap">
      <input
        ref={singleFileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Import a single PDF file"
      />
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl gap-1.5 text-xs"
        onClick={() => onImportFiles("single")}
        aria-label="Import File Button"
      >
        <FileUp className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Import File</span>
      </Button>
      <input
        ref={multFileInputRef}
        type="file"
        accept=".pdf"
        multiple
        webkitdirectory=""
        className="hidden"
        onChange={handleFileChange}
        aria-label="Import a folder containing PDF files"
      />
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl gap-1.5 text-xs"
        onClick={() => onImportFiles("multiple")}
        aria-label="Import Folder Button"
      >
        <FolderUp className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Import Folder</span>
      </Button>

      <div className="hidden sm:block h-8 w-px bg-border/50 mx-1" aria-hidden="true" />

      <div className="flex items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
        <Input
          placeholder="Absolute server path..."
          value={localPath}
          onChange={(e) => setLocalPath(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter" && localPath.trim()) {
              onAddPath(localPath);
              setLocalPath("");
            }
          }}
          aria-label="Absolute server path input"
          className="h-8 w-full sm:w-64 rounded-xl text-xs bg-secondary/30 border-border/30 focus:border-primary/50"
        />
        <Button
          variant="secondary"
          size="sm"
          className="rounded-xl h-8 px-3 text-xs"
          disabled={!localPath.trim()}
          onClick={() => {
            onAddPath(localPath);
            setLocalPath("");
          }}
          aria-label="Add absolute server path"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
