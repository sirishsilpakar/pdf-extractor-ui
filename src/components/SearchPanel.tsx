import { Search, FileText, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { SearchResult } from '@/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  results: SearchResult[];
}

export function SearchPanel({ query, onQueryChange, results }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="glass rounded-2xl p-5 space-y-4 flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search extracted text across all files..."
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          className="pl-10 h-10 rounded-xl text-sm"
        />
      </div>

      {query && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No matches found for "{query}"
        </div>
      )}

      {!query && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Enter a search term to find text across processed files
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {results.map(r => (
            <motion.div
              key={r.fileId}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass rounded-xl p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => setExpandedId(expandedId === r.fileId ? null : r.fileId)}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-sm">{r.fileName}</span>
                <ChevronDown className={cn('h-4 w-4 ml-auto text-muted-foreground transition-transform', expandedId === r.fileId && 'rotate-180')} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                ...{r.snippet.slice(0, r.matchIndex - Math.max(0, r.matchIndex - 40))}
                <mark className="bg-accent/30 text-accent-foreground rounded px-0.5">{query}</mark>
                {r.snippet.slice(r.matchIndex - Math.max(0, r.matchIndex - 40) + query.length)}...
              </p>
              {expandedId === r.fileId && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">{r.snippet}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
