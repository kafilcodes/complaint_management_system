"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useTicket, useDeleteTicket, useUpdateTicket } from "@/hooks/use-tickets";
import { useUser, useUsers } from "@/hooks/use-users";
import { useResolveTicket } from "@/hooks/use-resolution";
import { useStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Timeline } from "@/components/ui/timeline";
import { Combobox } from "@/components/ui/combobox";
import { ResolutionForm } from "@/components/tickets/ResolutionForm";
import { ResolutionDetails } from "@/components/tickets/ResolutionDetails";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  CircleDot,
  Download,
  ExternalLink,
  Paperclip,
  Trash2,
  Mail,
  Building2,
  Wrench,
  AlertTriangle,
  X,
  Loader2,
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
  const { data: assignedEmployee } = useUser(ticket?.assignedTo || null);
  const { data: allUsers = [], isLoading: usersLoading } = useUsers();
  const resolveTicketMutation = useResolveTicket();
  const deleteTicketMutation = useDeleteTicket();
  const updateTicketMutation = useUpdateTicket(id);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  const statusColor = ticket ? getColorByValue(TICKET_STATUSES, ticket.status) : "";
  const brandLabel = ticket ? getLabelByValue(BRANDS, ticket.brand) : "";

  // Check if user is admin
  const isAdmin = user && (user.role === "full_developer_admin" || user.role === "it_admin");

  // Prepare employee options for reassignment
  const employeeOptions = allUsers
    .filter((u) => 
      u.role === "it_technician" || 
      u.role === "it_admin" ||
      u.role === "full_developer_admin"
    )
    .map((u) => ({
      value: u.id,
      label: u.name,
      email: u.email,
      department: (u as any).department || "IT Department",
      photoURL: (u as any).photoURL,
    }));

  // Helper to get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Debug: Check if timeline exists
  console.log("[TicketDetail] Ticket data:", ticket);
  console.log("[TicketDetail] Timeline data:", ticket?.timeline);

  // Format timeline events for display
  const timelineData = ticket?.timeline?.map((event) => {
    const iconMap = {
      created: <Plus className="h-4 w-4" />,
      assigned: <UserCheck className="h-4 w-4" />,
      updated: <Edit className="h-4 w-4" />,
      resolved: <CheckCircle className="h-4 w-4" />,
      comment: <MessageSquare className="h-4 w-4" />,
    };

    // Enhanced message for assigned event
    let displayMessage = event.message || `Ticket ${event.event}`;
    if (event.event === "assigned" && assignedEmployee) {
      const firstName = assignedEmployee.name.split(" ")[0];
      displayMessage = `Ticket assigned to technician (${firstName})`;
    }

    return {
      title: event.event.charAt(0).toUpperCase() + event.event.slice(1),
      timestamp: formatDateTime(event.timestamp),
      icon: iconMap[event.event] || <Clock className="h-4 w-4" />,
      content: (
        <div className="space-y-2">
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base font-normal">
            {displayMessage}
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

  // Check if current user can delete this ticket (admin only)
  const canDelete = user && (user.role === "full_developer_admin" || user.role === "it_admin");

  const handleResolve = async (data: any) => {
    try {
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
      toast.success("Ticket resolved successfully!");
      router.push("/tickets");
    } catch (error) {
      console.error("Error resolving ticket:", error);
      toast.error("Failed to resolve ticket");
    }
  };

  const handleDeleteTicket = async () => {
    try {
      await deleteTicketMutation.mutateAsync(id);
      toast.success("Ticket deleted successfully!");
      router.push("/tickets");
    } catch (error) {
      console.error("Error deleting ticket:", error);
      // Error toast is already shown by the mutation
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleReassignEmployee = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    if (selectedEmployee === ticket?.assignedTo) {
      toast.error("Ticket is already assigned to this employee");
      return;
    }

    setIsReassigning(true);
    try {
      await updateTicketMutation.mutateAsync({
        assignedTo: selectedEmployee,
      });
      
      toast.success("Employee reassigned successfully!");
      
      // Refresh the page to see updated data
      router.refresh();
      
      // Reset the selection
      setSelectedEmployee("");
    } catch (error: any) {
      console.error("Error reassigning employee:", error);
      toast.error(error.message || "Failed to reassign employee");
    } finally {
      setIsReassigning(false);
    }
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={cn("text-sm px-3 py-1.5 font-semibold flex items-center gap-1.5", statusColor)}>
                <CircleDot className="h-4 w-4" />
                {getLabelByValue(TICKET_STATUSES, ticket.status)}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {brandLabel}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{ticket.productName}</h1>
            <p className="text-sm text-muted-foreground mt-1">Ticket ID: #{ticket.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleShare}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          {canDelete && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Delete Ticket"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Name</p>
                  <p className="font-semibold text-base">{ticket.customerName}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Phone Number</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-base">{ticket.customerPhone}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 hover:text-[#40e0d0]"
                        onClick={() => window.location.href = `tel:${ticket.customerPhone}`}
                      >
                        <Phone className="h-3 w-3 hover:text-[#40e0d0]" />
                        Call
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 hover:text-[#40e0d0]"
                        onClick={() => window.location.href = `sms:${ticket.customerPhone}`}
                      >
                        <MessageSquare className="h-3 w-3 hover:text-[#40e0d0]" />
                        Message
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                  <p className="font-medium text-sm leading-relaxed">
                    {ticket.address}
                    {ticket.pincode && <span className="block text-xs text-muted-foreground mt-1">Pincode: {ticket.pincode}</span>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Product</p>
                  <p className="font-semibold text-base">
                    {ticket.productName}
                  </p>
                  {ticket.productModel && (
                    <p className="text-sm text-muted-foreground mt-1">Model: {ticket.productModel}</p>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Purchase Date</p>
                  <p className="font-semibold text-sm">{formatDateTime(ticket.purchaseDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issue Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Issue Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{ticket.issueDescription}</p>
              {ticket.comments && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Additional Comments</p>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{ticket.comments}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Attachments ({ticket.attachmentUrls.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {ticket.attachmentUrls.map((url, index) => {
                    const fileName = url.split('/').pop()?.split('?')[0] || `attachment-${index + 1}`;
                    const fileExtension = fileName.split('.').pop()?.toLowerCase();
                    const isPDF = fileExtension === 'pdf';
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(fileExtension || '');
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="rounded-md bg-primary/10 p-2">
                            <Paperclip className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {isPDF ? 'PDF Document' : isImage ? 'Image' : 'File'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => window.open(url, '_blank')}
                            title="Open in new tab"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = fileName;
                              link.click();
                            }}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

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

        {/* Sidebar - Timeline on Desktop */}
        <div className="space-y-6 order-1 lg:order-2">
          {/* Activity Timeline - Desktop & Tablet */}
          <div className="hidden lg:block">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {timelineData && timelineData.length > 0 ? (
                  <div className="relative space-y-4 pb-4">
                    {/* Vertical beam line */}
                    <div className="absolute left-[9px] top-2 bottom-0 w-[2px] bg-gradient-to-b from-primary/60 via-primary/40 to-transparent" />
                    
                    {timelineData.map((item, index) => (
                      <div key={index} className="relative pl-8 pb-4 last:pb-0">
                        {/* Node */}
                        <div className="absolute left-0 top-1 h-5 w-5 rounded-full border-2 border-primary bg-background flex items-center justify-center shadow-sm shadow-primary/20">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        </div>
                        
                        {/* Content */}
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-foreground leading-tight">
                              {item.title}
                            </h4>
                          </div>
                          
                          {item.timestamp && (
                            <p className="text-xs text-muted-foreground">
                              {item.timestamp}
                            </p>
                          )}
                          
                          <div className="text-xs leading-relaxed text-muted-foreground">
                            {item.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">
                    No activity recorded yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Assigned Employee Card or Actions Card */}
          {ticket.assignedTo && assignedEmployee ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Assigned To
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    {(assignedEmployee as any).photoURL && (
                      <AvatarImage src={(assignedEmployee as any).photoURL} alt={assignedEmployee.name} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(assignedEmployee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="font-semibold text-sm leading-tight">{assignedEmployee.name}</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{assignedEmployee.email}</span>
                      </div>
                      {(assignedEmployee as any).department && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{(assignedEmployee as any).department}</span>
                        </div>
                      )}
                      {assignedEmployee.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{assignedEmployee.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {assignedEmployee.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <a href={`tel:${assignedEmployee.phone}`} className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4" />
                        Call
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a 
                      href={`mailto:${assignedEmployee.email}?subject=${encodeURIComponent(`Ticket #${ticket.id.slice(0, 8)} - ${ticket.productName}`)}&body=${encodeURIComponent(`Hi ${assignedEmployee.name.split(' ')[0]},\n\nI'm reaching out regarding the following ticket:\n\nTicket ID: ${ticket.id}\nProduct: ${ticket.productName}\nCustomer: ${ticket.customerName}\nStatus: ${ticket.status}\nIssue: ${ticket.issueDescription}\n\nPlease let me know if you need any additional information.\n\nBest regards`)}`}
                      className="flex items-center justify-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : !canResolve && ticket.status === "open" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This ticket needs to be assigned to a technician
                </p>
              </CardContent>
            </Card>
          )}

          {/* Reassign Employee Section - Admin Only */}
          {isAdmin && ticket.status === "open" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  {ticket.assignedTo ? "Reassign Employee" : "Assign Employee"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {ticket.assignedTo 
                    ? "Reassign this ticket to a different employee" 
                    : "Assign this ticket to an employee"}
                </p>
                
                <Combobox
                  options={employeeOptions}
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                  placeholder="Select an employee..."
                  searchPlaceholder="Search by name, email, or department..."
                  emptyText="No employees found."
                  disabled={usersLoading || isReassigning}
                  searchFields={["label", "email", "department"]}
                  renderOption={(option) => (
                    <div className="flex items-center gap-2 sm:gap-3 w-full py-1 sm:py-0">
                      <Avatar className="h-7 w-7 sm:h-9 sm:w-9 flex-shrink-0">
                        {option.photoURL && (
                          <AvatarImage src={option.photoURL} alt={option.label} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {option.label.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-semibold text-xs sm:text-sm truncate">{option.label}</span>
                        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground flex-wrap mt-0.5">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{option.department}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{option.email}</span>
                          </span>
                        </div>
                        {/* Mobile: Show only department */}
                        <div className="flex sm:hidden items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{option.department}</span>
                        </div>
                      </div>
                    </div>
                  )}
                />

                <Button
                  onClick={handleReassignEmployee}
                  disabled={!selectedEmployee || isReassigning || usersLoading}
                  className="w-full"
                >
                  {isReassigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {ticket.assignedTo ? "Reassigning..." : "Assigning..."}
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      {ticket.assignedTo ? "Reassign Employee" : "Assign Employee"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Activity Timeline - Mobile (Bottom) */}
      <div className="lg:hidden mt-8">
        {timelineData && timelineData.length > 0 ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative space-y-4 pb-2">
                {/* Vertical beam line */}
                <div className="absolute left-[9px] top-2 bottom-0 w-[2px] bg-gradient-to-b from-primary/60 via-primary/40 to-transparent" />
                
                {timelineData.map((item, index) => (
                  <div key={index} className="relative pl-8 pb-4 last:pb-0">
                    {/* Node */}
                    <div className="absolute left-0 top-1 h-5 w-5 rounded-full border-2 border-primary bg-background flex items-center justify-center shadow-sm shadow-primary/20">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-foreground leading-tight">
                          {item.title}
                        </h4>
                      </div>
                      
                      {item.timestamp && (
                        <p className="text-xs text-muted-foreground">
                          {item.timestamp}
                        </p>
                      )}
                      
                      <div className="text-xs leading-relaxed text-muted-foreground">
                        {item.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No activity recorded for this ticket yet. Timeline will appear as events occur.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Ticket
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
              All associated data including attachments and timeline will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTicket}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2"
              disabled={deleteTicketMutation.isPending}
            >
              {deleteTicketMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {deleteTicketMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
