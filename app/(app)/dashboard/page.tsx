/**
 * DASHBOARD PAGE
 * 
 * Main dashboard page showing key metrics and recent activity.
 * Content varies by user role (admin vs technician).
 * 
 * @module app/(app)/dashboard/page
 */

"use client";

import dynamic from "next/dynamic";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { useTicketList } from "@/hooks/useTicketData";
import { useUsers } from "@/hooks/useUsers";
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

// Dynamically import chart components for code splitting
const TicketsOverTimeChart = dynamic(
  () => import("@/components/charts/TicketsOverTimeChart").then(mod => ({ default: mod.TicketsOverTimeChart })),
  { 
    loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
    ssr: false 
  }
);

const TicketsByBrandChart = dynamic(
  () => import("@/components/charts/TicketsByBrandChart").then(mod => ({ default: mod.TicketsByBrandChart })),
  { 
    loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
    ssr: false 
  }
);

const TechnicianPerformanceChart = dynamic(
  () => import("@/components/charts/TechnicianPerformanceChart").then(mod => ({ default: mod.TechnicianPerformanceChart })),
  { 
    loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
    ssr: false 
  }
);

export default function DashboardPage() {
  const user = useStore((state) => state.user);
  const { data, isLoading } = useDashboardStats();
  
  // Fetch all tickets and technicians for charts (admin only)
  const isAdmin = user?.role === "it_admin" || user?.role === "full_developer_admin";
  const { data: allTickets = [], isLoading: isLoadingTickets } = useTicketList();
  const { data: technicians = [], isLoading: isLoadingTechs } = useUsers({ 
    role: "it_technician",
    enabled: isAdmin 
  });

  const stats = data?.data;
  const isTechnician = user?.role === "it_technician";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-1xl font-bold tracking-tight">
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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

      {/* Charts Section (Admin Only) */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Tickets Over Time */}
          <TicketsOverTimeChart tickets={allTickets} days={30} />

          {/* Tickets by Brand */}
          <TicketsByBrandChart tickets={allTickets} />

          {/* Technician Performance (Full Width) */}
          <div className="lg:col-span-2">
            <TechnicianPerformanceChart 
              tickets={allTickets} 
              technicians={technicians} 
            />
          </div>
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
