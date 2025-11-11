import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tickets/[id]/resolution
 * Fetch resolution details for a ticket
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[tickets/[id]/resolution:${requestId}] GET request started`);
  
  try {
    const { id: ticketId } = await context.params;

    console.log(`[tickets/[id]/resolution:${requestId}] ticketId: ${ticketId}`);

    // Fetch resolution document
    const resolutionDoc = await adminDb
      .collection("resolutions")
      .doc(ticketId)
      .get();

    if (!resolutionDoc.exists) {
      console.log(`[tickets/[id]/resolution:${requestId}] Resolution not found`);
      return NextResponse.json(
        { error: "Resolution not found" },
        { status: 404 }
      );
    }

    const resolutionData = resolutionDoc.data();
    console.log(`[tickets/[id]/resolution:${requestId}] Resolution found for ticket ${ticketId}`);

    return NextResponse.json({
      success: true,
      resolution: {
        id: resolutionDoc.id,
        ...resolutionData,
      },
    });
  } catch (error: any) {
    console.error(`[tickets/[id]/resolution:${requestId}] Error:`, error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
