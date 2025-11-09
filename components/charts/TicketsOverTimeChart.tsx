"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

interface Ticket {
  id: string;
  createdAt: any; // Firestore Timestamp or ISO string
  status: string;
}

interface TicketsOverTimeChartProps {
  tickets: Ticket[];
  days?: number;
}

const chartConfig = {
  tickets: {
    label: "Tickets Created",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

/**
 * Area chart showing tickets created over the last N days
 */
export function TicketsOverTimeChart({ tickets, days = 30 }: TicketsOverTimeChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const dataMap = new Map<string, number>();

    // Initialize all days with 0
    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(now, i));
      const dateKey = format(date, "MMM dd");
      dataMap.set(dateKey, 0);
    }

    // Count tickets per day
    tickets.forEach((ticket) => {
      const createdAt = ticket.createdAt?.toDate?.() || new Date(ticket.createdAt);
      const dateKey = format(startOfDay(createdAt), "MMM dd");
      
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tickets Created Over Time</CardTitle>
        <CardDescription>Last {days} days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="tickets"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
