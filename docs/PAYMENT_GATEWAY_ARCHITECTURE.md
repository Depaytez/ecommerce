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

# Scheduled Stock Reservation Cron
CRON_SECRET=your_secure_cron_token_here
```

---

## 6. Webhook Setup & Pointing Guide (Engineer Instructions)

For orders to complete asynchronously and reserve stock permanently, webhooks **must** be pointed to the application.

### A. Local Development

#### 1. Stripe Webhook Local Forwarding
Use the official Stripe CLI to forward events directly to your local Next.js server:
```bash
# 1. Login to your Stripe account
stripe login

# 2. Forward events to local webhook endpoint
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 3. Copy the printed webhook signing secret (starts with whsec_...) and paste into .env.local:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 2. Paystack Webhook Local Forwarding
Because Paystack requires a public URL for webhooks, use `ngrok` or `localtunnel`:
```bash
# Start ngrok tunnel to your local Next.js server
ngrok http 3000

# Copy the HTTPS forwarding URL (e.g., https://abc123.ngrok-free.app)
# Go to Paystack Dashboard -> Settings -> Preferences -> Webhooks:
# Live / Test Webhook URL: https://abc123.ngrok-free.app/api/webhooks/paystack
# Ensure Secret Key on dashboard matches PAYSTACK_SECRET_KEY in .env.local
```

### B. Production Deployment (Vercel / Custom Server)

#### 1. Stripe Dashboard Configuration
1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks).
2. Click **Add destination** / **Add an endpoint**.
3. **Endpoint URL**: `https://<YOUR_DOMAIN>/api/webhooks/stripe` (e.g., `https://jradianceco.com/api/webhooks/stripe`).
4. **Events to listen to**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
5. Reveal **Signing secret** (`whsec_...`) and configure as `STRIPE_WEBHOOK_SECRET` in your production environment variables.

#### 2. Paystack Dashboard Configuration
1. Go to [Paystack Dashboard > Settings > API Keys & Webhooks](https://dashboard.paystack.com/#/settings/developer).
2. In the **Live Webhook URL** field, set:
   `https://<YOUR_DOMAIN>/api/webhooks/paystack` (e.g., `https://jradianceco.com/api/webhooks/paystack`).
3. Paystack signs all webhooks using your `PAYSTACK_SECRET_KEY`. Ensure `PAYSTACK_SECRET_KEY` matches the secret key in your production environment variables.

---

## 7. Automated Expired Inventory Cleanup (Cron Setup)

When customers abandon checkout sessions without completing payment, stock is temporarily held for 15 minutes. To release expired stock back into available inventory:

### A. Vercel Cron Configuration (`vercel.json`)
Add a scheduled job to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/release-expired-reservations",
      "schedule": "*/10 * * * *"
    }
  ]
}
```
Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set in Vercel project environment variables.

### B. Supabase / External Webhook Invocation
Alternatively, call the endpoint every 10-15 minutes using GitHub Actions, Supabase `pg_cron`, or Cloudflare Workers:
```bash
curl -X POST https://jradianceco.com/api/cron/release-expired-reservations \
  -H "Authorization: Bearer <CRON_SECRET>"
```

