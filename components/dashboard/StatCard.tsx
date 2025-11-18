"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  onClick,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return TrendingUp;
    if (trend.value < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-green-600 dark:text-green-500";
    if (trend.value < 0) return "text-red-600 dark:text-red-500";
    return "text-gray-600 dark:text-gray-400";
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card 
      className={cn(
        "transition-shadow hover:shadow-lg", 
        onClick && "cursor-pointer hover:border-primary/50 active:scale-[0.98] transition-transform",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold">{value}</div>
          
          {(description || trend) && (
            <div className="flex items-center gap-2 text-xs">
              {trend && TrendIcon && (
                <Badge
                  variant="secondary"
                  className={cn("flex items-center gap-1 px-2 py-0.5", getTrendColor())}
                >
                  <TrendIcon className="h-3 w-3" />
                  <span>
                    {Math.abs(trend.value)}%
                  </span>
                </Badge>
              )}
              {(description || trend?.label) && (
                <span className="text-muted-foreground">
                  {trend?.label || description}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
