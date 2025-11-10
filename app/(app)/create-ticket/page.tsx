"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateTicket } from "@/hooks/useTicketData";
import { useBrandList } from "@/hooks/useConfig";
import { useUsers } from "@/hooks/useUsers";
import { Loader2, ArrowLeft, Wrench, Upload, X, FileIcon } from "lucide-react";
import type { TicketCreateInput } from "@/lib/types";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";
import { uploadFiles } from "@/lib/upload-helpers";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/client";

// Form validation schema
const ticketFormSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address is required"),
  pincode: z.string().min(5, "Pincode must be at least 5 characters"),
  productName: z.string().min(2, "Product name is required"),
  productModel: z.string().min(1, "Product model is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  brand: z.string().min(1, "Brand is required"),
  issueDescription: z.string().min(10, "Issue description must be at least 10 characters"),
  comments: z.string().optional(),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  assignedTo: z.string().min(1, "Please assign this ticket to a technician"),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

export default function CreateTicketPage() {
  const router = useRouter();
  const createTicket = useCreateTicket();
  
  // File attachments state (max 3 files, max 10MB each)
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Fetch brands from Firestore with 24-hour cache
  const { data: brands = [], isLoading: brandsLoading } = useBrandList();
  
  // Fetch technicians for assignee combobox
  const { data: allUsers = [], isLoading: usersLoading } = useUsers({ role: "it_technician" });
  const technicians = allUsers;

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      address: "",
      pincode: "",
      productName: "",
      productModel: "",
      purchaseDate: "",
      brand: "",
      issueDescription: "",
      comments: "",
      link: "",
      assignedTo: "",
    },
  });

  async function onSubmit(values: TicketFormValues) {
    try {
      setIsUploading(true);
      
      // Step 1: Create the ticket first
      const ticketData: TicketCreateInput = {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        address: values.address,
        pincode: values.pincode,
        productName: values.productName,
        productModel: values.productModel,
        purchaseDate: new Date(values.purchaseDate),
        brand: values.brand,
        issueDescription: values.issueDescription,
        comments: values.comments,
        assignedTo: values.assignedTo || undefined,
      };

      const result = await createTicket.mutateAsync(ticketData);
      
      // Step 2: Upload attachments if any
      if (attachments.length > 0 && result?.ticketId) {
        toast.info(`Uploading ${attachments.length} file(s)...`);
        
        const ticketId = result.ticketId;
        const storagePath = `ticket-attachments/${ticketId}`;
        
        try {
          // Upload files to Firebase Storage
          const downloadURLs = await uploadFiles(attachments, storagePath);
          
          // Step 3: Update the ticket document with attachment URLs
          const ticketRef = doc(db, "tickets", ticketId);
          await updateDoc(ticketRef, {
            attachmentUrls: downloadURLs,
            updatedAt: new Date(),
          });
          
          toast.success(`Ticket created with ${downloadURLs.length} attachment(s)`);
        } catch (uploadError) {
          console.error("Error uploading attachments:", uploadError);
          toast.warning("Ticket created but attachments failed to upload");
        }
      } else {
        toast.success("Ticket created successfully");
      }
      
      // Navigate to tickets page on success
      router.push("/tickets");
    } catch (error) {
      // Error handling is done in the hook
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    } finally {
      setIsUploading(false);
    }
  }
  
  // Convert technicians to combobox options
  const technicianOptions: ComboboxOption[] = technicians.map((tech) => ({
    value: tech.id,
    label: tech.name,
    email: tech.email,
    role: tech.role,
  }));

  return (
    <div className="container mx-auto py-6">
    {/* Left Column: Form */}
    <div className="flex-1 max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            
        <div>
          <h1 className="text-3xl font-bold">Create New Ticket</h1>
          <p className="text-muted-foreground mt-2">
            Fill in the details to create a new service ticket
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="123 Main St, City, State" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a brand" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brandsLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading brands...
                          </SelectItem>
                        ) : (
                          brands.map((brand) => (
                            <SelectItem key={brand.value} value={brand.value}>
                              {brand.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Point of Sale System" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Model <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., POS-2024-X" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Assignment & Link */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment & Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Technician <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Combobox
                        options={technicianOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select a technician..."
                        searchPlaceholder="Search technicians..."
                        emptyText="No technicians found."
                        disabled={usersLoading}
                        renderOption={(option) => (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                <Wrench className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{option.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {option.email}
                              </span>
                            </div>
                          </div>
                        )}
                      />
                    </FormControl>
                    <FormDescription>
                      Select a technician to assign this ticket to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Link (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="url"
                        placeholder="https://example.com/reference" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Add a reference link related to this ticket
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Issue Details */}
          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="issueDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Description <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the issue in detail..."
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed description of the problem
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Comments (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <FileUpload
                  onChange={(files) => setAttachments(files)}
                  maxFiles={3}
                  maxSize={10 * 1024 * 1024} // 10MB
                  accept={{
                    "image/*": [".png", ".jpg", ".jpeg", ".gif"],
                    "application/pdf": [".pdf"],
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Upload up to 3 files (images or PDFs, max 10MB each)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={createTicket.isPending || isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTicket.isPending || isUploading}>
              {(createTicket.isPending || isUploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isUploading ? "Uploading..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  </div>
  );
}
