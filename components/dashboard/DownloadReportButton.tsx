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
    
    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

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

    // Helper function to convert ticket date
    const getTicketDate = (ticket: Ticket): Date => {
      if (typeof ticket.createdAt === "string") {
        return new Date(ticket.createdAt);
      } else if (ticket.createdAt instanceof Date) {
        return ticket.createdAt;
      } else if (ticket.createdAt && typeof (ticket.createdAt as Timestamp).toDate === "function") {
        return (ticket.createdAt as Timestamp).toDate();
      }
      return new Date();
    };

    // Filter tickets for current month
    const monthTickets = tickets.filter((ticket) => {
      const ticketDate = getTicketDate(ticket);
      return ticketDate.getMonth() === currentMonth && ticketDate.getFullYear() === currentYear;
    });

    // Filter tickets for current year
    const yearTickets = tickets.filter((ticket) => {
      const ticketDate = getTicketDate(ticket);
      return ticketDate.getFullYear() === currentYear;
    });

    // Prepare tickets list with user names (recent 30)
    const prepareTicketData = (ticketsList: Ticket[], limit: number = 30) => {
      return ticketsList.slice(0, limit).map((ticket) => {
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
    };

    return {
      generatedAt: new Date().toISOString(),
      appName,
      totalTickets: stats.totalTickets,
      openTickets: stats.openTickets,
      closedTickets: stats.closedTickets,
      newThisWeek: stats.trends.newTickets,
      resolvedThisWeek: stats.trends.resolvedTickets,
      newTicketsChange: stats.trends.newTicketsChange,
      tickets: prepareTicketData(tickets, 30),
      brandBreakdown,
      // Monthly data
      monthlyStats: {
        total: monthTickets.length,
        open: monthTickets.filter((t) => t.status === "open").length,
        closed: monthTickets.filter((t) => t.status === "closed").length,
        tickets: prepareTicketData(monthTickets, 20),
      },
      // Yearly data
      yearlyStats: {
        total: yearTickets.length,
        open: yearTickets.filter((t) => t.status === "open").length,
        closed: yearTickets.filter((t) => t.status === "closed").length,
        tickets: prepareTicketData(yearTickets, 30),
      },
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
          className="gap-2 hover:bg-primary hover:text-primary-foreground hover:border-primary group transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 group-hover:text-inherit transition-colors" />
              Download Report
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
