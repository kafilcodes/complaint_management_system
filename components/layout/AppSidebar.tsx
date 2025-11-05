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

/**
 * App Sidebar Props
 */
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  /** Optional user data override for testing */
  user?: {
    name: string;
    email: string;
    role: "admin" | "full_developer_admin" | "employee" | "user";
    avatar?: string;
  };
}

/**
 * Main Application Sidebar Component
 */
export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // TODO: Replace with actual user data from auth context/store
  // For now, using placeholder data
  const currentUser = user || {
    name: "Developer Admin",
    email: "admin@gmail.com",
    role: "full_developer_admin" as const,
    avatar: undefined,
  };

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
    <Sidebar collapsible="icon" {...props}>
      {/* ========================================
          SIDEBAR HEADER
          Shows app logo and name
      ======================================== */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          {/* Logo */}
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            aria-label="App Logo"
          >
            <span className="text-base font-bold">
              {process.env.NEXT_PUBLIC_APP_NAME?.[0] || "S"}
            </span>
          </div>
          
          {/* App Name (hidden when collapsed) */}
          <div className="flex flex-1 flex-col text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">
              {process.env.NEXT_PUBLIC_APP_NAME || "ServiceFirst"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Management System
            </span>
          </div>
        </div>
      </SidebarHeader>

      <Separator className="mx-2" />

      {/* ========================================
          SIDEBAR CONTENT
          Main navigation items
      ======================================== */}
      <SidebarContent>
        <SidebarMenu>
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
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
      <SidebarFooter>
        <Separator className="mx-2 mb-2" />
        
        {/* User Info */}
        <div className="flex items-center gap-2 px-2 py-1">
          <Avatar className="h-8 w-8 rounded-lg">
            {currentUser.avatar && (
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            )}
            <AvatarFallback className="rounded-lg">
              {userInitials}
            </AvatarFallback>
          </Avatar>

          {/* User details (hidden when collapsed) */}
          <div className="flex flex-1 flex-col text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">{currentUser.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {roleDisplay}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <div className="px-2 pb-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start gap-2",
              "group-data-[collapsible=icon]:justify-center"
            )}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span className="group-data-[collapsible=icon]:hidden">
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
