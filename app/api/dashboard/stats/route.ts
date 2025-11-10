import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";

export interface DashboardStats {
  // Ticket counts by status
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  
  // User-specific stats
  myTickets?: number;
  myAssignedTickets?: number;
  myResolvedTickets?: number;
  
  // Recent activity
  recentTickets: Array<{
    id: string;
    productName: string;
    customerName: string;
    status: string;
    createdAt: string;
    assignedTo: string | null;
  }>;
  
  // Trends (last 7 days vs previous 7 days)
  trends: {
    newTickets: number;
    resolvedTickets: number;
    newTicketsChange: number; // percentage change
    resolvedTicketsChange: number; // percentage change
  };
}

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 * 
 * Returns all tickets (no authentication required)
 */
export async function GET(request: NextRequest) {
  try {
    // Get current date boundaries
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Base queries - show all tickets
    const allTicketsQuery = adminDb.collection("tickets");
    const recentTicketsQuery = adminDb
      .collection("tickets")
      .orderBy("createdAt", "desc")
      .limit(5);

    // Fetch all tickets (for counts)
    const allTicketsSnapshot = await allTicketsQuery.get();
    const allTickets = allTicketsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Count by status
    const openTickets = allTickets.filter((t: any) => t.status === "open").length;
    const closedTickets = allTickets.filter((t: any) => t.status === "closed").length;

    // Fetch recent tickets
    const recentTicketsSnapshot = await recentTicketsQuery.get();
    const recentTickets = recentTicketsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        productName: data.productName,
        customerName: data.customerName,
        status: data.status,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        assignedTo: data.assignedTo || null,
      };
    });

    // Calculate trends (last 7 days)
    const recentNewTickets = allTickets.filter((t: any) => {
      const createdAt = t.createdAt?.toDate?.() || new Date(0);
      return createdAt >= sevenDaysAgo;
    }).length;

    const recentResolvedTickets = allTickets.filter((t: any) => {
      const closedAt = t.closedAt?.toDate?.();
      return closedAt && closedAt >= sevenDaysAgo;
    }).length;

    // Previous 7 days (for comparison)
    const previousNewTickets = allTickets.filter((t: any) => {
      const createdAt = t.createdAt?.toDate?.() || new Date(0);
      return createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo;
    }).length;

    const previousResolvedTickets = allTickets.filter((t: any) => {
      const closedAt = t.closedAt?.toDate?.();
      return closedAt && closedAt >= fourteenDaysAgo && closedAt < sevenDaysAgo;
    }).length;

    // Calculate percentage change
    const newTicketsChange =
      previousNewTickets > 0
        ? ((recentNewTickets - previousNewTickets) / previousNewTickets) * 100
        : recentNewTickets > 0
        ? 100
        : 0;

    const resolvedTicketsChange =
      previousResolvedTickets > 0
        ? ((recentResolvedTickets - previousResolvedTickets) / previousResolvedTickets) * 100
        : recentResolvedTickets > 0
        ? 100
        : 0;

    // Build stats object
    const stats: DashboardStats = {
      totalTickets: allTickets.length,
      openTickets,
      closedTickets,
      recentTickets,
      trends: {
        newTickets: recentNewTickets,
        resolvedTickets: recentResolvedTickets,
        newTicketsChange: Math.round(newTicketsChange * 10) / 10,
        resolvedTicketsChange: Math.round(resolvedTicketsChange * 10) / 10,
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
