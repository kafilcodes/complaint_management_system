import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { DashboardStats } from "@/app/api/dashboard/stats/route";

interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}

/**
 * Hook to fetch dashboard statistics
 * Automatically includes Firebase Auth token in request
 */
export function useDashboardStats() {
  return useQuery<DashboardStatsResponse>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => apiGet<DashboardStatsResponse>("/api/dashboard/stats"),
    refetchInterval: 60000, // Refetch every minute
    retry: 2, // Retry failed requests twice
  });
}
