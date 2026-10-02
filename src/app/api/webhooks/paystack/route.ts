/**
 * POST /api/webhooks/paystack
 * Paystack Webhook Handler
 * Idempotently processes asynchronous Paystack charge events:
 * - charge.success -> commits stock reservation, marks order completed
 * - charge.failed -> releases stock reservation
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceRoleClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-paystack-signature');
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing x-paystack-signature header' },
      { status: 400 }
    );
  }

  if (!secretKey) {
    console.error('[Paystack Webhook] PAYSTACK_SECRET_KEY is not configured');
    return NextResponse.json(
      { error: 'Paystack secret key unconfigured' },
      { status: 500 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
  }

  // 1. Verify HMAC SHA-512 signature
  const expectedHash = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex');

  if (expectedHash !== signature) {
    console.error('[Paystack Webhook] Signature verification failed');
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  let event: { event: string; data: any };
  try {
    event = JSON.parse(rawBody);
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  try {
    switch (event.event) {
      case 'charge.success': {
        const data = event.data;
        const reference = data.reference;
        const orderId = data.metadata?.order_id;
        const userId = data.metadata?.user_id;

        console.log(`[Paystack Webhook] Charge succeeded for reference: ${reference}, Order ID: ${orderId}`);

        // Find order by ID or payment_reference
        let orderQuery = supabase
          .from('orders')
          .select('id, user_id, status, payment_status, total_amount');

        if (orderId) {
          orderQuery = orderQuery.eq('id', orderId);
        } else if (reference) {
          orderQuery = orderQuery.eq('payment_reference', reference);
        }

        const { data: order, error: orderFetchError } = await orderQuery.maybeSingle();

        if (orderFetchError || !order) {
          console.error(`[Paystack Webhook] Order not found for reference ${reference}`);
          break;
        }

        // Idempotency check: if already completed, ignore duplicate delivery
        if (order.payment_status === 'completed') {
          console.log(`[Paystack Webhook] Order ${order.id} is already completed. Skipping.`);
          break;
        }

        // Commit stock reservation in database
        const { error: rpcError } = await supabase.rpc('commit_stock_reservation', {
          p_order_id: order.id,
        });

        if (rpcError) {
          console.error(`[Paystack Webhook] Error committing stock for order ${order.id}:`, rpcError);
        }

        // Update order status to confirmed & completed
        const now = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'confirmed',
            payment_status: 'completed',
            payment_verified_at: now,
            payment_reference: reference,
            updated_at: now,
          })
          .eq('id', order.id);

        if (updateError) {
          console.error(`[Paystack Webhook] Failed to update order status:`, updateError);
        }

        // Clear user's cart
        const customerUserId = userId || order.user_id;
        if (customerUserId) {
          await supabase.from('cart_items').delete().eq('user_id', customerUserId);
        }

        break;
      }

      case 'charge.failed': {
        const data = event.data;
        const reference = data.reference;
        const orderId = data.metadata?.order_id;

        console.log(`[Paystack Webhook] Charge failed for reference: ${reference}`);

        let orderQuery = supabase.from('orders').select('id, status, payment_status');
        if (orderId) {
          orderQuery = orderQuery.eq('id', orderId);
        } else if (reference) {
          orderQuery = orderQuery.eq('payment_reference', reference);
        }

        const { data: order } = await orderQuery.maybeSingle();

        if (order && order.payment_status !== 'completed') {
          // Release stock reservation back to catalog
          await supabase.rpc('release_stock_reservation', {
            p_order_id: order.id,
          });

          await supabase
            .from('orders')
            .update({
              status: 'cancelled',
              payment_status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);
        }

        break;
      }

      default:
        // Ignore unhandled events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[Paystack Webhook] Unexpected processing error:', err);
    return NextResponse.json(
      { error: err.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
