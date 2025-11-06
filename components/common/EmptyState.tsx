/**
 * EMPTY STATE COMPONENT
 * 
 * A reusable component for displaying empty states across the application.
 * Features adaptive sizing and optional call-to-action button.
 * 
 * @module components/common/EmptyState
 */

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Empty State Props
 */
export interface EmptyStateProps {
  /** Path to the image/SVG to display */
  imageUrl: string;
  /** Main heading text */
  title: string;
  /** Supporting description text */
  description: string;
  /** Optional call-to-action button/element */
  cta?: React.ReactNode;
  /** Optional className for custom styling */
  className?: string;
  /** Optional image className for custom image styling */
  imageClassName?: string;
}

/**
 * Empty State Component
 * 
 * Displays an image, title, description, and optional CTA for empty states.
 * Responsive sizing adapts from mobile (360px) to desktop (1920px+).
 */
export function EmptyState({
  imageUrl,
  title,
  description,
  cta,
  className,
  imageClassName,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "py-12 px-4 md:py-16 lg:py-20",
        className
      )}
    >
      {/* Image */}
      <div
        className={cn(
          "relative w-full h-auto mb-6 md:mb-8",
          "max-w-xs md:max-w-sm lg:max-w-md",
          imageClassName
        )}
      >
        <div className="relative w-full aspect-square">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-contain"
            priority={false}
            sizes="(max-width: 768px) 320px, (max-width: 1024px) 448px, 512px"
          />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-2 md:mb-3">
        {title}
      </h2>

      {/* Description */}
      <p className="text-sm md:text-base text-muted-foreground max-w-md mb-6 md:mb-8">
        {description}
      </p>

      {/* Optional CTA */}
      {cta && <div className="mt-2">{cta}</div>}
    </div>
  );
}
