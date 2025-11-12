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
  requiredRole?: "full_developer_admin" | "admin";
  
  /** Roles that should NOT see this item */
  excludedRoles?: string[];
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
    // Only admins can create tickets, not employees
    excludedRoles: ["employee"],
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
  userRole: string
): NavItem[] {
  console.log("========================================");
  console.log("[navConfig] 🧭 FILTERING NAVIGATION ITEMS");
  console.log("========================================");
  console.log("[navConfig] Input userRole:", userRole);
  console.log("[navConfig] userRole type:", typeof userRole);
  
  const filtered = NAV_ITEMS.filter((item) => {
    console.log(`[navConfig] Checking item: "${item.label}"`);
    console.log(`  - href: ${item.href}`);
    console.log(`  - requiredRole: ${item.requiredRole || "none"}`);
    console.log(`  - excludedRoles: ${item.excludedRoles?.join(", ") || "none"}`);
    
    // If item has excluded roles, check if user is excluded
    if (item.excludedRoles && item.excludedRoles.includes(userRole)) {
      console.log(`  ❌ EXCLUDED (user role "${userRole}" is in excludedRoles)`);
      return false;
    }
    
    // If no required role, item is visible to everyone
    if (!item.requiredRole) {
      console.log(`  ✅ VISIBLE (no required role)`);
      return true;
    }
    
    // full_developer_admin can see everything
    if (userRole === "full_developer_admin") {
      console.log(`  ✅ VISIBLE (user is full_developer_admin)`);
      return true;
    }
    
    // If required role matches user role, item is visible
    const matches = item.requiredRole === userRole;
    console.log(`  ${matches ? "✅" : "❌"} ${matches ? "VISIBLE" : "HIDDEN"} (requiredRole "${item.requiredRole}" ${matches ? "matches" : "doesn't match"} userRole "${userRole}")`);
    return matches;
  });
  
  console.log("[navConfig] ✅ Final visible items:", filtered.map(i => i.label));
  console.log("========================================");
  return filtered;
}
