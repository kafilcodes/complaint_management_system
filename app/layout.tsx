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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: `${process.env.NEXT_PUBLIC_APP_NAME || "M/s M Parekh Enterprises"} - Complaint Management System`,
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME || "M/s M Parekh Enterprises"}`,
  },
  description:
    "M/s M Parekh Enterprises - A production-grade Progressive Web Application for managing customer complaints and service workflows in real-time. Located in Jagdalpur, Bastar, Chhattisgarh. Streamline your support operations efficiently.",
  keywords: [
    "M/s M Parekh Enterprises",
    "MParekh Enterprises",
    "complaint management",
    "Jagdalpur",
    "Bastar",
    "Chhattisgarh",
    "customer complaints",
    "service management",
    "PWA",
    "complaint tracking",
    "customer service software",
    "help desk",
    "support system",
    "business management",
  ],
  authors: [{ name: "M/s M Parekh Enterprises", url: "mailto:mparekhenterprises@gmail.com" }],
  creator: "M/s M Parekh Enterprises",
  publisher: "M/s M Parekh Enterprises",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    title: `${process.env.NEXT_PUBLIC_APP_NAME || "M/s M Parekh Enterprises"} - Complaint Management System`,
    description:
      "M/s M Parekh Enterprises - A production-grade PWA for managing customer complaints with real-time tracking. Located in Jagdalpur, Bastar, Chhattisgarh",
    siteName: process.env.NEXT_PUBLIC_APP_NAME || "M/s M Parekh Enterprises",
  },
  twitter: {
    card: "summary_large_image",
    title: `${process.env.NEXT_PUBLIC_APP_NAME || "M/s M Parekh Enterprises"} - Complaint Management`,
    description:
      "Streamline complaint resolution and improve customer satisfaction with M/s M Parekh Enterprises comprehensive management system",
  },
  icons: {
    icon: [
      { url: "/logo.png", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
      { url: "/ios/180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: process.env.NEXT_PUBLIC_APP_NAME || "M/s M Parekh Enterprises",
    startupImage: [
      {
        url: "/ios/180.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  category: "business",
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
