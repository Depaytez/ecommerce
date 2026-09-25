/**
 * Catalog Service
 * Bounded Context: Catalog
 * Domain operations: Pricing calculations, discounts, currency conversions, availability checks.
 */

import type { Product } from './types';
import type { ICatalogRepository } from './catalog.repository';

export const DEFAULT_USD_EXCHANGE_RATE = 0.00065; // Approx ₦1,538 to $1

export class CatalogService {
  constructor(private catalogRepo: ICatalogRepository) {}

  /**
   * Calculates the effective price of a product (accounting for valid discounts)
   */
  getEffectivePrice(product: Pick<Product, 'price' | 'discount_price'>): number {
    if (
      product.discount_price !== null &&
      product.discount_price !== undefined &&
      product.discount_price > 0 &&
      product.discount_price < product.price
    ) {
      return product.discount_price;
    }
    return product.price;
  }

  /**
   * Calculates discount percentage (0 to 100)
   */
  calculateDiscountPercentage(product: Pick<Product, 'price' | 'discount_price'>): number {
    const effectivePrice = this.getEffectivePrice(product);
    if (effectivePrice >= product.price || product.price <= 0) {
      return 0;
    }
    return Math.round(((product.price - effectivePrice) / product.price) * 100);
  }

  /**
   * Converts NGN amount to USD
   */
  convertToUsd(nairaAmount: number, exchangeRate: number = DEFAULT_USD_EXCHANGE_RATE): number {
    if (nairaAmount <= 0) return 0;
    const rate = exchangeRate > 0 ? exchangeRate : DEFAULT_USD_EXCHANGE_RATE;
    return Number((nairaAmount * rate).toFixed(2));
  }

  /**
   * Batch validates stock availability for a list of requested items against the catalog
   */
  async validateStockAvailability(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<{
    valid: boolean;
    unavailableItems: Array<{ productId: string; requested: number; available: number }>;
  }> {
    if (items.length === 0) {
      return { valid: true, unavailableItems: [] };
    }

    const productIds = items.map((i) => i.productId);
    const products = await this.catalogRepo.findByIds(productIds);
    const productMap = new Map(products.map((p) => [p.id, p]));

    const unavailableItems: Array<{ productId: string; requested: number; available: number }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || !product.is_active || product.stock_quantity < item.quantity) {
        unavailableItems.push({
          productId: item.productId,
          requested: item.quantity,
          available: product ? product.stock_quantity : 0,
        });
      }
    }

    return {
      valid: unavailableItems.length === 0,
      unavailableItems,
    };
  }
}
