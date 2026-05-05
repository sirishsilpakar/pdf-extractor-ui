import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { PathImporter } from "./AppHeader/PathImporter";

interface AppHeaderProps {
  globalSearch: string;
  onGlobalSearchChange: (v: string) => void;
  onSearchSubmit: (v: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddPath: (path: string) => void;
}

export function AppHeader({
  globalSearch,
  onGlobalSearchChange,
  onSearchSubmit,
  handleFileChange,
  onAddPath,
}: AppHeaderProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearchSubmit(globalSearch);
    }
  };

  return (
    <header className="min-h-14 border-b border-border/50 glass-strong flex flex-col md:flex-row items-start md:items-center px-4 py-2 gap-3 shrink-0">
      <PathImporter handleFileChange={handleFileChange} onAddPath={onAddPath} />

      <div className="flex-1 w-full max-w-md md:ml-auto md:mr-3 relative mt-2 md:mt-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Search extracted text..."
          value={globalSearch}
          onChange={(e) => onGlobalSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Global search for extracted text"
          className="pl-9 h-9 rounded-xl bg-secondary/50 border-border/50 text-sm w-full"
        />
      </div>

      <div className="absolute right-4 top-3 md:relative md:top-0 md:right-0">
        <ThemeToggle />
      </div>
    </header>
  );
}
