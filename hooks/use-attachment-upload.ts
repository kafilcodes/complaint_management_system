/**
 * Attachment Upload Hook
 * 
 * Production-grade file upload with progress tracking, validation, and error handling.
 * Supports uploading files to Firebase Storage with real-time progress updates.
 * 
 * @module hooks/use-attachment-upload
 */

import { useState, useCallback } from "react";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/firebase/client";
import { toast } from "sonner";

export interface AttachmentMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  downloadURL: string;
  storagePath: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

interface UseAttachmentUploadOptions {
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
  allowedTypes?: string[];
  storagePath: string;
}

export function useAttachmentUpload(options: UseAttachmentUploadOptions) {
  const {
    maxFiles = 5,
    maxSizePerFile = 10, // 10MB default
    allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    storagePath,
  } = options;

  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<AttachmentMetadata[]>([]);

  /**
   * Validate a single file
   */
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    const maxSizeBytes = maxSizePerFile * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds maximum size of ${maxSizePerFile}MB`,
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" is not allowed for "${file.name}"`,
      };
    }

    return { valid: true };
  }, [maxSizePerFile, allowedTypes]);

  /**
   * Upload files with progress tracking
   */
  const uploadFiles = useCallback(async (files: File[]): Promise<AttachmentMetadata[]> => {
    // Validate number of files
    if (files.length > maxFiles) {
      const error = `Maximum ${maxFiles} files allowed, got ${files.length}`;
      toast.error("Too many files", { description: error });
      throw new Error(error);
    }

    // Validate each file
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error("Invalid file", { description: validation.error });
        throw new Error(validation.error);
      }
    }

    setIsUploading(true);
    setUploads([]);
    const uploadedMetadata: AttachmentMetadata[] = [];
    const errors: string[] = [];

    try {
      // Upload files sequentially for better progress tracking
      for (const file of files) {
        try {
          // Generate unique filename
          const timestamp = Date.now();
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const fileName = `${timestamp}_${sanitizedName}`;
          const filePath = `${storagePath}/${fileName}`;

          // Create storage reference
          const storageRef = ref(storage, filePath);

          // Initialize upload progress
          setUploads((prev) => [
            ...prev,
            {
              fileName: file.name,
              progress: 0,
              status: "uploading",
            },
          ]);

          // Upload file with progress tracking
          const uploadTask = uploadBytesResumable(storageRef, file, {
            contentType: file.type,
            customMetadata: {
              originalName: file.name,
              uploadedAt: new Date().toISOString(),
              fileSize: file.size.toString(),
            },
          });

          // Wait for upload to complete
          await new Promise<void>((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                const progress = Math.round(
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                
                setUploads((prev) =>
                  prev.map((upload) =>
                    upload.fileName === file.name
                      ? { ...upload, progress }
                      : upload
                  )
                );
              },
              (error) => {
                console.error(`Error uploading ${file.name}:`, error);
                
                setUploads((prev) =>
                  prev.map((upload) =>
                    upload.fileName === file.name
                      ? { ...upload, status: "error", error: error.message }
                      : upload
                  )
                );
                
                reject(error);
              },
              async () => {
                try {
                  // Get download URL
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                  // Create metadata
                  const metadata: AttachmentMetadata = {
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    uploadedAt: new Date(),
                    downloadURL,
                    storagePath: filePath,
                  };

                  uploadedMetadata.push(metadata);

                  setUploads((prev) =>
                    prev.map((upload) =>
                      upload.fileName === file.name
                        ? { ...upload, progress: 100, status: "completed" }
                        : upload
                    )
                  );

                  resolve();
                } catch (error: any) {
                  reject(error);
                }
              }
            );
          });

        } catch (error: any) {
          console.error(`Failed to upload ${file.name}:`, error);
          errors.push(`${file.name}: ${error.message}`);
        }
      }

      // Check if all uploads succeeded
      if (errors.length > 0) {
        const errorMessage = `Failed to upload ${errors.length} file(s)`;
        toast.error("Upload failed", { description: errorMessage });
        throw new Error(errorMessage);
      }

      setUploadedFiles(uploadedMetadata);
      toast.success(`Successfully uploaded ${uploadedMetadata.length} file(s)`);
      
      return uploadedMetadata;

    } catch (error: any) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [storagePath, maxFiles, validateFile]);

  /**
   * Delete an uploaded file
   */
  const deleteFile = useCallback(async (metadata: AttachmentMetadata) => {
    try {
      const fileRef = ref(storage, metadata.storagePath);
      await deleteObject(fileRef);
      
      setUploadedFiles((prev) =>
        prev.filter((file) => file.downloadURL !== metadata.downloadURL)
      );
      
      toast.success(`Deleted ${metadata.fileName}`);
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file", { description: error.message });
      throw error;
    }
  }, []);

  /**
   * Reset upload state
   */
  const reset = useCallback(() => {
    setUploads([]);
    setUploadedFiles([]);
    setIsUploading(false);
  }, []);

  /**
   * Get overall upload progress
   */
  const overallProgress = uploads.length > 0
    ? Math.round(
        uploads.reduce((acc, upload) => acc + upload.progress, 0) / uploads.length
      )
    : 0;

  return {
    uploadFiles,
    deleteFile,
    reset,
    validateFile,
    uploads,
    uploadedFiles,
    isUploading,
    overallProgress,
    hasErrors: uploads.some((upload) => upload.status === "error"),
  };
}
