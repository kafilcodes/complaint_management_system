import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin";

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
 * List all notifications for a user
 * 
 * Query params:
 * - userId: user ID (required)
 * - read: filter by read status (true/false)
 * - limit: number of notifications to return (default: 50)
 * - type: filter by notification type
 */
export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[notifications:${requestId}] GET request started`);
  
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const readFilter = searchParams.get("read");
    const limitParam = searchParams.get("limit");
    const typeFilter = searchParams.get("type");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    console.log(`[notifications:${requestId}] Query params:`, { userId, readFilter, limit, typeFilter });

    if (!userId) {
      console.log(`[notifications:${requestId}] Missing userId parameter`);
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    // Build query
    let query = adminDb
      .collection("notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit);

    console.log(`[notifications:${requestId}] Building query for userId: ${userId}`);

    // Apply filters
    if (readFilter !== null) {
      const isRead = readFilter === "true";
      query = query.where("read", "==", isRead) as any;
      console.log(`[notifications:${requestId}] Applied read filter: ${isRead}`);
    }

    if (typeFilter) {
      query = query.where("type", "==", typeFilter) as any;
      console.log(`[notifications:${requestId}] Applied type filter: ${typeFilter}`);
    }

    // Execute query
    const snapshot = await query.get();
    console.log(`[notifications:${requestId}] Query returned ${snapshot.size} notifications`);

    // Transform documents
    const notifications: Notification[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];

    // Count unread notifications
    const unreadSnapshot = await adminDb
      .collection("notifications")
      .where("userId", "==", userId)
      .where("read", "==", false)
      .count()
      .get();

    const unreadCount = unreadSnapshot.data().count;
    console.log(`[notifications:${requestId}] Unread count: ${unreadCount}`);

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error(`[notifications:${requestId}] Error:`, error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Clear all read notifications for a user
 * 
 * Query params:
 * - userId: user ID (required)
 */
export async function DELETE(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[notifications:${requestId}] DELETE request started`);
  
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log(`[notifications:${requestId}] userId: ${userId}`);

    if (!userId) {
      console.log(`[notifications:${requestId}] Missing userId parameter`);
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    // Get all read notifications
    const snapshot = await adminDb
      .collection("notifications")
      .where("userId", "==", userId)
      .where("read", "==", true)
      .get();

    console.log(`[notifications:${requestId}] Found ${snapshot.size} read notifications to delete`);

    // Delete in batch
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    console.log(`[notifications:${requestId}] Successfully deleted ${snapshot.size} notifications`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${snapshot.size} read notifications`,
      deletedCount: snapshot.size,
    });
  } catch (error: any) {
    console.error(`[notifications:${requestId}] Error:`, error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
