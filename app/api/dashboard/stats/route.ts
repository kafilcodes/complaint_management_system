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
 * @note PUBLIC ROUTE - This is an internal-only app with no auth required
 * Query params: ?userId=xxx&role=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // Get user info from query params (since this is now a public route)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const userRole = searchParams.get("role");
    
    console.log("========================================");
    console.log("[Dashboard API] 📊 FETCHING DASHBOARD STATS");
    console.log("========================================");
    console.log("[Dashboard API] Request Params:");
    console.log("  - userId:", userId);
    console.log("  - role:", userRole);
    
    // Determine if user is employee (show only assigned tickets)
    const isEmployee = userRole === "employee";
    const isAdmin = userRole === "admin" || userRole === "full_developer_admin";
    
    console.log("[Dashboard API] Role Checks:");
    console.log("  - isEmployee:", isEmployee);
    console.log("  - isAdmin:", isAdmin);
    
    // Get current date boundaries
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Build base query based on role
    let allTicketsQuery: any = adminDb.collection("tickets");
    let recentTicketsQuery: any = adminDb.collection("tickets");
    
    // For employees, filter by assigned tickets
    if (isEmployee && userId) {
      console.log("[Dashboard API] 🔍 FILTERING for employee:", userId);
      allTicketsQuery = allTicketsQuery.where("assignedTo", "==", userId);
      recentTicketsQuery = recentTicketsQuery.where("assignedTo", "==", userId);
    } else {
      console.log("[Dashboard API] 📋 Fetching ALL tickets (admin/other role)");
    }
    
    // Add ordering and limit for recent tickets
    recentTicketsQuery = recentTicketsQuery
      .orderBy("createdAt", "desc")
      .limit(5);

    // Fetch all tickets (for counts)
    const allTicketsSnapshot = await allTicketsQuery.get();
    const allTickets = allTicketsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("[Dashboard API] 📦 Query Results:");
    console.log("  - Total tickets fetched:", allTickets.length);
    if (isEmployee && allTickets.length > 0) {
      console.log("  - Sample ticket assignedTo:", allTickets[0].assignedTo);
      console.log("  - Request userId:", userId);
      console.log("  - Match:", allTickets[0].assignedTo === userId);
    }

    // Count by status (simplified to open/closed only)
    const openTickets = allTickets.filter((t: any) => t.status === "open").length;
    const closedTickets = allTickets.filter((t: any) => t.status === "closed").length;
    
    console.log("[Dashboard API] 📊 Stats:");
    console.log("  - Open tickets:", openTickets);
    console.log("  - Closed tickets:", closedTickets);
    console.log("========================================");

    // Fetch recent tickets
    const recentTicketsSnapshot = await recentTicketsQuery.get();
    const recentTickets = recentTicketsSnapshot.docs.map((doc: any) => {
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
      // For employees, count when assigned to them
      const assignedAt = t.assignedAt?.toDate?.();
      const dateToCheck = isEmployee ? (assignedAt || createdAt) : createdAt;
      return dateToCheck >= sevenDaysAgo;
    }).length;

    const recentResolvedTickets = allTickets.filter((t: any) => {
      const closedAt = t.closedAt?.toDate?.();
      return closedAt && closedAt >= sevenDaysAgo;
    }).length;

    // Previous 7 days (for comparison)
    const previousNewTickets = allTickets.filter((t: any) => {
      const createdAt = t.createdAt?.toDate?.() || new Date(0);
      const assignedAt = t.assignedAt?.toDate?.();
      const dateToCheck = isEmployee ? (assignedAt || createdAt) : createdAt;
      return dateToCheck >= fourteenDaysAgo && dateToCheck < sevenDaysAgo;
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
