"use client";

import { useQuery } from "@tanstack/react-query";
import { User } from "@/lib/types";
import { apiGet } from "@/lib/api-client";
import { useStore } from "@/lib/store";

/**
 * Hook for fetching users from the API (client-side)
 * Uses TanStack Query for caching and automatic refetching
 * 
 * @module hooks/useUsers
 * 
 * @example
 * ```tsx
 * const { data: users = [], isLoading } = useUsers({ role: 'employee' });
 * ```
 */

interface UseUsersOptions {
  /**
   * Filter by role (optional)
   */
  role?: "admin" | "full_developer_admin" | "employee";
  
  /**
   * Enable/disable the query
   */
  enabled?: boolean;
}

interface UsersApiResponse {
  success: boolean;
  data: User[];
  count: number;
}

/**
 * Fetch users from the API with optional role filtering
 * Replaces useRealtimeUsers for better security (uses API route with auth middleware)
 */
export function useUsers(options: UseUsersOptions = {}) {
  const { role, enabled = true } = options;
  const user = useStore((state) => state.user);
  const isAuthLoading = useStore((state) => state.isAuthLoading);

  return useQuery({
    queryKey: ["users", role],
    queryFn: async () => {
      console.log("[useUsers] Query function called, role:", role);
      console.log("[useUsers] Auth state - isAuthLoading:", isAuthLoading, "user:", user?.id || "null");
      
      const params = new URLSearchParams();
      if (role) {
        params.set("role", role);
      }

      const url = `/api/users${params.toString() ? `?${params.toString()}` : ""}`;
      
      console.log("[useUsers] Calling apiGet for URL:", url);
      
      // Use authenticated API client that includes Firebase Auth token
      const response = await apiGet<UsersApiResponse>(url);
      
      console.log("[useUsers] Got response:", response?.data?.length || 0, "users");
      
      // API returns { success: true, data: [...] }
      return response.data;
    },
    // Only run query when:
    // 1. Auth is ready (isAuthLoading = false)
    // 2. User is logged in (user !== null)
    // 3. Explicitly enabled
    enabled: !isAuthLoading && user !== null && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}


