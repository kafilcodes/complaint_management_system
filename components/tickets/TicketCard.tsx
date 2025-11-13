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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  UserCheck,
} from "lucide-react";
import type { Ticket } from "@/lib/types";
import { formatDateTime, getRelativeTime } from "@/firebase/firestore-helpers";
import { TICKET_STATUSES, BRANDS, getLabelByValue, getColorByValue } from "@/lib/configuration";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-users";

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
  
  // Fetch assigned employee data if ticket is assigned
  const { data: assignedEmployee } = useUser(ticket.assignedTo || null);

  // Helper to get user initials
  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

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
    <Link href={`/complaints/${ticket.id}`} className="block group">
      <Card className="hover:shadow-lg transition-all hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 h-full">
        <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                <Badge className={cn("text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 py-0.5", statusColor)}>
                  {getStatusIcon(ticket.status)}
                  {getLabelByValue(TICKET_STATUSES, ticket.status)}
                </Badge>
                <Badge variant="outline" className="text-[10px] sm:text-xs py-0.5">
                  {brandLabel}
                </Badge>
              </div>
              <h3 className="text-sm sm:text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                {ticket.productName}
              </h3>
              {ticket.productModel && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  Model: {ticket.productModel}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

      <CardContent className="space-y-2 sm:space-y-3 pb-2 sm:pb-3 p-4 sm:p-6 pt-0">
        {/* Customer Info */}
        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
            <User className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">{ticket.customerName}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
            <Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span>{ticket.customerPhone}</span>
          </div>
          {ticket.address && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">{ticket.address}</span>
            </div>
          )}
        </div>

        {/* Issue Description */}
        <div className="pt-1.5 sm:pt-2 border-t">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {ticket.issueDescription}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground pt-1.5 sm:pt-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{getRelativeTime(ticket.createdAt)}</span>
          </div>
          {ticket.assignedTo && assignedEmployee && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-primary">
              <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                {(assignedEmployee as any).photoURL && (
                  <AvatarImage src={(assignedEmployee as any).photoURL} alt={assignedEmployee.name} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-[8px] sm:text-[10px] font-semibold">
                  {getInitials(assignedEmployee.name)}
                </AvatarFallback>
              </Avatar>
              <UserCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="truncate max-w-[100px] sm:max-w-[150px]">
                {assignedEmployee.name}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="gap-2 pt-2 sm:pt-3 border-t p-4 sm:p-6">
          {!ticket.assignedTo && onAssign && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onAssign(ticket.id);
              }}
              className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
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
              className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
            >
              Resolve
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm h-8 sm:h-9">
            View Details
          </Button>
        </CardFooter>
      )}
    </Card>
    </Link>
  );
}
