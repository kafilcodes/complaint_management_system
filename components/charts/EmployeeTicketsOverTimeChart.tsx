"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { TrendingUp } from "lucide-react";

interface Ticket {
  id: string;
  assignedAt?: any; // Firestore Timestamp or ISO string
  status: string;
}

interface EmployeeTicketsOverTimeChartProps {
  tickets: Ticket[];
  days?: number;
}

const chartConfig = {
  tickets: {
    label: "Tickets Assigned",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

/**
 * Area chart showing tickets assigned to employee over the last N days
 */
export function EmployeeTicketsOverTimeChart({ tickets, days = 30 }: EmployeeTicketsOverTimeChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const dataMap = new Map<string, number>();

    // Initialize all days with 0
    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(now, i));
      const dateKey = format(date, "MMM dd");
      dataMap.set(dateKey, 0);
    }

    // Count tickets assigned per day
    tickets.forEach((ticket) => {
      if (!ticket.assignedAt) return;
      
      const assignedAt = ticket.assignedAt?.toDate?.() || new Date(ticket.assignedAt);
      const dateKey = format(startOfDay(assignedAt), "MMM dd");
      
      if (dataMap.has(dateKey)) {
        dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + 1);
      }
    });

    // Convert to array
    return Array.from(dataMap.entries()).map(([date, count]) => ({
      date,
      tickets: count,
    }));
  }, [tickets, days]);

  const totalTickets = tickets.length;

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0 pb-2">
        <div>
          <CardTitle className="text-base sm:text-lg">My Tickets Over Time</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Tickets assigned to you in the last {days} days
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-primary">
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>{totalTickets} Total</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => value}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="tickets"
              stroke="var(--color-tickets)"
              fill="var(--color-tickets)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
