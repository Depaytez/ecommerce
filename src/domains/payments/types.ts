/**
 * Payment Domain Types
 * Bounded Context: Payments
 */

export interface CreatePaymentIntentParams {
  amount: number; // Smallest currency unit (cents or kobo if applicable, or standard units)
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
}

export interface PaymentWebhookEvent<T = unknown> {
  id: string;
  type: string;
  data: {
    object: T;
  };
}
