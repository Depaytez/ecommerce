/**
 * Identity Domain Types
 * Bounded Context: Identity & Access Management
 */

export type UserRole = 'customer' | 'admin' | 'super_admin';

export type AdminStaffRole =
  | 'chief_administrator'
  | 'super_admin'
  | 'store_manager'
  | 'customer_support'
  | 'inventory_manager'
  | 'analyst';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  preferred_currency: string;
  country_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminStaff {
  id: string;
  user_id: string;
  role: AdminStaffRole;
  is_active: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
}
