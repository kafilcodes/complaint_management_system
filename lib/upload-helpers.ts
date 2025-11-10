/**
 * UPLOAD HELPERS
 * 
 * Helper functions for uploading files to Firebase Storage
 * and managing file URLs in Firestore documents.
 * 
 * @module lib/upload-helpers
 */

import { storage } from "@/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Upload multiple files to Firebase Storage
 * 
 * @param files - Array of files to upload
 * @param path - Storage path (e.g., "ticket-attachments/ticketId")
 * @returns Array of download URLs
 */
export async function uploadFiles(
  files: File[],
  path: string
): Promise<string[]> {
  const uploadPromises = files.map(async (file) => {
    // Create unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}_${sanitizedName}`;
    const filePath = `${path}/${fileName}`;

    // Create storage reference
    const storageRef = ref(storage, filePath);

    // Upload file with metadata
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  });

  return Promise.all(uploadPromises);
}

/**
 * Upload a single file to Firebase Storage
 * 
 * @param file - File to upload
 * @param path - Storage path
 * @returns Download URL
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  const urls = await uploadFiles([file], path);
  return urls[0];
}

/**
 * Validate file size
 * 
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in MB
 * @returns true if valid, false otherwise
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validate file type
 * 
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns true if valid, false otherwise
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      return file.type.startsWith(type.replace("/*", "/"));
    }
    return file.type === type;
  });
}

/**
 * Format file size for display
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
