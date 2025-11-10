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
import { Timeline } from "@/components/ui/timeline";
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
  Share2,
  Plus,
  UserCheck,
  Edit,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
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

  // Format timeline events for display
  const timelineData = ticket?.timeline?.map((event) => {
    const iconMap = {
      created: <Plus className="h-4 w-4" />,
      assigned: <UserCheck className="h-4 w-4" />,
      updated: <Edit className="h-4 w-4" />,
      resolved: <CheckCircle className="h-4 w-4" />,
      comment: <MessageSquare className="h-4 w-4" />,
    };

    return {
      title: event.event.charAt(0).toUpperCase() + event.event.slice(1),
      timestamp: formatDateTime(event.timestamp),
      icon: iconMap[event.event] || <Clock className="h-4 w-4" />,
      content: (
        <div className="space-y-2">
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base font-normal">
            {event.message || `Ticket ${event.event}`}
          </p>
          {event.details && Object.keys(event.details).length > 0 && (
            <div className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 space-y-1">
              {event.details.status && (
                <p>Status: <span className="font-medium">{event.details.status}</span></p>
              )}
              {event.details.from !== undefined && event.details.to !== undefined && (
                <p>
                  {event.details.from ? `Reassigned from: ${event.details.from}` : 'Assigned to technician'}
                </p>
              )}
              {event.details.serviceRating && (
                <p>Service Rating: <span className="font-medium">{event.details.serviceRating}/5</span></p>
              )}
              {event.details.productSerial && (
                <p>Product Serial: <span className="font-medium">{event.details.productSerial}</span></p>
              )}
            </div>
          )}
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            {event.userName || 'System'} • {getRelativeTime(event.timestamp)}
          </p>
        </div>
      ),
    };
  }) || [];

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

  const handleShare = async () => {
    if (!ticket) return;

    const shareText = `
🎫 Ticket #${ticket.id}

📦 Product: ${ticket.productName}${ticket.productModel ? ` (${ticket.productModel})` : ''}
🏢 Brand: ${brandLabel}
📋 Status: ${getLabelByValue(TICKET_STATUSES, ticket.status)}

👤 Customer: ${ticket.customerName}
📞 Phone: ${ticket.customerPhone}
${ticket.address ? `📍 Address: ${ticket.address}${ticket.pincode ? ` - ${ticket.pincode}` : ''}` : ''}

❗ Issue Description:
${ticket.issueDescription}

🗓️ Created: ${formatDateTime(ticket.createdAt)}
${ticket.assignedTo ? `👨‍🔧 Assigned to technician` : '⚠️ Unassigned'}
    `.trim();

    // Try Web Share API first (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket #${ticket.id} - ${ticket.productName}`,
          text: shareText,
        });
        toast.success("Shared successfully!");
        return;
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        } else {
          return; // User cancelled, don't show fallback
        }
      }
    }

    // Fallback: Show WhatsApp/Email options
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(`Ticket #${ticket.id} - ${ticket.productName}`)}&body=${encodeURIComponent(shareText)}`;

    // Simple dialog for desktop users
    const useWhatsApp = confirm("Share ticket via:\n\nOK = WhatsApp\nCancel = Email");
    if (useWhatsApp) {
      window.open(whatsappUrl, "_blank");
      toast.success("Opening WhatsApp...");
    } else {
      window.location.href = emailUrl;
      toast.success("Opening email client...");
    }
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
        <Button
          variant="outline"
          onClick={handleShare}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
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

      {/* Activity Timeline */}
      {timelineData.length > 0 && (
        <div className="mt-12">
          <Timeline data={timelineData} />
        </div>
      )}
    </div>
  );
}
