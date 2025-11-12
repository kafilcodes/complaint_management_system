/**
 * Application Configuration
 * 
 * Centralized configuration for brands, categories, priorities, and other
 * application-wide settings. This keeps business logic separate from code.
 */

export const APP_CONFIG = {
  name: "MParekh",
  description: "Internal Complaint Management System",
  version: "1.0.0",
} as const;

/**
 * Supported brands for ticket creation
 */
export const BRANDS = [
  { value: "kfc", label: "KFC" },
  { value: "pizza_hut", label: "Pizza Hut" },
  { value: "taco_bell", label: "Taco Bell" },
] as const;

/**
 * Issue categories for ticket classification
 */
export const CATEGORIES = [
  { value: "hardware", label: "Hardware", icon: "Monitor" },
  { value: "software", label: "Software", icon: "Code" },
  { value: "network", label: "Network", icon: "Wifi" },
  { value: "access", label: "Access Control", icon: "Key" },
  { value: "peripherals", label: "Peripherals", icon: "Mouse" },
  { value: "pos", label: "POS System", icon: "CreditCard" },
  { value: "telephony", label: "Telephony", icon: "Phone" },
  { value: "other", label: "Other", icon: "HelpCircle" },
] as const;

/**
 * Priority levels for tickets
 */
export const PRIORITIES = [
  { value: "low", label: "Low", color: "text-blue-600 bg-blue-50" },
  { value: "medium", label: "Medium", color: "text-yellow-600 bg-yellow-50" },
  { value: "high", label: "High", color: "text-orange-600 bg-orange-50" },
  { value: "urgent", label: "Urgent", color: "text-red-600 bg-red-50" },
] as const;

/**
 * Ticket status types - Simplified to Open and Closed only
 */
export const TICKET_STATUSES = [
  { value: "open", label: "Open", color: "text-white bg-green-600 hover:bg-green-700 border-green-600" },
  { value: "closed", label: "Closed", color: "text-white bg-red-600 hover:bg-red-700 border-red-600" },
] as const;

/**
 * User roles with permissions
 */
export const USER_ROLES = [
  {
    value: "employee",
    label: "Employee",
    description: "Can view and resolve assigned tickets (differentiated by department)",
    permissions: [
      "view_assigned_tickets",
      "update_assigned_tickets",
      "resolve_tickets",
      "comment_assigned_tickets",
    ] as string[],
  },
  {
    value: "admin",
    label: "Admin",
    description: "Can manage all tickets and assign to employees",
    permissions: [
      "view_all_tickets",
      "update_all_tickets",
      "assign_tickets",
      "resolve_tickets",
      "comment_all_tickets",
      "manage_categories",
    ] as string[],
  },
  {
    value: "full_developer_admin",
    label: "Full Developer Admin",
    description: "Complete system access including user management",
    permissions: [
      "view_all_tickets",
      "update_all_tickets",
      "delete_tickets",
      "assign_tickets",
      "resolve_tickets",
      "comment_all_tickets",
      "manage_categories",
      "manage_users",
      "view_analytics",
      "manage_system",
    ] as string[],
  },
] as const;

/**
 * Service rating options
 */
export const SERVICE_RATINGS = [
  { value: 1, label: "Poor", emoji: "😞" },
  { value: 2, label: "Fair", emoji: "😐" },
  { value: 3, label: "Good", emoji: "🙂" },
  { value: 4, label: "Very Good", emoji: "😊" },
  { value: 5, label: "Excellent", emoji: "🤩" },
] as const;

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = [
  { value: "ticket_created", label: "Ticket Created", icon: "Plus" },
  { value: "ticket_assigned", label: "Ticket Assigned", icon: "UserPlus" },
  { value: "ticket_updated", label: "Ticket Updated", icon: "Edit" },
  { value: "ticket_resolved", label: "Ticket Resolved", icon: "CheckCircle" },
  { value: "ticket_commented", label: "New Comment", icon: "MessageSquare" },
  { value: "mention", label: "Mentioned", icon: "AtSign" },
] as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
  maxPageSize: 100,
} as const;

/**
 * File upload constraints
 */
export const FILE_UPLOAD = {
  maxFileSize: 5 * 1024 * 1024, // 5MB in bytes
  maxFiles: 5,
  allowedTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
} as const;

/**
 * Timeouts and intervals (in milliseconds)
 */
export const TIMINGS = {
  toastDuration: 5000,
  autoRefreshInterval: 30000, // 30 seconds
  idleTimeout: 30 * 60 * 1000, // 30 minutes
  sessionWarning: 5 * 60 * 1000, // 5 minutes before timeout
} as const;

/**
 * Feature flags
 */
export const FEATURES = {
  enableNotifications: true,
  enableRealTimeUpdates: true,
  enableAnalytics: true,
  enablePWA: true,
  enableDarkMode: true,
  enableFileUploads: true,
  enableComments: true,
  enableMentions: true,
  enableEmailNotifications: false, // Coming soon
  enableSMSNotifications: false, // Coming soon
} as const;

/**
 * Helper function to get label by value
 */
export function getLabelByValue<T extends readonly { value: string; label: string }[]>(
  array: T,
  value: string
): string {
  return array.find((item) => item.value === value)?.label ?? value;
}

/**
 * Helper function to get color by value
 */
export function getColorByValue<
  T extends readonly { value: string; color?: string }[]
>(array: T, value: string): string {
  return array.find((item) => item.value === value)?.color ?? "";
}

/**
 * Helper function to check if user has permission
 */
export function hasPermission(userRole: string, permission: string): boolean {
  const role = USER_ROLES.find((r) => r.value === userRole);
  return role?.permissions.includes(permission as any) ?? false;
}

/**
 * Helper function to validate file upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > FILE_UPLOAD.maxFileSize) {
    return {
      valid: false,
      error: `File size must be less than ${FILE_UPLOAD.maxFileSize / (1024 * 1024)}MB`,
    };
  }

  if (!FILE_UPLOAD.allowedTypes.includes(file.type as any)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${FILE_UPLOAD.allowedExtensions.join(", ")}`,
    };
  }

  return { valid: true };
}
