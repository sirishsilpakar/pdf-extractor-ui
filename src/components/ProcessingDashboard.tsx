import { Play, Sliders, Square, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  overallProgress: number;
  totalFiles: number;
  completedFiles: number;
  processingFile?: string;
  pendingFilesCount: number;
  isProcessing: boolean;
  eventErr: boolean;
  elapsedSeconds?: number;
  etaSeconds?: number | null;
  onCancel: () => void;
  onStart: () => void;
  onToggleSettings?: () => void;
}

export function ProcessingDashboard({
  overallProgress,
  totalFiles,
  completedFiles,
  processingFile,
  pendingFilesCount = 0,
  isProcessing,
  eventErr,
  elapsedSeconds,
  etaSeconds,
  onCancel,
  onStart,
  onToggleSettings,
}: Props) {
  const remaining = totalFiles - completedFiles;
  const [t, setT] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isProcessing && !timerRef.current) {
      timerRef.current = setInterval(() => setT((v) => v + 1), 1000);
    } else if (!isProcessing && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isProcessing]);

  useEffect(() => {
    if (elapsedSeconds !== undefined && elapsedSeconds > t) {
      setT(elapsedSeconds);
    }
  }, [elapsedSeconds]);

  useEffect(() => {
    if (pendingFilesCount > 0) {
      setT(0);
    }
  }, [pendingFilesCount]);

  useEffect(() => { if (remaining === 0) setT(0); }, [remaining]);

  useEffect(() => {
    if (eventErr) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [eventErr]);

  let etaStr = "0s";
  if (remaining > 0) {
    if (etaSeconds !== undefined && etaSeconds !== null) {
      etaStr = `~${etaSeconds}s`;
    } else if (isProcessing && overallProgress > 0 && t > 0) {
      const rate = overallProgress / t;
      const remainingProgress = 100 - overallProgress;
      const estEta = Math.round(remainingProgress / rate);
      etaStr = `~${estEta}s`;
    } else {
      etaStr = "Calculating...";
    }
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-sm">
            Processing Dashboard
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {!isProcessing && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1 text-xs lg:hidden"
                onClick={onToggleSettings}
                aria-label="Configure Settings"
              >
                <Sliders className="h-3.5 w-3.5" aria-hidden="true" /> Configure
              </Button>
              <Button
                size="sm"
                className="rounded-xl gap-1 text-xs"
                onClick={onStart}
                disabled={pendingFilesCount === 0}
                aria-label="Start Processing"
              >
                <Play className="h-3 w-3" aria-hidden="true" /> Start
              </Button>
            </>
          )}
          {isProcessing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-xl gap-1 text-xs"
                  aria-label="Cancel Processing"
                >
                  <Square className="h-3 w-3" aria-hidden="true" /> Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Processing?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will stop all current processing. Queued files will
                    remain in the queue.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl bg-inherit hover:bg-primary hover:text-white">
                    Keep Going
                  </AlertDialogCancel>
                  <AlertDialogAction className="rounded-xl bg-red-600 hover:bg-red-700" onClick={onCancel}>
                    Cancel Processing
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground" id="progress-label">Overall Progress</span>
          <motion.span
            key={overallProgress}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="font-bold text-primary"
            aria-live="polite"
          >
            {overallProgress}%
          </motion.span>
        </div>
        <Progress 
          value={overallProgress} 
          className="h-3 rounded-full" 
          aria-labelledby="progress-label"
          aria-valuenow={overallProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Elapsed",
            value: `${String((t / 60) | 0).padStart(2, "0")}:${String((t % 60) | 0).padStart(2, "0")}`,
          },
          { label: "ETA", value: etaStr },
          { label: "Processed", value: `${completedFiles}/${totalFiles}` },
          { label: "Remaining", value: String(remaining) },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-secondary/50 rounded-xl p-3 text-center flex flex-col justify-center"
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-semibold text-sm mt-0.5" aria-live="polite" aria-atomic="true">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
