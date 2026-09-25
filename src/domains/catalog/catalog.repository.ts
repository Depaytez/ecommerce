/**
 * Catalog Repository Interface & Supabase Implementation
 * Bounded Context: Catalog
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import type { Product, ProductFilters } from './types';

export interface ICatalogRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  findMany(filters?: ProductFilters): Promise<Product[]>;
  checkStockAvailability(productId: string, requestedQuantity: number): Promise<boolean>;
}

export class SupabaseCatalogRepository implements ICatalogRepository {
  constructor(private client?: SupabaseClient) {}

  private getClient(): SupabaseClient {
    return this.client || createClient();
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.getClient()
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Product;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await this.getClient()
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return data as Product;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];

    const { data, error } = await this.getClient()
      .from('products')
      .select('*')
      .in('id', ids);

    if (error || !data) return [];
    return data as Product[];
  }

  async findMany(filters?: ProductFilters): Promise<Product[]> {
    let query = this.getClient().from('products').select('*');

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters?.limit) {
      const start = filters.offset || 0;
      query = query.range(start, start + filters.limit - 1);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as Product[];
  }

  async checkStockAvailability(productId: string, requestedQuantity: number): Promise<boolean> {
    const product = await this.findById(productId);
    if (!product || !product.is_active) return false;
    return product.stock_quantity >= requestedQuantity;
  }
}
