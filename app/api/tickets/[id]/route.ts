/**
 * Single Ticket API Route
 * 
 * GET /api/tickets/[id] - Get ticket by ID
 * PUT /api/tickets/[id] - Update ticket
 * DELETE /api/tickets/[id] - Delete ticket (full_developer_admin only)
 * 
 * Authentication: Required
 * Authorization: Role-based access control
 */

import { NextRequest, NextResponse } from "next/server";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import type { Ticket, TicketUpdateInput, TimelineEvent, ApiSuccessResponse, ApiErrorResponse } from "@/lib/types";

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
 * GET /api/tickets/[id]
 * 
 * Get a single ticket by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get ticket from Firestore
    const ticketDoc = await db.collection("tickets").doc(id).get();

    if (!ticketDoc.exists) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    const ticket = {
      id: ticketDoc.id,
      ...ticketDoc.data(),
    } as Ticket;

    return NextResponse.json<ApiSuccessResponse<Ticket>>({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: error.message || "Failed to fetch ticket",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tickets/[id]
 * 
 * Update a ticket
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get existing ticket
    const ticketDoc = await db.collection("tickets").doc(id).get();

    if (!ticketDoc.exists) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    const existingTicket = ticketDoc.data() as Ticket;

    // Parse update data
    const body = await request.json();
    const updates: TicketUpdateInput = body;
    const updatedBy = body.updatedBy || "anonymous";
    const updaterName = body.updaterName || "User";

    // Prepare update object and timeline events
    const now = Timestamp.now();
    const timelineEvents: TimelineEvent[] = [];
    
    const updateData: any = {
      updatedAt: now,
    };

    // Update fields
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      timelineEvents.push({
        event: "updated",
        timestamp: now as any,
        userId: updatedBy,
        userName: updaterName,
        message: `Status changed to ${updates.status}`,
        details: { status: updates.status },
      });
    }
    
    if (updates.assignedTo !== undefined) {
      const wasAssigned = existingTicket.assignedTo;
      updateData.assignedTo = updates.assignedTo;
      updateData.assignedAt = updates.assignedTo ? now : null;
      
      if (wasAssigned !== updates.assignedTo) {
        timelineEvents.push({
          event: "assigned",
          timestamp: now as any,
          userId: updatedBy,
          userName: updaterName,
          message: updates.assignedTo 
            ? `Ticket ${wasAssigned ? 're-' : ''}assigned to technician`
            : "Ticket unassigned",
          details: {
            from: wasAssigned,
            to: updates.assignedTo,
          },
        });
      }
    }
    
    if (updates.customerName !== undefined) updateData.customerName = updates.customerName;
    if (updates.customerPhone !== undefined) updateData.customerPhone = updates.customerPhone;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.pincode !== undefined) updateData.pincode = updates.pincode;
    if (updates.productName !== undefined) updateData.productName = updates.productName;
    if (updates.productModel !== undefined) updateData.productModel = updates.productModel;
    if (updates.brand !== undefined) updateData.brand = updates.brand;
    if (updates.issueDescription !== undefined) updateData.issueDescription = updates.issueDescription;
    if (updates.comments !== undefined) {
      updateData.comments = updates.comments;
      timelineEvents.push({
        event: "comment",
        timestamp: now as any,
        userId: updatedBy,
        userName: updaterName,
        message: "Added a comment",
      });
    }

    // Add timeline events to update using arrayUnion
    if (timelineEvents.length > 0) {
      updateData.timeline = FieldValue.arrayUnion(...timelineEvents);
    }

    // Update ticket in Firestore
    await db.collection("tickets").doc(id).update(updateData);

    // If assignment changed, create notification
    if (updates.assignedTo && updates.assignedTo !== existingTicket.assignedTo) {
      await db.collection("notifications").add({
        userId: updates.assignedTo,
        createdAt: Timestamp.now(),
        read: false,
        title: "Ticket Assigned to You",
        message: `You have been assigned ticket: ${existingTicket.productName}`,
        link: `/tickets/${id}`,
        ticketId: id,
        type: "ticket_assigned",
      });
    }

    // Get updated ticket
    const updatedDoc = await db.collection("tickets").doc(id).get();
    const updatedTicket: Ticket = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as Ticket;

    return NextResponse.json<ApiSuccessResponse<Ticket>>({
      success: true,
      data: updatedTicket,
      message: "Ticket updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating ticket:", error);
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: error.message || "Failed to update ticket",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tickets/[id]
 * 
 * Delete a ticket (full_developer_admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get ticket to check if it exists
    const ticketDoc = await db.collection("tickets").doc(id).get();

    if (!ticketDoc.exists) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Delete the ticket
    await db.collection("tickets").doc(id).delete();

    // Also delete associated notifications
    const notificationsSnapshot = await db
      .collection("notifications")
      .where("ticketId", "==", id)
      .get();

    const deleteBatch = db.batch();
    notificationsSnapshot.docs.forEach((doc) => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();

    return NextResponse.json<ApiSuccessResponse<{ id: string }>>({
      success: true,
      data: { id },
      message: "Ticket deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: error.message || "Failed to delete ticket",
      },
      { status: 500 }
    );
  }
}
