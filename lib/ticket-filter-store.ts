/**
 * Ticket Filter Store
 * 
 * Global state management for ticket filtering across pages.
 * Used to persist filter state when navigating from dashboard to tickets page.
 */

import { create } from "zustand";

interface TicketFilterState {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  resetFilters: () => void;
}

export const useTicketFilterStore = create<TicketFilterState>((set) => ({
  statusFilter: "all",
  setStatusFilter: (status: string) => set({ statusFilter: status }),
  resetFilters: () => set({ statusFilter: "all" }),
}));
