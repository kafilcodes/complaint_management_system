"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Trash2,
  ExternalLink 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarkNotificationAsRead, useDeleteNotification } from "@/hooks/useRealtimeNotifications";
import type { Notification } from "@/lib/types";

interface NotificationItemProps {
  notification: Notification;
  showActions?: boolean;
}

const notificationIcons = {
  ticket_assigned: Bell,
  ticket_resolved: CheckCircle,
  ticket_updated: AlertCircle,
  system: Info,
};

const notificationColors = {
  ticket_assigned: "text-blue-500",
  ticket_resolved: "text-green-500",
  ticket_updated: "text-orange-500",
  system: "text-gray-500",
};

export function NotificationItem({ notification, showActions = true }: NotificationItemProps) {
  const markAsReadMutation = useMarkNotificationAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const Icon = notificationIcons[notification.type] || Bell;
  const iconColor = notificationColors[notification.type] || "text-gray-500";

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!notification.read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteNotificationMutation.mutateAsync(notification.id);
  };

  const getTimeAgo = () => {
    try {
      const date = notification.createdAt instanceof Date 
        ? notification.createdAt 
        : new Date(notification.createdAt as any);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border transition-colors hover:bg-muted/50",
        !notification.read && "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
      )}
    >
      {/* Icon */}
      <div className={cn("mt-1", iconColor)}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-medium text-sm">{notification.title}</p>
            {!notification.read && (
              <Badge variant="secondary" className="text-xs ml-2">
                New
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {getTimeAgo()}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>

        {notification.link && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <span>View details</span>
            <ExternalLink className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-1">
          {!notification.read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleMarkAsRead}
              disabled={markAsReadMutation.isPending}
            >
              <CheckCircle className="h-4 w-4" />
              <span className="sr-only">Mark as read</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleteNotificationMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      )}
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} className="block" onClick={handleMarkAsRead}>
        {content}
      </Link>
    );
  }

  return content;
}
