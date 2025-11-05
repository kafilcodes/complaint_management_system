import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin";
import { verifyAuth } from "@/lib/auth";

export interface Notification {
  id: string;
  userId: string;
  type: "ticket_assigned" | "ticket_resolved" | "ticket_updated" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date | Timestamp;
  link?: string;
  ticketId?: string;
}

/**
 * GET /api/notifications
 * List all notifications for the authenticated user
 * 
 * Query params:
 * - read: filter by read status (true/false)
 * - limit: number of notifications to return (default: 50)
 * - type: filter by notification type
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await verifyAuth(request);
    if (!authenticated || !user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const readFilter = searchParams.get("read");
    const limitParam = searchParams.get("limit");
    const typeFilter = searchParams.get("type");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    // Build query
    let query = adminDb
      .collection("notifications")
      .where("userId", "==", user.id)
      .orderBy("createdAt", "desc")
      .limit(limit);

    // Apply filters
    if (readFilter !== null) {
      const isRead = readFilter === "true";
      query = query.where("read", "==", isRead) as any;
    }

    if (typeFilter) {
      query = query.where("type", "==", typeFilter) as any;
    }

    // Execute query
    const snapshot = await query.get();

    // Transform documents
    const notifications: Notification[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];

    // Count unread notifications
    const unreadSnapshot = await adminDb
      .collection("notifications")
      .where("userId", "==", user.id)
      .where("read", "==", false)
      .count()
      .get();

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount: unreadSnapshot.data().count,
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Clear all read notifications for the authenticated user
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await verifyAuth(request);
    if (!authenticated || !user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all read notifications
    const snapshot = await adminDb
      .collection("notifications")
      .where("userId", "==", user.id)
      .where("read", "==", true)
      .get();

    // Delete in batch
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Deleted ${snapshot.size} read notifications`,
      deletedCount: snapshot.size,
    });
  } catch (error: any) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
