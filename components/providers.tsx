/**
 * PROVIDERS COMPONENT
 * 
 * This component wraps the application with all necessary providers:
 * - QueryProvider (TanStack Query for server state)
 * - AuthProvider (Firebase Auth state management)
 * - ThemeProvider (next-themes for light/dark mode)
 * - Toaster (Sonner for toast notifications)
 * 
 * Provider hierarchy is important:
 * 1. QueryProvider (outermost - needed by other providers)
 * 2. AuthProvider (needs QueryProvider for potential data fetching)
 * 3. ThemeProvider (UI-level provider)
 * 
 * This is a Client Component because providers require client-side context.
 * 
 * @module components/providers
 */

"use client";

import { type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CommandMenu } from "@/components/common/CommandMenu";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Providers Component
 * 
 * Wraps children with all application providers in the correct order.
 * Each provider is separated into its own file for better code organization.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          
          {/* Global Command Menu (Cmd+K / Ctrl+K) */}
          <CommandMenu />
          
          {/* Sonner Toast Notifications - Task 04 Enhanced */}
          <Toaster
            position="top-right"
            expand={true}
            richColors
            closeButton
            duration={4000}
            toastOptions={{
              classNames: {
                toast: "font-sans",
                title: "font-medium",
                description: "text-sm",
                actionButton: "bg-primary text-primary-foreground",
                cancelButton: "bg-muted text-muted-foreground",
                closeButton: "bg-muted text-muted-foreground hover:bg-muted/80",
              },
            }}
          />
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
