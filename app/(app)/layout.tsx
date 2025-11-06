/**
 * PROTECTED APP LAYOUT
 * 
 * This layout wraps all protected routes (dashboard, tickets, etc.).
 * It implements a responsive navigation system:
 * - Desktop (md+): Collapsible Sidebar
 * - Mobile (<md): Floating Dock at bottom
 * 
 * Route Structure:
 * app/(app)/
 *   ├── layout.tsx (this file)
 *   ├── dashboard/
 *   ├── tickets/
 *   ├── create-ticket/
 *   ├── users/
 *   ├── notifications/
 *   └── profile/
 * 
 * The (app) folder name with parentheses means it's a route group
 * that doesn't affect the URL structure.
 * 
 * @module app/(app)/layout
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppFloatingDock } from "@/components/layout/AppFloatingDock";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/store";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Protected App Layout
 * 
 * Provides adaptive navigation:
 * - Desktop: Collapsible sidebar (can collapse to icons)
 * - Mobile: Floating dock at bottom
 * 
 * Features:
 * - Auth guard: redirects to login if not authenticated
 * - Keyboard shortcut (Cmd/Ctrl+B) to toggle sidebar
 * - Persistent sidebar state (saved in cookie)
 * - Mobile-first responsive design
 * - Proper spacing with 4/8-point grid system
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const { user, isAuthLoading } = useAuth();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/login");
    }
  }, [user, isAuthLoading, router]);

  // Show loading spinner while checking auth
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      {/* Desktop Sidebar (hidden on mobile) */}
      <AppSidebar />

      {/* Main Content Area */}
      <SidebarInset>
        {/* Header with Sidebar Toggle */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            {/* Sidebar Toggle Button (desktop only) */}
            <SidebarTrigger className="-ml-1 hidden md:flex" />
          </div>

          {/* Header content can be added here */}
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              {/* App name on mobile (since sidebar is hidden) */}
              <h1 className="text-lg font-semibold md:hidden">
                {process.env.NEXT_PUBLIC_APP_NAME || "ServiceFirst"}
              </h1>
            </div>

            {/* Future: Add notification bell, theme toggle, etc. */}
            <div className="flex items-center gap-2">
              {/* Placeholder for future header actions */}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          {/* Content Container - respects 4/8-point grid */}
          <div className="mx-auto w-full max-w-7xl pb-20 md:pb-0">
            {children}
          </div>
        </main>
      </SidebarInset>

      {/* Mobile Floating Dock (hidden on desktop) */}
      <AppFloatingDock />
    </SidebarProvider>
  );
}
