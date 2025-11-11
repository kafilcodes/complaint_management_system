import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin";

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for a user
 * 
 * Body: { userId: string }
 */
export async function PUT(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[notifications/mark-all-read:${requestId}] PUT request started`);
  
  try {
    const body = await request.json();
    const { userId } = body;

    console.log(`[notifications/mark-all-read:${requestId}] userId: ${userId}`);

    if (!userId) {
      console.log(`[notifications/mark-all-read:${requestId}] Missing userId in request body`);
      return NextResponse.json(
        { error: "userId is required in request body" },
        { status: 400 }
      );
    }

    // Get all unread notifications
    const snapshot = await adminDb
      .collection("notifications")
      .where("userId", "==", userId)
      .where("read", "==", false)
      .get();

    console.log(`[notifications/mark-all-read:${requestId}] Found ${snapshot.size} unread notifications`);

    // Update in batch
    const batch = adminDb.batch();
    const now = Timestamp.now();
    
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        readAt: now,
      });
    });

    await batch.commit();

    console.log(`[notifications/mark-all-read:${requestId}] Successfully marked ${snapshot.size} notifications as read`);

    return NextResponse.json({
      success: true,
      message: `Marked ${snapshot.size} notifications as read`,
      updatedCount: snapshot.size,
    });
  } catch (error: any) {
    console.error(`[notifications/mark-all-read:${requestId}] Error:`, error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
