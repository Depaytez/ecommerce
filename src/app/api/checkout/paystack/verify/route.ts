/**
 * GET /api/checkout/paystack/verify?reference=xyz
 * Verifies transaction with Paystack API immediately upon customer redirect.
 * Provides instant confirmation fallback alongside asynchronous webhook delivery.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PaystackPaymentGateway } from '@/domains/payments/paystack.gateway';
import { createServiceRoleClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference') || searchParams.get('trxref');

    if (!reference) {
      return NextResponse.json(
        { error: 'Missing reference parameter' },
        { status: 400 }
      );
    }

    const paystackGateway = new PaystackPaymentGateway();
    const data = await paystackGateway.verifyTransaction(reference);

    if (data.status !== 'success') {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${data.status}` },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const orderId = data.metadata?.order_id;
    const userId = data.metadata?.user_id;

    let orderQuery = supabase
      .from('orders')
      .select('id, user_id, order_number, status, payment_status');

    if (orderId) {
      orderQuery = orderQuery.eq('id', orderId);
    } else {
      orderQuery = orderQuery.eq('payment_reference', reference);
    }

    const { data: order, error: orderError } = await orderQuery.maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found for verified transaction' },
        { status: 404 }
      );
    }

    // Commit stock reservation if not already completed
    if (order.payment_status !== 'completed') {
      await supabase.rpc('commit_stock_reservation', {
        p_order_id: order.id,
      });

      const now = new Date().toISOString();
      await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'completed',
          payment_verified_at: now,
          payment_reference: reference,
          updated_at: now,
        })
        .eq('id', order.id);

      const customerUserId = userId || order.user_id;
      if (customerUserId) {
        await supabase.from('cart_items').delete().eq('user_id', customerUserId);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      status: 'completed',
    });
  } catch (error: any) {
    console.error('[Paystack Verify API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
