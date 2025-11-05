/**
 * Ticket Card Component
 * 
 * Displays a single ticket in a card format with status, priority, and actions.
 * Used in ticket lists and dashboards.
 */

"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  User, 
  Package, 
  MapPin,
  Phone,
  Calendar,
  ExternalLink 
} from "lucide-react";
import type { Ticket } from "@/lib/types";
import { formatDateTime, getRelativeTime } from "@/firebase/firestore-helpers";
import { TICKET_STATUSES, BRANDS, getLabelByValue, getColorByValue } from "@/lib/configuration";
import { cn } from "@/lib/utils";

interface TicketCardProps {
  ticket: Ticket;
  showActions?: boolean;
  onAssign?: (ticketId: string) => void;
  onResolve?: (ticketId: string) => void;
}

export function TicketCard({ 
  ticket, 
  showActions = false,
  onAssign,
  onResolve 
}: TicketCardProps) {
  const statusColor = getColorByValue(TICKET_STATUSES, ticket.status);
  const brandLabel = getLabelByValue(BRANDS, ticket.brand);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn("text-xs", statusColor)}>
                {getLabelByValue(TICKET_STATUSES, ticket.status)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {brandLabel}
              </Badge>
            </div>
            <Link 
              href={`/tickets/${ticket.id}`}
              className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1"
            >
              {ticket.productName}
            </Link>
            {ticket.productModel && (
              <p className="text-sm text-muted-foreground mt-1">
                Model: {ticket.productModel}
              </p>
            )}
          </div>
          <Link href={`/tickets/${ticket.id}`}>
            <Button variant="ghost" size="icon">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Customer Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">{ticket.customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{ticket.customerPhone}</span>
          </div>
          {ticket.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{ticket.address}</span>
            </div>
          )}
        </div>

        {/* Issue Description */}
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {ticket.issueDescription}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{getRelativeTime(ticket.createdAt)}</span>
          </div>
          {ticket.assignedTo && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>Assigned</span>
            </div>
          )}
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="gap-2 pt-3 border-t">
          {!ticket.assignedTo && onAssign && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAssign(ticket.id)}
              className="flex-1"
            >
              Assign
            </Button>
          )}
          {ticket.status === "open" && ticket.assignedTo && onResolve && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onResolve(ticket.id)}
              className="flex-1"
            >
              Resolve
            </Button>
          )}
          <Link href={`/tickets/${ticket.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              View Details
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
