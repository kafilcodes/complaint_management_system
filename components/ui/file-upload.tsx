"use client";

import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const FileUpload = ({
  onChange,
  maxFiles = 3,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    "application/pdf": [".pdf"],
  },
}: {
  onChange?: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    setFiles((prevFiles) => {
      const combined = [...prevFiles, ...newFiles];
      const limited = combined.slice(0, maxFiles);
      onChange && onChange(limited);
      return limited;
    });
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: true,
    maxFiles,
    maxSize,
    accept,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (fileRejections) => {
      console.error("File rejected:", fileRejections);
    },
  });

  const removeFile = (index: number) => {
    setFiles((prevFiles) => {
      const newFiles = prevFiles.filter((_, i) => i !== index);
      onChange && onChange(newFiles);
      return newFiles;
    });
  };

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="group/file relative block w-full cursor-pointer overflow-hidden rounded-lg"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          multiple
          max={maxFiles}
          onChange={(e) => {
            const selectedFiles = Array.from(e.target.files || []);
            handleFileChange(selectedFiles);
          }}
          className="hidden"
          accept={Object.keys(accept).join(",")}
        />

        <div className="flex min-h-[200px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-primary/20 bg-muted/50 transition-colors hover:border-primary/40 hover:bg-muted/80">
          <div className="relative w-full max-w-xl mx-auto">
            {files.length > 0 ? (
              <div className="flex flex-col gap-2 p-8">
                {files.map((file, idx) => (
                  <motion.div
                    key={`file-${idx}`}
                    layoutId={`file-${idx}-${file.name}`}
                    className={cn(
                      "relative z-40 flex w-full items-center justify-between gap-4 overflow-hidden rounded-md bg-background p-4 shadow-sm",
                      "border border-border/50"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <IconUpload className="h-5 w-5 flex-shrink-0 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="flex-shrink-0 rounded-md p-1 hover:bg-destructive/10 text-destructive"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </motion.div>
                ))}

                {files.length < maxFiles && (
                  <motion.div
                    variants={secondaryVariant}
                    className="mt-4 flex items-center justify-center"
                  >
                    <p className="text-sm text-muted-foreground">
                      Click or drop to add more ({files.length}/{maxFiles})
                    </p>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className="relative z-40 mx-auto flex w-full max-w-[8rem] flex-col items-center justify-center gap-4 p-8"
              >
                <div className="rounded-full bg-primary/10 p-4">
                  <IconUpload className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {isDragActive ? "Drop files here" : "Upload files"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Drag and drop or click to browse
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Max {maxFiles} files • {maxSize / (1024 * 1024)}MB each
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
