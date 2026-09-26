import { describe, it, expect } from 'vitest';
import {
  CartService,
  VAT_RATE,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from '@/domains/cart/cart.service';
import type { CartItemEntity } from '@/domains/cart/types';
import type { Product } from '@/domains/catalog/types';

describe('CartService', () => {
  const baseProduct: Product = {
    id: 'prod-1',
    name: 'Glow Moisturizer',
    slug: 'glow-moisturizer',
    description: null,
    category: 'Skincare',
    price: 10000,
    discount_price: null,
    stock_quantity: 50,
    sku: null,
    images: [],
    attributes: {},
    is_active: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe('calculateShipping', () => {
    it('returns 0 when subtotal is 0', () => {
      expect(CartService.calculateShipping(0)).toBe(0);
    });

    it('returns standard shipping fee for orders at or below free shipping threshold', () => {
      expect(CartService.calculateShipping(FREE_SHIPPING_THRESHOLD)).toBe(STANDARD_SHIPPING_FEE);
      expect(CartService.calculateShipping(25000)).toBe(STANDARD_SHIPPING_FEE);
    });

    it('returns 0 (free shipping) for orders above free shipping threshold', () => {
      expect(CartService.calculateShipping(FREE_SHIPPING_THRESHOLD + 1)).toBe(0);
      expect(CartService.calculateShipping(100000)).toBe(0);
    });
  });

  describe('calculateTax', () => {
    it('returns 0 tax for zero subtotal', () => {
      expect(CartService.calculateTax(0)).toBe(0);
    });

    it('calculates 7.5% Nigerian VAT accurately', () => {
      const subtotal = 40000;
      expect(CartService.calculateTax(subtotal)).toBe(Math.round(40000 * VAT_RATE));
      expect(CartService.calculateTax(subtotal)).toBe(3000);
    });
  });

  describe('calculateTotals', () => {
    it('calculates empty cart correctly', () => {
      const totals = CartService.calculateTotals([]);
      expect(totals.subtotal).toBe(0);
      expect(totals.tax).toBe(0);
      expect(totals.shipping).toBe(0);
      expect(totals.total).toBe(0);
      expect(totals.itemCount).toBe(0);
      expect(totals.isFreeShipping).toBe(false);
    });

    it('calculates single item under free shipping threshold', () => {
      const item: Pick<CartItemEntity, 'product' | 'quantity'> = {
        product: baseProduct,
        quantity: 2,
      };

      const totals = CartService.calculateTotals([item]);
      const expectedSubtotal = 20000;
      const expectedTax = Math.round(20000 * 0.075); // 1500
      const expectedShipping = STANDARD_SHIPPING_FEE; // 2500

      expect(totals.subtotal).toBe(expectedSubtotal);
      expect(totals.tax).toBe(expectedTax);
      expect(totals.shipping).toBe(expectedShipping);
      expect(totals.total).toBe(expectedSubtotal + expectedTax + expectedShipping);
      expect(totals.itemCount).toBe(2);
      expect(totals.isFreeShipping).toBe(false);
    });

    it('calculates cart qualifying for free shipping', () => {
      const item: Pick<CartItemEntity, 'product' | 'quantity'> = {
        product: baseProduct, // 10000 each
        quantity: 6, // 60000 subtotal > 50000
      };

      const totals = CartService.calculateTotals([item]);
      const expectedSubtotal = 60000;
      const expectedTax = Math.round(60000 * 0.075); // 4500
      const expectedShipping = 0;

      expect(totals.subtotal).toBe(expectedSubtotal);
      expect(totals.tax).toBe(expectedTax);
      expect(totals.shipping).toBe(expectedShipping);
      expect(totals.total).toBe(expectedSubtotal + expectedTax);
      expect(totals.itemCount).toBe(6);
      expect(totals.isFreeShipping).toBe(true);
    });

    it('honors product discount price when calculating subtotal', () => {
      const discountedProduct: Product = {
        ...baseProduct,
        price: 20000,
        discount_price: 12000,
      };

      const item: Pick<CartItemEntity, 'product' | 'quantity'> = {
        product: discountedProduct,
        quantity: 3,
      };

      const totals = CartService.calculateTotals([item]);
      expect(totals.subtotal).toBe(36000); // 12000 * 3
    });
  });
});
