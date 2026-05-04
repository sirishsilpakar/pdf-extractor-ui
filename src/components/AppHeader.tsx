import { FileUp, FolderUp, Upload, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { useRef } from "react";

interface AppHeaderProps {
  globalSearch: string;
  onGlobalSearchChange: (v: string) => void;
  handleFileChange;
}

export function AppHeader({
  globalSearch,
  onGlobalSearchChange,
  handleFileChange,
}: AppHeaderProps) {
  const singleFileInputRef = useRef(null);
  const multFileInputRef = useRef(null);

  const onImportFiles = (mode: string) => {
    if (mode === "single") {
      singleFileInputRef.current?.click();
    } else if (mode === "multiple") {
      multFileInputRef.current?.click();
    }
  };
  return (
    <header className="h-14 border-b border-border/50 glass-strong flex items-center px-4 gap-3 shrink-0">
      <div className="flex items-center gap-1.5">
        <input
          ref={singleFileInputRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-1.5 text-xs"
          onClick={() => onImportFiles("single")}
        >
          <FileUp className="h-3.5 w-3.5" /> Import File
        </Button>
        <input
          ref={multFileInputRef}
          type="file"
          accept=".pdf"
          multiple
          webkitdirectory="true"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-1.5 text-xs"
          onClick={() => onImportFiles("multiple")}
        >
          <FolderUp className="h-3.5 w-3.5" /> Import Folder
        </Button>
      </div>

      <div className="flex-1 max-w-md ml-auto mr-3 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search extracted text..."
          value={globalSearch}
          onChange={(e) => onGlobalSearchChange(e.target.value)}
          className="pl-9 h-9 rounded-xl bg-secondary/50 border-border/50 text-sm"
        />
      </div>

      <ThemeToggle />
    </header>
  );
}
