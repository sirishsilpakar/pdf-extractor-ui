import { FileUp, FolderUp, Upload, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from './ThemeToggle';

interface AppHeaderProps {
  globalSearch: string;
  onGlobalSearchChange: (v: string) => void;
  onImportFiles: () => void;
}

export function AppHeader({ globalSearch, onGlobalSearchChange, onImportFiles }: AppHeaderProps) {
  return (
    <header className="h-14 border-b border-border/50 glass-strong flex items-center px-4 gap-3 shrink-0">
      <div className="flex items-center gap-2 mr-4">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">P</span>
        </div>
        <span className="font-semibold text-lg tracking-tight">PDF TextExtract</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={onImportFiles}>
          <FileUp className="h-3.5 w-3.5" /> Import File
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={() => onImportFiles()}>
          <FolderUp className="h-3.5 w-3.5" /> Import Folder
        </Button>
      </div>

      <div className="flex-1 max-w-md ml-auto mr-3 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search extracted text..."
          value={globalSearch}
          onChange={e => onGlobalSearchChange(e.target.value)}
          className="pl-9 h-9 rounded-xl bg-secondary/50 border-border/50 text-sm"
        />
      </div>

      <ThemeToggle />
    </header>
  );
}
