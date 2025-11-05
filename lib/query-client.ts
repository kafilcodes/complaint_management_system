/**
 * TANSTACK QUERY CLIENT CONFIGURATION
 * 
 * This file sets up the TanStack Query (React Query) client with optimized
 * defaults for our application. TanStack Query manages all server state,
 * caching, and data synchronization.
 * 
 * Key principles:
 * - Use Query for reads (with optional real-time via onSnapshot)
 * - Use Mutation for writes (create, update, delete)
 * - Set appropriate staleTime to reduce unnecessary refetches
 * - Enable automatic refetch on window focus for data freshness
 * 
 * @module lib/query-client
 */

import { QueryClient, DefaultOptions } from "@tanstack/react-query";

/**
 * Default query options for the entire application
 */
const defaultQueryOptions: DefaultOptions = {
  queries: {
    // Retry failed queries 3 times before throwing error
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Consider data fresh for 5 minutes (reduces unnecessary API calls)
    // For real-time data, we'll use onSnapshot which bypasses this
    staleTime: 5 * 60 * 1000, // 5 minutes

    // Keep unused/inactive cache for 10 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly 'cacheTime')

    // Refetch on window focus for data freshness
    refetchOnWindowFocus: true,

    // Don't refetch on reconnect (we use real-time listeners)
    refetchOnReconnect: false,

    // Don't refetch on mount if data is still fresh
    refetchOnMount: false,

    // Throw errors to error boundaries for better error handling
    throwOnError: false,

    // Network mode - always fetch (even offline), let Firebase handle it
    networkMode: "always",
  },

  mutations: {
    // Don't retry mutations automatically (user should explicitly retry)
    retry: 0,

    // Throw mutation errors to UI for user feedback
    throwOnError: false,

    // Network mode for mutations
    networkMode: "always",
  },
};

/**
 * Create and export the QueryClient instance
 * 
 * This client is used in the QueryClientProvider to wrap the app.
 * All query and mutation hooks will use this configuration.
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

/**
 * Query key factory for consistent, type-safe query keys
 * 
 * This pattern ensures:
 * 1. Consistent key structure across the app
 * 2. Easy invalidation of related queries
 * 3. Better TypeScript autocomplete
 * 
 * @example
 * // Get all tickets
 * const { data } = useQuery({ queryKey: queryKeys.tickets.all, ... })
 * 
 * // Get single ticket
 * const { data } = useQuery({ queryKey: queryKeys.tickets.detail(ticketId), ... })
 * 
 * // Invalidate all ticket queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
 */
export const queryKeys = {
  // Auth queries
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },

  // User queries
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    technicians: () => [...queryKeys.users.all, "technicians"] as const,
  },

  // Ticket queries
  tickets: {
    all: ["tickets"] as const,
    lists: () => [...queryKeys.tickets.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.tickets.lists(), filters] as const,
    details: () => [...queryKeys.tickets.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.tickets.details(), id] as const,
    resolution: (id: string) =>
      [...queryKeys.tickets.all, "resolution", id] as const,
    stats: () => [...queryKeys.tickets.all, "stats"] as const,
  },

  // Notification queries
  notifications: {
    all: ["notifications"] as const,
    lists: () => [...queryKeys.notifications.all, "list"] as const,
    list: (userId: string) =>
      [...queryKeys.notifications.lists(), userId] as const,
    unreadCount: (userId: string) =>
      [...queryKeys.notifications.all, "unread-count", userId] as const,
  },

  // Dashboard queries
  dashboard: {
    all: ["dashboard"] as const,
    adminStats: () => [...queryKeys.dashboard.all, "admin-stats"] as const,
    technicianStats: (userId: string) =>
      [...queryKeys.dashboard.all, "technician-stats", userId] as const,
    ticketsByBrand: () =>
      [...queryKeys.dashboard.all, "tickets-by-brand"] as const,
    technicianPerformance: () =>
      [...queryKeys.dashboard.all, "technician-performance"] as const,
  },
} as const;

/**
 * Helper function to invalidate multiple query keys at once
 * 
 * @example
 * // After creating a ticket, refresh ticket list and stats
 * await invalidateQueries([queryKeys.tickets.all, queryKeys.dashboard.all])
 */
export const invalidateQueries = async (keys: unknown[][]) => {
  await Promise.all(
    keys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
  );
};

/**
 * Helper function to set query data programmatically
 * Useful for optimistic updates
 * 
 * @example
 * // Optimistically update ticket in cache after mutation
 * setQueryData(queryKeys.tickets.detail(ticketId), updatedTicket)
 */
export const setQueryData = <T>(key: unknown[], data: T) => {
  queryClient.setQueryData(key, data);
};

/**
 * Helper function to get cached query data
 * 
 * @example
 * const cachedTicket = getQueryData(queryKeys.tickets.detail(ticketId))
 */
export const getQueryData = <T>(key: unknown[]): T | undefined => {
  return queryClient.getQueryData(key);
};

/**
 * Helper to prefetch queries
 * Useful for loading data before navigation
 * 
 * @example
 * // Prefetch ticket details on hover
 * prefetchQuery(queryKeys.tickets.detail(ticketId), () => fetchTicket(ticketId))
 */
export const prefetchQuery = async <T>(
  key: unknown[],
  queryFn: () => Promise<T>
) => {
  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn,
  });
};
