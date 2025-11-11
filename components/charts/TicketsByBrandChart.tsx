"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell, Legend } from "recharts";

interface Ticket {
  id: string;
  brand?: string;
}

interface TicketsByBrandChartProps {
  tickets: Ticket[];
}

const COLORS = [
  "var(--chart-pie-1)", // Lighter turquoise - reduced saturation
  "var(--chart-pie-2)", // Lighter darker turquoise
  "var(--chart-pie-3)", // Lighter even darker turquoise
  "var(--chart-pie-4)", // Lighter cyan variant
  "var(--chart-pie-5)", // Lighter blue-green variant
];

/**
 * Pie chart showing ticket distribution by brand
 */
export function TicketsByBrandChart({ tickets }: TicketsByBrandChartProps) {
  const chartData = useMemo(() => {
    const brandCounts = new Map<string, number>();

    tickets.forEach((ticket) => {
      const brand = ticket.brand || "Unknown";
      brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
    });

    return Array.from(brandCounts.entries())
      .map(([brand, count]) => ({
        name: brand,
        value: count,
      }))
      .sort((a, b) => b.value - a.value); // Sort by count descending
  }, [tickets]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    chartData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: COLORS[index % COLORS.length],
      };
    });
    return config;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tickets by Brand</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No tickets to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tickets by Brand</CardTitle>
        <CardDescription>Distribution across all brands</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={100}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
