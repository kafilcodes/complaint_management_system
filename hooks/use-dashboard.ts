import { useQuery } from "@tanstack/react-query";
import type { DashboardStats } from "@/app/api/dashboard/stats/route";

interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  return useQuery<DashboardStatsResponse>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });
}
