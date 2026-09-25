/**
 * Checkout Domain Service
 * Bounded Context: Checkout
 * Coordinates quote generation, price verification, and stock reservation.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import type { ICatalogRepository } from '@/domains/catalog/catalog.repository';
import { CartService } from '@/domains/cart/cart.service';
import type { CheckoutQuote, CheckoutItemQuote, StockReservationItem, StockReservationResult } from './types';

export class CheckoutService {
  constructor(
    private catalogRepo: ICatalogRepository,
    private client?: SupabaseClient
  ) {}

  private getClient(): SupabaseClient {
    return this.client || createClient();
  }

  /**
   * Generates a tamper-proof server-side quote directly from the catalog.
   * Client-supplied prices are strictly ignored.
   */
  async calculateServerQuote(
    items: Array<{ productId: string; quantity: number }>,
    currency: 'NGN' | 'USD' = 'NGN'
  ): Promise<CheckoutQuote> {
    if (items.length === 0) {
      return {
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        currency,
        isFreeShipping: false,
      };
    }

    const productIds = items.map((i) => i.productId);
    const products = await this.catalogRepo.findByIds(productIds);
    const productMap = new Map(products.map((p) => [p.id, p]));

    const quoteItems: CheckoutItemQuote[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (!product.is_active) {
        throw new Error(`Product is no longer available: ${product.name}`);
      }

      const unitPrice =
        product.discount_price !== null &&
        product.discount_price !== undefined &&
        product.discount_price > 0 &&
        product.discount_price < product.price
          ? product.discount_price
          : product.price;

      const subtotal = unitPrice * item.quantity;

      quoteItems.push({
        productId: product.id,
        name: product.name,
        unitPrice,
        quantity: item.quantity,
        subtotal,
      });
    }

    const subtotal = quoteItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    const tax = CartService.calculateTax(subtotal);
    const shipping = CartService.calculateShipping(subtotal);
    const total = subtotal + tax + shipping;

    return {
      items: quoteItems,
      subtotal,
      tax,
      shipping,
      total,
      currency,
      isFreeShipping: CartService.calculateShipping(subtotal) === 0 && subtotal > 0,
    };
  }

  /**
   * Reserves stock atomically for an order before payment
   */
  async reserveStock(
    orderId: string,
    items: StockReservationItem[],
    ttlMinutes: number = 15
  ): Promise<StockReservationResult> {
    const { data, error } = await this.getClient().rpc('reserve_stock_for_checkout', {
      p_order_id: orderId,
      p_items: items,
      p_ttl_minutes: ttlMinutes,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const result = data as { success: boolean; error?: string };
    return {
      success: result.success,
      reservationToken: orderId,
      error: result.error,
    };
  }

  /**
   * Releases stock reservation if checkout fails or is abandoned
   */
  async releaseStock(orderId: string): Promise<boolean> {
    const { data, error } = await this.getClient().rpc('release_stock_reservation', {
      p_order_id: orderId,
    });

    if (error) {
      console.error('Failed to release stock reservation:', error);
      return false;
    }

    return (data as { success: boolean })?.success ?? true;
  }
}
