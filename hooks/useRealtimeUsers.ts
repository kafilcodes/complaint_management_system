/**
 * REAL-TIME USERS HOOK
 * 
 * Uses Firestore onSnapshot for instant updates.
 * Wrapped in TanStack Query for caching and state management.
 * 
 * @module hooks/useRealtimeUsers
 */

import { useQuery } from "@tanstack/react-query";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  type Unsubscribe
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { useAuth } from "@/lib/store";
import type { User } from "@/lib/types";

interface UseRealtimeUsersOptions {
  role?: string;
  search?: string;
  limit?: number;
}

/**
 * Hook to get real-time users using onSnapshot
 */
export function useRealtimeUsers(options: UseRealtimeUsersOptions = {}) {
  const { user } = useAuth();

  return useQuery<User[]>({
    queryKey: ["users", "realtime", options],
    queryFn: () => {
      return new Promise<User[]>((resolve, reject) => {
        if (!user?.id) {
          reject(new Error("User not authenticated"));
          return;
        }

        try {
          // Build query
          const usersRef = collection(db, "users");
          let q = query(usersRef, orderBy("createdAt", "desc"));

          // Apply role filter if specified
          if (options.role) {
            q = query(usersRef, where("role", "==", options.role), orderBy("createdAt", "desc"));
          }

          // Set up real-time listener
          const unsubscribe: Unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              let users: User[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  email: data.email,
                  name: data.name,
                  role: data.role,
                  phone: data.phone,
                  storeId: data.storeId,
                  storeName: data.storeName,
                  brand: data.brand,
                  category: data.category,
                  isActive: data.isActive !== undefined ? data.isActive : (data.disabled !== undefined ? !data.disabled : true), // Support both isActive and legacy disabled
                  createdAt: data.createdAt instanceof Timestamp 
                    ? data.createdAt.toDate()
                    : data.createdAt,
                  updatedAt: data.updatedAt instanceof Timestamp
                    ? data.updatedAt.toDate()
                    : data.updatedAt,
                };
              });

              // Client-side search filter (since Firestore doesn't support text search)
              if (options.search) {
                const searchLower = options.search.toLowerCase();
                users = users.filter(
                  (u) =>
                    u.name.toLowerCase().includes(searchLower) ||
                    u.email.toLowerCase().includes(searchLower)
                );
              }

              resolve(users);
            },
            (error) => {
              console.error("Error in users listener:", error);
              reject(error);
            }
          );

          // Cleanup function
          return () => unsubscribe();
        } catch (error) {
          console.error("Error setting up users listener:", error);
          reject(error);
        }
      });
    },
    enabled: !!user?.id,
    staleTime: Infinity, // Data is always fresh due to real-time listener
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes after unmount
  });
}

/**
 * Hook to get a single user by ID in real-time
 */
export function useRealtimeUser(userId: string | null) {
  const { user: currentUser } = useAuth();

  return useQuery<User | null>({
    queryKey: ["users", "realtime", userId],
    queryFn: () => {
      return new Promise<User | null>((resolve, reject) => {
        if (!currentUser?.id || !userId) {
          resolve(null);
          return;
        }

        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("__name__", "==", userId));

          const unsubscribe: Unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              if (snapshot.empty) {
                resolve(null);
                return;
              }

              const doc = snapshot.docs[0];
              const data = doc.data();
              const user: User = {
                id: doc.id,
                email: data.email,
                name: data.name,
                role: data.role,
                phone: data.phone,
                storeId: data.storeId,
                storeName: data.storeName,
                brand: data.brand,
                category: data.category,
                isActive: data.isActive !== undefined ? data.isActive : (data.disabled !== undefined ? !data.disabled : true),
                createdAt: data.createdAt instanceof Timestamp 
                  ? data.createdAt.toDate()
                  : data.createdAt,
                updatedAt: data.updatedAt instanceof Timestamp
                  ? data.updatedAt.toDate()
                  : data.updatedAt,
              };

              resolve(user);
            },
            (error) => {
              console.error("Error in user listener:", error);
              reject(error);
            }
          );

          return () => unsubscribe();
        } catch (error) {
          console.error("Error setting up user listener:", error);
          reject(error);
        }
      });
    },
    enabled: !!currentUser?.id && !!userId,
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
  });
}
