import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ExtractionResultDetail } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  detail: ExtractionResultDetail | null;
  downloadUrl: string;
}

export function FileViewerModal({ open, onOpenChange, fileName, detail, downloadUrl }: Props) {
  const highConf = detail?.confidence !== null && detail?.confidence !== undefined && detail.confidence >= 0.85;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[82vh] flex flex-col p-0 overflow-hidden rounded-2xl gap-0">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 border-b border-border/50 flex-row items-start justify-between shrink-0 space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold leading-tight">{fileName}</DialogTitle>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-0.5">
                Extracted Text Content
              </p>
            </div>
          </div>
          <a
            href={downloadUrl}
            download
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/70 text-xs font-medium hover:bg-secondary/60 transition-colors mr-8 shrink-0 mt-1"
          >
            <Download className="h-3.5 w-3.5" /> Download .txt
          </a>
        </DialogHeader>

        {/* Metadata bar */}
        {detail && (
          <div className="flex items-center gap-4 px-4 py-2 bg-secondary/20 border-b border-border/30 text-xs text-muted-foreground shrink-0 flex-wrap">
            <span className="font-medium uppercase tracking-wider text-foreground/70">
              📄 {detail.method || "?"}
            </span>
            <span>📝 {(detail.char_count || 0).toLocaleString()} chars</span>
            {detail.page_count != null && <span>📃 {detail.page_count} pages</span>}
            {detail.confidence != null && (
              <span className={cn("font-semibold", highConf ? "text-success" : "text-destructive")}>
                🎯 {(detail.confidence * 100).toFixed(1)}% confidence
              </span>
            )}
            {detail.processed_at && (
              <span>🕒 {new Date(detail.processed_at).toLocaleString()}</span>
            )}
          </div>
        )}

        {/* Body */}
        <ScrollArea className="flex-1 bg-secondary/10">
          <div className="p-8">
            {!detail ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm font-medium">Loading extracted content…</p>
              </div>
            ) : detail.content ? (
              <pre className="text-sm font-mono whitespace-pre-wrap break-words leading-relaxed text-foreground/90 selection:bg-primary/20">
                {detail.content}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground italic">(empty)</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
