/**
 * AUTH LAYOUT
 * 
 * Layout for authentication pages (login, etc.).
 * This is a simple layout without the protected app Header/Sidebar.
 * 
 * @module app/(auth)/layout
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to access your account",
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Auth Layout Component
 * 
 * Simple layout for authentication pages.
 * No header or sidebar - just centered content.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return <>{children}</>;
}
