/**
 * Identity Repository Interface & Supabase Implementation
 * Bounded Context: Identity & Access Management
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import type { UserProfile, AdminStaff } from './types';

export interface IIdentityRepository {
  getProfile(userId: string): Promise<UserProfile | null>;
  getAdminStaff(userId: string): Promise<AdminStaff | null>;
  isStaffAdmin(userId: string): Promise<boolean>;
  isChiefAdmin(userId: string): Promise<boolean>;
}

export class SupabaseIdentityRepository implements IIdentityRepository {
  constructor(private client?: SupabaseClient) {}

  private getClient(): SupabaseClient {
    return this.client || createClient();
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;

    const { data, error } = await this.getClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as UserProfile;
  }

  async getAdminStaff(userId: string): Promise<AdminStaff | null> {
    if (!userId) return null;

    const { data, error } = await this.getClient()
      .from('admin_staff')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data as AdminStaff;
  }

  async isStaffAdmin(userId: string): Promise<boolean> {
    const staff = await this.getAdminStaff(userId);
    return staff !== null && staff.is_active;
  }

  async isChiefAdmin(userId: string): Promise<boolean> {
    const staff = await this.getAdminStaff(userId);
    return staff !== null && staff.is_active && staff.role === 'chief_administrator';
  }
}
