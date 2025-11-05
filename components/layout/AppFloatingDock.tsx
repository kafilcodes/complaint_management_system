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

import { NAV_ITEMS, getVisibleNavItems, type NavItem } from "@/app/config/navConfig";
import { cn } from "@/lib/utils";

/**
 * App Floating Dock Props
 */
interface AppFloatingDockProps {
  /** Optional user role override for testing */
  userRole?: "admin" | "full_developer_admin" | "employee" | "user";
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Mobile Floating Dock Component
 * 
 * A bottom-fixed navigation bar optimized for mobile devices.
 * Only the first 5-6 items are shown to prevent overflow.
 */
export function AppFloatingDock({ 
  userRole = "full_developer_admin",
  className 
}: AppFloatingDockProps) {
  const pathname = usePathname();

  // Get visible navigation items based on user role
  const visibleNavItems = React.useMemo(
    () => getVisibleNavItems(userRole),
    [userRole]
  );

  // Limit to first 6 items to prevent mobile overflow
  const dockItems = React.useMemo(
    () => visibleNavItems.slice(0, 6),
    [visibleNavItems]
  );

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
        // Floating card appearance
        "bg-background/80 backdrop-blur-lg",
        "border border-border",
        "rounded-2xl shadow-lg",
        // Flexbox layout
        "flex items-center justify-around",
        // Padding and sizing
        "h-16 px-2",
        // Animation
        "animate-in slide-in-from-bottom-4 duration-300"
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
                "flex flex-col items-center justify-center gap-1",
                "h-12 w-12 rounded-xl",
                // Transitions
                "transition-all duration-200",
                // Active state
                isActive ? [
                  "bg-primary text-primary-foreground",
                  "scale-105",
                ] : [
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-accent",
                ],
                // Touch optimization
                "active:scale-95",
                // Accessibility
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
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
