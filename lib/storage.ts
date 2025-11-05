/**
 * Firebase Storage Utilities
 * 
 * Helper functions for uploading, downloading, and managing files in Firebase Storage.
 * Used for ticket attachments and resolution images.
 */

import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL as getFirebaseDownloadURL,
  deleteObject,
  type UploadTaskSnapshot 
} from "firebase/storage";
import { storage } from "@/firebase/client";

/**
 * Upload progress callback type
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * Upload a file to Firebase Storage
 * 
 * @param file - The file to upload
 * @param path - Storage path (e.g., "tickets/abc123/image.jpg")
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Promise with download URL
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  try {
    // Create storage reference
    const storageRef = ref(storage, path);

    // Start upload
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Return promise that resolves with download URL
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot: UploadTaskSnapshot) => {
          // Calculate progress percentage
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          // Call progress callback if provided
          if (onProgress) {
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          // Handle upload error
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          // Upload complete, get download URL
          try {
            const downloadURL = await getFirebaseDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

/**
 * Upload multiple files
 * 
 * @param files - Array of files to upload
 * @param basePath - Base storage path (e.g., "tickets/abc123")
 * @param onProgress - Optional callback for overall progress
 * @returns Promise with array of download URLs
 */
export async function uploadMultipleFiles(
  files: File[],
  basePath: string,
  onProgress?: UploadProgressCallback
): Promise<string[]> {
  const totalFiles = files.length;
  let completedFiles = 0;

  const uploadPromises = files.map(async (file) => {
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const path = `${basePath}/${filename}`;

    // Upload file
    const url = await uploadFile(file, path, (fileProgress) => {
      // Calculate overall progress
      if (onProgress) {
        const overallProgress = ((completedFiles + fileProgress / 100) / totalFiles) * 100;
        onProgress(Math.round(overallProgress));
      }
    });

    completedFiles++;
    return url;
  });

  return Promise.all(uploadPromises);
}

/**
 * Delete a file from Firebase Storage
 * 
 * @param url - Download URL or storage path
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    // Extract path from URL or use as-is if it's already a path
    let path = url;
    
    if (url.includes("firebasestorage.googleapis.com")) {
      // Extract path from download URL
      const urlParts = url.split("/o/")[1];
      if (urlParts) {
        path = decodeURIComponent(urlParts.split("?")[0]);
      }
    }

    // Create reference and delete
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

/**
 * Delete multiple files
 * 
 * @param urls - Array of download URLs or storage paths
 */
export async function deleteMultipleFiles(urls: string[]): Promise<void> {
  const deletePromises = urls.map((url) => deleteFile(url));
  await Promise.all(deletePromises);
}

/**
 * Get download URL for a file path
 * 
 * @param path - Storage path (e.g., "tickets/abc123/image.jpg")
 * @returns Promise with download URL
 */
export async function getDownloadURL(path: string): Promise<string> {
  try {
    const fileRef = ref(storage, path);
    return await getFirebaseDownloadURL(fileRef);
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw error;
  }
}

/**
 * Generate a unique storage path for a ticket file
 * 
 * @param ticketId - The ticket ID
 * @param filename - Original filename
 * @param prefix - Optional prefix (e.g., "resolution", "attachment")
 * @returns Storage path
 */
export function generateTicketFilePath(
  ticketId: string,
  filename: string,
  prefix?: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const prefixPart = prefix ? `${prefix}/` : "";
  
  return `tickets/${ticketId}/${prefixPart}${timestamp}-${sanitizedFilename}`;
}

/**
 * Validate file before upload
 * 
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const maxSize = options.maxSize || 5 * 1024 * 1024; // Default 5MB
  const allowedTypes = options.allowedTypes || [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Create a file preview URL (for images)
 * 
 * @param file - File to preview
 * @returns Object URL for preview
 */
export function createFilePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a file preview URL to free memory
 * 
 * @param url - Object URL to revoke
 */
export function revokeFilePreview(url: string): void {
  URL.revokeObjectURL(url);
}
