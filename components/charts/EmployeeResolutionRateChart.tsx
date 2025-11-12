"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Label, Pie, PieChart } from "recharts";
import { Target } from "lucide-react";

interface Ticket {
  id: string;
  status: string;
}

interface EmployeeResolutionRateChartProps {
  tickets: Ticket[];
}

const chartConfig = {
  active: {
    label: "Active",
    color: "var(--chart-1)",
  },
  resolved: {
    label: "Resolved",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

/**
 * Donut chart showing employee's resolution rate
 */
export function EmployeeResolutionRateChart({ tickets }: EmployeeResolutionRateChartProps) {
  const { chartData, resolvedPercentage } = useMemo(() => {
    const resolvedCount = tickets.filter(
      (t) => t.status === "closed"
    ).length;
    const activeCount = tickets.filter(
      (t) => t.status === "open"
    ).length;

    const data = [
      {
        status: "Active",
        count: activeCount,
        fill: "var(--color-active)",
      },
      {
        status: "Resolved",
        count: resolvedCount,
        fill: "var(--color-resolved)",
      },
    ];

    const percentage = tickets.length > 0 
      ? Math.round((resolvedCount / tickets.length) * 100)
      : 0;

    return { chartData: data, resolvedPercentage: percentage };
  }, [tickets]);

  const totalTickets = tickets.length;

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0 pb-2">
        <div>
          <CardTitle className="text-base sm:text-lg">My Resolution Rate</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Percentage of tickets successfully resolved
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-primary">
          <Target className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>{resolvedPercentage}%</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-3 sm:p-6 pt-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[200px] sm:h-[250px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              outerRadius={80}
              strokeWidth={2}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl sm:text-3xl font-bold"
                        >
                          {resolvedPercentage}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-xs"
                        >
                          Resolved
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex flex-col gap-2 text-sm w-full sm:w-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[var(--color-active)]" />
              <span className="text-xs sm:text-sm text-muted-foreground">Active</span>
            </div>
            <span className="text-xs sm:text-sm font-medium">
              {chartData[0].count} tickets
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[var(--color-resolved)]" />
              <span className="text-xs sm:text-sm text-muted-foreground">Resolved</span>
            </div>
            <span className="text-xs sm:text-sm font-medium">
              {chartData[1].count} tickets
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
