import { describe, it, expect, vi } from 'vitest';
import { StripePaymentGateway } from '@/domains/payments/stripe.gateway';

describe('StripePaymentGateway', () => {
  const mockCreate = vi.fn();
  const mockRetrieve = vi.fn();
  const mockCancel = vi.fn();
  const mockConstructEvent = vi.fn();

  const mockStripeClient = {
    paymentIntents: {
      create: mockCreate,
      retrieve: mockRetrieve,
      cancel: mockCancel,
    },
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  } as any;

  const gateway = new StripePaymentGateway(mockStripeClient);

  describe('createPaymentIntent', () => {
    it('creates payment intent with converted amount in smallest currency unit', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_xyz',
        amount: 5000000, // 50,000 NGN in kobo
        currency: 'ngn',
        status: 'requires_payment_method',
      });

      const result = await gateway.createPaymentIntent({
        amount: 50000,
        currency: 'ngn',
        orderId: 'order-1',
        orderNumber: 'JR-20260925-ABCD',
        customerEmail: 'customer@example.com',
        customerName: 'Test Customer',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5000000,
          currency: 'ngn',
          receipt_email: 'customer@example.com',
          metadata: expect.objectContaining({
            order_id: 'order-1',
            order_number: 'JR-20260925-ABCD',
          }),
        })
      );

      expect(result.clientSecret).toBe('pi_test_123_secret_xyz');
      expect(result.paymentIntentId).toBe('pi_test_123');
      expect(result.amount).toBe(50000);
      expect(result.currency).toBe('ngn');
    });

    it('throws error when Stripe fails to generate client_secret', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'pi_test_no_secret',
        client_secret: null,
      });

      await expect(
        gateway.createPaymentIntent({
          amount: 1000,
          currency: 'usd',
          orderId: 'order-2',
          orderNumber: 'JR-TEST-2',
          customerEmail: 'test@example.com',
        })
      ).rejects.toThrow('Failed to generate client_secret');
    });
  });

  describe('retrievePaymentIntent', () => {
    it('retrieves and maps existing payment intent', async () => {
      mockRetrieve.mockResolvedValueOnce({
        id: 'pi_test_retrieve',
        client_secret: 'secret_123',
        amount: 2500000,
        currency: 'ngn',
        status: 'succeeded',
      });

      const result = await gateway.retrievePaymentIntent('pi_test_retrieve');
      expect(result).not.toBeNull();
      expect(result?.paymentIntentId).toBe('pi_test_retrieve');
      expect(result?.amount).toBe(25000);
      expect(result?.status).toBe('succeeded');
    });

    it('returns null on retrieval error', async () => {
      mockRetrieve.mockRejectedValueOnce(new Error('PaymentIntent not found'));

      const result = await gateway.retrievePaymentIntent('pi_invalid');
      expect(result).toBeNull();
    });
  });

  describe('cancelPaymentIntent', () => {
    it('cancels payment intent successfully', async () => {
      mockCancel.mockResolvedValueOnce({ id: 'pi_cancel', status: 'canceled' });

      const success = await gateway.cancelPaymentIntent('pi_cancel');
      expect(success).toBe(true);
      expect(mockCancel).toHaveBeenCalledWith('pi_cancel');
    });

    it('returns false on cancel error', async () => {
      mockCancel.mockRejectedValueOnce(new Error('Cannot cancel'));

      const success = await gateway.cancelPaymentIntent('pi_cancel_fail');
      expect(success).toBe(false);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('constructs and returns verified webhook event', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test_123' } },
      };
      mockConstructEvent.mockReturnValueOnce(mockEvent);

      const event = await gateway.verifyWebhookSignature('payload', 'sig_123', 'whsec_123');
      expect(mockConstructEvent).toHaveBeenCalledWith('payload', 'sig_123', 'whsec_123');
      expect(event.id).toBe('evt_123');
      expect(event.type).toBe('payment_intent.succeeded');
    });
  });
});
