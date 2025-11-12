/**
 * DASHBOARD PAGE
 * 
 * Main dashboard page showing key metrics and recent activity.
 * Content varies by user role (admin vs technician).
 * 
 * @module app/(app)/dashboard/page
 */

"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { useTicketList, useMyTicketList } from "@/hooks/useTicketData";
import { useUsers } from "@/hooks/useUsers";
import { useStore } from "@/lib/store";
import { 
  isAdmin, 
  isEmployee, 
  canViewAllTickets, 
  canViewOnlyAssignedTickets,
  logUserState 
} from "@/lib/auth-validation";
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

// Employee-specific charts
const EmployeeTicketsOverTimeChart = dynamic(
  () => import("@/components/charts/EmployeeTicketsOverTimeChart").then(mod => ({ default: mod.EmployeeTicketsOverTimeChart })),
  { 
    loading: () => <Skeleton className="h-[350px] w-full rounded-lg" />,
    ssr: false 
  }
);

const EmployeeTicketsByStatusChart = dynamic(
  () => import("@/components/charts/EmployeeTicketsByStatusChart").then(mod => ({ default: mod.EmployeeTicketsByStatusChart })),
  { 
    loading: () => <Skeleton className="h-[350px] w-full rounded-lg" />,
    ssr: false 
  }
);

const EmployeeResolutionRateChart = dynamic(
  () => import("@/components/charts/EmployeeResolutionRateChart").then(mod => ({ default: mod.EmployeeResolutionRateChart })),
  { 
    loading: () => <Skeleton className="h-[350px] w-full rounded-lg" />,
    ssr: false 
  }
);

// Dynamically import PDF download button (client-side only)
const DownloadReportButton = dynamic(
  () => import("@/components/dashboard/DownloadReportButton").then(mod => ({ default: mod.DownloadReportButton })),
  { 
    loading: () => <Skeleton className="h-9 w-40" />,
    ssr: false 
  }
);

export default function DashboardPage() {
  const user = useStore((state) => state.user);
  const { data, isLoading } = useDashboardStats();
  
  // Debug: Log user and role
  useEffect(() => {
    console.log("========================================");
    console.log("[Dashboard] 📊 DASHBOARD PAGE RENDER");
    console.log("========================================");
    console.log("[Dashboard] User from Zustand Store:");
    console.log(JSON.stringify(user, null, 2));
    console.log("[Dashboard] � Extracted Fields:");
    console.log("  - id:", user?.id);
    console.log("  - email:", user?.email);
    console.log("  - name:", user?.name);
    console.log("  - role:", user?.role);
    console.log("  - department:", user?.department);
    console.log("[Dashboard] ⚠️ CRITICAL - Role value:", user?.role);
    console.log("[Dashboard] ⚠️ Role type:", typeof user?.role);
    console.log("========================================");
  }, [user]);
  
  // Log comprehensive user state for debugging
  useEffect(() => {
    logUserState("Dashboard Page", user);
  }, [user]);
  
  // Use validation utilities for role checking
  const userIsAdmin = isAdmin(user);
  const userIsEmployee = isEmployee(user);
  const shouldFetchAllTickets = canViewAllTickets(user);
  
  console.log("[Dashboard] 🎯 Access Control:", {
    userId: user?.id,
    role: user?.role,
    userIsAdmin,
    userIsEmployee,
    shouldFetchAllTickets,
  });
  
  // Fetch all tickets and technicians for charts (admin only)
  const { data: allTickets = [], isLoading: isLoadingTickets } = useTicketList({ 
    enabled: shouldFetchAllTickets 
  });
  
  const { data: technicians = [], isLoading: isLoadingTechs } = useUsers({ 
    role: "employee",
    enabled: userIsAdmin 
  });

  // Fetch employee's assigned tickets for charts (employee only)
  const { data: myTickets = [] } = useMyTicketList();

  // Debug: Log role checks and ticket counts
  useEffect(() => {
    console.log("[Dashboard] 🔍 ROLE CHECKS:");
    console.log("  - user?.role =", user?.role);
    console.log("  - user?.role === 'admin' =", user?.role === "admin");
    console.log("  - user?.role === 'full_developer_admin' =", user?.role === "full_developer_admin");
    console.log("  - user?.role === 'employee' =", user?.role === "employee");
    console.log("  - isAdmin (final) =", userIsAdmin);
    console.log("  - isEmployee (final) =", userIsEmployee);
    console.log("[Dashboard] 🎫 TICKET COUNTS:");
    console.log("  - My tickets (employee):", myTickets.length);
    console.log("  - All tickets (admin):", allTickets.length);
    console.log("[Dashboard] ✅ SHOULD SHOW:");
    console.log("  - Employee charts:", userIsEmployee && !userIsAdmin);
    console.log("  - Admin charts:", userIsAdmin);
    console.log("  - Download Report button:", userIsAdmin);
    console.log("========================================");
  }, [userIsAdmin, userIsEmployee, myTickets.length, allTickets.length, user?.role]);

  const stats = data?.data;
  const isTechnician = user?.role === "employee";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl sm:text-1xl font-bold tracking-tight">
            {getGreeting()}, {user?.name?.split(" ")[0] || "User"}!
          </h1>
          <p className="text-muted-foreground">
            {userIsAdmin && "Here's an overview of all service tickets."}
            {userIsEmployee && "Here's an overview of your assigned tickets."}
            {!userIsAdmin && !userIsEmployee && "Here's an overview of your service requests."}
          </p>
        </div>
        {/* PDF Download Button - Admin Only */}
        {(() => {
          const shouldShowButton = stats && !isLoading && userIsAdmin;
          console.log("[Dashboard] 🔵 DOWNLOAD BUTTON CHECK:");
          console.log("  - stats exists:", !!stats);
          console.log("  - !isLoading:", !isLoading);
          console.log("  - isAdmin:", isAdmin);
          console.log("  - shouldShowButton:", shouldShowButton);
          return shouldShowButton && <DownloadReportButton stats={stats} tickets={allTickets} />;
        })()}
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
            description={userIsAdmin ? "All tickets" : userIsEmployee ? "Assigned to you" : "Your tickets"}
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
      {userIsAdmin && (
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

      {/* Charts Section (Employee Only) */}
      {(() => {
        const shouldShowEmployeeCharts = userIsEmployee && !userIsAdmin;
        console.log("[Dashboard] 📈 EMPLOYEE CHARTS CHECK:");
        console.log("  - isEmployee:", userIsEmployee);
        console.log("  - isAdmin:", userIsAdmin);
        console.log("  - isEmployee && !isAdmin:", shouldShowEmployeeCharts);
        console.log("  - myTickets.length:", myTickets.length);
        
        if (!shouldShowEmployeeCharts) {
          console.log("  - ❌ NOT showing employee charts (condition false)");
          return null;
        }
        
        console.log("  - ✅ RENDERING employee charts");
        return (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* My Tickets Over Time - Full Width on Mobile */}
            <div className="w-full">
              <EmployeeTicketsOverTimeChart tickets={myTickets} days={30} />
            </div>

            {/* My Tickets by Status & Resolution Rate - Stack on Mobile, Side-by-side on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <EmployeeTicketsByStatusChart tickets={myTickets} />
              <EmployeeResolutionRateChart tickets={myTickets} />
            </div>
          </div>
        );
      })()}

      {/* Recent Tickets */}
      <RecentTickets
        tickets={stats?.recentTickets || []}
        isLoading={isLoading}
      />
    </div>
  );
}
