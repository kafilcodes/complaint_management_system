/**
 * APP SIDEBAR COMPONENT
 * 
 * The main navigation sidebar for the admin application.
 * Features:
 * - Collapsible to icon-only view
 * - Mobile-responsive (becomes Sheet on mobile)
 * - Role-based navigation filtering
 * - User avatar and info display
 * - Logout functionality
 * 
 * @module components/layout/AppSidebar
 */

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

import { NAV_ITEMS, getVisibleNavItems } from "@/app/config/navConfig";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/firebase/client";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { useAuth } from "@/lib/store";
import { ThemeToggle } from "@/components/common/ThemeToggle";

/**
 * App Sidebar Props
 */
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

/**
 * Main Application Sidebar Component
 */
export function AppSidebar({ ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Get current user from Zustand store (populated by AuthProvider)
  const { user: currentUser } = useAuth();

  // If no user is logged in, don't render the sidebar
  // (this shouldn't happen as layout is protected, but adding as safety)
  if (!currentUser) {
    return null;
  }

  // Get visible navigation items based on user role
  const visibleNavItems = React.useMemo(
    () => getVisibleNavItems(currentUser.role),
    [currentUser.role]
  );

  /**
   * Handle logout
   * Clears auth session and redirects to login
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
      setIsLoggingOut(false);
    }
  };

  /**
   * Get user initials for avatar fallback
   */
  const userInitials = React.useMemo(() => {
    return currentUser.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [currentUser.name]);

  /**
   * Format role for display
   */
  const roleDisplay = React.useMemo(() => {
    const roleMap: Record<string, string> = {
      full_developer_admin: "Developer Admin",
      admin: "Admin",
      employee: "Employee",
      user: "User",
    };
    return roleMap[currentUser.role] || currentUser.role;
  }, [currentUser.role]);

  return (
    <Sidebar collapsible="icon" {...props} className="border-r-0 overflow-hidden">
      {/* ========================================
          SIDEBAR HEADER
          Shows app logo and name
      ======================================== */}
      <SidebarHeader className="border-b-0">
        <div className="flex items-center gap-3 px-4 py-4 group-data-[collapsible=icon]:justify-center">
          {/* Logo with proper aspect ratio */}
          <div className="relative h-10 w-10 flex-shrink-0 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12">
            <Image
              src="/logo.png"
              alt="ServiceFirst Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          
          {/* App Name (hidden when collapsed) */}
          <div className="flex flex-1 flex-col text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold text-base">
              {process.env.NEXT_PUBLIC_APP_NAME || "ServiceFirst"}
            </span>
            <span className="truncate text-sm text-muted-foreground">
              Management System
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* ========================================
          SIDEBAR CONTENT
          Main navigation items
      ======================================== */}
      <SidebarContent className="px-2">
        <SidebarMenu className="gap-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className="h-11"
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <Icon className="h-6 w-6 flex-shrink-0" />
                    <span className="text-base">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* ========================================
          SIDEBAR FOOTER
          User info and logout button
      ======================================== */}
      <SidebarFooter className="border-t-0 mt-auto px-4 pb-4">
        {/* User Info */}
        <div className="flex items-center gap-3 px-2 py-3 rounded-lg bg-accent/50 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-10 w-10 rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>

          {/* User details (hidden when collapsed) */}
          <div className="flex flex-1 flex-col text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium text-sm">{currentUser.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {roleDisplay}
            </span>
          </div>
        </div>

        {/* Theme Toggle and Logout */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 justify-start gap-3 h-11",
              "group-data-[collapsible=icon]:flex-initial group-data-[collapsible=icon]:justify-center"
            )}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
            <span className="text-base group-data-[collapsible=icon]:hidden">
              Logout
            </span>
          </Button>
        </div>
      </SidebarFooter>

      {/* Sidebar Rail (hover area for expanding collapsed sidebar) */}
      <SidebarRail />
    </Sidebar>
  );
}
