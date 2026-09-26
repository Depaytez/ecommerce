import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '@/domains/orders/order.service';
import type { IOrderRepository } from '@/domains/orders/order.repository';
import type { Order, OrderStatus } from '@/domains/orders/types';

describe('OrderService', () => {
  const mockRepo: IOrderRepository = {
    findById: vi.fn(),
    findByOrderNumber: vi.fn(),
    findByStripePaymentIntentId: vi.fn(),
    findByUserId: vi.fn(),
    createOrder: vi.fn(),
    updateStatus: vi.fn(),
    updatePaymentStatus: vi.fn(),
    updateStripeDetails: vi.fn(),
  };

  const orderService = new OrderService(mockRepo);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateOrderNumber', () => {
    it('generates order number with JR-YYYYMMDD- prefix', () => {
      const orderNumber = OrderService.generateOrderNumber();
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      expect(orderNumber).toMatch(new RegExp(`^JR-${todayStr}-[A-Z0-9]{5}$`));
    });
  });

  describe('canTransition (State Machine)', () => {
    it('allows valid state transitions', () => {
      expect(OrderService.canTransition('pending', 'confirmed')).toBe(true);
      expect(OrderService.canTransition('pending', 'cancelled')).toBe(true);
      expect(OrderService.canTransition('confirmed', 'shipped')).toBe(true);
      expect(OrderService.canTransition('confirmed', 'cancelled')).toBe(true);
      expect(OrderService.canTransition('shipped', 'delivered')).toBe(true);
      expect(OrderService.canTransition('shipped', 'returned')).toBe(true);
      expect(OrderService.canTransition('delivered', 'returned')).toBe(true);
    });

    it('rejects invalid state transitions', () => {
      // Cannot jump from pending directly to delivered
      expect(OrderService.canTransition('pending', 'delivered')).toBe(false);
      // Cannot uncancel an order
      expect(OrderService.canTransition('cancelled', 'confirmed')).toBe(false);
      expect(OrderService.canTransition('cancelled', 'pending')).toBe(false);
      // Cannot move returned backwards
      expect(OrderService.canTransition('returned', 'shipped')).toBe(false);
    });
  });

  describe('transitionStatus', () => {
    const mockOrder: Order = {
      id: 'order-123',
      user_id: 'user-abc',
      order_number: 'JR-20260925-TEST1',
      subtotal: 10000,
      tax: 750,
      shipping_cost: 2500,
      total_amount: 13250,
      discount_applied: 0,
      currency: 'NGN',
      original_amount: null,
      exchange_rate: 1.0,
      status: 'pending',
      payment_status: 'pending',
      payment_reference: null,
      payment_verified_at: null,
      notes: null,
      shipping_address: '123 Test St, Lagos',
      billing_address: '123 Test St, Lagos',
      estimated_delivery_date: null,
      stripe_payment_intent_id: null,
      stripe_customer_id: null,
      stripe_client_secret: null,
      stripe_status: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('successfully transitions from pending to confirmed', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValueOnce(mockOrder);
      vi.mocked(mockRepo.updateStatus).mockResolvedValueOnce(true);

      const result = await orderService.transitionStatus('order-123', 'confirmed');

      expect(result.success).toBe(true);
      expect(result.previousStatus).toBe('pending');
      expect(result.newStatus).toBe('confirmed');
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('order-123', 'confirmed');
    });

    it('rejects illegal transition and does not call repository update', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValueOnce(mockOrder);

      const result = await orderService.transitionStatus('order-123', 'delivered');

      expect(result.success).toBe(false);
      expect(result.error).toContain("Illegal state transition from 'pending' to 'delivered'");
      expect(mockRepo.updateStatus).not.toHaveBeenCalled();
    });

    it('returns error if order does not exist', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValueOnce(null);

      const result = await orderService.transitionStatus('non-existent', 'confirmed');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Order with ID non-existent not found');
    });
  });

  describe('getUserOrder', () => {
    it('returns order if it belongs to the given user', async () => {
      const mockOrder: any = { id: 'order-1', user_id: 'user-123' };
      vi.mocked(mockRepo.findById).mockResolvedValueOnce(mockOrder);

      const order = await orderService.getUserOrder('order-1', 'user-123');
      expect(order).toEqual(mockOrder);
    });

    it('returns null if order belongs to a different user', async () => {
      const mockOrder: any = { id: 'order-1', user_id: 'user-other' };
      vi.mocked(mockRepo.findById).mockResolvedValueOnce(mockOrder);

      const order = await orderService.getUserOrder('order-1', 'user-123');
      expect(order).toBeNull();
    });
  });
});
