import { JSONContent } from "@tiptap/core";
/**
 * Type definitions for JRADIANCE E-Commerce Application
 * Ensures type safety across the entire application
 */


/* User & Authentication Types */
export type UserRole = "customer" | "admin" | "agent" | "chief_admin";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  preferred_language: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminStaff {
  id: string;
  profile_id: string;
  staff_id: string;
  department: string | null;
  position: string | null;
  manager_id: string | null;
  permissions: Record<string, boolean>;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthState {
  error?: string | null;
  message?: string | null;
  requiresConfirmation?: boolean;
  email?: string | null;
  code?: AuthErrorCode;
}

/*
  Enhanced Authentication Types
*/
/**
 * Authenticated user with profile information
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  full_name?: string | null;
}

/**
 * Admin-specific user with extended info
 */
export interface AdminUser extends AuthenticatedUser {
  role: Extract<UserRole, "admin" | "agent" | "chief_admin">;
  staff_id?: string | null;
  department?: string | null;
  position?: string | null;
}

/**
 * Customer-specific user
 */
export interface CustomerUser extends AuthenticatedUser {
  role: Extract<UserRole, "customer">;
  phone?: string | null;
}

/**
 * Authentication error codes for consistent handling
 */
export enum AuthErrorCode {
  // General errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  TIMEOUT = "TIMEOUT",
  
  // Credential errors
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  EMAIL_NOT_FOUND = "EMAIL_NOT_FOUND",
  WRONG_PASSWORD = "WRONG_PASSWORD",
  
  // Account status errors
  ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE",
  ACCOUNT_NOT_CONFIRMED = "ACCOUNT_NOT_CONFIRMED",
  
  // Authorization errors
  UNAUTHORIZED_ROLE = "UNAUTHORIZED_ROLE",
  ACCESS_DENIED = "ACCESS_DENIED",
  
  // Session errors
  SESSION_EXPIRED = "SESSION_EXPIRED",
  SESSION_INVALID = "SESSION_INVALID",
  
  // Operation errors
  SIGNUP_FAILED = "SIGNUP_FAILED",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT_FAILED = "LOGOUT_FAILED",
  PASSWORD_RESET_FAILED = "PASSWORD_RESET_FAILED",
}

/**
 * Standard authentication result
 */
export interface AuthResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: AuthErrorCode;
}

/**
 * Result from authentication guard checks
 */
export interface GuardResult {
  success: boolean;
  isAuthenticated: boolean;
  isAdmin?: boolean;
  isChiefAdmin?: boolean;
  error?: string;
  redirectUrl?: string;
  user?: AuthenticatedUser;
}

/**
 * Role check result for RBAC
 */
export interface RoleCheckResult {
  hasRole: boolean;
  userRole?: UserRole;
  requiredRoles: UserRole[];
}

/**
 * Session persistence options
 */
export enum SessionPersistence {
  /** Session lasts until explicitly logged out */
  PERSISTENT = "persistent",
  /** Session expires after browser close */
  SESSION_ONLY = "session_only",
}

/**
 * Session configuration
 */
export interface SessionConfig {
  /** How long to remember the user (in seconds) */
  expiresIn: number;
  /** Whether to persist session across browser restarts */
  persistence: SessionPersistence;
}

/**
 * Default session configurations
 */
export const SESSION_CONFIGS = {
  /** Admin sessions: 30 days persistent */
  ADMIN: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    persistence: SessionPersistence.PERSISTENT,
  },
  /** Customer sessions: 7 days persistent */
  CUSTOMER: {
    expiresIn: 7 * 24 * 60 * 60, // 7 days
    persistence: SessionPersistence.PERSISTENT,
  },
  /** Temporary sessions: 1 hour */
  TEMPORARY: {
    expiresIn: 60 * 60, // 1 hour
    persistence: SessionPersistence.SESSION_ONLY,
  },
} as const;

/*
  Auth Action Input Types
*/
/**
 * Login form input
 */
export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Signup form input
 */
export interface SignupInput {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

/**
 * Password reset input
 */
export interface PasswordResetInput {
  password: string;
  confirmPassword: string;
}

/**
 * Email input for forgot password
 */
export interface EmailInput {
  email: string;
}

/* Product Types */
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  sku: string | null;
  images: string[];
  attributes: Record<string, string | number | boolean | null>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  review_text: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

/* Shopping Types */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  added_at: string;
  updated_at: string;
  product?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  added_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total_amount: number;
  discount_applied: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  notes: string | null;
  shipping_address: string | null;
  billing_address: string | null;
  estimated_delivery_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items?: OrderItem[];
}

/* Admin Types */
export interface AdminActivityLog {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/* API Response Types */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/* Service Layer Types */
export interface CreateOrderInput {
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total_amount: number;
  shipping_address?: string;
  billing_address?: string;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  is_active?: boolean;
}

/* Context Types */
export interface UserContextType {
  user: UserProfile | null;
  authUser: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isChiefAdmin: boolean;
  refetch: () => Promise<void>;
}

export type RichTextContent = JSONContent;
