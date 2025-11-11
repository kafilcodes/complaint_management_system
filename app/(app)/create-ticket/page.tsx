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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateTicket } from "@/hooks/useTicketData";
import { useBrandList } from "@/hooks/useConfig";
import { useUsers } from "@/hooks/useUsers";
import { useAttachmentUpload } from "@/hooks/use-attachment-upload";
import { useStore } from "@/lib/store";
import { Loader2, ArrowLeft, Wrench, Upload, X, FileIcon, User, MapPin, Package, FileText, Building2, Mail, Phone, Calendar } from "lucide-react";
import type { TicketCreateInput } from "@/lib/types";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";
import { UploadProgressDisplay } from "@/components/ui/upload-progress";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/client";

// Form validation schema
const ticketFormSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address is required"),
  pincode: z.string().min(5, "Pincode must be at least 5 characters"),
  productName: z.string().min(2, "Product name is required"),
  productModel: z.string().optional(),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  brand: z.string().min(1, "Brand is required"),
  customBrand: z.string().optional(),
  issueDescription: z.string().min(10, "Issue description must be at least 10 characters"),
  comments: z.string().optional(),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  assignedTo: z.string().min(1, "Please assign this ticket to an employee"),
}).refine((data) => {
  // If brand is "Other", customBrand must be provided
  if (data.brand === "Other" && (!data.customBrand || data.customBrand.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Custom brand name is required when 'Other' is selected",
  path: ["customBrand"],
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

export default function CreateTicketPage() {
  const router = useRouter();
  const currentUser = useStore((state) => state.user);
  const createTicket = useCreateTicket();
  
  // File attachments state
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Generate a temporary ticket ID for storage path (will be used if ticket is created)
  const [tempTicketId] = useState(() => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Fetch brands from Firestore with 24-hour cache
  const { data: brands = [], isLoading: brandsLoading } = useBrandList();
  
  // Fetch all employees for assignee combobox (exclude admins and administration department)
  const { data: allUsers = [], isLoading: usersLoading } = useUsers();
  const employees = allUsers.filter(
    (user) => 
      user.role !== "full_developer_admin" && 
      user.role !== "it_admin" &&
      user.department !== "Administration"
  );

  // Initialize attachment upload hook with temp ID (files will be uploaded to temp path)
  const attachmentUpload = useAttachmentUpload({
    maxFiles: 5,
    maxSizePerFile: 10, // 10MB
    storagePath: `ticket-attachments/${tempTicketId}`,
  });

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
      customBrand: "",
      issueDescription: "",
      comments: "",
      link: "",
      assignedTo: "",
    },
  });

  async function onSubmit(values: TicketFormValues) {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Step 1: Validate attachments first (before creating ticket)
      if (attachments.length > 0) {
        for (const file of attachments) {
          const validation = attachmentUpload.validateFile(file);
          if (!validation.valid) {
            toast.error("Invalid file", { description: validation.error });
            setIsSubmitting(false);
            return;
          }
        }
      }
      
      // Step 2: Upload attachments first (if any) to temp location
      let uploadedMetadata: Array<{
        fileName: string;
        fileSize: number;
        fileType: string;
        downloadURL: string;
        storagePath: string;
        uploadedAt: Date;
      }> = [];
      
      if (attachments.length > 0) {
        try {
          uploadedMetadata = await attachmentUpload.uploadFiles(attachments);
          
          if (uploadedMetadata.length === 0) {
            throw new Error("No files were uploaded successfully");
          }
        } catch (uploadError: any) {
          console.error("Error uploading attachments:", uploadError);
          toast.error("Failed to upload attachments", {
            description: uploadError.message || "Please try again",
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Step 3: Create the ticket with attachment data
      const ticketData: TicketCreateInput = {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        address: values.address,
        pincode: values.pincode,
        productName: values.productName,
        productModel: values.productModel || "",
        purchaseDate: new Date(values.purchaseDate),
        brand: values.brand === "Other" && values.customBrand ? values.customBrand : values.brand,
        issueDescription: values.issueDescription,
        comments: values.comments,
        assignedTo: values.assignedTo || undefined,
      };

      const result = await createTicket.mutateAsync(ticketData);
      
      if (!result?.ticketId) {
        throw new Error("Failed to create ticket - no ticket ID returned");
      }

      const newTicketId = result.ticketId;
      
      // Step 4: Update ticket document with attachment metadata if uploads succeeded
      if (uploadedMetadata.length > 0) {
        try {
          const ticketRef = doc(db, "tickets", newTicketId);
          await updateDoc(ticketRef, {
            attachments: uploadedMetadata.map((meta) => ({
              fileName: meta.fileName,
              fileSize: meta.fileSize,
              fileType: meta.fileType,
              downloadURL: meta.downloadURL,
              storagePath: meta.storagePath,
              uploadedAt: Timestamp.now(),
              uploadedBy: currentUser?.id || "unknown",
            })),
            attachmentUrls: uploadedMetadata.map((meta) => meta.downloadURL),
            updatedAt: Timestamp.now(),
          });
          
          console.log(`✅ Uploaded ${uploadedMetadata.length} attachments for ticket ${newTicketId}`);
        } catch (updateError: any) {
          console.error("Error updating ticket with attachments:", updateError);
          toast.warning("Ticket created but failed to attach files", {
            description: "You can try adding attachments later",
          });
        }
      }
      
      // Step 5: Success - navigate to tickets page
      toast.success("Ticket created successfully", {
        description: uploadedMetadata.length > 0 
          ? `With ${uploadedMetadata.length} attachment(s)` 
          : undefined,
      });
      
      // Reset form and attachments
      form.reset();
      setAttachments([]);
      attachmentUpload.reset();
      
      router.push("/tickets");
      
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Convert employees to combobox options
  const employeeOptions: ComboboxOption[] = employees.map((emp) => ({
    value: emp.id,
    label: emp.name,
    email: emp.email,
    role: emp.role,
    department: emp.department || "No Department",
    photoURL: emp.photoURL,
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
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground peer-focus:text-primary transition-colors" />
                        <Input placeholder="John Doe" maxLength={100} className="pl-10 peer" {...field} />
                      </div>
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
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground peer-focus:text-primary transition-colors" />
                        <Input placeholder="+1234567890" maxLength={20} className="pl-10 peer" {...field} />
                      </div>
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
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground peer-focus:text-primary transition-colors" />
                        <Textarea 
                          placeholder="123 Main St, City, State" 
                          maxLength={500}
                          className="pl-10 peer"
                          {...field} 
                        />
                      </div>
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
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground peer-focus:text-primary transition-colors" />
                        <Input placeholder="12345" maxLength={10} className="pl-10 peer" {...field} />
                      </div>
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
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand <span className="text-destructive">*</span></FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Clear custom brand if switching away from "Other"
                        if (value !== "Other") {
                          form.setValue("customBrand", "");
                        }
                      }} 
                      defaultValue={field.value}
                    >
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
                          <>
                            {brands.map((brand) => (
                              <SelectItem key={brand.value} value={brand.value}>
                                {brand.label}
                              </SelectItem>
                            ))}
                            <SelectItem value="Other">Other (Custom Brand)</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Brand Input - shown only when "Other" is selected */}
              {form.watch("brand") === "Other" && (
                <FormField
                  control={form.control}
                  name="customBrand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Brand Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground peer-focus:text-primary transition-colors" />
                          <Input 
                            placeholder="Enter brand name" 
                            maxLength={100} 
                            className="pl-10 peer" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter the brand name manually
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground peer-focus:text-primary transition-colors" />
                        <Input placeholder="e.g., Point of Sale System" maxLength={200} className="pl-10 peer" {...field} />
                      </div>
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
                    <FormLabel>Product Model</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground peer-focus:text-primary transition-colors" />
                        <Input placeholder="e.g., POS-2024-X" maxLength={100} className="pl-10 peer" {...field} />
                      </div>
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
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground peer-focus:text-primary transition-colors" />
                        <Input type="date" className="pl-10 peer" {...field} />
                      </div>
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
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Assignment & Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Employee <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Combobox
                        options={employeeOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select an employee..."
                        searchPlaceholder="Search by name, email, or department..."
                        emptyText="No employees found."
                        disabled={usersLoading}
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
                    </FormControl>
                    <FormDescription>
                      Select an employee to assign this ticket to
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
                        maxLength={500}
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
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Issue Details
              </CardTitle>
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
                        maxLength={2000}
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
                        maxLength={1000}
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
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Attachments (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FileUpload
                  onChange={(files) => setAttachments(files)}
                  maxFiles={5}
                  maxSize={10 * 1024 * 1024} // 10MB
                  accept={{
                    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic"],
                    "application/pdf": [".pdf"],
                    "application/msword": [".doc"],
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Upload up to 5 files (images, PDFs, or documents - max 10MB each)
                </p>
                
                {/* Upload Progress */}
                {attachmentUpload.isUploading && (
                  <UploadProgressDisplay
                    uploads={attachmentUpload.uploads}
                    overallProgress={attachmentUpload.overallProgress}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={createTicket.isPending || isSubmitting || attachmentUpload.isUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTicket.isPending || isSubmitting || attachmentUpload.isUploading || !form.formState.isValid}
            >
              {(createTicket.isPending || isSubmitting || attachmentUpload.isUploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {attachmentUpload.isUploading ? "Uploading..." : isSubmitting ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  </div>
  );
}
