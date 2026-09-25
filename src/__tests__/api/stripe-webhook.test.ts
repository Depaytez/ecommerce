import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/webhooks/stripe/route';
import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import * as serverSupabase from '@/utils/supabase/server';

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

vi.mock('@/utils/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

describe('Stripe Webhook API Route', () => {
  const originalEnv = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  it('returns 400 if stripe-signature header is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing stripe-signature header');
  });

  it('returns 400 if signature verification fails', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementationOnce(() => {
      throw new Error('Invalid signature');
    });

    const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig_invalid' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Webhook Error: Invalid signature');
  });

  it('processes payment_intent.succeeded event and commits stock reservation', async () => {
    const mockEvent = {
      id: 'evt_test',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_success',
          status: 'succeeded',
          metadata: {
            order_id: 'order-uuid-123',
            user_id: 'user-uuid-abc',
          },
        },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent as any);

    const mockRpc = vi.fn().mockResolvedValue({ error: null });
    const mockOrderUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockOrderSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'order-uuid-123',
            user_id: 'user-uuid-abc',
            status: 'pending',
            payment_status: 'pending',
          },
          error: null,
        }),
      }),
    });
    const mockCartDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'orders') {
          return {
            select: mockOrderSelect,
            update: mockOrderUpdate,
          };
        }
        if (table === 'cart_items') {
          return {
            delete: mockCartDelete,
          };
        }
        return {};
      }),
      rpc: mockRpc,
    } as any;

    vi.mocked(serverSupabase.createServiceRoleClient).mockReturnValue(mockSupabase);

    const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig_valid' },
      body: JSON.stringify(mockEvent),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);

    expect(mockRpc).toHaveBeenCalledWith('commit_stock_reservation', {
      p_order_id: 'order-uuid-123',
    });
    expect(mockOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'confirmed',
        payment_status: 'completed',
        payment_reference: 'pi_test_success',
      })
    );
  });
});
