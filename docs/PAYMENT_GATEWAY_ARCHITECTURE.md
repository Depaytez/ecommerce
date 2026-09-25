# Payment Gateway Architecture: Dual-Gateway (Stripe + Paystack)

## 1. Executive Summary

JRADIANCE operates an international luxury e-commerce platform catering to both Nigerian and international clientele. To maximize checkout conversion, minimize payment failures, and reduce foreign exchange fees, the payment subsystem implements a **Dual-Gateway Strategy**:
- **Stripe**: Optimized for global transactions (USD, EUR, GBP, international Visa/Mastercard/Amex, Apple Pay, Google Pay).
- **Paystack**: Optimized for Nigerian & African transactions (NGN, local debit cards, Nigerian bank transfers, USSD, EFT).

---

## 2. Geolocation & Gateway Selection Matrix

| Customer Location | Detected Currency | Primary Gateway | Secondary / Alternative | Payment Methods Supported |
|---|---|---|---|---|
| **Nigeria (`NG`)** | `NGN` (₦) | **Paystack** | Stripe | Nigerian Cards, Bank Transfer, USSD, Pay with Transfer |
| **Nigeria (`NG`) - International Card** | `USD` ($) or `NGN` | **Stripe** | Paystack | Global Cards, Apple Pay |
| **United States (`US`)** | `USD` ($) | **Stripe** | — | Cards, Apple Pay, Google Pay |
| **United Kingdom (`GB`) / Europe (`EU`)** | `USD` ($) | **Stripe** | — | Cards, Apple Pay, Google Pay |
| **Rest of World** | `USD` ($) | **Stripe** | — | Global Cards |

---

## 3. Architecture & Domain-Driven Design (DDD)

Both gateways implement the common `IPaymentGateway` interface defined in `src/domains/payments/`:

```typescript
export interface IPaymentGateway {
  provider: 'stripe' | 'paystack';
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  verifyPayment(referenceOrId: string): Promise<boolean>;
}
```

### Factory Pattern: `PaymentGatewayFactory`
A gateway factory selects or instantiates the requested provider:
- `PaymentGatewayFactory.getGateway('stripe')` -> `StripePaymentGateway`
- `PaymentGatewayFactory.getGateway('paystack')` -> `PaystackPaymentGateway`

---

## 4. Webhook Processing & Idempotency

Both providers send asynchronous webhooks upon successful or failed payment:
- **Stripe**: `/api/webhooks/stripe` listening for `payment_intent.succeeded` and `payment_intent.payment_failed`.
- **Paystack**: `/api/webhooks/paystack` listening for `charge.success`.

Both webhook handlers execute the same transactional domain logic:
1. Verify cryptographic signature (`stripe-signature` or `x-paystack-signature`).
2. Verify idempotency using `webhook_events` log table in Supabase.
3. Transition order status from `pending` -> `confirmed`.
4. Update `payment_status` -> `completed`.
5. Release stock reservation locks and mark inventory as committed.
6. Trigger email notification / receipt dispatch.

---

## 5. Required Environment Variables

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Paystack Configuration (Future Integration)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=whsec_...
```
