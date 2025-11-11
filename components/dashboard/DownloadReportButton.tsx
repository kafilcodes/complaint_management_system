/**
 * DOWNLOAD REPORT BUTTON COMPONENT
 * 
 * Generates and downloads a comprehensive PDF report of ticket statistics.
 * Uses @react-pdf/renderer for client-side PDF generation.
 * 
 * @module components/dashboard/DownloadReportButton
 */

"use client";

import React, { useState, useMemo } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { TicketReport, type TicketReportData } from "@/components/pdf/TicketReport";
import type { Ticket } from "@/lib/types";
import type { DashboardStats } from "@/app/api/dashboard/stats/route";
import { useUsers } from "@/hooks/useUsers";
import { Timestamp } from "firebase/firestore";

interface DownloadReportButtonProps {
  stats: DashboardStats;
  tickets: Ticket[];
}

/**
 * Download Report Button
 * 
 * Generates a PDF report with ticket statistics, charts, and details
 */
export function DownloadReportButton({ stats, tickets }: DownloadReportButtonProps) {
  const [isClient, setIsClient] = useState(false);
  const { data: users = [] } = useUsers();

  // Ensure component only renders on client side
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Prepare report data
  const reportData = useMemo<TicketReportData>(() => {
    // Get app name from environment or default
    const appName = process.env.NEXT_PUBLIC_APP_NAME || "ServiceFirst";

    // Calculate brand breakdown
    const brandCounts: Record<string, number> = {};
    tickets.forEach((ticket) => {
      const brand = ticket.brand || "Unknown";
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });

    const brandBreakdown = Object.entries(brandCounts)
      .map(([brand, count]) => ({
        brand,
        count,
        percentage: Math.round((count / tickets.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Prepare tickets list with user names
    const ticketsWithNames = tickets
      .slice(0, 50) // Limit to 50 for PDF size
      .map((ticket) => {
        const assignedUser = ticket.assignedTo
          ? users.find((u) => u.id === ticket.assignedTo)
          : null;

        // Convert createdAt to ISO string
        let createdAtString: string;
        if (typeof ticket.createdAt === "string") {
          createdAtString = ticket.createdAt;
        } else if (ticket.createdAt instanceof Date) {
          createdAtString = ticket.createdAt.toISOString();
        } else if (ticket.createdAt && typeof (ticket.createdAt as Timestamp).toDate === "function") {
          createdAtString = (ticket.createdAt as Timestamp).toDate().toISOString();
        } else {
          createdAtString = new Date().toISOString();
        }

        return {
          id: ticket.id,
          productName: ticket.productName,
          customerName: ticket.customerName,
          status: ticket.status,
          brand: ticket.brand,
          createdAt: createdAtString,
          assignedToName: assignedUser?.name || null,
        };
      });

    return {
      generatedAt: new Date().toISOString(),
      appName,
      totalTickets: stats.totalTickets,
      openTickets: stats.openTickets,
      closedTickets: stats.closedTickets,
      newThisWeek: stats.trends.newTickets,
      resolvedThisWeek: stats.trends.resolvedTickets,
      newTicketsChange: stats.trends.newTicketsChange,
      tickets: ticketsWithNames,
      brandBreakdown,
    };
  }, [stats, tickets, users]);

  // Generate filename with timestamp
  const fileName = `ticket-report-${new Date().toISOString().split("T")[0]}.pdf`;

  // Don't render on server side (PDFDownloadLink requires client)
  if (!isClient) {
    return (
      <Button disabled variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Download Report
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<TicketReport data={reportData} />}
      fileName={fileName}
    >
      {({ blob, url, loading, error }) => (
        <Button
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Report
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
