"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface Ticket {
  id: string;
  assignedTo?: string | null;
  status: string;
}

interface User {
  id: string;
  name: string;
}

interface TechnicianPerformanceChartProps {
  tickets: Ticket[];
  technicians: User[];
}

const chartConfig = {
  resolved: {
    label: "Resolved Tickets",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

/**
 * Bar chart showing resolved tickets per technician
 */
export function TechnicianPerformanceChart({ tickets, technicians }: TechnicianPerformanceChartProps) {
  const chartData = useMemo(() => {
    const techMap = new Map<string, { name: string; resolved: number }>();

    // Initialize technicians
    technicians.forEach((tech) => {
      techMap.set(tech.id, { name: tech.name.split(" ")[0], resolved: 0 });
    });

    // Count resolved tickets per technician
    tickets.forEach((ticket) => {
      if (ticket.status === "closed" && ticket.assignedTo && techMap.has(ticket.assignedTo)) {
        const tech = techMap.get(ticket.assignedTo)!;
        tech.resolved++;
      }
    });

    // Convert to array and sort by resolved count
    return Array.from(techMap.values())
      .filter((tech) => tech.resolved > 0) // Only show techs with resolved tickets
      .sort((a, b) => b.resolved - a.resolved)
      .slice(0, 10); // Top 10
  }, [tickets, technicians]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Technician Performance</CardTitle>
          <CardDescription>Top performers</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No resolved tickets yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technician Performance</CardTitle>
        <CardDescription>Top {chartData.length} performers by resolved tickets</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="resolved"
              fill="hsl(var(--chart-2))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
