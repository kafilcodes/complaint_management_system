/**
 * FIREBASE ADMIN SDK INITIALIZATION
 * 
 * This file initializes the Firebase Admin SDK for server-side operations.
 * It's used exclusively in Next.js API Routes and Server Components.
 * 
 * CRITICAL SECURITY:
 * - This SDK has FULL access to your Firebase project
 * - It bypasses all security rules
 * - Environment variables must NEVER be exposed to the client
 * - Only use in API routes and server-side code
 * 
 * Use cases:
 * - Verifying ID tokens in API routes
 * - Setting custom user claims (roles)
 * - Creating/updating/deleting documents (server-side only)
 * - Reading data without security rule checks
 * 
 * @module firebase/admin
 */

import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

// ==============================================================================
// ENVIRONMENT VALIDATION
// ==============================================================================

/**
 * Validate that all required Admin SDK environment variables are present
 */
const validateAdminConfig = () => {
  const requiredVars = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase Admin environment variables: ${missing.join(", ")}\n` +
        "Please check your .env.local file and ensure these variables are set.\n" +
        "These should NEVER have the NEXT_PUBLIC_ prefix."
    );
  }
};

// ==============================================================================
// FIREBASE ADMIN APP INITIALIZATION
// ==============================================================================

/**
 * Initialize Firebase Admin SDK (singleton pattern)
 * Only initialize once, even if this module is imported multiple times
 */
let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

try {
  // Only initialize on the server
  if (typeof window === "undefined") {
    // Validate config
    validateAdminConfig();

    // Initialize Admin SDK (only once)
    if (!getApps().length) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle multiline private key from environment variable
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });

      console.log("✅ Firebase Admin SDK initialized successfully");
    } else {
      adminApp = getApps()[0];
      console.log("✅ Firebase Admin SDK already initialized");
    }

    // Initialize Admin services
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);

    // Set Firestore settings for better performance
    adminDb.settings({
      ignoreUndefinedProperties: true, // Ignore undefined values in writes
    });
  }
} catch (error) {
  console.error("❌ Firebase Admin SDK initialization error:", error);
  throw error;
}

// ==============================================================================
// EXPORTS
// ==============================================================================

/**
 * Export Firebase Admin services for use in API routes and server components
 */
export { adminApp, adminAuth, adminDb, adminStorage };

/**
 * Export Admin SDK types for convenience
 */
export type { DecodedIdToken, UserRecord } from "firebase-admin/auth";
export type {
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  CollectionReference,
  Timestamp,
  FieldValue,
} from "firebase-admin/firestore";

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

/**
 * Verify a Firebase ID token and return the decoded token
 * Use this in API routes to authenticate requests
 * 
 * @param idToken - The ID token from the client's Authorization header
 * @returns Decoded token with uid, email, and custom claims
 * 
 * @example
 * const token = await verifyIdToken(req.headers.authorization?.replace('Bearer ', ''))
 * if (token.role !== 'admin') throw new Error('Unauthorized')
 */
export const verifyIdToken = async (idToken: string) => {
  if (!adminAuth) {
    console.error("[verifyIdToken] ERROR: Firebase Admin Auth not initialized!");
    throw new Error("Firebase Admin Auth not initialized");
  }
  
  try {
    console.log("[verifyIdToken] Starting verification, token length:", idToken.length);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log("[verifyIdToken] ✅ Token verified successfully for user:", decodedToken.uid);
    return decodedToken;
  } catch (error) {
    console.error("[verifyIdToken] ❌ Token verification FAILED:", error);
    throw new Error("Invalid or expired token");
  }
};

/**
 * Set custom claims on a user (for role-based access control)
 * Only call this from secure API routes
 * 
 * @param uid - User's Firebase Auth UID
 * @param claims - Custom claims object (e.g., { role: 'admin' })
 * 
 * @example
 * await setCustomClaims(userId, { role: 'admin' })
 */
export const setCustomClaims = async (
  uid: string,
  claims: Record<string, unknown>
) => {
  if (!adminAuth) {
    throw new Error("Firebase Admin Auth not initialized");
  }

  try {
    await adminAuth.setCustomUserClaims(uid, claims);
    console.log(`✅ Custom claims set for user ${uid}:`, claims);
  } catch (error) {
    console.error("Failed to set custom claims:", error);
    throw new Error("Failed to set custom claims");
  }
};

/**
 * Get server timestamp for Firestore operations
 * Use this for createdAt, updatedAt fields
 * 
 * @example
 * await adminDb.collection('tickets').add({
 *   ...data,
 *   createdAt: getServerTimestamp()
 * })
 */
export const getServerTimestamp = () => {
  const { FieldValue } = require("firebase-admin/firestore");
  return FieldValue.serverTimestamp();
};

/**
 * Helper: Check if Admin SDK is initialized
 */
export const isAdminInitialized = (): boolean => {
  return !!adminApp && !!adminAuth && !!adminDb && !!adminStorage;
};

/**
 * Helper: Get Admin SDK project ID
 */
export const getAdminProjectId = (): string => {
  return process.env.FIREBASE_PROJECT_ID || "";
};
