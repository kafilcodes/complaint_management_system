/**
 * CORE TYPE DEFINITIONS
 * 
 * This file contains all shared TypeScript types and interfaces for the application.
 * These types ensure type safety across the entire codebase and serve as
 * the single source of truth for data structures.
 * 
 * @module lib/types
 */

import { Timestamp } from "firebase/firestore";

// ==============================================================================
// USER TYPES
// ==============================================================================

/**
 * User roles with hierarchical permissions
 * - full_developer_admin: Super admin with all permissions including user management
 * - it_admin: Can manage all tickets but cannot manage users
 * - it_technician: Can only view and resolve assigned tickets
 * - store_manager: Can view and manage store tickets
 * - store_employee: Can create and view own tickets
 */
export type UserRole = 
  | "full_developer_admin" 
  | "it_admin" 
  | "it_technician"
  | "store_manager"
  | "store_employee";

/**
 * User document structure from Firestore
 * Document ID matches the Firebase Auth UID
 */
export interface User {
  id: string; // Same as uid for compatibility
  uid?: string; // Firebase Auth UID (optional for backward compatibility)
  email: string;
  name: string;
  phone?: string;
  photoURL?: string; // Profile photo URL from Firebase Storage
  role: UserRole;
  department?: string; // Department (e.g., "Customer Service", "IT Support")
  storeId?: string; // Store identifier for store employees/managers
  storeName?: string; // Store name for display
  brand?: string; // Brand (KFC, Pizza Hut, Taco Bell)
  category?: string; // Only for technicians
  isActive: boolean;
  disabled?: boolean; // From Firebase Auth (server-side only)
  lastLogin?: string; // From Firebase Auth metadata (server-side only)
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

/**
 * Base interface for all Firestore documents
 */
export interface FirestoreDocument {
  id: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

/**
 * Client-safe user data (without sensitive fields)
 * Used for UI display and non-sensitive operations
 */
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  category?: string;
}

// ==============================================================================
// TICKET TYPES
// ==============================================================================

/**
 * Ticket status lifecycle
 * - open: Newly created or assigned, awaiting resolution
 * - closed: Resolved by technician with resolution details
 */
export type TicketStatus = "open" | "closed";

/**
 * Timeline event for ticket activity log
 */
export interface TimelineEvent {
  event: "created" | "assigned" | "updated" | "resolved" | "comment";
  timestamp: Timestamp | Date;
  userId: string; // UID of user who triggered the event
  userName?: string; // Display name of user
  details?: Record<string, any>; // Additional event-specific data
  message?: string; // Human-readable message
}

/**
 * Ticket document structure from Firestore
 * This is the main collection for all complaints/service requests
 */
export interface Ticket {
  id: string;
  
  // Status & Metadata
  status: TicketStatus;
  createdAt: Timestamp | Date;
  createdBy: string; // UID of admin who created it
  assignedTo?: string | null; // UID of technician (null if unassigned)
  assignedAt?: Timestamp | Date | null;
  closedAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date;
  
  // Store Information
  storeId?: string;
  storeName?: string;
  
  // Customer Information
  customerName: string;
  customerPhone: string;
  address: string;
  pincode: string;
  
  // Product Information
  productName: string;
  productModel: string;
  purchaseDate: Timestamp | Date;
  brand: string; // From TICKET_BRANDS config
  
  // Issue Details
  issueDescription: string;
  comments?: string | null;
  
  // Attachments (Firebase Storage URLs or metadata)
  attachmentUrls?: string[];
  attachments?: TicketAttachment[];
  
  // Timeline (Activity log)
  timeline?: TimelineEvent[];
}

/**
 * Ticket Attachment metadata
 * Stored as array in ticket document or as subcollection
 */
export interface TicketAttachment {
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadURL: string;
  storagePath: string;
  uploadedAt: Timestamp | Date;
  uploadedBy: string; // UID
}

/**
 * Ticket Resolution document (1:1 with Ticket)
 * Stored separately to keep main tickets collection lightweight
 * Document ID matches the parent ticket ID
 */
export interface TicketResolution {
  ticketId: string;
  resolvedBy: string; // UID of technician
  resolvedAt: Timestamp;
  
  // Resolution Details
  productSerial: string;
  serviceRating: number; // 1-5 stars
  feedbackText?: string | null;
  
  // Attachments (Firebase Storage URLs)
  productImageURL?: string | null;
  warrantyCardURL?: string | null;
  partConsumedImageURL?: string | null;
}

/**
 * Ticket with resolution data (joined view)
 * Used for displaying complete ticket details
 */
export interface TicketWithResolution extends Ticket {
  resolution?: TicketResolution | null;
}

/**
 * Ticket with creator and assignee details (enriched view)
 * Used for display in lists and cards
 */
export interface TicketWithUsers extends Ticket {
  createdByUser?: UserProfile;
  assignedToUser?: UserProfile | null;
  resolution?: TicketResolution | null;
}

// ==============================================================================
// NOTIFICATION TYPES
// ==============================================================================

/**
 * Notification document structure from Firestore
 * Real-time notifications for ticket events
 */
export interface Notification {
  id: string;
  userId: string; // UID of recipient
  createdAt: Timestamp | Date | string;
  read: boolean;
  
  // Notification Content
  title: string;
  message: string;
  link?: string; // Relative path (e.g., /tickets/abc-123)
  
  // Optional metadata
  ticketId?: string;
  type: "ticket_assigned" | "ticket_resolved" | "ticket_updated" | "system";
  updatedAt?: Timestamp | Date | string;
}

// ==============================================================================
// FORM INPUT TYPES (Client-side)
// ==============================================================================

/**
 * Ticket creation form data
 * Used with react-hook-form and zod validation
 */
export interface TicketCreateInput {
  // Customer
  customerName: string;
  customerPhone: string;
  address: string;
  pincode: string;
  
  // Product
  productName: string;
  productModel: string;
  purchaseDate: Date | string; // Date picker returns Date, but can accept string
  brand: string;
  
  // Issue
  issueDescription: string;
  comments?: string;
  
  // Assignment (optional)
  assignedTo?: string | null;
}

/**
 * Ticket update form data
 * Partial type allows updating specific fields only
 */
export interface TicketUpdateInput extends Partial<TicketCreateInput> {
  status?: TicketStatus;
  assignedTo?: string | null;
}

/**
 * Resolution form data
 * Required to close a ticket
 */
export interface ResolutionFormInput {
  productSerial: string;
  serviceRating: number;
  feedbackText?: string;
  
  // File uploads (before upload to Storage)
  productImage?: File | null;
  warrantyCard?: File | null;
  partConsumedImage?: File | null;
}

/**
 * User creation form data (full_developer_admin only)
 */
export interface UserCreateInput {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  category?: string; // Required for technicians
}

/**
 * User update form data (full_developer_admin only)
 */
export interface UserUpdateInput {
  name?: string;
  phone?: string;
  role?: UserRole;
  category?: string;
  isActive?: boolean;
}

// ==============================================================================
// API RESPONSE TYPES
// ==============================================================================

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Generic API response union type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ==============================================================================
// DASHBOARD & ANALYTICS TYPES
// ==============================================================================

/**
 * Dashboard statistics for admins
 */
export interface AdminDashboardStats {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  unassignedTickets: number;
  totalTechnicians: number;
  avgResolutionTime?: number; // In hours
}

/**
 * Dashboard statistics for technicians
 */
export interface TechnicianDashboardStats {
  myOpenTickets: number;
  myClosedTickets: number;
  myTotalTickets: number;
  pendingNotifications: number;
}

/**
 * Ticket by brand chart data
 */
export interface TicketsByBrand {
  brand: string;
  count: number;
}

/**
 * Technician performance data
 */
export interface TechnicianPerformance {
  technicianId: string;
  technicianName: string;
  totalTickets: number;
  closedTickets: number;
  avgRating: number;
  avgResolutionTime: number; // In hours
}

// ==============================================================================
// UTILITY TYPES
// ==============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Filter parameters for tickets
 */
export interface TicketFilters {
  status?: TicketStatus;
  brand?: string;
  assignedTo?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string; // Search in customer name, phone, or issue description
}

// ==============================================================================
// AUTH & SESSION TYPES
// ==============================================================================

/**
 * Decoded Firebase token with custom claims
 */
export interface DecodedToken {
  uid: string;
  email?: string;
  role?: UserRole;
  email_verified?: boolean;
  iat?: number;
  exp?: number;
  aud?: string;
  iss?: string;
  sub?: string;
}

/**
 * Auth context state
 */
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

// ==============================================================================
// STORAGE TYPES
// ==============================================================================

/**
 * File upload metadata
 */
export interface FileUploadMetadata {
  contentType: string;
  size: number;
  name: string;
  ticketId: string;
  uploadedBy: string;
  uploadedAt: Date;
}

/**
 * Storage path configuration
 */
export interface StoragePaths {
  productImages: string;
  warrantyCards: string;
  partConsumedImages: string;
}

// ==============================================================================
// THEME & UI TYPES
// ==============================================================================

/**
 * Theme mode
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Toast notification types
 */
export type ToastType = "success" | "error" | "info" | "warning";

/**
 * Loading state
 */
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// ==============================================================================
// EXPORT ALL TYPES
// ==============================================================================

export type {
  // Re-export Firestore Timestamp for convenience
  Timestamp,
};
