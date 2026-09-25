/**
 * Stripe Payment Gateway Implementation
 * Bounded Context: Payments
 * Implements IPaymentGateway using official Stripe Node SDK.
 */

import Stripe from 'stripe';
import { stripe as defaultStripe } from '@/lib/stripe';
import type { IPaymentGateway } from './payment.gateway';
import type {
  CreatePaymentIntentParams,
  PaymentIntentResult,
  PaymentWebhookEvent,
} from './types';

export class StripePaymentGateway implements IPaymentGateway {
  constructor(private stripeClient: Stripe = defaultStripe) {}

  /**
   * Creates a PaymentIntent in Stripe.
   * If currency is NGN, converts to smallest unit (kobo: 1 NGN = 100 kobo).
   * If USD, converts to cents (1 USD = 100 cents).
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const currency = params.currency.toLowerCase();
    const amountInSmallestUnit = Math.round(params.amount * 100);

    const paymentIntent = await this.stripeClient.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency,
      receipt_email: params.customerEmail,
      metadata: {
        order_id: params.orderId,
        order_number: params.orderNumber,
        customer_email: params.customerEmail,
        customer_name: params.customerName || '',
        ...params.metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Failed to generate client_secret from Stripe PaymentIntent');
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntentResult | null> {
    try {
      const pi = await this.stripeClient.paymentIntents.retrieve(paymentIntentId);
      return {
        clientSecret: pi.client_secret || '',
        paymentIntentId: pi.id,
        amount: pi.amount / 100,
        currency: pi.currency,
        status: pi.status,
      };
    } catch (error) {
      console.error(`[Stripe Gateway] Failed to retrieve payment intent ${paymentIntentId}:`, error);
      return null;
    }
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<boolean> {
    try {
      await this.stripeClient.paymentIntents.cancel(paymentIntentId);
      return true;
    } catch (error) {
      console.error(`[Stripe Gateway] Failed to cancel payment intent ${paymentIntentId}:`, error);
      return false;
    }
  }

  async verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Promise<PaymentWebhookEvent> {
    const event = this.stripeClient.webhooks.constructEvent(payload, signature, secret);
    return {
      id: event.id,
      type: event.type,
      data: {
        object: event.data.object,
      },
    };
  }
}
