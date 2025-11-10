/**
 * Authentication Utilities
 * 
 * Helper functions for authentication, authorization, and user management.
 * These utilities work with both client-side (Firebase Auth) and server-side
 * (Firebase Admin) authentication.
 */

import { auth } from "@/firebase/client";
import { verifyIdToken } from "@/firebase/admin";
import type { User, UserRole } from "@/lib/types";
import { cookies } from "next/headers";

/**
 * Get the current authenticated user on the client side
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Get the current user's ID token
 */
export async function getCurrentUserToken(): Promise<string | null> {
  const user = getCurrentUser();
  if (!user) return null;

  try {
    return await user.getIdToken();
  } catch (error) {
    console.error("Error getting user token:", error);
    return null;
  }
}

/**
 * Get the current user's custom claims (includes role)
 */
export async function getCurrentUserClaims(): Promise<{
  role?: UserRole;
  [key: string]: unknown;
} | null> {
  const user = getCurrentUser();
  if (!user) return null;

  try {
    const idTokenResult = await user.getIdTokenResult();
    return idTokenResult.claims;
  } catch (error) {
    console.error("Error getting user claims:", error);
    return null;
  }
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const claims = await getCurrentUserClaims();
  return claims?.role === role;
}

/**
 * Check if the current user has any of the specified roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const claims = await getCurrentUserClaims();
  return roles.includes(claims?.role as UserRole);
}

/**
 * Check if the current user is an admin (IT Admin or Full Developer Admin)
 */
export async function isAdmin(): Promise<boolean> {
  return hasAnyRole(["it_admin", "full_developer_admin"]);
}

/**
 * Check if the current user is a full developer admin
 */
export async function isFullAdmin(): Promise<boolean> {
  return hasRole("full_developer_admin");
}

/**
 * Server-side function to verify authentication from request
 * Use this in API routes and Server Components
 */
export async function verifyAuth(request?: Request | { headers: Headers }): Promise<{
  authenticated: boolean;
  user: User | null;
  error?: string;
}> {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[verifyAuth:${requestId}] ===== START =====`);
  
  try {
    // Try to get token from Authorization header
    let token: string | null = null;

    if (request) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
        console.log(`[verifyAuth:${requestId}] Found Bearer token in header, length:`, token.length);
      } else {
        console.log(`[verifyAuth:${requestId}] No Bearer token found in Authorization header`);
      }
    }

    // If no token in header, try cookies (for SSR)
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("session")?.value ?? null;
      if (token) {
        console.log(`[verifyAuth:${requestId}] Found token in cookie, length:`, token.length);
      }
    }

    if (!token) {
      console.log(`[verifyAuth:${requestId}] ❌ No token found anywhere - returning 401`);
      return {
        authenticated: false,
        user: null,
        error: "No authentication token provided",
      };
    }

    console.log(`[verifyAuth:${requestId}] 🔍 About to verify token...`);
    // Verify the token
    const decodedToken = await verifyIdToken(token);
    console.log(`[verifyAuth:${requestId}] ✅ Token verified, constructing user object...`);

    // Construct user object from token claims
    const user: User = {
      id: decodedToken.uid,
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      name: decodedToken.name || "",
      role: (decodedToken.role as UserRole) || "store_employee",
      storeId: decodedToken.storeId as string,
      storeName: decodedToken.storeName as string,
      brand: decodedToken.brand as string,
      isActive: true,
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    };

    return {
      authenticated: true,
      user,
    };
  } catch (error) {
    console.error(`[verifyAuth:${requestId}] ❌ Authentication verification failed:`, error);
    return {
      authenticated: false,
      user: null,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}

/**
 * Server-side function to require authentication
 * Throws an error if user is not authenticated
 */
export async function requireAuth(request?: Request): Promise<User> {
  const { authenticated, user, error } = await verifyAuth(request);

  if (!authenticated || !user) {
    throw new Error(error || "Authentication required");
  }

  return user;
}

/**
 * Server-side function to require specific role
 * Throws an error if user doesn't have the required role
 */
export async function requireRole(
  role: UserRole,
  request?: Request
): Promise<User> {
  const user = await requireAuth(request);

  if (user.role !== role) {
    throw new Error(`Access denied. Required role: ${role}`);
  }

  return user;
}

/**
 * Server-side function to require any of the specified roles
 * Throws an error if user doesn't have any of the required roles
 */
export async function requireAnyRole(
  roles: UserRole[],
  request?: Request
): Promise<User> {
  const user = await requireAuth(request);

  if (!roles.includes(user.role)) {
    throw new Error(`Access denied. Required roles: ${roles.join(", ")}`);
  }

  return user;
}

/**
 * Server-side function to require admin access
 * Throws an error if user is not an admin
 */
export async function requireAdmin(request?: Request): Promise<User> {
  return requireAnyRole(["it_admin", "full_developer_admin"], request);
}

/**
 * Server-side function to require full admin access
 * Throws an error if user is not a full developer admin
 */
export async function requireFullAdmin(request?: Request): Promise<User> {
  return requireRole("full_developer_admin", request);
}

/**
 * Format user display name
 */
export function formatUserName(user: User | null): string {
  if (!user) return "Unknown User";
  return user.name || user.email || "Unknown User";
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(user: User | null): string {
  if (!user?.name) return "U";

  const nameParts = user.name.trim().split(" ");
  if (nameParts.length >= 2) {
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  }

  return user.name.substring(0, 2).toUpperCase();
}

/**
 * Check if user can perform action on ticket
 */
export function canModifyTicket(user: User, ticketCreatorId: string): boolean {
  // Admins can modify any ticket
  if (user.role === "it_admin" || user.role === "full_developer_admin") {
    return true;
  }

  // Technicians can modify assigned tickets (checked elsewhere)
  if (user.role === "it_technician") {
    return false; // Must check assignedTo separately
  }

  // Users can only modify their own tickets
  return user.id === ticketCreatorId;
}

/**
 * Check if user can view ticket
 */
export function canViewTicket(user: User, ticket: {
  creatorId: string;
  storeId?: string;
  assignedTo?: string;
}): boolean {
  // Admins and technicians can view all tickets
  if (
    user.role === "it_admin" ||
    user.role === "full_developer_admin" ||
    user.role === "it_technician"
  ) {
    return true;
  }

  // Store managers can view tickets from their store
  if (user.role === "store_manager" && ticket.storeId === user.storeId) {
    return true;
  }

  // Users can view their own tickets
  return user.id === ticket.creatorId;
}
