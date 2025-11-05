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
import { Star, Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateFileUpload, createFilePreview, revokeFilePreview } from "@/lib/storage";
import { SERVICE_RATINGS } from "@/lib/configuration";

// Form validation schema
const resolutionFormSchema = z.object({
  productSerial: z.string().min(3, "Product serial number is required"),
  serviceRating: z.number().min(1).max(5),
  feedbackText: z.string().optional(),
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
  const [previews, setPreviews] = useState<{
    productImage?: string;
    warrantyCard?: string;
    partConsumedImage?: string;
  }>({});

  const form = useForm<ResolutionFormValues>({
    resolver: zodResolver(resolutionFormSchema),
    defaultValues: {
      productSerial: "",
      serviceRating: 0,
      feedbackText: "",
    },
  });

  const handleRatingClick = (value: number) => {
    setRating(value);
    form.setValue("serviceRating", value);
  };

  const handleFileChange = (
    field: "productImage" | "warrantyCard" | "partConsumedImage",
    file: File | undefined
  ) => {
    if (!file) {
      // Clear preview
      if (previews[field]) {
        revokeFilePreview(previews[field]!);
        setPreviews((prev) => ({ ...prev, [field]: undefined }));
      }
      return;
    }

    // Validate file
    const validation = validateFileUpload(file);
    if (!validation.valid) {
      form.setError(field, { message: validation.error });
      return;
    }

    // Create preview
    const previewUrl = createFilePreview(file);
    setPreviews((prev) => ({ ...prev, [field]: previewUrl }));
  };

  const handleSubmit = async (values: ResolutionFormValues) => {
    try {
      await onSubmit(values);
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
                  <FormLabel>Product Serial Number</FormLabel>
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

            {/* Product Image */}
            <FormField
              control={form.control}
              name="productImage"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Product Image</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          onChange(file);
                          handleFileChange("productImage", file);
                        }}
                        {...field}
                      />
                      {previews.productImage && (
                        <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                          <img
                            src={previews.productImage}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onChange(undefined);
                              handleFileChange("productImage", undefined);
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload a photo of the product
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warranty Card */}
            <FormField
              control={form.control}
              name="warrantyCard"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Warranty Card (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          onChange(file);
                          handleFileChange("warrantyCard", file);
                        }}
                        {...field}
                      />
                      {previews.warrantyCard && (
                        <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                          <img
                            src={previews.warrantyCard}
                            alt="Warranty card preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onChange(undefined);
                              handleFileChange("warrantyCard", undefined);
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload warranty card image or PDF
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parts Consumed Image */}
            <FormField
              control={form.control}
              name="partConsumedImage"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Parts Consumed (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          onChange(file);
                          handleFileChange("partConsumedImage", file);
                        }}
                        {...field}
                      />
                      {previews.partConsumedImage && (
                        <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                          <img
                            src={previews.partConsumedImage}
                            alt="Parts consumed preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onChange(undefined);
                              handleFileChange("partConsumedImage", undefined);
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload image of parts used for repair
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
