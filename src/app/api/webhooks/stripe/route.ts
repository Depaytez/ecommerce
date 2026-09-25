/**
 * POST /api/webhooks/stripe
 * Stripe Webhook Handler
 * Idempotently handles asynchronous Stripe events:
 * - payment_intent.succeeded -> commits stock reservation, marks order completed
 * - payment_intent.payment_failed / payment_intent.canceled -> releases stock reservation
 * - charge.refunded -> updates payment status to refunded
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createServiceRoleClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret unconfigured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Use service role client to bypass RLS for webhook execution
  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.order_id;
        const userId = paymentIntent.metadata?.user_id;

        console.log(`[Stripe Webhook] Payment succeeded for PaymentIntent: ${paymentIntent.id}, Order: ${orderId}`);

        // 1. Find order (by ID or stripe_payment_intent_id)
        let orderQuery = supabase.from('orders').select('id, user_id, status, payment_status');
        if (orderId) {
          orderQuery = orderQuery.eq('id', orderId);
        } else {
          orderQuery = orderQuery.eq('stripe_payment_intent_id', paymentIntent.id);
        }

        const { data: order, error: orderFetchError } = await orderQuery.single();

        if (orderFetchError || !order) {
          console.error(`[Stripe Webhook] Order not found for PaymentIntent: ${paymentIntent.id}`);
          break;
        }

        // Idempotency check: if already completed, skip duplicate processing
        if (order.payment_status === 'completed') {
          console.log(`[Stripe Webhook] Order ${order.id} already marked as completed.`);
          break;
        }

        // 2. Commit stock reservation in database
        const { error: rpcError } = await supabase.rpc('commit_stock_reservation', {
          p_order_id: order.id,
        });

        if (rpcError) {
          console.error(`[Stripe Webhook] Error committing stock for order ${order.id}:`, rpcError);
        }

        // 3. Mark order as confirmed and payment completed
        const now = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'confirmed',
            payment_status: 'completed',
            payment_verified_at: now,
            payment_reference: paymentIntent.id,
            stripe_status: paymentIntent.status,
            updated_at: now,
          })
          .eq('id', order.id);

        if (updateError) {
          console.error(`[Stripe Webhook] Failed to update order status:`, updateError);
        }

        // 4. Clear user's cart
        const customerUserId = userId || order.user_id;
        if (customerUserId) {
          await supabase.from('cart_items').delete().eq('user_id', customerUserId);
        }

        break;
      }

      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.order_id;

        console.log(`[Stripe Webhook] Payment failed or cancelled for PaymentIntent: ${paymentIntent.id}`);

        let orderQuery = supabase.from('orders').select('id');
        if (orderId) {
          orderQuery = orderQuery.eq('id', orderId);
        } else {
          orderQuery = orderQuery.eq('stripe_payment_intent_id', paymentIntent.id);
        }

        const { data: order } = await orderQuery.single();
        if (order) {
          // Release reserved stock back into available pool
          await supabase.rpc('release_stock_reservation', {
            p_order_id: order.id,
          });

          await supabase
            .from('orders')
            .update({
              status: 'cancelled',
              payment_status: 'failed',
              stripe_status: paymentIntent.status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);
        }

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;

        if (paymentIntentId) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'refunded',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntentId);
        }

        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (handlerError: any) {
    console.error('[Stripe Webhook Handler Error]:', handlerError);
    return NextResponse.json(
      { error: 'Webhook processing error', details: handlerError.message },
      { status: 500 }
    );
  }
}
