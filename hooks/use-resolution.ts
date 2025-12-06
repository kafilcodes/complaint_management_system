import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadFile, generateTicketFilePath } from "@/lib/storage";
import { useAuth } from "@/lib/store";

interface Resolution {
  id: string;
  ticketId: string;
  productSerial: string;
  serviceRating: number;
  feedbackText: string | null;
  otp: string | null;
  productImageURL: string | null;
  warrantyCardURL: string | null;
  partConsumedImageURL: string | null;
  resolvedBy: string;
  resolvedAt: Date;
  createdAt: Date;
  // Denormalized fields (optional for backward compatibility)
  resolvedByUserName?: string;
  resolvedByUserEmail?: string;
  ticketTitle?: string;
  ticketBrand?: string;
}

interface ResolveTicketData {
  productSerial: string;
  serviceRating: number;
  feedbackText?: string;
  otp?: string;
  productImage?: File;
  warrantyCard?: File;
  partConsumedImage?: File;
}

interface ResolveTicketVariables {
  ticketId: string;
  data: ResolveTicketData;
}

/**
 * Hook to fetch resolution details for a ticket
 */
export function useResolution(ticketId: string) {
  return useQuery<Resolution>({
    queryKey: ["resolution", ticketId],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${ticketId}/resolution`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Resolution not found");
        }
        throw new Error("Failed to fetch resolution");
      }
      const data = await response.json();
      // Convert string dates to Date objects
      const resolution = data.resolution;
      return {
        ...resolution,
        resolvedAt: new Date(resolution.resolvedAt),
        createdAt: new Date(resolution.createdAt),
      };
    },
    enabled: !!ticketId,
    retry: false, // Don't retry on 404 (resolution doesn't exist yet)
  });
}

/**
 * Hook to resolve a ticket with file uploads
 */
export function useResolveTicket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ ticketId, data }: ResolveTicketVariables) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Upload images to Firebase Storage if provided
      const uploadPromises: Promise<[string, string]>[] = [];
      const imageFields = [
        { key: "productImage", file: data.productImage },
        { key: "warrantyCard", file: data.warrantyCard },
        { key: "partConsumedImage", file: data.partConsumedImage },
      ];

      // Start all uploads in parallel
      for (const { key, file } of imageFields) {
        if (file instanceof File) {
          const path = generateTicketFilePath(ticketId, file.name, key);
          const uploadPromise = uploadFile(file, path).then((url) => [
            `${key}URL`,
            url,
          ] as [string, string]);
          uploadPromises.push(uploadPromise);
        }
      }

      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);

      // Build image URLs object
      const imageURLs = Object.fromEntries(uploadResults);

      // Submit resolution with image URLs and userId
      const resolutionData = {
        userId: user.id, // Add user ID
        productSerial: data.productSerial,
        serviceRating: data.serviceRating,
        feedbackText: data.feedbackText || null,
        otp: data.otp || null,
        productImageURL: imageURLs.productImageURL || null,
        warrantyCardURL: imageURLs.warrantyCardURL || null,
        partConsumedImageURL: imageURLs.partConsumedImageURL || null,
      };

      const response = await fetch(`/api/tickets/${ticketId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resolutionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resolve ticket");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success("Ticket resolved successfully");
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ["ticket", variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["resolution", variables.ticketId] });
    },
    onError: (error: Error) => {
      console.error("Error resolving ticket:", error);
      toast.error(error.message || "Failed to resolve ticket");
    },
  });
}
