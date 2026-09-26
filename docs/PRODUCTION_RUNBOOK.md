# JRADIANCE E-Commerce - Production Runbook

## 1. System Overview

JRADIANCE is a Next.js 15 luxury e-commerce web application powered by Supabase (PostgreSQL + Auth + Storage) and Stripe Elements with an extensible architecture for Paystack.

---

## 2. Environment Variables Specification

The application requires the following environment variables in production (configured in Vercel or your hosting provider dashboard):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Stripe Payment Gateway
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Paystack Payment Gateway (When Activated)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_WEBHOOK_SECRET=whsec_...

# Site URLs
NEXT_PUBLIC_BASE_URL=https://jradianceco.com
NEXT_PUBLIC_SITE_URL=https://jradianceco.com
NODE_ENV=production
```

---

## 3. Stripe Dashboard Webhook Setup

1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com/webhooks).
2. Click **Add endpoint**.
3. **Endpoint URL**: `https://jradianceco.com/api/webhooks/stripe`
4. **Events to send**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the **Signing secret** (`whsec_...`) and store it in your hosting platform environment variables as `STRIPE_WEBHOOK_SECRET`.

---

## 4. Database Migrations Deployment

When deploying new migrations to Supabase:
```powershell
# Authenticate CLI
npx supabase login --token <SUPABASE_PAS_TOKEN>

# Link project
npx supabase link --project-ref <PROJECT_REF>

# Apply pending migrations
npx supabase db push --linked

# Verify sync status
npx supabase migration list
```

---

## 5. Deployment Verification Checklist (Smoke Testing)

After production deployment:
1. **Storefront Landing**: Verify homepage loads in <2s with no console errors (`https://jradianceco.com`).
2. **Product Catalog**: Open `/shop` and test category filters, search input, and grid/list toggle.
3. **Currency Switcher**: Click currency selector in TopBar (`₦ NGN` ↔ `$ USD`) and confirm price conversion across all products.
4. **Product Detail**: Navigate to `/shop/products/beard-oil-green-2-oz` and verify image gallery, lightbox, and Add to Cart action.
5. **Cart Drawer**: Open cart, verify free shipping threshold progress bar, increment/decrement items, and click Checkout.
6. **Checkout Flow**: Open `/shop/checkout`, enter shipping details, and verify Stripe Elements mounts cleanly.
7. **Admin Dashboard**: Log in via `/admin/login`, open `/admin/dashboard`, and verify metrics load with smooth skeleton states and zero access denied flash.
8. **Navigation Separation**: Confirm the public TopBar logo is hidden on all `/admin/*` routes and "View Store" returns to storefront.
