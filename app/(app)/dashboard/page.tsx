/**
 * DASHBOARD PAGE
 * 
 * Main dashboard page showing key metrics and recent activity.
 * Content varies by user role (admin vs technician).
 * 
 * @module app/(app)/dashboard/page
 */

"use client";

import { useDashboardStats } from "@/hooks/use-dashboard";
import { useStore } from "@/lib/store";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentTickets } from "@/components/dashboard/RecentTickets";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Ticket, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  AlertCircle 
} from "lucide-react";

export default function DashboardPage() {
  const user = useStore((state) => state.user);
  const { data, isLoading } = useDashboardStats();

  const stats = data?.data;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const isAdmin = user?.role === "it_admin" || user?.role === "full_developer_admin";
  const isTechnician = user?.role === "it_technician";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, {user?.name?.split(" ")[0] || "User"}!
        </h1>
        <p className="text-muted-foreground">
          {isAdmin && "Here's an overview of all service tickets."}
          {isTechnician && "Here's an overview of your assigned tickets."}
          {!isAdmin && !isTechnician && "Here's an overview of your service requests."}
        </p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Tickets */}
          <StatCard
            title="Total Tickets"
            value={stats?.totalTickets || 0}
            icon={Ticket}
            description={isAdmin ? "All tickets" : isTechnician ? "Assigned to you" : "Your tickets"}
          />

          {/* Open Tickets */}
          <StatCard
            title="Open Tickets"
            value={stats?.openTickets || 0}
            icon={AlertCircle}
            description="Currently active"
            className="border-orange-200 dark:border-orange-900"
          />

          {/* Closed Tickets */}
          <StatCard
            title="Resolved Tickets"
            value={stats?.closedTickets || 0}
            icon={CheckCircle}
            description="Successfully completed"
            className="border-green-200 dark:border-green-900"
          />

          {/* New Tickets Trend */}
          <StatCard
            title="New This Week"
            value={stats?.trends.newTickets || 0}
            icon={TrendingUp}
            trend={{
              value: stats?.trends.newTicketsChange || 0,
              label: "vs last week",
            }}
          />
        </div>
      )}

      {/* Recent Tickets */}
      <RecentTickets
        tickets={stats?.recentTickets || []}
        isLoading={isLoading}
      />
    </div>
  );
}
