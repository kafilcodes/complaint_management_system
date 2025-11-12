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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Download, Loader2, ChevronDown, Calendar, Check } from "lucide-react";
import { TicketReport, type TicketReportData } from "@/components/pdf/TicketReport";
import type { Ticket } from "@/lib/types";
import type { DashboardStats } from "@/app/api/dashboard/stats/route";
import { useUsers } from "@/hooks/useUsers";
import { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface DownloadReportButtonProps {
  stats: DashboardStats;
  tickets: Ticket[];
}

type TimePeriod = "week" | "month" | "year" | "all";

interface PeriodOption {
  value: TimePeriod;
  label: string;
  icon: string;
}

/**
 * Download Report Button
 * 
 * Generates a PDF report with ticket statistics, charts, and details
 * Supports filtering by time period: This Week, This Month, This Year, or All Time
 */
export function DownloadReportButton({ stats, tickets }: DownloadReportButtonProps) {
  const [isClient, setIsClient] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: users = [] } = useUsers();

  const periodOptions: PeriodOption[] = [
    { value: "week", label: "This Week", icon: "📅" },
    { value: "month", label: "This Month", icon: "📆" },
    { value: "year", label: "This Year", icon: "🗓️" },
    { value: "all", label: "All Time", icon: "📊" },
  ];

  // Ensure component only renders on client side
  React.useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Filter tickets based on selected time period
  const filteredTickets = useMemo(() => {
    const now = new Date();
    
    switch (selectedPeriod) {
      case "week": {
        // Get start of current week (Sunday)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        return tickets.filter((ticket) => {
          const ticketDate = getTicketDate(ticket);
          return ticketDate >= startOfWeek;
        });
      }
      
      case "month": {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return tickets.filter((ticket) => {
          const ticketDate = getTicketDate(ticket);
          return ticketDate.getMonth() === currentMonth && ticketDate.getFullYear() === currentYear;
        });
      }
      
      case "year": {
        const currentYear = now.getFullYear();
        
        return tickets.filter((ticket) => {
          const ticketDate = getTicketDate(ticket);
          return ticketDate.getFullYear() === currentYear;
        });
      }
      
      case "all":
      default:
        return tickets;
    }
  }, [tickets, selectedPeriod]);

  // Calculate stats based on filtered tickets
  const filteredStats = useMemo(() => {
    const openCount = filteredTickets.filter((t) => t.status === "open").length;
    const closedCount = filteredTickets.filter((t) => t.status === "closed").length;
    
    return {
      totalTickets: filteredTickets.length,
      openTickets: openCount,
      closedTickets: closedCount,
    };
  }, [filteredTickets]);

  // Prepare report data
  const reportData = useMemo<TicketReportData>(() => {
    // Get app name from environment or default
    const appName = process.env.NEXT_PUBLIC_APP_NAME || "MParekh";
    
    // Get current date info
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate brand breakdown from filtered tickets
    const brandCounts: Record<string, number> = {};
    filteredTickets.forEach((ticket) => {
      const brand = ticket.brand || "Unknown";
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });

    const brandBreakdown = Object.entries(brandCounts)
      .map(([brand, count]) => ({
        brand,
        count,
        percentage: filteredTickets.length > 0 ? Math.round((count / filteredTickets.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Filter tickets for current month (from all tickets, not filtered)
    const monthTickets = tickets.filter((ticket) => {
      const ticketDate = getTicketDate(ticket);
      return ticketDate.getMonth() === currentMonth && ticketDate.getFullYear() === currentYear;
    });

    // Filter tickets for current year (from all tickets, not filtered)
    const yearTickets = tickets.filter((ticket) => {
      const ticketDate = getTicketDate(ticket);
      return ticketDate.getFullYear() === currentYear;
    });

    // Prepare tickets list with user names
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
      totalTickets: filteredStats.totalTickets,
      openTickets: filteredStats.openTickets,
      closedTickets: filteredStats.closedTickets,
      newThisWeek: stats.trends.newTickets,
      resolvedThisWeek: stats.trends.resolvedTickets,
      newTicketsChange: stats.trends.newTicketsChange,
      tickets: prepareTicketData(filteredTickets, 30),
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
  }, [filteredStats, filteredTickets, stats.trends, tickets, users]);

  // Generate filename with timestamp and period
  const fileName = `ticket-report-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.pdf`;

  const selectedPeriodLabel = periodOptions.find((p) => p.value === selectedPeriod)?.label || "All Time";

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 hover:bg-primary hover:text-primary-foreground hover:border-primary group transition-all shadow-sm"
        >
          <Calendar className="h-4 w-4 group-hover:text-inherit transition-colors" />
          <span className="hidden sm:inline">Download Report</span>
          <span className="sm:hidden">Report</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2 text-sm font-semibold">
          <Calendar className="h-4 w-4 text-primary" />
          Select Report Period
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-1">
          {periodOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setSelectedPeriod(option.value)}
              className={cn(
                "gap-3 cursor-pointer rounded-md px-3 py-2.5 transition-all",
                selectedPeriod === option.value && "bg-primary/10 text-primary"
              )}
            >
              <span className="text-lg">{option.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm leading-tight">{option.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {option.value === "week" && "Last 7 days of tickets"}
                  {option.value === "month" && "Current month tickets"}
                  {option.value === "year" && "Current year tickets"}
                  {option.value === "all" && "Complete history"}
                </div>
              </div>
              {selectedPeriod === option.value && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
        
        <DropdownMenuSeparator />
        
        <div className="p-2">
          <PDFDownloadLink
            document={<TicketReport data={reportData} />}
            fileName={fileName}
            className="w-full block"
          >
            {({ blob, url, loading, error }) => (
              <Button
                disabled={loading || isGenerating}
                size="sm"
                className="w-full gap-2 shadow-sm"
                onClick={() => setIsGenerating(true)}
              >
                {loading || isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs sm:text-sm">Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">Generate {selectedPeriodLabel}</span>
                  </>
                )}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
