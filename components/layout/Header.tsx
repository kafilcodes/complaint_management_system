/**
 * HEADER COMPONENT
 * 
 * The main navigation header for the protected app layout.
 * 
 * Features:
 * - Mobile: Hamburger menu button to toggle sidebar
 * - Desktop: App title/logo
 * - Theme toggle button (light/dark mode)
 * - User profile dropdown with logout
 * - Notification bell with badge count
 * 
 * This is mobile-first and responsive.
 * 
 * @module components/layout/Header
 */

"use client";

import { Menu, Moon, Sun, LogOut, User } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/client";
import { useAuth, useSidebar } from "@/lib/store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NotificationBell } from "@/components/notifications/NotificationBell";

/**
 * Header Component
 * 
 * Displays the top navigation bar with mobile menu toggle,
 * theme switcher, notifications, and user menu.
 */
export function Header() {
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Clear Firebase auth session
      await signOut(auth);
      
      // Clear Zustand store (auth state) - import store directly
      const { useStore } = await import("@/lib/store");
      useStore.getState().clearAuth();
      
      // Clear React Query cache
      const { QueryClient } = await import("@tanstack/react-query");
      const queryClient = new QueryClient();
      queryClient.clear();
      
      // Clear local storage
      localStorage.clear();
      
      // Clear session storage
      sessionStorage.clear();
      
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={toggleSidebar}
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* App Title/Logo */}
        <div className="flex items-center gap-2">
          {/* Logo - Show on mobile and desktop */}
          <div className="relative h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="MParekh Logo"
              fill
              sizes="(max-width: 768px) 32px, 40px"
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xs font-semibold tracking-tight md:text-xs">
            {process.env.NEXT_PUBLIC_APP_NAME || "MParekh"}
          </h1>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications Bell with Dropdown */}
          <NotificationBell />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* User Menu - Simple for now */}
          <div className="flex items-center gap-2 border-l border-border pl-2 ml-2">
            <button
              onClick={() => router.push("/profile")}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Profile"
              title={user?.name || "Profile"}
            >
              <User className="h-5 w-5" />
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
