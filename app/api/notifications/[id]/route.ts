import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/notifications/[id]
 * Mark a specific notification as read
 * 
 * Body: { userId: string }
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[notifications/[id]:${requestId}] PUT request started`);
  
  try {
    const { id: notificationId } = await context.params;
    const body = await request.json();
    const { userId } = body;

    console.log(`[notifications/[id]:${requestId}] notificationId: ${notificationId}, userId: ${userId}`);

    if (!userId) {
      console.log(`[notifications/[id]:${requestId}] Missing userId in request body`);
      return NextResponse.json(
        { error: "userId is required in request body" },
        { status: 400 }
      );
    }

    // Get notification document
    const notificationRef = adminDb.collection("notifications").doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      console.log(`[notifications/[id]:${requestId}] Notification not found`);
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const notificationData = notificationDoc.data();

    // Verify ownership
    if (notificationData?.userId !== userId) {
      console.log(`[notifications/[id]:${requestId}] Ownership verification failed. Expected: ${notificationData?.userId}, Got: ${userId}`);
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

    console.log(`[notifications/[id]:${requestId}] Successfully marked as read`);

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error: any) {
    console.error(`[notifications/[id]:${requestId}] Error:`, error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a specific notification
 * 
 * Query params: userId=xxx
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[notifications/[id]:${requestId}] DELETE request started`);
  
  try {
    const { id: notificationId } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log(`[notifications/[id]:${requestId}] notificationId: ${notificationId}, userId: ${userId}`);

    if (!userId) {
      console.log(`[notifications/[id]:${requestId}] Missing userId parameter`);
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    // Get notification document
    const notificationRef = adminDb.collection("notifications").doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      console.log(`[notifications/[id]:${requestId}] Notification not found`);
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const notificationData = notificationDoc.data();

    // Verify ownership
    if (notificationData?.userId !== userId) {
      console.log(`[notifications/[id]:${requestId}] Ownership verification failed`);
      return NextResponse.json(
        { error: "Forbidden - You can only delete your own notifications" },
        { status: 403 }
      );
    }

    // Delete notification
    await notificationRef.delete();

    console.log(`[notifications/[id]:${requestId}] Successfully deleted`);

    return NextResponse.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error: any) {
    console.error(`[notifications/[id]:${requestId}] Error:`, error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
