import { describe, it, expect, vi } from 'vitest';
import { CatalogService, DEFAULT_USD_EXCHANGE_RATE } from '@/domains/catalog/catalog.service';
import type { ICatalogRepository } from '@/domains/catalog/catalog.repository';
import type { Product } from '@/domains/catalog/types';

describe('CatalogService', () => {
  const mockProduct: Product = {
    id: 'prod-123',
    name: 'Luxury Rose Gold Serum',
    slug: 'luxury-rose-gold-serum',
    description: 'Nourishing serum',
    category: 'Skincare',
    price: 20000,
    discount_price: 15000,
    stock_quantity: 10,
    sku: 'SKU-SERUM-01',
    images: ['https://example.com/serum.jpg'],
    attributes: {},
    is_active: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockRepo: ICatalogRepository = {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findByIds: vi.fn(),
    findMany: vi.fn(),
    checkStockAvailability: vi.fn(),
  };

  const service = new CatalogService(mockRepo);

  describe('getEffectivePrice', () => {
    it('returns discount_price when discount is active and lower than original price', () => {
      const price = service.getEffectivePrice(mockProduct);
      expect(price).toBe(15000);
    });

    it('returns regular price when discount_price is null or undefined', () => {
      const noDiscount = { ...mockProduct, discount_price: null };
      expect(service.getEffectivePrice(noDiscount)).toBe(20000);
    });

    it('returns regular price when discount_price is greater than or equal to regular price', () => {
      const invalidDiscount = { ...mockProduct, discount_price: 25000 };
      expect(service.getEffectivePrice(invalidDiscount)).toBe(20000);
    });
  });

  describe('calculateDiscountPercentage', () => {
    it('calculates accurate discount percentage', () => {
      // 20000 down to 15000 is 25% discount
      const pct = service.calculateDiscountPercentage(mockProduct);
      expect(pct).toBe(25);
    });

    it('returns 0 when there is no discount', () => {
      const noDiscount = { ...mockProduct, discount_price: null };
      expect(service.calculateDiscountPercentage(noDiscount)).toBe(0);
    });
  });

  describe('convertToUsd', () => {
    it('converts naira to USD using default exchange rate', () => {
      const usd = service.convertToUsd(20000);
      expect(usd).toBe(Number((20000 * DEFAULT_USD_EXCHANGE_RATE).toFixed(2)));
    });

    it('converts naira to USD using custom exchange rate', () => {
      const usd = service.convertToUsd(10000, 0.001);
      expect(usd).toBe(10);
    });

    it('returns 0 for non-positive amounts', () => {
      expect(service.convertToUsd(0)).toBe(0);
      expect(service.convertToUsd(-500)).toBe(0);
    });
  });

  describe('validateStockAvailability', () => {
    it('returns valid when requested items are in stock', async () => {
      vi.mocked(mockRepo.findByIds).mockResolvedValueOnce([mockProduct]);

      const result = await service.validateStockAvailability([
        { productId: 'prod-123', quantity: 5 },
      ]);

      expect(result.valid).toBe(true);
      expect(result.unavailableItems).toHaveLength(0);
    });

    it('flags unavailable items when requested quantity exceeds stock', async () => {
      vi.mocked(mockRepo.findByIds).mockResolvedValueOnce([mockProduct]);

      const result = await service.validateStockAvailability([
        { productId: 'prod-123', quantity: 20 },
      ]);

      expect(result.valid).toBe(false);
      expect(result.unavailableItems).toHaveLength(1);
      expect(result.unavailableItems[0].requested).toBe(20);
      expect(result.unavailableItems[0].available).toBe(10);
    });

    it('flags inactive products as unavailable', async () => {
      const inactiveProduct = { ...mockProduct, is_active: false };
      vi.mocked(mockRepo.findByIds).mockResolvedValueOnce([inactiveProduct]);

      const result = await service.validateStockAvailability([
        { productId: 'prod-123', quantity: 1 },
      ]);

      expect(result.valid).toBe(false);
      expect(result.unavailableItems[0].productId).toBe('prod-123');
    });
  });
});
