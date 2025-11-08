/**
 * Real-time Ticket Data Hooks
 * 
 * Production-grade TanStack Query hooks wrapping Firestore onSnapshot listeners.
 * These hooks provide real-time, cached ticket data with automatic updates.
 * 
 * Architecture:
 * - Uses onSnapshot for real-time WebSocket-like updates
 * - Wrapped in TanStack Query for caching and state management
 * - staleTime: Infinity (data is always fresh from real-time listener)
 * - Automatic cleanup via unsubscribe() on unmount
 * 
 * @module hooks/useTicketData
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { queryKeys } from "@/lib/query-client";
import { useStore } from "@/lib/store";
import { apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type { 
  Ticket, 
  TicketCreateInput, 
  TicketUpdateInput,
  TicketStatus,
  ApiSuccessResponse 
} from "@/lib/types";
import { toast } from "sonner";

// ==============================================================================
// REAL-TIME QUERY HOOKS
// ==============================================================================

/**
 * Get all tickets in real-time (Admin only)
 * 
 * This hook creates an onSnapshot listener for the entire tickets collection.
 * Data updates automatically when any ticket changes in Firestore.
 * 
 * @param filters - Optional filters for status, brand, etc.
 * @returns TanStack Query result with live ticket array
 */
export function useTicketList(filters?: {
  status?: TicketStatus;
  brand?: string;
  limit?: number;
}) {
  return useQuery<Ticket[]>({
    queryKey: queryKeys.tickets.list(filters),
    queryFn: () =>
      new Promise<Ticket[]>((resolve, reject) => {
        try {
          // Build query constraints
          const constraints = [];
          
          if (filters?.status) {
            constraints.push(where("status", "==", filters.status));
          }
          
          if (filters?.brand) {
            constraints.push(where("brand", "==", filters.brand));
          }
          
          // Always order by newest first
          constraints.push(orderBy("createdAt", "desc"));
          
          const ticketsQuery = query(
            collection(db, "tickets"),
            ...constraints
          );

          // Create real-time listener
          const unsubscribe = onSnapshot(
            ticketsQuery,
            (snapshot) => {
              const tickets: Ticket[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  status: data.status,
                  createdAt: data.createdAt instanceof Timestamp 
                    ? data.createdAt.toDate() 
                    : new Date(data.createdAt),
                  createdBy: data.createdBy,
                  assignedTo: data.assignedTo || null,
                  assignedAt: data.assignedAt instanceof Timestamp
                    ? data.assignedAt.toDate()
                    : data.assignedAt ? new Date(data.assignedAt) : null,
                  closedAt: data.closedAt instanceof Timestamp
                    ? data.closedAt.toDate()
                    : data.closedAt ? new Date(data.closedAt) : null,
                  updatedAt: data.updatedAt instanceof Timestamp
                    ? data.updatedAt.toDate()
                    : data.updatedAt ? new Date(data.updatedAt) : undefined,
                  storeId: data.storeId,
                  storeName: data.storeName,
                  customerName: data.customerName,
                  customerPhone: data.customerPhone,
                  address: data.address,
                  pincode: data.pincode,
                  productName: data.productName,
                  productModel: data.productModel,
                  purchaseDate: data.purchaseDate instanceof Timestamp
                    ? data.purchaseDate.toDate()
                    : new Date(data.purchaseDate),
                  brand: data.brand,
                  issueDescription: data.issueDescription,
                  comments: data.comments || null,
                } as Ticket;
              });
              
              resolve(tickets);
            },
            (error) => {
              console.error("[useTicketList] Firestore error:", error);
              reject(error);
            }
          );

          // Cleanup function (TanStack Query will call this on unmount)
          return () => unsubscribe();
        } catch (error) {
          console.error("[useTicketList] Setup error:", error);
          reject(error);
        }
      }),
    staleTime: Infinity, // Data is always fresh (real-time listener)
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes after unmount
  });
}

/**
 * Get tickets assigned to current user (Technician only)
 * 
 * This hook creates a real-time listener filtered by assignedTo === currentUser.uid.
 * Only returns tickets assigned to the logged-in technician.
 * 
 * @returns TanStack Query result with assigned tickets array
 */
export function useMyTicketList() {
  const user = useStore((state) => state.user);

  return useQuery<Ticket[]>({
    queryKey: queryKeys.tickets.myTickets(),
    queryFn: () =>
      new Promise<Ticket[]>((resolve, reject) => {
        if (!user?.id) {
          resolve([]);
          return;
        }

        try {
          const myTicketsQuery = query(
            collection(db, "tickets"),
            where("assignedTo", "==", user.id),
            orderBy("createdAt", "desc")
          );

          const unsubscribe = onSnapshot(
            myTicketsQuery,
            (snapshot) => {
              const tickets: Ticket[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  status: data.status,
                  createdAt: data.createdAt instanceof Timestamp 
                    ? data.createdAt.toDate() 
                    : new Date(data.createdAt),
                  createdBy: data.createdBy,
                  assignedTo: data.assignedTo || null,
                  assignedAt: data.assignedAt instanceof Timestamp
                    ? data.assignedAt.toDate()
                    : data.assignedAt ? new Date(data.assignedAt) : null,
                  closedAt: data.closedAt instanceof Timestamp
                    ? data.closedAt.toDate()
                    : data.closedAt ? new Date(data.closedAt) : null,
                  updatedAt: data.updatedAt instanceof Timestamp
                    ? data.updatedAt.toDate()
                    : data.updatedAt ? new Date(data.updatedAt) : undefined,
                  storeId: data.storeId,
                  storeName: data.storeName,
                  customerName: data.customerName,
                  customerPhone: data.customerPhone,
                  address: data.address,
                  pincode: data.pincode,
                  productName: data.productName,
                  productModel: data.productModel,
                  purchaseDate: data.purchaseDate instanceof Timestamp
                    ? data.purchaseDate.toDate()
                    : new Date(data.purchaseDate),
                  brand: data.brand,
                  issueDescription: data.issueDescription,
                  comments: data.comments || null,
                } as Ticket;
              });
              
              resolve(tickets);
            },
            (error) => {
              console.error("[useMyTicketList] Firestore error:", error);
              reject(error);
            }
          );

          return () => unsubscribe();
        } catch (error) {
          console.error("[useMyTicketList] Setup error:", error);
          reject(error);
        }
      }),
    enabled: !!user?.id,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 5,
  });
}

/**
 * Get a single ticket by ID in real-time
 * 
 * This hook creates a document-level onSnapshot listener.
 * Updates automatically when the specific ticket changes.
 * 
 * @param ticketId - The ticket document ID
 * @returns TanStack Query result with single ticket
 */
export function useTicketById(ticketId: string | undefined) {
  return useQuery<Ticket | null>({
    queryKey: queryKeys.tickets.detail(ticketId || ""),
    queryFn: () =>
      new Promise<Ticket | null>((resolve, reject) => {
        if (!ticketId) {
          resolve(null);
          return;
        }

        try {
          const ticketDocRef = doc(db, "tickets", ticketId);

          const unsubscribe = onSnapshot(
            ticketDocRef,
            (snapshot) => {
              if (!snapshot.exists()) {
                resolve(null);
                return;
              }

              const data = snapshot.data();
              const ticket: Ticket = {
                id: snapshot.id,
                status: data.status,
                createdAt: data.createdAt instanceof Timestamp 
                  ? data.createdAt.toDate() 
                  : new Date(data.createdAt),
                createdBy: data.createdBy,
                assignedTo: data.assignedTo || null,
                assignedAt: data.assignedAt instanceof Timestamp
                  ? data.assignedAt.toDate()
                  : data.assignedAt ? new Date(data.assignedAt) : null,
                closedAt: data.closedAt instanceof Timestamp
                  ? data.closedAt.toDate()
                  : data.closedAt ? new Date(data.closedAt) : null,
                updatedAt: data.updatedAt instanceof Timestamp
                  ? data.updatedAt.toDate()
                  : data.updatedAt ? new Date(data.updatedAt) : undefined,
                storeId: data.storeId,
                storeName: data.storeName,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                address: data.address,
                pincode: data.pincode,
                productName: data.productName,
                productModel: data.productModel,
                purchaseDate: data.purchaseDate instanceof Timestamp
                  ? data.purchaseDate.toDate()
                  : new Date(data.purchaseDate),
                brand: data.brand,
                issueDescription: data.issueDescription,
                comments: data.comments || null,
              };
              
              resolve(ticket);
            },
            (error) => {
              console.error("[useTicketById] Firestore error:", error);
              reject(error);
            }
          );

          return () => unsubscribe();
        } catch (error) {
          console.error("[useTicketById] Setup error:", error);
          reject(error);
        }
      }),
    enabled: !!ticketId,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 5,
  });
}

// ==============================================================================
// MUTATION HOOKS (API Routes)
// ==============================================================================

/**
 * Create a new ticket (Admin only)
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketData: TicketCreateInput) => {
      const response: ApiSuccessResponse<{ ticketId: string }> = await apiPost(
        "/api/tickets",
        ticketData
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all ticket lists to refetch with real-time data
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      toast.success("Ticket created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create ticket");
    },
  });
}

/**
 * Update an existing ticket (Admin only)
 */
export function useUpdateTicket(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: TicketUpdateInput) => {
      await apiPut(`/api/tickets/${ticketId}`, updates);
    },
    onSuccess: () => {
      // Invalidate to trigger real-time refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      toast.success("Ticket updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update ticket");
    },
  });
}

/**
 * Delete a ticket (Admin only)
 */
export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      await apiDelete(`/api/tickets/${ticketId}`);
      return ticketId;
    },
    onSuccess: (ticketId) => {
      queryClient.removeQueries({ queryKey: queryKeys.tickets.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      toast.success("Ticket deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete ticket");
    },
  });
}
