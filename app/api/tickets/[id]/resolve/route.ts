/**
 * Ticket Resolution API Route
 * 
 * POST /api/tickets/[id]/resolve
 * 
 * Submit a resolution for a ticket (technicians only).
 * Uploads images to Firebase Storage and creates resolution document.
 */

import { NextRequest, NextResponse } from "next/server";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { verifyAuth } from "@/lib/auth";
import type { ApiSuccessResponse, ApiErrorResponse, TimelineEvent } from "@/lib/types";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

/**
 * POST /api/tickets/[id]/resolve
 * 
 * Submit ticket resolution
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const { authenticated, user, error } = await verifyAuth(request);

    if (!authenticated || !user) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Only technicians and admins can resolve tickets
    if (
      user.role !== "it_technician" &&
      user.role !== "it_admin" &&
      user.role !== "full_developer_admin"
    ) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Only technicians can resolve tickets" },
        { status: 403 }
      );
    }

    // Get existing ticket
    const ticketDoc = await db.collection("tickets").doc(id).get();

    if (!ticketDoc.exists) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    const ticket = ticketDoc.data();

    // Check if technician is assigned to this ticket
    if (user.role === "it_technician" && ticket?.assignedTo !== user.id) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "You are not assigned to this ticket" },
        { status: 403 }
      );
    }

    // Check if ticket is already closed
    if (ticket?.status === "closed") {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Ticket is already closed" },
        { status: 400 }
      );
    }

    // Parse resolution data from request body
    const data = await request.json();

    // Validate required fields
    if (!data.productSerial || !data.serviceRating) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Product serial and service rating are required" },
        { status: 400 }
      );
    }

    // Prepare resolution document
    const resolutionData = {
      ticketId: id,
      resolvedBy: user.id,
      resolvedAt: Timestamp.now(),
      productSerial: data.productSerial,
      serviceRating: data.serviceRating,
      feedbackText: data.feedbackText || null,
      productImageURL: data.productImageURL || null,
      warrantyCardURL: data.warrantyCardURL || null,
      partConsumedImageURL: data.partConsumedImageURL || null,
    };

    // Create resolution document
    await db.collection("resolutions").doc(id).set(resolutionData);

    // Create timeline event for resolution
    const now = Timestamp.now();
    const resolvedEvent: TimelineEvent = {
      event: "resolved",
      timestamp: now as any, // Firebase Admin Timestamp
      userId: user.id,
      userName: user.name,
      message: `Ticket resolved by ${user.name}`,
      details: {
        serviceRating: data.serviceRating,
        productSerial: data.productSerial,
      },
    };

    // Update ticket status to closed and add timeline event
    await db.collection("tickets").doc(id).update({
      status: "closed",
      closedAt: now,
      updatedAt: now,
      timeline: FieldValue.arrayUnion(resolvedEvent),
    });

    // Create notification for ticket creator
    if (ticket?.createdBy) {
      await db.collection("notifications").add({
        userId: ticket.createdBy,
        createdAt: Timestamp.now(),
        read: false,
        title: "Ticket Resolved",
        message: `Your ticket has been resolved by the technician`,
        link: `/tickets/${id}`,
        ticketId: id,
        type: "ticket_resolved",
      });
    }

    // Return success response
    return NextResponse.json<ApiSuccessResponse>({
      success: true,
      message: "Ticket resolved successfully",
      data: {
        ticketId: id,
        resolution: resolutionData,
      },
    });
  } catch (error: any) {
    console.error("Error resolving ticket:", error);
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: error.message || "Failed to resolve ticket",
      },
      { status: 500 }
    );
  }
}
