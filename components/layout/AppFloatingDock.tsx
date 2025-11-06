/**
 * APP FLOATING DOCK COMPONENT
 * 
 * A floating navigation dock for mobile devices.
 * Positioned fixed at the bottom of the viewport as an overlay.
 * 
 * Features:
 * - Fixed bottom positioning (z-50)
 * - Active route detection
 * - Role-based navigation filtering
 * - Touch-optimized sizing
 * 
 * @module components/layout/AppFloatingDock
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getVisibleNavItems } from "@/app/config/navConfig";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/store";

/**
 * App Floating Dock Props
 */
interface AppFloatingDockProps {
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Mobile Floating Dock Component
 * 
 * A bottom-fixed navigation bar optimized for mobile devices.
 * Only the first 5-6 items are shown to prevent overflow.
 */
export function AppFloatingDock({ className }: AppFloatingDockProps) {
  const pathname = usePathname();
  const { user: currentUser } = useAuth();

  // Get visible navigation items based on user role
  const visibleNavItems = React.useMemo(
    () => currentUser ? getVisibleNavItems(currentUser.role) : [],
    [currentUser]
  );

  // Limit to first 5 items to prevent mobile overflow (better UX)
  const dockItems = React.useMemo(
    () => visibleNavItems.slice(0, 5),
    [visibleNavItems]
  );

  if (!currentUser) return null;

  return (
    <nav
      className={cn(
        // Fixed positioning at bottom
        "fixed bottom-0 left-0 right-0 z-50",
        // Only visible on mobile (hidden on md and up)
        "md:hidden",
        // Padding and safe area handling
        "p-4 pb-safe",
        className
      )}
      aria-label="Mobile Navigation"
    >
      {/* Dock Container */}
      <div className={cn(
        // Floating card appearance with clean design
        "bg-background/95 backdrop-blur-lg",
        "rounded-2xl",
        // Flexbox layout
        "flex items-center justify-around",
        // Padding and sizing
        "h-16 px-1",
        // Animation
        "animate-in slide-in-from-bottom-4 duration-300",
        // Shadow for depth
        "shadow-lg"
      )}>
        {dockItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                // Base styles
                "flex flex-col items-center justify-center",
                "h-14 w-14 rounded-xl",
                // Transitions
                "transition-all duration-200",
                // Hover state (not active)
                !isActive && "hover:bg-accent/50",
                // Touch optimization
                "active:scale-95",
                // Accessibility
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon 
                className={cn(
                  "h-6 w-6 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
