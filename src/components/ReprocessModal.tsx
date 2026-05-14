import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alreadyCount: number;
  totalCount: number;
  onSkip: () => void;
  onReprocess: () => void;
  onCancel: () => void;
}

export function ReprocessModal({
  open,
  onOpenChange,
  alreadyCount,
  totalCount,
  onSkip,
  onReprocess,
  onCancel,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Already Processed Files</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            {alreadyCount} of {totalCount} file(s) have already been extracted. 
            What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="secondary" 
            onClick={onCancel} 
            className="rounded-xl flex-1"
          >
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={onSkip} 
            className="rounded-xl flex-1"
          >
            Skip Existing
          </Button>
          <Button 
            onClick={onReprocess} 
            className="rounded-xl flex-1"
          >
            Reprocess All
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
