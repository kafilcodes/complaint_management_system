/**
 * Custom hook for managing tickets
 * 
 * Provides React Query hooks for CRUD operations on tickets.
 * Includes automatic caching, optimistic updates, and error handling.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type {
  Ticket,
  TicketCreateInput,
  TicketUpdateInput,
  ApiSuccessResponse,
  ApiErrorResponse,
} from "@/lib/types";
import { toast } from "sonner";

/**
 * Fetch all tickets with optional filters
 */
export function useTickets(filters?: {
  status?: string;
  brand?: string;
  assignedTo?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.tickets.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.brand) params.append("brand", filters.brand);
      if (filters?.assignedTo) params.append("assignedTo", filters.assignedTo);
      if (filters?.limit) params.append("limit", filters.limit.toString());

      const data: ApiSuccessResponse<Ticket[]> = await apiGet(`/api/tickets?${params}`);
      return data.data || [];
    },
  });
}

/**
 * Fetch a single ticket by ID
 */
export function useTicket(ticketId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(ticketId || ""),
    queryFn: async () => {
      if (!ticketId) throw new Error("Ticket ID is required");
      const data: ApiSuccessResponse<Ticket> = await apiGet(`/api/tickets/${ticketId}`);
      return data.data;
    },
    enabled: !!ticketId,
  });
}

/**
 * Create a new ticket
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketData: TicketCreateInput) => {
      const data: ApiSuccessResponse<Ticket> = await apiPost("/api/tickets", ticketData);
      return data.data;
    },
    onSuccess: (newTicket) => {
      // Invalidate tickets list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      // Toast is shown in the create-ticket page with attachment count
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create ticket");
    },
  });
}

/**
 * Update an existing ticket
 */
export function useUpdateTicket(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: TicketUpdateInput) => {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw new Error(error.error || "Failed to update ticket");
      }

      const data: ApiSuccessResponse<Ticket> = await response.json();
      return data.data;
    },
    onSuccess: (updatedTicket) => {
      // Update the specific ticket in cache
      queryClient.setQueryData(
        queryKeys.tickets.detail(ticketId),
        updatedTicket
      );
      
      // Invalidate tickets list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      
      toast.success("Ticket updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update ticket");
    },
  });
}

/**
 * Delete a ticket (full_developer_admin only)
 */
export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw new Error(error.error || "Failed to delete ticket");
      }

      return ticketId;
    },
    onSuccess: (ticketId) => {
      // Remove ticket from cache
      queryClient.removeQueries({ queryKey: queryKeys.tickets.detail(ticketId) });
      
      // Invalidate tickets list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      
      toast.success("Ticket deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete ticket");
    },
  });
}
