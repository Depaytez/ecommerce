/**
 * Payment Domain Types
 * Bounded Context: Payments
 *
 * Supports Dual-Gateway Architecture:
 * - Stripe (International: USD, EUR, GBP, Global Cards, Apple Pay, Google Pay)
 * - Paystack (Africa / Nigeria: NGN, Local Cards, Bank Transfer, USSD, EFT)
 */

export type PaymentGatewayProvider = 'stripe' | 'paystack';

export interface CreatePaymentIntentParams {
  amount: number; // Smallest currency unit (cents or kobo if applicable)
  currency: 'usd' | 'ngn';
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  provider: PaymentGatewayProvider;
}

export interface PaystackInitializeParams {
  amount: number; // In kobo (NGN * 100)
  email: string;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  channels?: Array<'card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer'>;
}

export interface PaystackInitializeResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaymentWebhookEvent<T = unknown> {
  id: string;
  type: string;
  provider: PaymentGatewayProvider;
  data: {
    object: T;
  };
}

export interface IPaymentGateway {
  provider: PaymentGatewayProvider;
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  verifyPayment(referenceOrId: string): Promise<boolean>;
}
