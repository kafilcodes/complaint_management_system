"use client";

import { useQuery } from "@tanstack/react-query";
import { User } from "@/lib/types";

/**
 * Hook for fetching users from the API (client-side)
 * Uses TanStack Query for caching and automatic refetching
 * 
 * @module hooks/useUsers
 * 
 * @example
 * ```tsx
 * const { data: users = [], isLoading } = useUsers({ role: 'it_technician' });
 * ```
 */

interface UseUsersOptions {
  /**
   * Filter by role (optional)
   */
  role?: "admin" | "full_developer_admin" | "it_technician" | "customer";
  
  /**
   * Enable/disable the query
   */
  enabled?: boolean;
}

/**
 * Fetch users from the API with optional role filtering
 * Replaces useRealtimeUsers for better security (uses API route with auth middleware)
 */
export function useUsers(options: UseUsersOptions = {}) {
  const { role, enabled = true } = options;

  return useQuery({
    queryKey: ["users", role],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (role) {
        params.set("role", role);
      }

      const url = `/api/users${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to fetch users" }));
        throw new Error(error.message || "Failed to fetch users");
      }

      const data = await response.json();
      return data.users as User[];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
