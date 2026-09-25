/**
 * Payment Gateway Abstraction Interface
 * Bounded Context: Payments
 * Follows Dependency Inversion Principle (DIP).
 */

import type { CreatePaymentIntentParams, PaymentIntentResult, PaymentWebhookEvent } from './types';

export interface IPaymentGateway {
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntentResult | null>;
  cancelPaymentIntent(paymentIntentId: string): Promise<boolean>;
  verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string): Promise<PaymentWebhookEvent>;
}
