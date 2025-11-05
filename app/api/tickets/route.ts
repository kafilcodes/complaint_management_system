/**
 * Tickets API Route
 * 
 * GET /api/tickets - List all tickets (with filters and pagination)
 * POST /api/tickets - Create a new ticket
 * 
 * Authentication: Required
 * Authorization: Role-based access control
 */

import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin";
import { verifyAuth } from "@/lib/auth";
import type { Ticket, TicketCreateInput, ApiSuccessResponse, ApiErrorResponse } from "@/lib/types";

// Using adminDb from @/firebase/admin which handles initialization

/**
 * GET /api/tickets
 * 
 * List tickets based on user role and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await verifyAuth(request);

    if (!authenticated || !user) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const brand = searchParams.get("brand");
    const assignedTo = searchParams.get("assignedTo");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build query based on user role
    let query = adminDb.collection("tickets");

    // Role-based filtering
    if (user.role === "store_employee") {
      // Store employees can only see their own tickets
      query = query.where("createdBy", "==", user.id) as any;
    } else if (user.role === "store_manager") {
      // Store managers can see all tickets from their store
      if (user.storeId) {
        query = query.where("storeId", "==", user.storeId) as any;
      }
    } else if (user.role === "it_technician") {
      // Technicians can see assigned tickets
      if (assignedTo === user.id || !assignedTo) {
        query = query.where("assignedTo", "==", user.id) as any;
      }
    }
    // IT Admin and Full Developer Admin can see all tickets

    // Apply filters
    if (status) {
      query = query.where("status", "==", status) as any;
    }

    if (brand) {
      query = query.where("brand", "==", brand) as any;
    }

    if (assignedTo && (user.role === "it_admin" || user.role === "full_developer_admin")) {
      query = query.where("assignedTo", "==", assignedTo) as any;
    }

    // Order by creation date (newest first)
    query = query.orderBy("createdAt", "desc").limit(limit) as any;

    // Execute query
    const snapshot = await query.get();
    const tickets: Ticket[] = [];

    snapshot.forEach((doc) => {
      tickets.push({
        id: doc.id,
        ...doc.data(),
      } as Ticket);
    });

    return NextResponse.json<ApiSuccessResponse<Ticket[]>>({
      success: true,
      data: tickets,
    });
  } catch (error: any) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: error.message || "Failed to fetch tickets",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets
 * 
 * Create a new ticket
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await verifyAuth(request);

    if (!authenticated || !user) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Only admins and store employees can create tickets
    if (user.role === "it_technician") {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Technicians cannot create tickets" },
        { status: 403 }
      );
    }

    // Parse request body
    const data: TicketCreateInput = await request.json();

    // Validate required fields
    if (!data.customerName || !data.customerPhone || !data.productName || !data.issueDescription) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prepare ticket document
    const ticketData: Omit<Ticket, "id"> = {
      status: "open",
      createdAt: Timestamp.now() as any,
      createdBy: user.id,
      assignedTo: data.assignedTo || null,
      assignedAt: data.assignedTo ? (Timestamp.now() as any) : null,
      closedAt: null,
      
      // Customer Information
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      address: data.address || "",
      pincode: data.pincode || "",
      
      // Product Information
      productName: data.productName,
      productModel: data.productModel || "",
      purchaseDate: data.purchaseDate ? (Timestamp.fromDate(new Date(data.purchaseDate)) as any) : (Timestamp.now() as any),
      brand: data.brand || "",
      
      // Issue Details
      issueDescription: data.issueDescription,
      comments: data.comments || null,
    };

    // Add ticket to Firestore
    const ticketRef = await adminDb.collection("tickets").add(ticketData);

    // Create notification if ticket is assigned
    if (ticketData.assignedTo) {
      await adminDb.collection("notifications").add({
        userId: ticketData.assignedTo,
        createdAt: Timestamp.now(),
        read: false,
        title: "New Ticket Assigned",
        message: `You have been assigned a new ticket: ${data.productName}`,
        link: `/tickets/${ticketRef.id}`,
        ticketId: ticketRef.id,
        type: "ticket_assigned",
      });
    }

    // Return created ticket
    const createdTicket: Ticket = {
      id: ticketRef.id,
      ...ticketData,
    };

    return NextResponse.json<ApiSuccessResponse<Ticket>>(
      {
        success: true,
        data: createdTicket,
        message: "Ticket created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating ticket:", error);
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: error.message || "Failed to create ticket",
      },
      { status: 500 }
    );
  }
}
