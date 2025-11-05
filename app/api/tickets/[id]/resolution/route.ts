import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { adminDb } from "@/firebase/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tickets/[id]/resolution
 * Fetch resolution details for a ticket
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: ticketId } = await context.params;

    // Verify authentication
    const { authenticated, user, error } = await verifyAuth(request);
    if (!authenticated || !user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch resolution document
    const resolutionDoc = await adminDb
      .collection("resolutions")
      .doc(ticketId)
      .get();

    if (!resolutionDoc.exists) {
      return NextResponse.json(
        { error: "Resolution not found" },
        { status: 404 }
      );
    }

    const resolutionData = resolutionDoc.data();

    // Optionally check permissions (admins can see all, users can see their own tickets)
    // For now, allowing all authenticated users to see resolutions
    // You could add ticket ownership check here if needed

    return NextResponse.json({
      success: true,
      resolution: {
        id: resolutionDoc.id,
        ...resolutionData,
      },
    });
  } catch (error: any) {
    console.error("Error fetching resolution:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
