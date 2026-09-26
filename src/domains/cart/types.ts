/**
 * Cart Domain Types
 * Bounded Context: Cart
 */

import type { Product } from '@/domains/catalog/types';

export interface CartItemEntity {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  added_at: string;
  updated_at: string;
  product?: Product;
}

export interface CartTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
  isFreeShipping: boolean;
}

export interface CartSummary {
  items: CartItemEntity[];
  totals: CartTotals;
}
