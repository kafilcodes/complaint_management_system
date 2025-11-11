import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/store";
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
  const { user } = useAuth();
  
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications", user?.id, options],
    queryFn: async () => {
      console.log('[useNotifications] Fetching notifications for user:', user?.id);
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      const params = new URLSearchParams();
      params.append("userId", user.id);
      
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
        console.error('[useNotifications] Fetch failed:', response.status);
        throw new Error("Failed to fetch notifications");
      }
      const data = await response.json();
      console.log('[useNotifications] Fetched notifications:', data.data?.length || 0);
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
}

/**
 * Hook to fetch unread notification count only
 */
export function useUnreadCount() {
  const { user } = useAuth();
  
  return useQuery<number>({
    queryKey: ["notifications", "unread-count", user?.id],
    queryFn: async () => {
      console.log('[useUnreadCount] Fetching unread count for user:', user?.id);
      
      if (!user?.id) {
        return 0;
      }
      
      const params = new URLSearchParams();
      params.append("userId", user.id);
      params.append("read", "false");
      params.append("limit", "1");
      
      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        console.error('[useUnreadCount] Fetch failed:', response.status);
        throw new Error("Failed to fetch unread count");
      }
      const data = await response.json();
      console.log('[useUnreadCount] Unread count:', data.unreadCount);
      return data.unreadCount || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 15000, // Refetch every 15 seconds
  });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      console.log('[useMarkAsRead] Marking notification as read:', notificationId, 'userId:', user?.id);
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[useMarkAsRead] Failed:', error);
        throw new Error(error.error || "Failed to mark notification as read");
      }

      const data = await response.json();
      console.log('[useMarkAsRead] Success:', data);
      return data;
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      console.log('[useMarkAllAsRead] Marking all notifications as read for user:', user?.id);
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[useMarkAllAsRead] Failed:', error);
        throw new Error(error.error || "Failed to mark all as read");
      }

      const data = await response.json();
      console.log('[useMarkAllAsRead] Success:', data);
      return data;
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      console.log('[useDeleteNotification] Deleting notification:', notificationId, 'userId:', user?.id);
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      const response = await fetch(`/api/notifications/${notificationId}?userId=${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[useDeleteNotification] Failed:', error);
        throw new Error(error.error || "Failed to delete notification");
      }

      const data = await response.json();
      console.log('[useDeleteNotification] Success:', data);
      return data;
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      console.log('[useClearReadNotifications] Clearing read notifications for user:', user?.id);
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      const response = await fetch(`/api/notifications?userId=${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[useClearReadNotifications] Failed:', error);
        throw new Error(error.error || "Failed to clear notifications");
      }

      const data = await response.json();
      console.log('[useClearReadNotifications] Success:', data);
      return data;
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
