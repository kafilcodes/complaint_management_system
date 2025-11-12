/**
 * Firestore Helper Functions
 * 
 * Reusable utility functions for common Firestore operations.
 * These helpers provide type-safe CRUD operations and query builders.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type Query,
  type QueryConstraint,
  type DocumentData,
  type DocumentSnapshot,
  type QuerySnapshot,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import type { FirestoreDocument } from "@/lib/types";

/**
 * Generic function to get a document by ID
 */
export async function getDocument<T extends FirestoreDocument>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as T;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Generic function to get all documents in a collection
 */
export async function getDocuments<T extends FirestoreDocument>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Generic function to create a new document
 */
export async function createDocument<T extends Omit<FirestoreDocument, "id">>(
  collectionName: string,
  data: T
): Promise<string> {
  try {
    const collectionRef = collection(db, collectionName);
    const docRef = await addDoc(collectionRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Generic function to update a document
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Generic function to delete a document
 */
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Real-time listener for a single document
 */
export function subscribeToDocument<T extends FirestoreDocument>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, docId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({
          id: snapshot.id,
          ...snapshot.data(),
        } as T);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error(`Error in document subscription (${collectionName}):`, error);
      onError?.(error);
    }
  );
}

/**
 * Real-time listener for a collection with query
 */
export function subscribeToCollection<T extends FirestoreDocument>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const documents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
      callback(documents);
    },
    (error) => {
      console.error(`Error in collection subscription (${collectionName}):`, error);
      onError?.(error);
    }
  );
}

/**
 * Paginated query helper
 */
export async function getPaginatedDocuments<T extends FirestoreDocument>(
  collectionName: string,
  constraints: QueryConstraint[],
  pageSize: number,
  lastDoc?: DocumentSnapshot
): Promise<{
  documents: T[];
  lastDocument: DocumentSnapshot | null;
  hasMore: boolean;
}> {
  try {
    const collectionRef = collection(db, collectionName);
    const queryConstraints = [...constraints, limit(pageSize + 1)];

    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc));
    }

    const q = query(collectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.slice(0, pageSize).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];

    const hasMore = querySnapshot.docs.length > pageSize;
    const lastDocument = hasMore
      ? querySnapshot.docs[querySnapshot.docs.length - 2]
      : querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    return {
      documents,
      lastDocument,
      hasMore,
    };
  } catch (error) {
    console.error(`Error getting paginated documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Count documents in a collection with query
 */
export async function countDocuments(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<number> {
  try {
    const documents = await getDocuments(collectionName, constraints);
    return documents.length;
  } catch (error) {
    console.error(`Error counting documents in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Check if a document exists
 */
export async function documentExists(
  collectionName: string,
  docId: string
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error(`Error checking document existence in ${collectionName}:`, error);
    return false;
  }
}

/**
 * Batch update multiple documents
 */
export async function batchUpdateDocuments(
  collectionName: string,
  updates: Array<{ id: string; data: Partial<DocumentData> }>
): Promise<void> {
  try {
    // Firebase SDK will handle batching automatically
    const promises = updates.map(({ id, data }) =>
      updateDocument(collectionName, id, data)
    );

    await Promise.all(promises);
  } catch (error) {
    console.error(`Error batch updating documents in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Convert Firestore Timestamp to Date (Production-Safe)
 * 
 * Handles all possible timestamp formats from Firestore and JavaScript:
 * - Firestore Timestamp objects (with .toDate() method)
 * - Serialized Firestore timestamps ({ seconds, nanoseconds })
 * - Native JavaScript Date objects
 * - ISO 8601 date strings
 * - Unix timestamps (milliseconds)
 * - Null/undefined values
 * 
 * @param timestamp - Any date-like value
 * @returns A valid JavaScript Date object
 */
export function timestampToDate(timestamp: any): Date {
  // Handle null/undefined
  if (!timestamp) return new Date();
  
  // Case 1: Already a JavaScript Date
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Case 2: Firestore Timestamp (has toDate method)
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // Case 3: Serialized Firestore Timestamp (REST API / JSON serialization)
  // Format: { seconds: number, nanoseconds: number } OR { _seconds: number, _nanoseconds: number }
  if (timestamp && (typeof timestamp.seconds === 'number' || typeof (timestamp as any)._seconds === 'number')) {
    const seconds = timestamp.seconds || (timestamp as any)._seconds;
    return new Date(seconds * 1000);
  }
  
  // Case 4: ISO 8601 string or Unix timestamp
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    // Validate the date is not invalid
    return isNaN(date.getTime()) ? new Date() : date;
  }
  
  // Fallback for any other type
  console.warn('Unknown timestamp format:', timestamp);
  return new Date();
}

/**
 * Format date for display
 */
export function formatDate(date: Date | Timestamp | undefined): string {
  if (!date) return "N/A";
  
  try {
    const d = timestampToDate(date);
    
    // Validate the date is not invalid
    if (!d || isNaN(d.getTime()) || d.getTime() < 0) {
      console.warn('Invalid date passed to formatDate:', date);
      return "N/A";
    }
    
    // Additional validation - check if year is reasonable (between 1900 and 2100)
    const year = d.getFullYear();
    if (year < 1900 || year > 2100) {
      console.warn('Date year out of range:', year, date);
      return "N/A";
    }
    
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return "N/A";
  }
}

/**
 * Format datetime for display
 * PRODUCTION-GRADE: Multiple layers of validation and error handling
 */
export function formatDateTime(date: Date | Timestamp | undefined): string {
  // Layer 1: Check if date exists
  if (!date) {
    console.log('[formatDateTime] No date provided');
    return "N/A";
  }
  
  try {
    // Layer 2: Convert to Date object
    const d = timestampToDate(date);
    
    // Layer 3: Validate Date object exists
    if (!d) {
      console.warn('[formatDateTime] timestampToDate returned null/undefined');
      return "N/A";
    }
    
    // Layer 4: Check if date time is valid
    const timestamp = d.getTime();
    if (isNaN(timestamp)) {
      console.warn('[formatDateTime] Invalid timestamp (NaN):', date);
      return "N/A";
    }
    
    // Layer 5: Check if timestamp is reasonable (not negative, not too far in future)
    if (timestamp < 0) {
      console.warn('[formatDateTime] Negative timestamp:', timestamp);
      return "N/A";
    }
    
    const now = Date.now();
    const tenYearsFromNow = now + (10 * 365 * 24 * 60 * 60 * 1000);
    if (timestamp > tenYearsFromNow) {
      console.warn('[formatDateTime] Timestamp too far in future:', new Date(timestamp));
      return "N/A";
    }
    
    // Layer 6: Validate year is reasonable
    try {
      const year = d.getFullYear();
      if (isNaN(year) || year < 1900 || year > 2100) {
        console.warn('[formatDateTime] Year out of range:', year);
        return "N/A";
      }
    } catch (yearError) {
      console.error('[formatDateTime] Error getting year:', yearError);
      return "N/A";
    }
    
    // Layer 7: Final formatting with additional try-catch
    try {
      // Test if date can be converted to ISO string first
      d.toISOString();
      
      const formatted = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
      
      return formatted;
    } catch (formatError) {
      console.error('[formatDateTime] Intl.DateTimeFormat error:', formatError, 'Date:', d);
      // Fallback to simple string conversion
      try {
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
      } catch (fallbackError) {
        console.error('[formatDateTime] Fallback formatting failed:', fallbackError);
        return "N/A";
      }
    }
  } catch (error) {
    console.error('[formatDateTime] Outer catch - Unexpected error:', error, 'Input:', date);
    return "N/A";
  }
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date | Timestamp | undefined): string {
  const d = timestampToDate(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return formatDate(d);
}

/**
 * Query builder helpers
 */
export const QueryBuilder = {
  where: (field: string, operator: any, value: any) => where(field, operator, value),
  orderBy: (field: string, direction: "asc" | "desc" = "asc") =>
    orderBy(field, direction),
  limit: (count: number) => limit(count),
};
