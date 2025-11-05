/**
 * NOTIFICATIONS PAGE
 * 
 * Displays all notifications for the current user with filtering and actions.
 * 
 * @module app/(app)/notifications/page
 */

"use client";

import { NotificationList } from "@/components/notifications/NotificationList";

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <NotificationList />
    </div>
  );
}
