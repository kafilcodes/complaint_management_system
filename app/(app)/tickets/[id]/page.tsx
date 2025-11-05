"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useTicket } from "@/hooks/use-tickets";
import { useResolveTicket } from "@/hooks/use-resolution";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ResolutionForm } from "@/components/tickets/ResolutionForm";
import { ResolutionDetails } from "@/components/tickets/ResolutionDetails";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Package,
  Calendar,
  Clock,
  CheckCircle,
} from "lucide-react";
import { formatDateTime, getRelativeTime } from "@/firebase/firestore-helpers";
import { TICKET_STATUSES, BRANDS, getLabelByValue, getColorByValue } from "@/lib/configuration";
import { cn } from "@/lib/utils";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const user = useStore((state) => state.user);
  const { data: ticket, isLoading } = useTicket(id);
  const resolveTicketMutation = useResolveTicket();

  const statusColor = ticket ? getColorByValue(TICKET_STATUSES, ticket.status) : "";
  const brandLabel = ticket ? getLabelByValue(BRANDS, ticket.brand) : "";

  // Check if current user can resolve this ticket
  const canResolve =
    ticket &&
    ticket.status === "open" &&
    user &&
    ((user.role === "it_technician" && ticket.assignedTo === user.id) ||
      user.role === "it_admin" ||
      user.role === "full_developer_admin");

  const handleResolve = async (data: any) => {
    await resolveTicketMutation.mutateAsync({
      ticketId: id,
      data: {
        productSerial: data.productSerial,
        serviceRating: data.serviceRating,
        feedbackText: data.feedbackText,
        productImage: data.productImage,
        warrantyCard: data.warrantyCard,
        partConsumedImage: data.partConsumedImage,
      },
    });
    router.push("/tickets");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">Ticket not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn("text-xs", statusColor)}>
              {getLabelByValue(TICKET_STATUSES, ticket.status)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {brandLabel}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{ticket.productName}</h1>
          <p className="text-muted-foreground mt-1">Ticket ID: {ticket.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{ticket.customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{ticket.customerPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {ticket.address}
                    {ticket.pincode && ` - ${ticket.pincode}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">
                    {ticket.productName} {ticket.productModel && `- ${ticket.productModel}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Purchase Date</p>
                  <p className="font-medium">{formatDateTime(ticket.purchaseDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issue Details */}
          <Card>
            <CardHeader>
              <CardTitle>Issue Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{ticket.issueDescription}</p>
              {ticket.comments && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Additional Comments</p>
                    <p className="text-sm text-muted-foreground">{ticket.comments}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Resolution Form (for open tickets assigned to current user) */}
          {canResolve && (
            <ResolutionForm
              ticketId={ticket.id}
              onSubmit={handleResolve}
              isSubmitting={resolveTicketMutation.isPending}
            />
          )}

          {/* Resolution Details (for closed tickets) */}
          {ticket.status === "closed" && (
            <ResolutionDetails 
              ticketId={ticket.id}
              resolvedBy={ticket.assignedTo || "Unknown"}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {getRelativeTime(ticket.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(ticket.createdAt)}
                  </p>
                </div>
              </div>

              {ticket.assignedAt && (
                <div className="flex gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Assigned</p>
                    <p className="text-sm text-muted-foreground">
                      {getRelativeTime(ticket.assignedAt)}
                    </p>
                  </div>
                </div>
              )}

              {ticket.closedAt && (
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Closed</p>
                    <p className="text-sm text-muted-foreground">
                      {getRelativeTime(ticket.closedAt)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {!canResolve && ticket.status === "open" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {ticket.assignedTo
                    ? "This ticket is assigned to a technician"
                    : "This ticket needs to be assigned"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
