import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Providers } from "@/components/providers";

/**
 * ROOT LAYOUT
 * 
 * This is the root layout for the entire application.
 * It sets up global providers, fonts, and metadata.
 * 
 * Key integrations:
 * - Inter font (Design System v2.0)
 * - TanStack Query Provider (server state)
 * - Theme Provider (light/dark mode)
 * - Vercel Speed Insights (performance monitoring)
 * - Vercel Analytics (user behavior tracking)
 * - Sonner Toaster (toast notifications)
 */

/**
 * Inter Variable Font Configuration
 * This is our primary font family as per the Design System v2.0
 * Using the variable font for optimal performance and flexibility
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

/**
 * Application metadata for SEO and PWA
 */
export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_APP_NAME || "Internal Complaint Management System",
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME || "CMS"}`,
  },
  description:
    "A production-grade Progressive Web Application for managing customer complaints, service tickets, and technician workflows in real-time.",
  keywords: [
    "complaint management",
    "service tickets",
    "technician management",
    "customer support",
    "PWA",
  ],
  authors: [{ name: "Your Company Name" }],
  creator: "Your Company Name",
  publisher: "Your Company Name",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    title: process.env.NEXT_PUBLIC_APP_NAME || "Internal Complaint Management System",
    description:
      "A production-grade PWA for managing customer complaints and service tickets",
    siteName: process.env.NEXT_PUBLIC_APP_NAME || "CMS",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: process.env.NEXT_PUBLIC_APP_NAME || "CMS",
  },
  formatDetection: {
    telephone: false,
  },
};

/**
 * Viewport configuration for responsive design and PWA
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

/**
 * Root Layout Component
 * 
 * Wraps the entire application with necessary providers and integrations
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-sans`}>
        <Providers>
          {children}
        </Providers>
        
        {/* Vercel Speed Insights - monitors page load performance */}
        <SpeedInsights />
        
        {/* Vercel Analytics - tracks page views and user behavior */}
        <Analytics />
      </body>
    </html>
  );
}
