import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin";
import { verifyAuth } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/notifications/[id]
 * Mark a specific notification as read
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: notificationId } = await context.params;

    // Verify authentication
    const { authenticated, user, error } = await verifyAuth(request);
    if (!authenticated || !user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Get notification document
    const notificationRef = adminDb.collection("notifications").doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const notificationData = notificationDoc.data();

    // Verify ownership
    if (notificationData?.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only modify your own notifications" },
        { status: 403 }
      );
    }

    // Update notification
    await notificationRef.update({
      read: true,
      readAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a specific notification
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: notificationId } = await context.params;

    // Verify authentication
    const { authenticated, user, error } = await verifyAuth(request);
    if (!authenticated || !user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Get notification document
    const notificationRef = adminDb.collection("notifications").doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const notificationData = notificationDoc.data();

    // Verify ownership
    if (notificationData?.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only delete your own notifications" },
        { status: 403 }
      );
    }

    // Delete notification
    await notificationRef.delete();

    return NextResponse.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
