"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationItem } from "./NotificationItem";
import {
  useRealtimeNotifications,
  useUnreadNotificationsCount,
  useMarkAllNotificationsAsRead,
  useDeleteReadNotifications,
} from "@/hooks/useRealtimeNotifications";
import { CheckCheck, Trash2, Bell } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

export function NotificationList() {
  const [readFilter, setReadFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch notifications with real-time updates
  const { data: notifications = [], isLoading } = useRealtimeNotifications({
    read: readFilter === "all" ? undefined : readFilter === "read",
    type: typeFilter === "all" ? undefined : typeFilter,
    limit: 50,
  });

  // Get unread count
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const clearReadMutation = useDeleteReadNotifications();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? (
              <>
                You have <span className="font-medium text-blue-600">{unreadCount}</span> unread{" "}
                {unreadCount === 1 ? "notification" : "notifications"}
              </>
            ) : (
              "You're all caught up!"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && notifications.some(n => n.read) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearReadMutation.mutate()}
              disabled={clearReadMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Read Filter */}
        <Select value={readFilter} onValueChange={setReadFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="ticket_assigned">Ticket Assigned</SelectItem>
            <SelectItem value="ticket_resolved">Ticket Resolved</SelectItem>
            <SelectItem value="ticket_updated">Ticket Updated</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <EmptyState
          imageUrl="/no_notifications.svg"
          title="No Notifications"
          description={
            readFilter === "unread"
              ? "You're all caught up! No unread notifications at the moment."
              : "You'll be notified here when tickets are assigned to you or when there are important updates."
          }
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
