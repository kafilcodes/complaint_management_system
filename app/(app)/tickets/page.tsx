/**
 * TICKETS PAGE
 * 
 * Displays a list of all tickets (admin) or assigned tickets (technician).
 * 
 * @module app/(app)/tickets/page
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TicketList } from "@/components/tickets/TicketList";
import { useTickets } from "@/hooks/use-tickets";
import { useStore } from "@/lib/store";
import { Plus } from "lucide-react";

export default function TicketsPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // Fetch tickets based on user role
  const { data: tickets = [], isLoading } = useTickets({
    status: statusFilter,
    limit: 50,
  });

  // Check if user can create tickets
  const canCreateTicket = user?.role !== "it_technician";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-muted-foreground mt-2">
            View and manage service tickets
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
