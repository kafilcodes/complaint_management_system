/**
 * ENVIRONMENT CONFIGURATION
 * 
 * This file provides a centralized way to access environment variables
 * with proper type safety and validation. It's compatible with Turbopack
 * and ensures environment variables are accessible both server-side and client-side.
 * 
 * @module lib/env
 */

/**
 * Client-side environment variables (safe to expose)
 * These are protected by Firebase Security Rules
 */
export const env = {
  // Firebase Client SDK Configuration
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  },
  
  // Application Configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "MParekh",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
} as const;

/**
 * Validate that all required environment variables are present
 * This runs at module load time to fail fast if configuration is missing
 */
export function validateEnv() {
  const missing: string[] = [];

  // Check Firebase required fields
  if (!env.firebase.apiKey) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!env.firebase.authDomain) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!env.firebase.projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!env.firebase.storageBucket) missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!env.firebase.messagingSenderId) missing.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!env.firebase.appId) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (missing.length > 0) {
    const error = new Error(
      `Missing required environment variables:\n${missing.join("\n")}\n\n` +
      `Please ensure your .env.local file contains all required variables and restart the dev server.`
    );
    console.error("❌ Environment Configuration Error");
    console.error("Missing variables:", missing);
    console.error("\nCurrent env values:", {
      firebase: env.firebase,
      app: env.app,
    });
    throw error;
  }

  console.log("✅ Environment variables validated successfully");
}
