/**
 * Upload Progress Component
 * 
 * Displays file upload progress with individual file status and overall progress bar.
 */

import { Check, Loader2, X, FileIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { UploadProgress } from "@/hooks/use-attachment-upload";
import { cn } from "@/lib/utils";

interface UploadProgressDisplayProps {
  uploads: UploadProgress[];
  overallProgress: number;
  className?: string;
}

export function UploadProgressDisplay({
  uploads,
  overallProgress,
  className,
}: UploadProgressDisplayProps) {
  if (uploads.length === 0) return null;

  return (
    <div className={cn("space-y-3 rounded-lg border bg-muted/30 p-4", className)}>
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Uploading {uploads.length} file{uploads.length > 1 ? "s" : ""}...
          </span>
          <span className="text-muted-foreground">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Individual File Progress */}
      <div className="space-y-2">
        {uploads.map((upload, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-md bg-background px-3 py-2"
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {upload.status === "uploading" && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              {upload.status === "completed" && (
                <Check className="h-4 w-4 text-green-500" />
              )}
              {upload.status === "error" && (
                <X className="h-4 w-4 text-destructive" />
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{upload.fileName}</p>
              {upload.error && (
                <p className="text-xs text-destructive mt-0.5">{upload.error}</p>
              )}
            </div>

            {/* Progress */}
            <div className="flex-shrink-0 text-xs text-muted-foreground">
              {upload.progress}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
