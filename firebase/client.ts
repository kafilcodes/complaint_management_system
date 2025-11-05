/**
 * FIREBASE CLIENT SDK INITIALIZATION
 * 
 * This file initializes the Firebase client SDK for use in browser/client components.
 * It's used by TanStack Query for data fetching and by client-side Auth listeners.
 * 
 * IMPORTANT: This SDK should ONLY be used for:
 * - Authentication (signInWithEmailAndPassword, signOut, etc.)
 * - Reading data (with Firestore security rules enforcement)
 * - Real-time listeners (onSnapshot)
 * - File uploads to Storage (with Storage rules enforcement)
 * 
 * NEVER use this for:
 * - Direct database writes (create, update, delete) - use API routes instead
 * - Setting custom claims - that's Admin SDK only
 * 
 * @module firebase/client
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { env, validateEnv } from "@/lib/env";

// ==============================================================================
// FIREBASE CONFIGURATION
// ==============================================================================

/**
 * Firebase client configuration from centralized env module
 * This ensures compatibility with Turbopack and provides better type safety
 */
const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
  measurementId: env.firebase.measurementId,
};

// ==============================================================================
// FIREBASE APP INITIALIZATION
// ==============================================================================

/**
 * Initialize Firebase app (singleton pattern)
 * Only initialize once, even if this module is imported multiple times
 */
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  // Validate environment variables before initialization
  if (typeof window !== "undefined") {
    validateEnv();
  }

  // Initialize Firebase app (only once)
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized successfully");
  } else {
    app = getApps()[0];
    console.log("✅ Using existing Firebase instance");
  }

  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Enable offline persistence for Firestore (improves UX)
  if (typeof window !== "undefined") {
    // Note: enableIndexedDbPersistence is no longer needed in Firestore v9+
    // Persistence is enabled by default
  }
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
  throw error;
}

// ==============================================================================
// EXPORTS
// ==============================================================================

/**
 * Export Firebase services for use in the application
 */
export { app, auth, db, storage };

/**
 * Export commonly used Firebase types and functions
 * Note: Full wildcard exports removed to avoid naming conflicts
 * Import specific functions from firebase/auth, firebase/firestore, firebase/storage as needed
 */
export type { User, UserCredential, IdTokenResult } from "firebase/auth";
export type {
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  CollectionReference,
} from "firebase/firestore";
export type { UploadResult, UploadTask, StorageReference } from "firebase/storage";

/**
 * Helper: Check if Firebase is initialized
 */
export const isFirebaseInitialized = (): boolean => {
  return !!app && !!auth && !!db && !!storage;
};

/**
 * Helper: Get current Firebase project ID
 */
export const getProjectId = (): string => {
  return app.options.projectId || "";
};

/**
 * Helper: Get storage bucket URL
 */
export const getStorageBucket = (): string => {
  return app.options.storageBucket || "";
};
