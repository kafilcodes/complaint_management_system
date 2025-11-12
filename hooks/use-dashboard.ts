import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { useStore } from "@/lib/store";
import type { DashboardStats } from "@/app/api/dashboard/stats/route";

interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}

/**
 * Hook to fetch dashboard statistics
 * @note PUBLIC API - Passes userId and role as query params
 */
export function useDashboardStats() {
  const user = useStore((state) => state.user);
  
  console.log("[useDashboardStats] 🔐 Current user state:", {
    hasUser: !!user,
    userId: user?.id,
    userRole: user?.role,
    enabled: !!user?.id && !!user?.role
  });
  
  return useQuery<DashboardStatsResponse>({
    queryKey: ["dashboard", "stats", user?.id, user?.role],
    queryFn: () => {
      console.log("[useDashboardStats] 📡 Making API call with user:", {
        userId: user?.id,
        role: user?.role
      });
      const params = new URLSearchParams();
      if (user?.id) params.append("userId", user.id);
      if (user?.role) params.append("role", user.role);
      const url = `/api/dashboard/stats?${params.toString()}`;
      console.log("[useDashboardStats] 🌐 API URL:", url);
      return apiGet<DashboardStatsResponse>(url);
    },
    enabled: !!user?.id && !!user?.role, // Only fetch when user is loaded
    refetchInterval: 60000, // Refetch every minute
    retry: 2, // Retry failed requests twice
  });
}
