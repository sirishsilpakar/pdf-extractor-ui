import { Search, MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { SearchResult, PaginationState, ExtractionResultDetail } from '@/types';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileViewerModal } from './FileViewerModal';

interface Props {
  query: string;
  results: SearchResult[];
  pagination: PaginationState;
  onSearch: (query: string, page?: number) => void;
  onReindex: () => void;
  onGetDetail: (id: number) => Promise<ExtractionResultDetail | null>;
  getDownloadUrl: (id: number) => string;
  isLoading?: boolean;
}

export function SearchPanel({
  query,
  results,
  pagination,
  onSearch,
  onReindex,
  onGetDetail,
  getDownloadUrl,
  isLoading,
}: Props) {
  const [inputValue, setInputValue] = useState(query);
  const [viewingResult, setViewingResult] = useState<SearchResult | null>(null);
  const [viewingDetail, setViewingDetail] = useState<ExtractionResultDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(false);

  // Sync with global query (e.g. from header)
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const handleSearch = () => {
    if (inputValue.trim()) onSearch(inputValue.trim(), 1);
  };

  const handleView = async (r: SearchResult) => {
    setViewingResult(r);
    setViewingDetail(null);
    setIsLoadingDetail(true);
    setDetailError(false);

    try {
      const detail = await onGetDetail(r.resultId);
      if (detail) {
        setViewingDetail(detail);
      } else {
        setDetailError(true);
      }
    } catch (e) {
      console.error("Failed to load result text detail", e);
      setDetailError(true);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-4">
      <FileViewerModal
        open={!!viewingResult}
        onOpenChange={(open) => {
          if (!open) {
            setViewingResult(null);
            setViewingDetail(null);
            setIsLoadingDetail(false);
            setDetailError(false);
          }
        }}
        fileName={viewingResult?.file || ""}
        detail={viewingDetail}
        isLoading={isLoadingDetail}
        isError={detailError}
        downloadUrl={viewingResult ? getDownloadUrl(viewingResult.resultId) : ""}
      />

      {/* Search bar */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search extracted text across all files…"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              className="pl-10 h-10 rounded-xl text-sm"
            />
          </div>
          <Button onClick={handleSearch} className="rounded-xl px-5">
            Search
          </Button>
          <Button variant="outline" onClick={onReindex} className="rounded-xl gap-2 hover:bg-primary hover:text-white" title="Build full-text search index from all extracted files">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Build Index</span>
          </Button>
        </div>

        {/* Index notice */}
        {query && results.length === 0 && pagination.total === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/30 text-sm">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <span className="text-warning">
              No results found. If you haven't built the search index yet, click <strong>Build Index</strong> then try again.
            </span>
          </div>
        )}
      </div>

      {!query && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Enter a search term to find text across all processed files
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="glass rounded-xl border border-border/50 overflow-hidden p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-1/3 bg-muted/20 animate-pulse rounded" />
                <div className="h-6 w-20 bg-muted/20 animate-pulse rounded-lg" />
              </div>
              <div className="h-16 w-full bg-muted/10 animate-pulse rounded-lg" />
            </div>
          ))
        ) : (
          <AnimatePresence>
            {results.map((r, idx) => (
              <motion.div
                key={`${r.resultId}-${idx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass rounded-xl border border-border/50 overflow-hidden"
              >
                {/* Result header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/20 border-b border-border/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-sm truncate">{r.file}</span>
                    <span className="text-xs text-muted-foreground truncate hidden sm:block">{r.relPath}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.pageNo > 0 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        <MapPin className="h-3 w-3" />
                        PAGE {r.pageNo}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg h-7 text-xs hover:bg-primary hover:text-white"
                      onClick={() => handleView(r)}
                    >
                      View →
                    </Button>
                  </div>
                </div>

                {/* Snippet — rendered as HTML since FTS5 already provides <mark> tags */}
                <div
                  className="px-4 py-3 text-sm text-muted-foreground leading-relaxed [&_mark]:bg-primary/20 [&_mark]:text-primary [&_mark]:font-semibold [&_mark]:rounded [&_mark]:px-0.5"
                  dangerouslySetInnerHTML={{ __html: `…${r.snippet}…` }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-muted-foreground">
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} result{pagination.total !== 1 ? 's' : ''})
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm" className="rounded-xl"
              disabled={pagination.page <= 1}
              onClick={() => onSearch(query, pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline" size="sm" className="rounded-xl"
              disabled={pagination.page >= pagination.pages}
              onClick={() => onSearch(query, pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
