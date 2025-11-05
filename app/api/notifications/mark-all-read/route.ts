import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin";
import { verifyAuth } from "@/lib/auth";

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await verifyAuth(request);
    if (!authenticated || !user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all unread notifications
    const snapshot = await adminDb
      .collection("notifications")
      .where("userId", "==", user.id)
      .where("read", "==", false)
      .get();

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

    return NextResponse.json({
      success: true,
      message: `Marked ${snapshot.size} notifications as read`,
      updatedCount: snapshot.size,
    });
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
