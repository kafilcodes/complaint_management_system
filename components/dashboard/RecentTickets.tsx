"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Clock, User, Plus, CircleDot, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TICKET_STATUSES, getLabelByValue, getColorByValue } from "@/lib/configuration";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";

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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Tickets</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tickets">
            View all
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {tickets.map((ticket) => {
          const statusColor = getColorByValue(TICKET_STATUSES, ticket.status);
          const timeAgo = formatDistanceToNow(new Date(ticket.createdAt), {
            addSuffix: true,
          });

          return (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="block group"
            >
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {ticket.productName}
                    </p>
                    <Badge className={cn("text-xs flex items-center gap-1", statusColor)}>
                      {getStatusIcon(ticket.status)}
                      {getLabelByValue(TICKET_STATUSES, ticket.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">{ticket.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
