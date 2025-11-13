/**
 * COMPLAINTS PAGE
 * 
 * Displays a list of all complaints (admin) or assigned complaints (technician).
 * Now using real-time Firestore onSnapshot listeners for instant updates.
 * 
 * @module app/(app)/complaints/page
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TicketList } from "@/components/tickets/TicketList";
import { useTicketList, useMyTicketList } from "@/hooks/useTicketData";
import { useStore } from "@/lib/store";
import { 
  isAdmin, 
  isEmployee, 
  canViewAllTickets, 
  canViewOnlyAssignedTickets,
  logUserState 
} from "@/lib/auth-validation";
import { Plus } from "lucide-react";
import type { TicketStatus } from "@/lib/types";

export default function TicketsPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>();

  // Debug: Log user object to verify role
  useEffect(() => {
    console.log("========================================");
    console.log("[TicketsPage] 🎫 TICKETS PAGE RENDER");
    console.log("========================================");
    console.log("[TicketsPage] User from Zustand Store:");
    console.log(JSON.stringify(user, null, 2));
    console.log("[TicketsPage] � Extracted Fields:");
    console.log("  - id:", user?.id);
    console.log("  - email:", user?.email);
    console.log("  - role:", user?.role);
    console.log("  - department:", user?.department);
    console.log("[TicketsPage] ⚠️ CRITICAL - Role value:", user?.role);
    console.log("========================================");
  }, [user]);

  // Log comprehensive user state for debugging
  useEffect(() => {
    logUserState("Tickets Page", user);
  }, [user]);
  
  // Use validation utilities for role checking
  const userIsAdmin = isAdmin(user);
  const userIsEmployee = isEmployee(user);
  const shouldFetchAllTickets = canViewAllTickets(user);
  const shouldUseMyTickets = canViewOnlyAssignedTickets(user);

  // Debug: Log role checks
  useEffect(() => {
    console.log("========================================");
    console.log("[TicketsPage] 🎯 Access Control:");
    console.log("  - userId:", user?.id);
    console.log("  - role:", user?.role);
    console.log("  - userIsAdmin:", userIsAdmin);
    console.log("  - userIsEmployee:", userIsEmployee);
    console.log("  - shouldFetchAllTickets:", shouldFetchAllTickets);
    console.log("  - shouldUseMyTickets:", shouldUseMyTickets);
    console.log("========================================");
  }, [userIsAdmin, userIsEmployee, shouldFetchAllTickets, shouldUseMyTickets, user?.id, user?.role]);

  // Use appropriate hook based on role - conditionally fetch tickets
  // For employees: only fetch their assigned tickets
  // For admins: fetch all tickets
  
  console.log("[TicketsPage] 📊 Calling useTicketList with enabled:", shouldFetchAllTickets);
  console.log("[TicketsPage] 📊 Calling useMyTicketList for employee");
  
  const { data: allTickets = [], isLoading: isLoadingAll } = useTicketList({
    status: statusFilter,
    enabled: shouldFetchAllTickets, // Only fetch all tickets for admins
  });
  
  const { data: myTickets = [], isLoading: isLoadingMy } = useMyTicketList();

  // Debug: Log tickets data
  useEffect(() => {
    console.log("[TicketsPage] 📊 TICKETS DATA:");
    console.log("  - isEmployee:", isEmployee);
    console.log("  - isAdmin:", isAdmin);
    console.log("  - All tickets count:", allTickets.length);
    console.log("  - My tickets count:", myTickets.length);
    console.log("  - user.id:", user?.id);
    if (allTickets.length > 0) {
      console.log("  - Sample all ticket:", allTickets[0]);
    }
    if (myTickets.length > 0) {
      console.log("  - Sample my ticket:", myTickets[0]);
    }
  }, [allTickets.length, myTickets.length, isEmployee, isAdmin, user?.id, allTickets, myTickets]);

  // Select the correct data and loading state - ALWAYS use myTickets for employees
  const tickets = shouldUseMyTickets ? myTickets : allTickets;
  const isLoading = shouldUseMyTickets ? isLoadingMy : isLoadingAll;

  // Debug: Log final tickets selection
  useEffect(() => {
    console.log("[TicketsPage] ✅ FINAL SELECTION:");
    console.log("  - Using:", shouldUseMyTickets ? "myTickets" : "allTickets");
    console.log("  - Count:", tickets.length);
    console.log("  - isLoading:", isLoading);
    if (tickets.length > 0) {
      console.log("  - First ticket assignedTo:", tickets[0].assignedTo);
      console.log("  - Current user.id:", user?.id);
      console.log("  - Match:", tickets[0].assignedTo === user?.id);
    }
  }, [shouldUseMyTickets, tickets.length, isLoading, tickets, user?.id]);

  // Check if user can create tickets - only admins
  const canCreateTicket = userIsAdmin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Complaints</h1>
          <p className="text-muted-foreground mt-2">
            {userIsEmployee 
              ? "View complaints assigned to you" 
              : "View and manage all service complaints"}
          </p>
        </div>
        {userIsAdmin && (
          <Button onClick={() => router.push("/create-complaint")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Complaint
          </Button>
        )}
      </div>

      <TicketList
        tickets={tickets}
        isLoading={isLoading}
        showActions={user?.role === "admin" || user?.role === "full_developer_admin"}
      />
    </div>
  );
}
