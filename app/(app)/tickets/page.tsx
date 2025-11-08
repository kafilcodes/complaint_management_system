/**
 * TICKETS PAGE
 * 
 * Displays a list of all tickets (admin) or assigned tickets (technician).
 * Now using real-time Firestore onSnapshot listeners for instant updates.
 * 
 * @module app/(app)/tickets/page
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TicketList } from "@/components/tickets/TicketList";
import { useTicketList, useMyTicketList } from "@/hooks/useTicketData";
import { useStore } from "@/lib/store";
import { Plus } from "lucide-react";
import type { TicketStatus } from "@/lib/types";

export default function TicketsPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>();

  // Determine if user is admin or technician
  const isAdmin = user?.role === "it_admin" || user?.role === "full_developer_admin";
  const isTechnician = user?.role === "it_technician";

  // Use appropriate hook based on role
  const { data: allTickets = [], isLoading: isLoadingAll } = useTicketList({
    status: statusFilter,
  });
  
  const { data: myTickets = [], isLoading: isLoadingMy } = useMyTicketList();

  // Select the correct data and loading state
  const tickets = isTechnician ? myTickets : allTickets;
  const isLoading = isTechnician ? isLoadingMy : isLoadingAll;

  // Check if user can create tickets
  const canCreateTicket = user?.role !== "it_technician";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-muted-foreground mt-2">
            {isTechnician 
              ? "View tickets assigned to you" 
              : "View and manage all service tickets"}
          </p>
        </div>
        {canCreateTicket && (
          <Button onClick={() => router.push("/create-ticket")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Button>
        )}
      </div>

      <TicketList
        tickets={tickets}
        isLoading={isLoading}
        showActions={user?.role === "it_admin" || user?.role === "full_developer_admin"}
      />
    </div>
  );
}
