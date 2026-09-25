/**
 * POST /api/checkout/create-payment-intent
 * Server-side source of truth for checkout quote and Stripe PaymentIntent creation.
 * Enforces atomic stock reservation and prevents client pricing tampering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SupabaseCatalogRepository } from '@/domains/catalog/catalog.repository';
import { CheckoutService } from '@/domains/checkout/checkout.service';
import { SupabaseOrderRepository } from '@/domains/orders/order.repository';
import { OrderService } from '@/domains/orders/order.service';
import { StripePaymentGateway } from '@/domains/payments/stripe.gateway';

interface CreatePaymentIntentRequestBody {
  items: Array<{ productId: string; quantity: number }>;
  customer: {
    fullName: string;
    email: string;
    phone?: string;
    shippingAddress: string;
    billingAddress?: string;
  };
  currency?: 'NGN' | 'USD';
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to complete checkout.' },
        { status: 401 }
      );
    }

    const body: CreatePaymentIntentRequestBody = await req.json();
    const { items, customer, currency = 'NGN' } = body;

    // 1. Validate payload structure
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Invalid product or quantity in cart items' },
          { status: 400 }
        );
      }
    }

    if (!customer?.email || !customer?.shippingAddress || !customer?.fullName) {
      return NextResponse.json(
        { error: 'Missing required customer information (name, email, shipping address)' },
        { status: 400 }
      );
    }

    // 2. Compute server-side verified quote (database source of truth)
    const catalogRepo = new SupabaseCatalogRepository(supabase);
    const checkoutService = new CheckoutService(catalogRepo, supabase);

    let quote;
    try {
      quote = await checkoutService.calculateServerQuote(items, currency);
    } catch (calcError: any) {
      return NextResponse.json(
        { error: calcError.message || 'Pricing calculation failed' },
        { status: 400 }
      );
    }

    // 3. Create pending Order in database
    const orderRepo = new SupabaseOrderRepository(supabase);
    const orderNumber = OrderService.generateOrderNumber();

    const order = await orderRepo.createOrder({
      user_id: user.id,
      order_number: orderNumber,
      subtotal: quote.subtotal,
      tax: quote.tax,
      shipping_cost: quote.shipping,
      total_amount: quote.total,
      currency: quote.currency,
      shipping_address: customer.shippingAddress,
      billing_address: customer.billingAddress || customer.shippingAddress,
      notes: customer.phone ? `Phone: ${customer.phone}` : undefined,
      items: quote.items.map((i) => ({
        product_id: i.productId,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        total_price: i.subtotal,
      })),
    });

    // 4. Atomically reserve inventory
    const reservationItems = items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
    }));

    const reservationResult = await checkoutService.reserveStock(order.id, reservationItems);
    if (!reservationResult.success) {
      await orderRepo.updateStatus(order.id, 'cancelled');
      return NextResponse.json(
        {
          error:
            reservationResult.error ||
            'Insufficient inventory for one or more items. Stock reservation failed.',
        },
        { status: 409 }
      );
    }

    // 5. Create Stripe PaymentIntent
    const stripeGateway = new StripePaymentGateway();
    const paymentIntent = await stripeGateway.createPaymentIntent({
      amount: quote.total,
      currency: quote.currency.toLowerCase() as 'ngn' | 'usd',
      orderId: order.id,
      orderNumber: order.order_number,
      customerEmail: customer.email,
      customerName: customer.fullName,
      metadata: {
        user_id: user.id,
      },
    });

    // 6. Update order with Stripe references
    await orderRepo.updateStripeDetails(order.id, {
      stripePaymentIntentId: paymentIntent.paymentIntentId,
      stripeClientSecret: paymentIntent.clientSecret,
      stripeStatus: paymentIntent.status,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.clientSecret,
      orderId: order.id,
      orderNumber: order.order_number,
      quote,
    });
  } catch (error: any) {
    console.error('[Create Payment Intent API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error processing checkout' },
      { status: 500 }
    );
  }
}
