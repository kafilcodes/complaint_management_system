/**
 * TICKET REPORT PDF COMPONENT
 * 
 * Generates a professional A4 PDF report with ticket statistics, charts, and details.
 * Uses @react-pdf/renderer for client-side PDF generation.
 * 
 * @module components/pdf/TicketReport
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// ==============================================================================
// TYPE DEFINITIONS
// ==============================================================================

export interface TicketReportData {
  // Report metadata
  generatedAt: string;
  appName: string;
  
  // Statistics
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  newThisWeek: number;
  resolvedThisWeek: number;
  newTicketsChange: number;
  
  // Tickets list
  tickets: Array<{
    id: string;
    productName: string;
    customerName: string;
    status: string;
    brand: string;
    createdAt: string;
    assignedToName?: string | null;
  }>;
  
  // Chart data (simplified for text representation)
  brandBreakdown: Array<{
    brand: string;
    count: number;
    percentage: number;
  }>;
  
  // Monthly stats
  monthlyStats?: {
    total: number;
    open: number;
    closed: number;
    tickets: Array<{
      id: string;
      productName: string;
      customerName: string;
      status: string;
      brand: string;
      createdAt: string;
      assignedToName?: string | null;
    }>;
  };
  
  // Yearly stats
  yearlyStats?: {
    total: number;
    open: number;
    closed: number;
    tickets: Array<{
      id: string;
      productName: string;
      customerName: string;
      status: string;
      brand: string;
      createdAt: string;
      assignedToName?: string | null;
    }>;
  };
}

// ==============================================================================
// STYLES
// ==============================================================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  
  // Header
  header: {
    marginBottom: 30,
    borderBottom: "2px solid #0891b2",
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0891b2",
  },
  headerSubtitle: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  generatedDate: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 8,
  },
  
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
    borderLeft: "4px solid #0891b2",
    paddingLeft: 8,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "23%",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderLeft: "3px solid #0891b2",
  },
  statLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  statDescription: {
    fontSize: 7,
    color: "#94a3b8",
  },
  statTrend: {
    fontSize: 7,
    marginTop: 4,
    fontWeight: "bold",
  },
  trendPositive: {
    color: "#16a34a",
  },
  trendNegative: {
    color: "#dc2626",
  },
  
  // Chart Section
  chartContainer: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 6,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: "1px solid #e2e8f0",
  },
  chartLabel: {
    width: "40%",
    fontSize: 9,
    color: "#475569",
  },
  chartBar: {
    width: "45%",
    height: 16,
    backgroundColor: "#e0f2fe",
    borderRadius: 3,
    position: "relative",
  },
  chartBarFill: {
    height: "100%",
    backgroundColor: "#0891b2",
    borderRadius: 3,
  },
  chartValue: {
    width: "15%",
    fontSize: 9,
    color: "#0f172a",
    textAlign: "right",
    fontWeight: "bold",
  },
  
  // Table
  table: {
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0891b2",
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottom: "1px solid #e2e8f0",
  },
  tableRowOdd: {
    backgroundColor: "#f8fafc",
  },
  tableCell: {
    fontSize: 8,
    color: "#475569",
  },
  
  // Column widths
  colId: { width: "15%" },
  colProduct: { width: "20%" },
  colCustomer: { width: "18%" },
  colBrand: { width: "12%" },
  colStatus: { width: "10%" },
  colAssigned: { width: "15%" },
  colDate: { width: "10%" },
  
  // Status badges
  statusOpen: {
    color: "#ea580c",
    fontWeight: "bold",
  },
  statusClosed: {
    color: "#16a34a",
    fontWeight: "bold",
  },
  
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 8,
    borderTop: "1px solid #e2e8f0",
    paddingTop: 8,
  },
  
  // Summary box
  summaryBox: {
    backgroundColor: "#ecfeff",
    padding: 12,
    borderRadius: 6,
    borderLeft: "4px solid #0891b2",
    marginTop: 12,
  },
  summaryText: {
    fontSize: 9,
    color: "#0e7490",
    lineHeight: 1.6,
  },
});

// ==============================================================================
// COMPONENT
// ==============================================================================

export const TicketReport: React.FC<{ data: TicketReportData }> = ({ data }) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Format ticket ID (show first 8 chars)
  const formatTicketId = (id: string) => {
    return `#${id.slice(0, 8)}`;
  };

  // Calculate resolution rate
  const resolutionRate =
    data.totalTickets > 0
      ? Math.round((data.closedTickets / data.totalTickets) * 100)
      : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              src="/logo.png"
              style={styles.logo}
            />
            <View>
              <Text style={styles.headerTitle}>
                {data.appName} - Ticket Operations Report
              </Text>
              <Text style={styles.headerSubtitle}>
                Comprehensive Ticket Management Overview
              </Text>
            </View>
          </View>
          <Text style={styles.generatedDate}>
            Generated on {formatDate(data.generatedAt)} at{" "}
            {new Date(data.generatedAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Statistics</Text>
          <View style={styles.statsGrid}>
            {/* Total Tickets */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Tickets</Text>
              <Text style={styles.statValue}>{data.totalTickets}</Text>
              <Text style={styles.statDescription}>All service requests</Text>
            </View>

            {/* Open Tickets */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Open Tickets</Text>
              <Text style={styles.statValue}>{data.openTickets}</Text>
              <Text style={styles.statDescription}>Currently active</Text>
            </View>

            {/* Closed Tickets */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Resolved</Text>
              <Text style={styles.statValue}>{data.closedTickets}</Text>
              <Text style={styles.statDescription}>
                {resolutionRate}% resolution rate
              </Text>
            </View>

            {/* New This Week */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>New This Week</Text>
              <Text style={styles.statValue}>{data.newThisWeek}</Text>
              {data.newTicketsChange !== 0 && (
                <Text
                  style={[
                    styles.statTrend,
                    data.newTicketsChange > 0
                      ? styles.trendPositive
                      : styles.trendNegative,
                  ]}
                >
                  {data.newTicketsChange > 0 ? "↑" : "↓"}{" "}
                  {Math.abs(data.newTicketsChange).toFixed(1)}% vs last week
                </Text>
              )}
            </View>
          </View>

          {/* Summary Box */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              Overview: Currently managing {data.totalTickets} total tickets
              with {data.openTickets} active cases requiring attention.{" "}
              {data.closedTickets} tickets have been successfully resolved,
              achieving a {resolutionRate}% resolution rate. This week saw{" "}
              {data.newThisWeek} new tickets and {data.resolvedThisWeek}{" "}
              resolutions.
            </Text>
          </View>
        </View>

        {/* Brand Breakdown Chart */}
        {data.brandBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tickets by Brand</Text>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Distribution Breakdown</Text>
              {data.brandBreakdown.map((item, index) => (
                <View key={index} style={styles.chartRow}>
                  <Text style={styles.chartLabel}>{item.brand}</Text>
                  <View style={styles.chartBar}>
                    <View
                      style={[
                        styles.chartBarFill,
                        { width: `${item.percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartValue}>
                    {item.count} ({item.percentage}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tickets List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Recent Tickets ({data.tickets.length})
          </Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colId]}>
                Ticket ID
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colProduct]}>
                Product
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colCustomer]}>
                Customer
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colBrand]}>
                Brand
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colStatus]}>
                Status
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colAssigned]}>
                Assigned To
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
            </View>

            {/* Table Rows */}
            {data.tickets.map((ticket, index) => (
              <View
                key={ticket.id}
                style={[
                  styles.tableRow,
                  index % 2 === 1 ? styles.tableRowOdd : {},
                ]}
              >
                <Text style={[styles.tableCell, styles.colId]}>
                  {formatTicketId(ticket.id)}
                </Text>
                <Text style={[styles.tableCell, styles.colProduct]}>
                  {ticket.productName}
                </Text>
                <Text style={[styles.tableCell, styles.colCustomer]}>
                  {ticket.customerName}
                </Text>
                <Text style={[styles.tableCell, styles.colBrand]}>
                  {ticket.brand}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.colStatus,
                    ticket.status === "open"
                      ? styles.statusOpen
                      : styles.statusClosed,
                  ]}
                >
                  {ticket.status.toUpperCase()}
                </Text>
                <Text style={[styles.tableCell, styles.colAssigned]}>
                  {ticket.assignedToName || "Unassigned"}
                </Text>
                <Text style={[styles.tableCell, styles.colDate]}>
                  {formatDate(ticket.createdAt)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {data.appName} © {new Date().getFullYear()} - Confidential Document
            - Page 1 of 2
          </Text>
        </View>
      </Page>

      {/* Page 2: Monthly & Yearly Details */}
      {(data.monthlyStats || data.yearlyStats) && (
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image src="/logo.png" style={styles.logo} />
              <View>
                <Text style={styles.headerTitle}>
                  {data.appName} - Monthly & Yearly Analysis
                </Text>
                <Text style={styles.headerSubtitle}>
                  Detailed Breakdown by Time Period
                </Text>
              </View>
            </View>
            <Text style={styles.generatedDate}>
              Report Period: {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>

          {/* Monthly Statistics */}
          {data.monthlyStats && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Current Month ({new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })})
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Total This Month</Text>
                  <Text style={styles.statValue}>{data.monthlyStats.total}</Text>
                  <Text style={styles.statDescription}>All tickets</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Open</Text>
                  <Text style={styles.statValue}>{data.monthlyStats.open}</Text>
                  <Text style={styles.statDescription}>Active cases</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Closed</Text>
                  <Text style={styles.statValue}>{data.monthlyStats.closed}</Text>
                  <Text style={styles.statDescription}>
                    {data.monthlyStats.total > 0
                      ? Math.round((data.monthlyStats.closed / data.monthlyStats.total) * 100)
                      : 0}% resolved
                  </Text>
                </View>
              </View>

              {/* Monthly Tickets Table */}
              {data.monthlyStats.tickets.length > 0 && (
                <View style={styles.table}>
                  <Text style={styles.chartTitle}>Recent Tickets This Month</Text>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.colId]}>Ticket ID</Text>
                    <Text style={[styles.tableHeaderCell, styles.colProduct]}>Product</Text>
                    <Text style={[styles.tableHeaderCell, styles.colCustomer]}>Customer</Text>
                    <Text style={[styles.tableHeaderCell, styles.colBrand]}>Brand</Text>
                    <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
                  </View>
                  {data.monthlyStats.tickets.slice(0, 15).map((ticket, index) => (
                    <View
                      key={ticket.id}
                      style={[
                        styles.tableRow,
                        index % 2 === 1 ? styles.tableRowOdd : {},
                      ]}
                    >
                      <Text style={[styles.tableCell, styles.colId]}>
                        {formatTicketId(ticket.id)}
                      </Text>
                      <Text style={[styles.tableCell, styles.colProduct]}>
                        {ticket.productName}
                      </Text>
                      <Text style={[styles.tableCell, styles.colCustomer]}>
                        {ticket.customerName}
                      </Text>
                      <Text style={[styles.tableCell, styles.colBrand]}>
                        {ticket.brand}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.colStatus,
                          ticket.status === "open"
                            ? styles.statusOpen
                            : styles.statusClosed,
                        ]}
                      >
                        {ticket.status.toUpperCase()}
                      </Text>
                      <Text style={[styles.tableCell, styles.colDate]}>
                        {formatDate(ticket.createdAt)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Yearly Statistics */}
          {data.yearlyStats && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Year {new Date().getFullYear()} Summary
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Total This Year</Text>
                  <Text style={styles.statValue}>{data.yearlyStats.total}</Text>
                  <Text style={styles.statDescription}>All tickets</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Open</Text>
                  <Text style={styles.statValue}>{data.yearlyStats.open}</Text>
                  <Text style={styles.statDescription}>Active cases</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Closed</Text>
                  <Text style={styles.statValue}>{data.yearlyStats.closed}</Text>
                  <Text style={styles.statDescription}>
                    {data.yearlyStats.total > 0
                      ? Math.round((data.yearlyStats.closed / data.yearlyStats.total) * 100)
                      : 0}% resolved
                  </Text>
                </View>
              </View>

              {/* Summary box for yearly */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>
                  Year-to-Date Performance: {data.yearlyStats.total} tickets processed with{" "}
                  {data.yearlyStats.closed} successfully resolved. Average monthly volume:{" "}
                  {Math.round(data.yearlyStats.total / (new Date().getMonth() + 1))} tickets.
                </Text>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text>
              {data.appName} © {new Date().getFullYear()} - Confidential Document
              - Page 2 of 2
            </Text>
          </View>
        </Page>
      )}
    </Document>
  );
};
