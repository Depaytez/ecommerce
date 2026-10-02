import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaystackPaymentGateway } from '@/domains/payments/paystack.gateway';
import crypto from 'crypto';

describe('PaystackPaymentGateway', () => {
  const secretKey = 'sk_test_mock_paystack_secret_key';
  let gateway: PaystackPaymentGateway;

  beforeEach(() => {
    gateway = new PaystackPaymentGateway(secretKey);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeTransaction', () => {
    it('successfully initializes Paystack transaction with amount in kobo', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: true,
          message: 'Authorization URL created',
          data: {
            authorization_url: 'https://checkout.paystack.com/access_code_123',
            access_code: 'access_code_123',
            reference: 'ref_123',
          },
        }),
      });
      global.fetch = mockFetch;

      const result = await gateway.initializeTransaction({
        amount: 5000000, // 50,000 NGN in kobo
        email: 'customer@example.com',
        reference: 'JR-20261002-TEST',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paystack.co/transaction/initialize',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${secretKey}`,
          }),
        })
      );

      expect(result.authorization_url).toBe('https://checkout.paystack.com/access_code_123');
      expect(result.access_code).toBe('access_code_123');
      expect(result.reference).toBe('ref_123');
    });

    it('throws error when Paystack API returns status: false', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          status: false,
          message: 'Invalid amount or email',
        }),
      });

      await expect(
        gateway.initializeTransaction({
          amount: -100,
          email: 'invalid',
          reference: 'ref_fail',
        })
      ).rejects.toThrow('Invalid amount or email');
    });
  });

  describe('verifyTransaction', () => {
    it('fetches and returns verification data for a reference', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: true,
          data: {
            status: 'success',
            reference: 'ref_success_123',
            amount: 5000000,
            currency: 'NGN',
          },
        }),
      });

      const data = await gateway.verifyTransaction('ref_success_123');
      expect(data.status).toBe('success');
      expect(data.reference).toBe('ref_success_123');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('validates authentic webhook HMAC SHA-512 signatures', async () => {
      const payload = JSON.stringify({
        event: 'charge.success',
        data: {
          id: 998877,
          reference: 'ref_success_123',
          amount: 5000000,
        },
      });

      const signature = crypto
        .createHmac('sha512', secretKey)
        .update(payload)
        .digest('hex');

      const event = await gateway.verifyWebhookSignature(payload, signature, secretKey);

      expect(event.type).toBe('charge.success');
      expect(event.provider).toBe('paystack');
      expect((event.data.object as any).reference).toBe('ref_success_123');
    });

    it('throws error on invalid webhook signature', async () => {
      const payload = JSON.stringify({ event: 'charge.success' });
      const badSignature = 'invalid_tampered_signature_hex';

      await expect(
        gateway.verifyWebhookSignature(payload, badSignature, secretKey)
      ).rejects.toThrow('[Paystack Gateway] Invalid webhook signature');
    });
  });
});
