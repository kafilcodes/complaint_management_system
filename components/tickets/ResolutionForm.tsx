/**
 * Resolution Form Component
 * 
 * Form for technicians to resolve tickets with resolution details and images.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { Star, Loader2, Hash, Image, FileText, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICE_RATINGS } from "@/lib/configuration";

// Form validation schema
const resolutionFormSchema = z.object({
  productSerial: z.string().min(3, "Product serial number is required"),
  serviceRating: z.number().min(1).max(5),
  feedbackText: z.string().optional(),
  otp: z.string()
    .optional()
    .refine(
      (val) => !val || (val.length >= 3 && val.length <= 6 && /^\d{3,6}$/.test(val)),
      "OTP must be 3-6 digits"
    )
    .or(z.literal("")),
  productImage: z.custom<File>().optional(),
  warrantyCard: z.custom<File>().optional(),
  partConsumedImage: z.custom<File>().optional(),
});

type ResolutionFormValues = z.infer<typeof resolutionFormSchema>;

interface ResolutionFormProps {
  ticketId: string;
  onSubmit: (data: ResolutionFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function ResolutionForm({ ticketId, onSubmit, isSubmitting = false }: ResolutionFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [warrantyCardFiles, setWarrantyCardFiles] = useState<File[]>([]);
  const [partConsumedFiles, setPartConsumedFiles] = useState<File[]>([]);

  const form = useForm<ResolutionFormValues>({
    resolver: zodResolver(resolutionFormSchema),
    defaultValues: {
      productSerial: "",
      serviceRating: 0,
      feedbackText: "",
      otp: "",
    },
  });

  const handleRatingClick = (value: number) => {
    setRating(value);
    form.setValue("serviceRating", value);
  };

  const handleSubmit = async (values: ResolutionFormValues) => {
    try {
      // Add file data to submission
      const submissionData = {
        ...values,
        productImage: productImageFiles[0],
        warrantyCard: warrantyCardFiles[0],
        partConsumedImage: partConsumedFiles[0],
      };
      await onSubmit(submissionData);
    } catch (error) {
      console.error("Error submitting resolution:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resolve Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Product Serial Number */}
            <FormField
              control={form.control}
              name="productSerial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    Product Serial Number
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter serial number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the serial number from the product
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service Rating */}
            <FormField
              control={form.control}
              name="serviceRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Rating</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleRatingClick(value)}
                            onMouseEnter={() => setHoveredRating(value)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
                          >
                            <Star
                              className={cn(
                                "h-8 w-8 transition-colors",
                                (hoveredRating || rating) >= value
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                      {rating > 0 && (
                        <Badge variant="outline" className="text-sm">
                          {SERVICE_RATINGS.find((r) => r.value === rating)?.emoji}{" "}
                          {SERVICE_RATINGS.find((r) => r.value === rating)?.label}
                        </Badge>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Rate the overall service quality
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Feedback Text */}
            <FormField
              control={form.control}
              name="feedbackText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what was done to resolve the issue..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details about the resolution
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* OTP Field */}
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OTP (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter OTP (3-6 digits)"
                      maxLength={6}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional OTP for verification (3-6 digits, numbers only)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Image */}
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Image className="h-4 w-4 text-primary" />
                Product Image
              </FormLabel>
              <FormControl>
                <FileUpload
                  onChange={setProductImageFiles}
                  maxFiles={1}
                  maxSize={10}
                  accept={{
                    "image/*": [".png", ".jpg", ".jpeg", ".gif"],
                  }}
                />
              </FormControl>
              <FormDescription>
                Upload a photo of the product
              </FormDescription>
              <FormMessage />
            </FormItem>

            {/* Warranty Card */}
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Warranty Card (Optional)
              </FormLabel>
              <FormControl>
                <FileUpload
                  onChange={setWarrantyCardFiles}
                  maxFiles={1}
                  maxSize={10}
                  accept={{
                    "image/*": [".png", ".jpg", ".jpeg", ".gif"],
                    "application/pdf": [".pdf"],
                  }}
                />
              </FormControl>
              <FormDescription>
                Upload warranty card image or PDF
              </FormDescription>
              <FormMessage />
            </FormItem>

            {/* Parts Consumed Image */}
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Parts Consumed (Optional)
              </FormLabel>
              <FormControl>
                <FileUpload
                  onChange={setPartConsumedFiles}
                  maxFiles={1}
                  maxSize={10}
                  accept={{
                    "image/*": [".png", ".jpg", ".jpeg", ".gif"],
                  }}
                />
              </FormControl>
              <FormDescription>
                Upload image of parts used for repair
              </FormDescription>
              <FormMessage />
            </FormItem>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting || rating === 0} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Submitting Resolution..." : "Submit Resolution"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
