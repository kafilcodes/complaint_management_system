"use client";

import { useResolution } from "@/hooks/use-resolution";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Star, CheckCircle, Calendar, User as UserIcon } from "lucide-react";
import { formatDateTime } from "@/firebase/firestore-helpers";
import Image from "next/image";

interface ResolutionDetailsProps {
  ticketId: string;
  resolvedBy?: string;
}

const ratingLabels: { [key: number]: string } = {
  1: "Very Poor",
  2: "Poor",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

export function ResolutionDetails({ ticketId, resolvedBy }: ResolutionDetailsProps) {
  const { data: resolution, isLoading, error } = useResolution(ticketId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resolution Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !resolution) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resolution Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error ? "Failed to load resolution details" : "No resolution data available"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Resolution Details</CardTitle>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Serial Number */}
        <div>
          <p className="text-sm font-medium mb-1">Product Serial Number</p>
          <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md">
            {resolution.productSerial}
          </p>
        </div>

        <Separator />

        {/* Service Rating */}
        <div>
          <p className="text-sm font-medium mb-2">Service Rating</p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= resolution.serviceRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">
              {resolution.serviceRating}/5 - {ratingLabels[resolution.serviceRating]}
            </span>
          </div>
        </div>

        {/* Feedback */}
        {resolution.feedbackText && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Feedback</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {resolution.feedbackText}
              </p>
            </div>
          </>
        )}

        {/* OTP */}
        {resolution.otp && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-1">OTP</p>
              <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md">
                {resolution.otp}
              </p>
            </div>
          </>
        )}

        {/* Images */}
        {(resolution.productImageURL ||
          resolution.warrantyCardURL ||
          resolution.partConsumedImageURL) && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-3">Attachments</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resolution.productImageURL && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Product Image</p>
                    <a
                      href={resolution.productImageURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative aspect-video rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                    >
                      <Image
                        src={resolution.productImageURL}
                        alt="Product"
                        fill
                        className="object-cover"
                      />
                    </a>
                  </div>
                )}
                {resolution.warrantyCardURL && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Warranty Card</p>
                    <a
                      href={resolution.warrantyCardURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative aspect-video rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                    >
                      <Image
                        src={resolution.warrantyCardURL}
                        alt="Warranty Card"
                        fill
                        className="object-cover"
                      />
                    </a>
                  </div>
                )}
                {resolution.partConsumedImageURL && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Parts Consumed</p>
                    <a
                      href={resolution.partConsumedImageURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative aspect-video rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                    >
                      <Image
                        src={resolution.partConsumedImageURL}
                        alt="Parts Consumed"
                        fill
                        className="object-cover"
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {(resolution.resolvedByUserName || resolvedBy) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>
                {/* Use denormalized user name if available, fallback to prop */}
                Resolved by: {resolution.resolvedByUserName || resolvedBy}
                {resolution.resolvedByUserEmail && (
                  <span className="text-xs ml-1">({resolution.resolvedByUserEmail})</span>
                )}
              </span>
            </div>
          )}
          {resolution.resolvedAt && (() => {
            // DEFENSIVE GUARD: Check that resolvedAt is valid before formatting
            if (!resolution.resolvedAt) return null;
            
            // Check if it's a Date object with a valid time
            if (resolution.resolvedAt instanceof Date && isNaN(resolution.resolvedAt.getTime())) {
              console.warn("[ResolutionDetails] Invalid resolvedAt date:", resolution.resolvedAt);
              return null;
            }
            
            // For Timestamp objects, check seconds validity
            if (typeof resolution.resolvedAt === 'object' && 'seconds' in resolution.resolvedAt) {
              const timestamp = resolution.resolvedAt as any;
              if (!timestamp.seconds || timestamp.seconds < 0 || isNaN(timestamp.seconds)) {
                console.warn("[ResolutionDetails] Invalid Timestamp seconds:", timestamp);
                return null;
              }
            }
            
            try {
              const dateStr = formatDateTime(resolution.resolvedAt);
              if (dateStr === "N/A") return null;
              return (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{dateStr}</span>
                </div>
              );
            } catch (error) {
              console.error("[ResolutionDetails] Error formatting resolvedAt date:", error);
              return null;
            }
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
