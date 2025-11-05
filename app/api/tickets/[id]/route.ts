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
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { verifyAuth } from "@/lib/auth";
import type { Ticket, TicketUpdateInput, ApiSuccessResponse, ApiErrorResponse } from "@/lib/types";

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
    
    // Verify authentication
    const { authenticated, user, error } = await verifyAuth(request);

    if (!authenticated || !user) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
      );
    }

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

    // Check if user has access to this ticket
    const canView =
      user.role === "it_admin" ||
      user.role === "full_developer_admin" ||
      user.role === "it_technician" ||
      ticket.createdBy === user.id ||
      (user.role === "store_manager" && ticket.storeId === user.storeId);

    if (!canView) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

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
    
    // Verify authentication
    const { authenticated, user, error } = await verifyAuth(request);

    if (!authenticated || !user) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
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

    const existingTicket = ticketDoc.data() as Ticket;

    // Check if user can modify this ticket
    const canModify =
      user.role === "it_admin" ||
      user.role === "full_developer_admin" ||
      (user.role === "it_technician" && existingTicket.assignedTo === user.id) ||
      (existingTicket.createdBy === user.id && existingTicket.status === "open");

    if (!canModify) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Parse update data
    const updates: TicketUpdateInput = await request.json();

    // Prepare update object
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    // Only allow certain fields to be updated based on role
    if (user.role === "it_admin" || user.role === "full_developer_admin") {
      // Admins can update everything
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.assignedTo !== undefined) {
        updateData.assignedTo = updates.assignedTo;
        updateData.assignedAt = updates.assignedTo ? Timestamp.now() : null;
      }
      if (updates.customerName !== undefined) updateData.customerName = updates.customerName;
      if (updates.customerPhone !== undefined) updateData.customerPhone = updates.customerPhone;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.pincode !== undefined) updateData.pincode = updates.pincode;
      if (updates.productName !== undefined) updateData.productName = updates.productName;
      if (updates.productModel !== undefined) updateData.productModel = updates.productModel;
      if (updates.brand !== undefined) updateData.brand = updates.brand;
      if (updates.issueDescription !== undefined) updateData.issueDescription = updates.issueDescription;
      if (updates.comments !== undefined) updateData.comments = updates.comments;
    } else if (user.role === "it_technician") {
      // Technicians can only update status and comments
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.comments !== undefined) updateData.comments = updates.comments;
    } else {
      // Store employees/managers can only update description and comments if ticket is open
      if (updates.issueDescription !== undefined) updateData.issueDescription = updates.issueDescription;
      if (updates.comments !== undefined) updateData.comments = updates.comments;
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
    
    // Verify authentication
    const { authenticated, user, error } = await verifyAuth(request);

    if (!authenticated || !user) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Only full_developer_admin can delete tickets
    if (user.role !== "full_developer_admin") {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Check if ticket exists
    const ticketDoc = await db.collection("tickets").doc(id).get();

    if (!ticketDoc.exists) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Delete ticket
    await db.collection("tickets").doc(id).delete();

    // Delete related resolution if exists
    const resolutionDoc = await db.collection("resolutions").doc(id).get();
    if (resolutionDoc.exists) {
      await db.collection("resolutions").doc(id).delete();
    }

    // Delete related notifications
    const notificationsSnapshot = await db
      .collection("notifications")
      .where("ticketId", "==", id)
      .get();

    const deleteBatch = db.batch();
    notificationsSnapshot.forEach((doc) => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();

    return NextResponse.json<ApiSuccessResponse>({
      success: true,
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
