import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Notification } from "@/app/api/notifications/route";

interface UseNotificationsOptions {
  read?: boolean;
  type?: string;
  limit?: number;
}

interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  unreadCount: number;
}

/**
 * Hook to fetch notifications for the current user
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (options.read !== undefined) {
        params.append("read", String(options.read));
      }
      if (options.type) {
        params.append("type", options.type);
      }
      if (options.limit) {
        params.append("limit", String(options.limit));
      }

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
}

/**
 * Hook to fetch unread notification count only
 */
export function useUnreadCount() {
  return useQuery<number>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await fetch("/api/notifications?read=false&limit=1");
      if (!response.ok) {
        throw new Error("Failed to fetch unread count");
      }
      const data = await response.json();
      return data.unreadCount || 0;
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark notification as read");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate notifications queries to refetch
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      console.error("Error marking notification as read:", error);
      toast.error(error.message || "Failed to mark notification as read");
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark all as read");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      console.error("Error marking all as read:", error);
      toast.error(error.message || "Failed to mark all as read");
    },
  });
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete notification");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Notification deleted");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      console.error("Error deleting notification:", error);
      toast.error(error.message || "Failed to delete notification");
    },
  });
}

/**
 * Hook to clear all read notifications
 */
export function useClearReadNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to clear notifications");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "Read notifications cleared");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      console.error("Error clearing notifications:", error);
      toast.error(error.message || "Failed to clear notifications");
    },
  });
}
