/**
 * Cart Repository Interface & Supabase Implementation
 * Bounded Context: Cart
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import type { CartItemEntity } from './types';
import type { Product } from '@/domains/catalog/types';

export interface ICartRepository {
  fetchUserCart(userId: string): Promise<CartItemEntity[]>;
  addItem(userId: string, productId: string, quantity: number): Promise<CartItemEntity | null>;
  updateQuantity(cartItemId: string, quantity: number): Promise<boolean>;
  removeItem(cartItemId: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;
}

export class SupabaseCartRepository implements ICartRepository {
  constructor(private client?: SupabaseClient) {}

  private getClient(): SupabaseClient {
    return this.client || createClient();
  }

  async fetchUserCart(userId: string): Promise<CartItemEntity[]> {
    if (!userId) return [];

    const { data, error } = await this.getClient()
      .from('cart_items')
      .select(`
        id,
        quantity,
        product_id,
        user_id,
        added_at,
        updated_at,
        product:products!inner (
          id,
          name,
          slug,
          description,
          category,
          price,
          discount_price,
          stock_quantity,
          sku,
          images,
          attributes,
          is_active,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return (data as unknown as Array<{
      id: string;
      user_id: string;
      product_id: string;
      quantity: number;
      added_at: string;
      updated_at: string;
      product: Product;
    }>).map((item) => ({
      id: item.id,
      user_id: item.user_id,
      product_id: item.product_id,
      quantity: item.quantity,
      added_at: item.added_at,
      updated_at: item.updated_at,
      product: item.product,
    }));
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<CartItemEntity | null> {
    if (!userId || !productId || quantity <= 0) return null;

    const { data, error } = await this.getClient()
      .from('cart_items')
      .upsert(
        {
          user_id: userId,
          product_id: productId,
          quantity,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,product_id',
          ignoreDuplicates: false,
        }
      )
      .select(`
        id,
        quantity,
        product_id,
        user_id,
        added_at,
        updated_at,
        product:products!inner (
          id,
          name,
          slug,
          description,
          category,
          price,
          discount_price,
          stock_quantity,
          sku,
          images,
          attributes,
          is_active,
          created_by,
          created_at,
          updated_at
        )
      `)
      .single();

    if (error || !data) {
      return null;
    }

    const item = data as unknown as {
      id: string;
      user_id: string;
      product_id: string;
      quantity: number;
      added_at: string;
      updated_at: string;
      product: Product;
    };

    return {
      id: item.id,
      user_id: item.user_id,
      product_id: item.product_id,
      quantity: item.quantity,
      added_at: item.added_at,
      updated_at: item.updated_at,
      product: item.product,
    };
  }

  async updateQuantity(cartItemId: string, quantity: number): Promise<boolean> {
    if (quantity <= 0) {
      return this.removeItem(cartItemId);
    }

    const { error } = await this.getClient()
      .from('cart_items')
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cartItemId);

    return !error;
  }

  async removeItem(cartItemId: string): Promise<boolean> {
    const { error } = await this.getClient()
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    return !error;
  }

  async clearCart(userId: string): Promise<boolean> {
    if (!userId) return false;

    const { error } = await this.getClient()
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    return !error;
  }
}
