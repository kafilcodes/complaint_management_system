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
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin";
import type { Ticket, TicketCreateInput, TimelineEvent, ApiSuccessResponse, ApiErrorResponse } from "@/lib/types";

// Using adminDb from @/firebase/admin which handles initialization

/**
 * GET /api/tickets
 * 
 * List tickets based on user role and filters
 */
export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[tickets:${requestId}] GET request started`);
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const brand = searchParams.get("brand");
    const assignedTo = searchParams.get("assignedTo");
    const limit = parseInt(searchParams.get("limit") || "20");

    console.log(`[tickets:${requestId}] Query params:`, { status, brand, assignedTo, limit });

    // Build query
    let query = adminDb.collection("tickets");

    // Apply filters
    if (status) {
      query = query.where("status", "==", status) as any;
      console.log(`[tickets:${requestId}] Applied status filter: ${status}`);
    }

    if (brand) {
      query = query.where("brand", "==", brand) as any;
      console.log(`[tickets:${requestId}] Applied brand filter: ${brand}`);
    }

    if (assignedTo) {
      query = query.where("assignedTo", "==", assignedTo) as any;
      console.log(`[tickets:${requestId}] Applied assignedTo filter: ${assignedTo}`);
    }

    // Order by creation date (newest first)
    query = query.orderBy("createdAt", "desc").limit(limit) as any;

    // Execute query
    const snapshot = await query.get();
    console.log(`[tickets:${requestId}] Query returned ${snapshot.size} tickets`);
    
    const tickets: Ticket[] = [];

    snapshot.forEach((doc) => {
      tickets.push({
        id: doc.id,
        ...doc.data(),
      } as Ticket);
    });

    console.log(`[tickets:${requestId}] Successfully fetched ${tickets.length} tickets`);

    return NextResponse.json<ApiSuccessResponse<Ticket[]>>({
      success: true,
      data: tickets,
    });
  } catch (error: any) {
    console.error(`[tickets:${requestId}] Error:`, error);
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
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[tickets:${requestId}] POST request started`);
  
  try {
    // Parse request body
    const body = await request.json();
    const data: TicketCreateInput = body;
    const createdBy = body.createdBy || null;
    const creatorName = body.creatorName || "User";

    console.log(`[tickets:${requestId}] Creating ticket:`, {
      customerName: data.customerName,
      productName: data.productName,
      createdBy,
      assignedTo: data.assignedTo,
    });

    // Validate required fields
    if (!data.customerName || !data.customerPhone || !data.productName || !data.issueDescription) {
      console.log(`[tickets:${requestId}] Validation failed: missing required fields`);
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch creator user data for denormalization
    let createdByUserName = creatorName;
    let createdByUserEmail = "";
    if (createdBy) {
      try {
        const creatorDoc = await adminDb.collection("users").doc(createdBy).get();
        if (creatorDoc.exists) {
          const creatorData = creatorDoc.data();
          createdByUserName = creatorData?.name || creatorName;
          createdByUserEmail = creatorData?.email || "";
        }
      } catch (err) {
        console.warn(`[tickets:${requestId}] Could not fetch creator data, using defaults`);
      }
    }

    // Fetch assignee user data for denormalization
    let assignedToUserName: string | null = null;
    let assignedToUserEmail: string | null = null;
    if (data.assignedTo) {
      try {
        const assigneeDoc = await adminDb.collection("users").doc(data.assignedTo).get();
        if (assigneeDoc.exists) {
          const assigneeData = assigneeDoc.data();
          assignedToUserName = assigneeData?.name || null;
          assignedToUserEmail = assigneeData?.email || null;
          
          // Update assignee's ticket count
          await adminDb.collection("users").doc(data.assignedTo).update({
            ticketCount: FieldValue.increment(1),
            lastActivity: Timestamp.now(),
          });
        }
      } catch (err) {
        console.warn(`[tickets:${requestId}] Could not fetch assignee data, using null`);
      }
    }

    // Update creator's ticket count if exists
    if (createdBy) {
      try {
        await adminDb.collection("users").doc(createdBy).update({
          ticketCount: FieldValue.increment(1),
          lastActivity: Timestamp.now(),
        });
      } catch (err) {
        console.warn(`[tickets:${requestId}] Could not update creator ticket count`);
      }
    }

    // Prepare ticket document
    const now = Timestamp.now();
    
    // Create initial timeline event
    const initialTimelineEvent: TimelineEvent = {
      event: "created",
      timestamp: now as any,
      userId: createdBy || "anonymous",
      userName: creatorName,
      message: `Ticket created`,
    };
    
    // Add assignment event if ticket is assigned
    const timelineEvents: TimelineEvent[] = [initialTimelineEvent];
    
    if (data.assignedTo) {
      timelineEvents.push({
        event: "assigned",
        timestamp: now as any,
        userId: createdBy || "anonymous",
        userName: creatorName,
        message: `Ticket assigned to technician`,
        details: {
          assignedTo: data.assignedTo,
        },
      });
    }
    
    const ticketData: Omit<Ticket, "id"> = {
      status: "open",
      createdAt: now as any,
      createdBy: createdBy,
      assignedTo: data.assignedTo || null,
      assignedAt: data.assignedTo ? (now as any) : null,
      closedAt: null,
      
      // Denormalized User Data (for performance)
      createdByUserName,
      createdByUserEmail,
      assignedToUserName,
      assignedToUserEmail,
      
      // Customer Information
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      address: data.address || "",
      pincode: data.pincode || "",
      
      // Product Information
      productName: data.productName,
      productModel: data.productModel || "",
      purchaseDate: data.purchaseDate ? (Timestamp.fromDate(new Date(data.purchaseDate)) as any) : (now as any),
      brand: data.brand || "",
      
      // Issue Details
      issueDescription: data.issueDescription,
      comments: data.comments || null,
      
      // Timeline
      timeline: timelineEvents,
    };

    // Add ticket to Firestore
    const ticketRef = await adminDb.collection("tickets").add(ticketData);
    console.log(`[tickets:${requestId}] Ticket created with ID: ${ticketRef.id}`);

    // Create notification if ticket is assigned (with denormalized data)
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
        // Denormalized data
        ticketTitle: `${data.productName} - ${data.brand}`,
        ticketBrand: data.brand,
        assignedUserName: assignedToUserName || undefined,
      });
      console.log(`[tickets:${requestId}] Notification created for assignee: ${ticketData.assignedTo}`);
    }

    // Return created ticket
    const createdTicket: Ticket = {
      id: ticketRef.id,
      ...ticketData,
    };

    console.log(`[tickets:${requestId}] Successfully created ticket ${ticketRef.id}`);

    return NextResponse.json<ApiSuccessResponse<Ticket>>(
      {
        success: true,
        data: createdTicket,
        message: "Ticket created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(`[tickets:${requestId}] Error:`, error);
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: error.message || "Failed to create ticket",
      },
      { status: 500 }
    );
  }
}
