/**
 * NAVIGATION CONFIGURATION
 * 
 * Defines the navigation structure for the Admin-side application.
 * This configuration is used by both the Sidebar and FloatingDock components.
 * 
 * Role-based visibility:
 * - All items are visible to admins and full_developer_admins
 * - The "Users" page is only visible to full_developer_admins
 * 
 * @module app/config/navConfig
 */

import {
  LayoutDashboard,
  Ticket,
  Plus,
  Users,
  Bell,
  User,
  type LucideIcon,
} from "lucide-react";

/**
 * Navigation item type definition
 */
export interface NavItem {
  /** Display label for the navigation item */
  label: string;
  
  /** The route/href for the navigation item */
  href: string;
  
  /** Lucide icon component */
  icon: LucideIcon;
  
  /** Role required to see this item (optional, defaults to any authenticated user) */
  requiredRole?: "full_developer_admin";
}

/**
 * Admin navigation items
 * 
 * These items are displayed in the sidebar and floating dock.
 * Items are ordered by importance and frequency of use.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Tickets",
    href: "/tickets",
    icon: Ticket,
  },
  {
    label: "Create Ticket",
    href: "/create-ticket",
    icon: Plus,
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    requiredRole: "full_developer_admin", // Only full_developer_admin can see this
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
];

/**
 * Filter navigation items based on user role
 * 
 * @param userRole - The role of the currently logged-in user
 * @returns Filtered array of navigation items that the user can access
 */
export function getVisibleNavItems(
  userRole: "admin" | "full_developer_admin" | "employee" | "user"
): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    // If no required role, item is visible to everyone
    if (!item.requiredRole) return true;
    
    // If required role matches user role, item is visible
    return item.requiredRole === userRole;
  });
}
