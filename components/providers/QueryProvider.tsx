/**
 * QUERY PROVIDER
 * 
 * This client component wraps the application with QueryClientProvider
 * from TanStack Query (React Query v5).
 * 
 * It provides server state management, caching, and real-time data
 * synchronization across the entire application.
 * 
 * @module components/providers/QueryProvider
 */

"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/query-client";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider Component
 * 
 * Wraps children with TanStack Query's QueryClientProvider.
 * Includes React Query Devtools in development mode for debugging.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create a stable queryClient instance that persists across renders
  // Using useState ensures the client is only created once per component mount
  const [client] = useState(() => queryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
      
      {/* React Query Devtools - only visible in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
          position="bottom"
        />
      )}
    </QueryClientProvider>
  );
}
