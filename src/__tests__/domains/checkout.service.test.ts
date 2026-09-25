import { describe, it, expect, vi } from 'vitest';
import { CheckoutService } from '@/domains/checkout/checkout.service';
import type { ICatalogRepository } from '@/domains/catalog/catalog.repository';
import type { Product } from '@/domains/catalog/types';

describe('CheckoutService', () => {
  const activeProduct: Product = {
    id: 'prod-1',
    name: 'Hydrating Face Cream',
    slug: 'hydrating-face-cream',
    description: null,
    category: 'Skincare',
    price: 30000,
    discount_price: 25000,
    stock_quantity: 15,
    sku: 'HFC-001',
    images: [],
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

  const mockRpc = vi.fn();
  const mockSupabaseClient = {
    rpc: mockRpc,
  } as any;

  const checkoutService = new CheckoutService(mockRepo, mockSupabaseClient);

  describe('calculateServerQuote', () => {
    it('calculates server quote accurately using database discount price', async () => {
      vi.mocked(mockRepo.findByIds).mockResolvedValueOnce([activeProduct]);

      const quote = await checkoutService.calculateServerQuote([
        { productId: 'prod-1', quantity: 2 },
      ]);

      expect(quote.items).toHaveLength(1);
      expect(quote.items[0].unitPrice).toBe(25000);
      expect(quote.items[0].subtotal).toBe(50000);
      expect(quote.subtotal).toBe(50000);
      expect(quote.tax).toBe(Math.round(50000 * 0.075)); // 3750
      expect(quote.shipping).toBe(2500); // <= 50000
      expect(quote.total).toBe(50000 + 3750 + 2500);
      expect(quote.currency).toBe('NGN');
    });

    it('throws error when requested product is not found', async () => {
      vi.mocked(mockRepo.findByIds).mockResolvedValueOnce([]);

      await expect(
        checkoutService.calculateServerQuote([{ productId: 'non-existent', quantity: 1 }])
      ).rejects.toThrow('Product not found: non-existent');
    });

    it('throws error when requested product is inactive', async () => {
      vi.mocked(mockRepo.findByIds).mockResolvedValueOnce([
        { ...activeProduct, is_active: false },
      ]);

      await expect(
        checkoutService.calculateServerQuote([{ productId: 'prod-1', quantity: 1 }])
      ).rejects.toThrow('Product is no longer available');
    });
  });

  describe('reserveStock', () => {
    it('calls database rpc reserve_stock_for_checkout', async () => {
      mockRpc.mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const result = await checkoutService.reserveStock('order-123', [
        { product_id: 'prod-1', quantity: 2 },
      ]);

      expect(mockRpc).toHaveBeenCalledWith('reserve_stock_for_checkout', {
        p_order_id: 'order-123',
        p_items: [{ product_id: 'prod-1', quantity: 2 }],
        p_ttl_minutes: 15,
      });
      expect(result.success).toBe(true);
    });

    it('handles database reservation error cleanly', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insufficient stock' },
      });

      const result = await checkoutService.reserveStock('order-123', [
        { product_id: 'prod-1', quantity: 100 },
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient stock');
    });
  });
});
