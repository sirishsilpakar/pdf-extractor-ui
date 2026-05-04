import { Pause, Play, Square, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import type { PDFFile } from "@/types";
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
  isProcessing: boolean;
  isPaused: boolean;
  eventErr: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onStart: () => void;
}

export function ProcessingDashboard({
  overallProgress,
  totalFiles,
  completedFiles,
  processingFile,
  isProcessing,
  isPaused,
  eventErr,
  onPause,
  onResume,
  onCancel,
  onStart,
}: Props) {
  const remaining = totalFiles - completedFiles;
  const [t, setT] = useState(0);
  const i = useRef(null);
  const totalFileCount = useMemo(() => {
    return (totalFiles - completedFiles)
  },[totalFiles, completedFiles])

  const start = () => {
    clearInterval(i.current);
    i.current = setInterval(() => setT((v) => v + 1), 1000);
  };
  const stop = () => clearInterval(i.current);
  useEffect(() => {
    if ((totalFiles - completedFiles === 0) || eventErr) stop();
  }, [totalFiles, completedFiles, eventErr]);
  const eta = remaining > 0 ? `~${Math.floor(remaining * Math.PI)}s` : "0s";

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" />
          <h2 className="font-semibold text-sm">
            Processing Dashboard | Processing: {isProcessing ? "true" : "false"} | Total Files: {totalFiles}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {isProcessing && !isPaused && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1 text-xs"
              onClick={onPause}
            >
              <Pause className="h-3 w-3" /> Pause
            </Button>
          )}
          {isProcessing && isPaused && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1 text-xs"
              onClick={onResume}
            >
              <Play className="h-3 w-3" /> Resume
            </Button>
          )}
          {!isProcessing && (
            <Button
              size="sm"
              className="rounded-xl gap-1 text-xs"
              onClick={() => {
                onStart();
                start();
              }}
              disabled={totalFiles === 0}
            >
              <Play className="h-3 w-3" /> Start
            </Button>
          )}
          {isProcessing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-xl gap-1 text-xs"
                >
                  <Square className="h-3 w-3" /> Cancel
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
                  <AlertDialogCancel className="rounded-xl">
                    Keep Going
                  </AlertDialogCancel>
                  <AlertDialogAction className="rounded-xl" onClick={onCancel}>
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
          <span className="text-muted-foreground">Overall Progress</span>
          <motion.span
            key={overallProgress}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="font-bold text-primary"
          >
            {overallProgress}%
          </motion.span>
        </div>
        <Progress value={overallProgress} className="h-3 rounded-full" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Elapsed",
            value: `${String((t / 60) | 0).padStart(2, "0")}:${String((t % 60) | 0).padStart(2, "0")}`,
          },
          { label: "ETA", value: eta },
          { label: "Processed", value: `${completedFiles}/${totalFiles}` },
          { label: "Remaining", value: String(remaining) },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-secondary/50 rounded-xl p-3 text-center"
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-semibold text-sm mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {(totalFileCount != 0) && (
        <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
          <span className="text-muted-foreground">{processingFile ? 'Currently processing:' : 'Ready to start the process!' } </span>
          <span className="font-medium">{processingFile}</span>
          <span className="ml-auto font-mono text-xs text-primary">0%</span>
        </div>
      )}
    </div>
  );
}
