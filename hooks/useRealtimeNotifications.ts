/**
 * REAL-TIME NOTIFICATIONS HOOK
 * 
 * Uses Firestore onSnapshot for instant updates.
 * Wrapped in TanStack Query for caching and state management.
 * 
 * @module hooks/useRealtimeNotifications
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  type Unsubscribe
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { useAuth } from "@/lib/store";
import { toast } from "sonner";
import type { Notification } from "@/lib/types";

interface UseRealtimeNotificationsOptions {
  read?: boolean;
  type?: string;
  limit?: number;
}

/**
 * Hook to get real-time notifications using onSnapshot
 */
export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const { user } = useAuth();

  return useQuery<Notification[]>({
    queryKey: ["notifications", "realtime", user?.id, options],
    queryFn: () => {
      return new Promise<Notification[]>((resolve, reject) => {
        if (!user?.id) {
          reject(new Error("User not authenticated"));
          return;
        }

        try {
          // Build query
          const notificationsRef = collection(db, "notifications");
          let q = query(
            notificationsRef,
            where("userId", "==", user.id),
            orderBy("createdAt", "desc")
          );

          // Apply filters
          if (options.read !== undefined) {
            q = query(q, where("read", "==", options.read));
          }
          if (options.type) {
            q = query(q, where("type", "==", options.type));
          }
          if (options.limit) {
            q = query(q, firestoreLimit(options.limit));
          }

          // Set up real-time listener
          const unsubscribe: Unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const notifications: Notification[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  userId: data.userId,
                  type: data.type,
                  title: data.title,
                  message: data.message,
                  read: data.read || false,
                  ticketId: data.ticketId,
                  link: data.link,
                  createdAt: data.createdAt instanceof Timestamp 
                    ? data.createdAt.toDate().toISOString()
                    : data.createdAt,
                  updatedAt: data.updatedAt instanceof Timestamp
                    ? data.updatedAt.toDate().toISOString()
                    : data.updatedAt,
                };
              });

              resolve(notifications);
            },
            (error) => {
              console.error("Error in notifications listener:", error);
              reject(error);
            }
          );

          // Cleanup function will be called when query is invalidated
          return () => unsubscribe();
        } catch (error) {
          console.error("Error setting up notifications listener:", error);
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
 * Hook to get unread notification count in real-time
 */
export function useUnreadNotificationsCount() {
  const { user } = useAuth();

  return useQuery<number>({
    queryKey: ["notifications", "unread-count", user?.id],
    queryFn: () => {
      return new Promise<number>((resolve, reject) => {
        if (!user?.id) {
          resolve(0);
          return;
        }

        try {
          const notificationsRef = collection(db, "notifications");
          const q = query(
            notificationsRef,
            where("userId", "==", user.id),
            where("read", "==", false)
          );

          const unsubscribe: Unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              resolve(snapshot.size);
            },
            (error) => {
              console.error("Error in unread count listener:", error);
              reject(error);
            }
          );

          return () => unsubscribe();
        } catch (error) {
          console.error("Error setting up unread count listener:", error);
          reject(error);
        }
      });
    },
    enabled: !!user?.id,
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: Timestamp.now(),
      });

      return { id: notificationId };
    },
    onSuccess: () => {
      // Real-time listener will auto-update, but invalidate to be safe
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Get all unread notifications
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("userId", "==", user.id),
        where("read", "==", false)
      );

      return new Promise((resolve, reject) => {
        // Get docs once instead of using onSnapshot with { once: true }
        const fetchAndUpdate = async () => {
          try {
            const unsubscribe = onSnapshot(
              q,
              async (snapshot) => {
                unsubscribe(); // Immediately unsubscribe

                if (snapshot.empty) {
                  resolve({ count: 0 });
                  return;
                }

                // Use batch to update multiple documents
                const batch = writeBatch(db);
                snapshot.docs.forEach((docSnap) => {
                  batch.update(docSnap.ref, {
                    read: true,
                    updatedAt: Timestamp.now(),
                  });
                });

                await batch.commit();
                resolve({ count: snapshot.size });
              },
              (error) => {
                unsubscribe();
                reject(error);
              }
            );
          } catch (error) {
            reject(error);
          }
        };

        fetchAndUpdate();
      });
    },
    onSuccess: (data: any) => {
      toast.success(`Marked ${data.count} notification${data.count !== 1 ? 's' : ''} as read`);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    },
  });
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const notificationRef = doc(db, "notifications", notificationId);
      await deleteDoc(notificationRef);

      return { id: notificationId };
    },
    onSuccess: () => {
      toast.success("Notification deleted");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    },
  });
}

/**
 * Hook to delete all read notifications
 */
export function useDeleteReadNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Get all read notifications
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("userId", "==", user.id),
        where("read", "==", true)
      );

      return new Promise((resolve, reject) => {
        // Get docs once instead of using onSnapshot with { once: true }
        const fetchAndDelete = async () => {
          try {
            const unsubscribe = onSnapshot(
              q,
              async (snapshot) => {
                unsubscribe(); // Immediately unsubscribe

                if (snapshot.empty) {
                  resolve({ count: 0 });
                  return;
                }

                // Use batch to delete multiple documents
                const batch = writeBatch(db);
                snapshot.docs.forEach((docSnap) => {
                  batch.delete(docSnap.ref);
                });

                await batch.commit();
                resolve({ count: snapshot.size });
              },
              (error) => {
                unsubscribe();
                reject(error);
              }
            );
          } catch (error) {
            reject(error);
          }
        };

        fetchAndDelete();
      });
    },
    onSuccess: (data: any) => {
      toast.success(`Deleted ${data.count} read notification${data.count !== 1 ? 's' : ''}`);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      console.error("Error deleting read notifications:", error);
      toast.error("Failed to delete read notifications");
    },
  });
}
