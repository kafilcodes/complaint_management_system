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
  ExternalLink,
  CircleDot,
  CheckCircle,
  XCircle,
  AlertCircle,
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

  // Map status to icons
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <CircleDot className="h-3.5 w-3.5" />;
      case "closed":
        return <CheckCircle className="h-3.5 w-3.5" />;
      case "cancelled":
        return <XCircle className="h-3.5 w-3.5" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5" />;
    }
  };

  return (
    <Link href={`/tickets/${ticket.id}`} className="block group">
      <Card className="hover:shadow-lg transition-all hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className={cn("text-xs flex items-center gap-1.5", statusColor)}>
                  {getStatusIcon(ticket.status)}
                  {getLabelByValue(TICKET_STATUSES, ticket.status)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {brandLabel}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                {ticket.productName}
              </h3>
              {ticket.productModel && (
                <p className="text-sm text-muted-foreground mt-1">
                  Model: {ticket.productModel}
                </p>
              )}
            </div>
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
              onClick={(e) => {
                e.preventDefault();
                onAssign(ticket.id);
              }}
              className="flex-1"
            >
              Assign
            </Button>
          )}
          {ticket.status === "open" && ticket.assignedTo && onResolve && (
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onResolve(ticket.id);
              }}
              className="flex-1"
            >
              Resolve
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1">
            View Details
          </Button>
        </CardFooter>
      )}
    </Card>
    </Link>
  );
}
