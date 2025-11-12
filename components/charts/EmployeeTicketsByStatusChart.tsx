"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ClipboardList } from "lucide-react";
import { TICKET_STATUSES, getLabelByValue } from "@/lib/configuration";

interface Ticket {
  id: string;
  status: string;
}

interface EmployeeTicketsByStatusChartProps {
  tickets: Ticket[];
}

const chartConfig = {
  open: {
    label: "Open",
    color: "var(--chart-1)",
  },
  closed: {
    label: "Closed",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

/**
 * Bar chart showing employee's tickets by status
 */
export function EmployeeTicketsByStatusChart({ tickets }: EmployeeTicketsByStatusChartProps) {
  const chartData = useMemo(() => {
    const statusCounts = new Map<string, number>();

    // Initialize all statuses with 0
    TICKET_STATUSES.forEach((status) => {
      statusCounts.set(status.value, 0);
    });

    // Count tickets by status
    tickets.forEach((ticket) => {
      const currentCount = statusCounts.get(ticket.status) || 0;
      statusCounts.set(ticket.status, currentCount + 1);
    });

    // Convert to array and format for chart
    return Array.from(statusCounts.entries()).map(([status, count]) => ({
      status: getLabelByValue(TICKET_STATUSES, status),
      count,
      fill: `var(--color-${status})`,
    }));
  }, [tickets]);

  const totalTickets = tickets.length;

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0 pb-2">
        <div>
          <CardTitle className="text-base sm:text-lg">My Tickets by Status</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Distribution of your assigned tickets
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-primary">
          <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>{totalTickets} Total</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis
              dataKey="status"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              angle={-15}
              height={60}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="count" 
              radius={[8, 8, 0, 0]} 
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
