/**
 * Authentication & Role-Based Access Validation
 * 
 * Production-grade validation utilities for user authentication and role-based access control.
 * Provides comprehensive logging and error handling.
 * 
 * @module lib/auth-validation
 */

import type { User, UserRole } from "./types";

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Validate user object has required fields
 */
export function validateUser(user: User | null | undefined): ValidationResult {
  console.log("[validateUser] 🔍 Validating user:", {
    hasUser: !!user,
    userId: user?.id,
    userRole: user?.role,
  });

  if (!user) {
    return {
      isValid: false,
      error: "User is null or undefined",
      details: { user: null },
    };
  }

  if (!user.id) {
    return {
      isValid: false,
      error: "User ID is missing",
      details: { userId: user.id },
    };
  }

  if (!user.role) {
    return {
      isValid: false,
      error: "User role is missing",
      details: { role: user.role },
    };
  }

  if (!user.email) {
    return {
      isValid: false,
      error: "User email is missing",
      details: { email: user.email },
    };
  }

  if (!user.name) {
    return {
      isValid: false,
      error: "User name is missing",
      details: { name: user.name },
    };
  }

  return { isValid: true };
}

/**
 * Check if user is admin (full_developer_admin OR admin)
 */
export function isAdmin(user: User | null | undefined): boolean {
  const result = user?.role === "admin" || user?.role === "full_developer_admin";
  console.log("[isAdmin] 🔐 Check:", {
    userId: user?.id,
    role: user?.role,
    isAdmin: result,
  });
  return result;
}

/**
 * Check if user is employee
 */
export function isEmployee(user: User | null | undefined): boolean {
  const result = user?.role === "employee";
  console.log("[isEmployee] 🔐 Check:", {
    userId: user?.id,
    role: user?.role,
    isEmployee: result,
  });
  return result;
}

/**
 * Check if user is full developer admin
 */
export function isFullDeveloperAdmin(user: User | null | undefined): boolean {
  const result = user?.role === "full_developer_admin";
  console.log("[isFullDeveloperAdmin] 🔐 Check:", {
    userId: user?.id,
    role: user?.role,
    isFullDeveloperAdmin: result,
  });
  return result;
}

/**
 * Validate user has specific role
 */
export function hasRole(
  user: User | null | undefined,
  allowedRoles: UserRole[]
): ValidationResult {
  console.log("[hasRole] 🔐 Checking roles:", {
    userId: user?.id,
    userRole: user?.role,
    allowedRoles,
  });

  const userValidation = validateUser(user);
  if (!userValidation.isValid) {
    return userValidation;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return {
      isValid: false,
      error: `User role '${user?.role}' is not in allowed roles`,
      details: {
        userRole: user?.role,
        allowedRoles,
      },
    };
  }

  return { isValid: true };
}

/**
 * Check if user can view all tickets (admin only)
 */
export function canViewAllTickets(user: User | null | undefined): boolean {
  const result = isAdmin(user);
  console.log("[canViewAllTickets] 🎫 Check:", {
    userId: user?.id,
    role: user?.role,
    canView: result,
  });
  return result;
}

/**
 * Check if user can only view assigned tickets (employee only)
 */
export function canViewOnlyAssignedTickets(user: User | null | undefined): boolean {
  const result = isEmployee(user);
  console.log("[canViewOnlyAssignedTickets] 🎫 Check:", {
    userId: user?.id,
    role: user?.role,
    canViewOnlyAssigned: result,
  });
  return result;
}

/**
 * Validate user can access specific resource
 */
export function canAccessResource(
  user: User | null | undefined,
  resourceOwnerId: string
): ValidationResult {
  console.log("[canAccessResource] 🔒 Checking access:", {
    userId: user?.id,
    userRole: user?.role,
    resourceOwnerId,
  });

  const userValidation = validateUser(user);
  if (!userValidation.isValid) {
    return userValidation;
  }

  // Admins can access all resources
  if (isAdmin(user)) {
    return { isValid: true, details: { reason: "Admin access" } };
  }

  // Employees can only access their own resources
  if (user?.id === resourceOwnerId) {
    return { isValid: true, details: { reason: "Owner access" } };
  }

  return {
    isValid: false,
    error: "User cannot access this resource",
    details: {
      userId: user?.id,
      resourceOwnerId,
      userRole: user?.role,
    },
  };
}

/**
 * Get error message for failed validation
 */
export function getValidationErrorMessage(result: ValidationResult): string {
  if (result.isValid) return "";
  
  let message = result.error || "Validation failed";
  if (result.details) {
    message += ` - Details: ${JSON.stringify(result.details)}`;
  }
  
  return message;
}

/**
 * Log comprehensive user state for debugging
 */
export function logUserState(context: string, user: User | null | undefined) {
  console.group(`[AUTH] ${context}`);
  console.log("📊 User State:", {
    hasUser: !!user,
    userId: user?.id || "N/A",
    email: user?.email || "N/A",
    name: user?.name || "N/A",
    role: user?.role || "N/A",
    isActive: user?.isActive,
  });
  console.log("🔐 Role Checks:", {
    isAdmin: isAdmin(user),
    isEmployee: isEmployee(user),
    isFullDeveloperAdmin: isFullDeveloperAdmin(user),
    canViewAllTickets: canViewAllTickets(user),
    canViewOnlyAssignedTickets: canViewOnlyAssignedTickets(user),
  });
  console.log("✅ Validation:", validateUser(user));
  console.groupEnd();
}
