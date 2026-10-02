/**
 * Paystack Payment Gateway Implementation
 * Bounded Context: Payments
 * Implements IPaymentGateway and provides Paystack REST API operations.
 */

import crypto from 'crypto';
import type { IPaymentGateway } from './payment.gateway';
import type {
  CreatePaymentIntentParams,
  PaymentIntentResult,
  PaymentWebhookEvent,
  PaystackInitializeParams,
  PaystackInitializeResult,
} from './types';

export class PaystackPaymentGateway implements IPaymentGateway {
  private secretKey: string;
  private baseUrl: string = 'https://api.paystack.co';

  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.PAYSTACK_SECRET_KEY || '';
  }

  /**
   * Initializes a transaction with Paystack API.
   * Amount must be provided in kobo (NGN * 100).
   */
  async initializeTransaction(
    params: PaystackInitializeParams
  ): Promise<PaystackInitializeResult> {
    if (!this.secretKey) {
      throw new Error('[Paystack Gateway] PAYSTACK_SECRET_KEY is not configured');
    }

    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(params.amount),
        email: params.email,
        reference: params.reference,
        callback_url: params.callback_url,
        metadata: params.metadata || {},
        channels: params.channels || [
          'card',
          'bank',
          'ussd',
          'qr',
          'mobile_money',
          'bank_transfer',
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      throw new Error(
        data.message || '[Paystack Gateway] Transaction initialization failed'
      );
    }

    return {
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    };
  }

  /**
   * Verifies a Paystack transaction by reference.
   */
  async verifyTransaction(reference: string): Promise<any> {
    if (!this.secretKey) {
      throw new Error('[Paystack Gateway] PAYSTACK_SECRET_KEY is not configured');
    }

    const response = await fetch(
      `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      throw new Error(
        data.message || `[Paystack Gateway] Verification failed for reference ${reference}`
      );
    }

    return data.data;
  }

  /**
   * Adapts CreatePaymentIntentParams to Paystack's transaction initialization
   * fulfilling the generic IPaymentGateway contract.
   */
  async createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntentResult> {
    const amountInKobo = Math.round(params.amount * 100);
    const reference = params.orderNumber || `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const paystackResult = await this.initializeTransaction({
      amount: amountInKobo,
      email: params.customerEmail,
      reference,
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        customerName: params.customerName,
        ...params.metadata,
      },
    });

    return {
      clientSecret: paystackResult.access_code,
      paymentIntentId: paystackResult.reference,
      amount: params.amount,
      currency: 'NGN',
      status: 'pending',
      provider: 'paystack',
    };
  }

  async retrievePaymentIntent(
    paymentIntentId: string
  ): Promise<PaymentIntentResult | null> {
    try {
      const data = await this.verifyTransaction(paymentIntentId);
      return {
        clientSecret: data.access_code || '',
        paymentIntentId: data.reference,
        amount: data.amount / 100,
        currency: data.currency,
        status: data.status,
        provider: 'paystack',
      };
    } catch (error) {
      console.error(`[Paystack Gateway] Failed to retrieve reference ${paymentIntentId}:`, error);
      return null;
    }
  }

  async cancelPaymentIntent(_paymentIntentId: string): Promise<boolean> {
    // Paystack does not require explicit cancellation API call for pending initializations
    return true;
  }

  /**
   * Verifies the authenticity of a Paystack webhook payload using HMAC SHA-512.
   */
  async verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret?: string
  ): Promise<PaymentWebhookEvent> {
    const signingSecret = secret || this.secretKey;
    if (!signingSecret) {
      throw new Error('[Paystack Gateway] Missing secret key for signature verification');
    }

    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
    const computedHash = crypto
      .createHmac('sha512', signingSecret)
      .update(payloadString)
      .digest('hex');

    if (computedHash !== signature) {
      throw new Error('[Paystack Gateway] Invalid webhook signature');
    }

    const parsed = JSON.parse(payloadString);

    return {
      id: parsed.data?.id ? String(parsed.data.id) : `evt_${Date.now()}`,
      type: parsed.event,
      provider: 'paystack',
      data: {
        object: parsed.data,
      },
    };
  }
}
