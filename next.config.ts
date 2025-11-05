import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

/**
 * PWA Configuration
 * 
 * Configures the Progressive Web App features using @ducanh2912/next-pwa
 * This makes the application installable and enables offline capabilities.
 */
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

/**
 * Next.js Configuration
 */
const nextConfig: NextConfig = {
  /* Experimental features */
  experimental: {
    // Enable optimizePackageImports for better bundle size
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },

  /* Turbopack Configuration (Next.js 16+) */
  turbopack: {
    // Environment variables are automatically loaded from .env.local
    // Access them through lib/env.ts for better compatibility
  },

  /* Image optimization */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  /* Headers for security */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  /* 
   * Webpack configuration removed - using Turbopack in Next.js 16+
   * Turbopack handles module resolution automatically without fallbacks
   */
};

export default withPWA(nextConfig);
