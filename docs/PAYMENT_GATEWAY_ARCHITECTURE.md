# Payment Gateway Architecture: Dual-Gateway (Stripe + Paystack)

## 1. Executive Summary

JRADIANCE operates an international luxury e-commerce platform catering to both Nigerian and international clientele. To maximize checkout conversion, minimize payment failures, and eliminate foreign exchange conversion barriers, the payment subsystem implements a **Dual-Gateway Architecture**:
- **Stripe**: Optimized for global transactions (USD, EUR, GBP, international Visa/Mastercard/Amex, Apple Pay, Google Pay).
- **Paystack**: Optimized for Nigerian & African transactions (NGN, local debit cards, Nigerian bank transfers, USSD, EFT).

---

## 2. Geolocation & Gateway Selection Matrix

| Customer Location | Detected Currency | Primary Gateway | Secondary / Alternative | Payment Methods Supported |
|---|---|---|---|---|
| **Nigeria (`NG`)** | `NGN` (₦) | **Paystack** | Stripe | Nigerian Cards, Bank Transfer, USSD |
| **Nigeria (`NG`) - International Card** | `USD` ($) or `NGN` | **Stripe** | Paystack | Global Cards, Apple Pay |
| **United States (`US`)** | `USD` ($) | **Stripe** | — | Cards, Apple Pay, Google Pay |
| **United Kingdom (`GB`) / Europe (`EU`)** | `USD` ($) | **Stripe** | — | Cards, Apple Pay, Google Pay |
| **Rest of World** | `USD` ($) | **Stripe** | — | Global Cards, Digital Wallets |

Customers can toggle freely between Stripe and Paystack on the checkout page or switch currencies (`NGN` ↔ `USD`) in the TopBar.

---

## 3. Architecture & Domain-Driven Design (DDD)

Both gateways implement the common `IPaymentGateway` interface defined in `src/domains/payments/payment.gateway.ts`:

```typescript
export interface IPaymentGateway {
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntentResult | null>;
  cancelPaymentIntent(paymentIntentId: string): Promise<boolean>;
  verifyWebhookSignature(payload: string | Buffer, signature: string, secret?: string): Promise<PaymentWebhookEvent>;
}
```

### Implemented Gateways

1. **`StripePaymentGateway` (`src/domains/payments/stripe.gateway.ts`)**:
   - Integrates with Stripe Node SDK.
   - Creates PaymentIntents with automatic payment methods.
   - Validates webhook signatures using `stripe.webhooks.constructEvent`.

2. **`PaystackPaymentGateway` (`src/domains/payments/paystack.gateway.ts`)**:
   - Integrates with Paystack REST API (`https://api.paystack.co`).
   - `initializeTransaction`: Generates secure authorization URL and access code.
   - `verifyTransaction`: Real-time transaction status verification.
   - `verifyWebhookSignature`: Cryptographic HMAC SHA-512 signature validation.

---

## 4. Webhook Processing & Concurrency Defenses

Both providers send asynchronous webhooks upon successful or failed payment:
- **Stripe**: `/api/webhooks/stripe` listening for `payment_intent.succeeded` and `payment_intent.payment_failed`.
- **Paystack**: `/api/webhooks/paystack` listening for `charge.success` and `charge.failed`.

### Transactional Webhook Workflow
1. **Cryptographic Validation**: Validates `stripe-signature` or `x-paystack-signature` against the configured webhook secret.
2. **Idempotency Guard**: Checks if the order is already marked as `completed`. If so, logs and exits cleanly without re-executing actions.
3. **Atomic Stock Commitment**: Invokes database procedure `commit_stock_reservation(order_id)` to permanently deduct inventory and transition reservations from `reserved` to `committed`.
4. **Order State Transition**: Transitions order status to `confirmed` and `payment_status` to `completed` with timestamp.
5. **Cart Invalidation**: Clears the customer's active items in `cart_items`.

---

## 5. Environment Variables Configuration

```env
# Stripe Payment Gateway
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Paystack Payment Gateway
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=whsec_...
```
