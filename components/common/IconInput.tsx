/**
 * ICON INPUT COMPONENT
 * 
 * A reusable input component with icon support.
 * Wraps shadcn/ui Input with absolute positioned icons.
 * 
 * @module components/common/IconInput
 */

"use client";

import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface IconInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Icon component from lucide-react to display on the left
   */
  icon?: LucideIcon;
  /**
   * Optional action button/element to display on the right
   */
  rightElement?: React.ReactNode;
}

const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  ({ className, icon: Icon, rightElement, ...props }, ref) => {
    return (
      <div className="relative">
        {/* Left Icon */}
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
        )}

        {/* Input Field */}
        <Input
          ref={ref}
          className={cn(
            Icon && "pl-10", // Add left padding when icon exists
            rightElement && "pr-10", // Add right padding when right element exists
            className
          )}
          {...props}
        />

        {/* Right Element (e.g., show/hide password button) */}
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    );
  }
);

IconInput.displayName = "IconInput";

export { IconInput };
