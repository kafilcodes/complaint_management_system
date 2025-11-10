/**
 * AUTH PROVIDER
 * 
 * This client component manages the authentication state for the entire app.
 * It listens to Firebase Auth state changes via onAuthStateChanged and
 * syncs the current user to the Zustand store.
 * 
 * Key responsibilities:
 * 1. Listen to Firebase Auth state changes
 * 2. Get the user's ID token and decode custom claims (role)
 * 3. Fetch user profile from Firestore
 * 4. Update Zustand store with user data
 * 5. Handle loading and error states
 * 
 * @module components/providers/AuthProvider
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/client";
import { useAuth } from "@/lib/store";
import type { User } from "@/lib/types";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider Component
 * 
 * Wraps the application and provides authentication context.
 * This component runs on the client and establishes the auth listener.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setAuthToken, setAuthLoading } = useAuth();

  useEffect(() => {
    // Set up the Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in - get token and fetch profile
          await handleUserSignedIn(firebaseUser, setUser, setAuthToken);
        } else {
          // User is signed out
          setUser(null);
          setAuthToken(null);
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error);
        setUser(null);
        setAuthToken(null);
      } finally {
        // Always set loading to false after first check
        setAuthLoading(false);
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [setUser, setAuthToken, setAuthLoading]);

  return <>{children}</>;
}

/**
 * Handle user signed in state
 * 
 * Fetches the user's profile from Firestore, gets the ID token, and updates the store
 */
async function handleUserSignedIn(
  firebaseUser: FirebaseUser,
  setUser: (user: User | null) => void,
  setAuthToken: (token: string | null) => void
) {
  try {
    // Get the ID token first - this is critical for API requests
    const token = await firebaseUser.getIdToken();
    setAuthToken(token); // Store token in global state IMMEDIATELY
    console.log("[AuthProvider] ✅ Got auth token, length:", token.length);
    
    // Get the ID token result to access custom claims (role)
    const idTokenResult = await firebaseUser.getIdTokenResult();
    const role = idTokenResult.claims.role as string | undefined;

    // Fetch user profile from Firestore
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      // User profile exists in Firestore
      const userData = userDocSnap.data();
      
      const user: User = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || userData.email,
        name: userData.name,
        phone: userData.phone,
        photoURL: userData.photoURL, // Include profile photo URL
        role: role || userData.role,
        category: userData.category,
        storeId: userData.storeId,
        storeName: userData.storeName,
        brand: userData.brand,
        isActive: userData.isActive ?? true,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };

      setUser(user);
      console.log("[AuthProvider] ✅ User profile loaded:", user.email);
    } else {
      // User profile doesn't exist in Firestore (shouldn't happen normally)
      console.warn("User authenticated but no Firestore profile found:", firebaseUser.uid);
      
      // Create minimal user object from Firebase Auth data
      const user: User = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || "Unknown User",
        phone: firebaseUser.phoneNumber || "",
        role: role as any || "it_technician",
        isActive: true,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      };

      setUser(user);
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    setUser(null);
    setAuthToken(null);
    throw error;
  }
}
