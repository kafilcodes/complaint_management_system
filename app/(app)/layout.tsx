/**
 * PROTECTED APP LAYOUT
 * 
 * This layout wraps all protected routes (dashboard, tickets, etc.).
 * It includes the Header and Sidebar components and provides a
 * consistent structure for the authenticated app.
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

import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: {
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME || "ServiceFirst"}`,
    default: process.env.NEXT_PUBLIC_APP_NAME || "ServiceFirst",
  },
};

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Protected App Layout
 * 
 * Provides the main structure for authenticated pages:
 * - Header (top navigation bar)
 * - Sidebar (left navigation menu)
 * - Main content area
 * 
 * This layout is mobile-first and responsive.
 */
export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Header - Fixed at top */}
      <Header />

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar - Slide-out on mobile, fixed on desktop */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Content Container - respects 4/8-point grid */}
          <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
