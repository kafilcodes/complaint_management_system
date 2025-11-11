"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Clock, User, Plus, CircleDot, CheckCircle, XCircle, AlertCircle, UserCircle, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TICKET_STATUSES, getLabelByValue, getColorByValue } from "@/lib/configuration";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { useUser } from "@/hooks/use-users";

interface RecentTicket {
  id: string;
  productName: string;
  customerName: string;
  status: string;
  createdAt: string;
  assignedTo: string | null;
}

interface RecentTicketsProps {
  tickets: RecentTicket[];
  isLoading?: boolean;
}

// Separate component for ticket row to use hooks
function TicketRow({ ticket, getStatusIcon }: { ticket: RecentTicket; getStatusIcon: (status: string) => React.ReactElement }) {
  const { data: assignedEmployee } = useUser(ticket.assignedTo);
  const statusColor = getColorByValue(TICKET_STATUSES, ticket.status);
  const timeAgo = formatDistanceToNow(new Date(ticket.createdAt), {
    addSuffix: true,
  });

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="block group"
    >
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all">
        {/* Assigned Employee Avatar */}
        <div className="flex-shrink-0">
          {ticket.assignedTo && assignedEmployee ? (
            <Avatar className="h-9 w-9">
              {(assignedEmployee as any).photoURL && (
                <AvatarImage src={(assignedEmployee as any).photoURL} alt={assignedEmployee.name} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {getInitials(assignedEmployee.name)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {ticket.productName}
            </p>
            <Badge className={cn("text-xs flex items-center gap-1 flex-shrink-0 h-fit", statusColor)}>
              {getStatusIcon(ticket.status)}
              {getLabelByValue(TICKET_STATUSES, ticket.status)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate max-w-[150px]">{ticket.customerName}</span>
            </div>
            {ticket.assignedTo && assignedEmployee && (
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                <span className="truncate max-w-[120px] text-primary">{assignedEmployee.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">{timeAgo}</span>
            </div>
          </div>
        </div>

        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </div>
    </Link>
  );
}

export function RecentTickets({ tickets, isLoading }: RecentTicketsProps) {
  // Map status to icons
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <CircleDot className="h-3 w-3" />;
      case "closed":
        return <CheckCircle className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            imageUrl="/create_tickets.svg"
            title="No Recent Tickets"
            description="Create a new ticket to see it appear here. Track and manage all your service requests in one place."
            cta={
              <Button asChild>
                <Link href="/create-ticket">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-2">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">Recent Tickets</CardTitle>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
          <Link href="/tickets" className="flex items-center gap-1.5">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {tickets.slice(0, 5).map((ticket) => (
          <TicketRow key={ticket.id} ticket={ticket} getStatusIcon={getStatusIcon} />
        ))}
      </CardContent>
    </Card>
  );
}
