/**
 * Cart Domain Service
 * Pure business logic for cart mathematical operations and shipping/tax rules.
 * Bounded Context: Cart
 */

import type { CartItemEntity, CartTotals } from './types';

export const VAT_RATE = 0.075; // 7.5% Nigerian VAT
export const FREE_SHIPPING_THRESHOLD = 50000; // Free shipping threshold ₦50,000
export const STANDARD_SHIPPING_FEE = 2500; // Standard shipping ₦2,500

export class CartService {
  /**
   * Calculates subtotal for a single cart item
   */
  static getItemUnitPrice(item: Pick<CartItemEntity, 'product'>): number {
    if (!item.product) return 0;
    if (
      item.product.discount_price !== null &&
      item.product.discount_price !== undefined &&
      item.product.discount_price > 0 &&
      item.product.discount_price < item.product.price
    ) {
      return item.product.discount_price;
    }
    return item.product.price;
  }

  static getItemSubtotal(item: Pick<CartItemEntity, 'product' | 'quantity'>): number {
    return this.getItemUnitPrice(item) * Math.max(0, item.quantity);
  }

  /**
   * Calculates shipping fee based on subtotal
   */
  static calculateShipping(subtotal: number): number {
    if (subtotal <= 0) return 0;
    return subtotal > FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  }

  /**
   * Calculates VAT based on subtotal
   */
  static calculateTax(subtotal: number): number {
    if (subtotal <= 0) return 0;
    return Math.round(subtotal * VAT_RATE);
  }

  /**
   * Computes complete financial totals for a collection of cart items
   */
  static calculateTotals(
    items: Array<Pick<CartItemEntity, 'product' | 'quantity'>>
  ): CartTotals {
    let subtotal = 0;
    let itemCount = 0;

    for (const item of items) {
      const qty = Math.max(0, item.quantity);
      itemCount += qty;
      subtotal += this.getItemSubtotal(item);
    }

    const tax = this.calculateTax(subtotal);
    const shipping = this.calculateShipping(subtotal);
    const total = subtotal + tax + shipping;

    return {
      subtotal,
      tax,
      shipping,
      total,
      itemCount,
      isFreeShipping: subtotal > FREE_SHIPPING_THRESHOLD && subtotal > 0,
    };
  }
}
