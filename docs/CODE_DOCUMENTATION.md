# JRADIANCE E-Commerce - Architectural & Code Documentation

## Professional Architecture & Codebase Reference

**Version:** 2.0.0  
**Last Updated:** October 2026  
**Project:** JRADIANCE Luxury E-Commerce Platform

---

## Table of Contents

1. [Architecture Overview & DDD Bounded Contexts](#1-architecture-overview--ddd-bounded-contexts)
2. [Domain-Driven Design (DDD) Breakdown](#2-domain-driven-design-ddd-breakdown)
   - [Catalog Domain (`src/domains/catalog`)](#catalog-domain)
   - [Cart Domain (`src/domains/cart`)](#cart-domain)
   - [Checkout Domain (`src/domains/checkout`)](#checkout-domain)
   - [Orders Domain (`src/domains/orders`)](#orders-domain)
   - [Payments Domain (`src/domains/payments`)](#payments-domain)
3. [Dual Payment Gateway Engine (Stripe + Paystack)](#3-dual-payment-gateway-engine-stripe--paystack)
4. [Concurrency & Inventory Security (Atomic Reservations)](#4-concurrency--inventory-security-atomic-reservations)
5. [Supabase & Database Architecture](#5-supabase--database-architecture)
   - [Row-Level Security (RLS) Policies](#row-level-security-rls-policies)
   - [Migrations & Versioning](#migrations--versioning)
6. [Admin System & Role-Based Access Control (RBAC)](#6-admin-system--role-based-access-control-rbac)
7. [Testing Strategy & Verification](#7-testing-strategy--verification)

---

## 1. Architecture Overview & DDD Bounded Contexts

The application is engineered according to Domain-Driven Design (DDD) principles, segregating business logic into distinct, loosely-coupled bounded contexts.

```
src/
├── domains/                   # Bounded Contexts (Core Domain Logic)
│   ├── catalog/               # Products, Categories, Stock Queries
│   ├── cart/                  # Business Rules, Discounts, Free Shipping
│   ├── checkout/              # Server-Side Quote Verification & Reservation
│   ├── orders/                # Order State Machine, Repository & History
│   └── payments/              # Dual Gateway (Stripe & Paystack) Abstractions
│
├── app/                       # Next.js 15 App Router (Routing & Presentation)
│   ├── (users)/               # Public Storefront & Customer Routes
│   │   └── shop/
│   │       ├── checkout/      # Dual Gateway Checkout & Paystack Callback
│   │       ├── history/       # Order Tracking & Status
│   │       └── products/      # Catalog Browsing & Detail
│   ├── admin/                 # Admin Dashboard (RBAC Protected)
│   └── api/                   # Server Endpoints & Webhooks
│       ├── checkout/          # Quote & Initialization APIs
│       └── webhooks/          # Stripe & Paystack Webhook Handlers
│
├── components/                # Reusable UI & Layout Components
├── context/                   # Context Providers (User, Cart, Currency, Admin)
└── utils/                     # Supabase Clients, Storage & Helpers
```

---

## 2. Domain-Driven Design (DDD) Breakdown

### Catalog Domain (`src/domains/catalog`)
- **`types.ts`**: Defines `Product`, `Category`, `CatalogFilter`, and stock inventory models.
- **`catalog.repository.ts`**: `ICatalogRepository` interface and `SupabaseCatalogRepository` implementation with parameterized queries and caching.
- **`catalog.service.ts`**: Domain business logic for search, category filtering, and inventory availability checking.

### Cart Domain (`src/domains/cart`)
- **`types.ts`**: Defines `CartItem`, `CartSummary`, and discount rules.
- **`cart.service.ts`**: Pure domain functions for price calculations, Nigerian VAT computation (7.5%), free delivery qualification (threshold: ₦50,000), and quantity bounds.

### Checkout Domain (`src/domains/checkout`)
- **`types.ts`**: Defines `CheckoutQuote`, `QuoteItem`, and `StockReservationResult`.
- **`checkout.service.ts`**: Database source of truth for pricing calculations, preventing client-side price manipulation, and coordinating atomic stock reservation locks.

### Orders Domain (`src/domains/orders`)
- **`types.ts`**: Defines `Order`, `OrderItem`, `OrderStatus` (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`), and `PaymentStatus`.
- **`order.repository.ts`**: `IOrderRepository` handling orders, items, and payment references.
- **`order.service.ts`**: State machine validation and order number generation (`JR-YYYYMMDD-XXXX`).

### Payments Domain (`src/domains/payments`)
- **`payment.gateway.ts`**: `IPaymentGateway` interface following Dependency Inversion Principle (DIP).
- **`stripe.gateway.ts`**: Stripe implementation for global card payments, Apple Pay, and webhook signature verification.
- **`paystack.gateway.ts`**: Paystack implementation for Naira debit cards, bank transfers, USSD, and HMAC SHA-512 webhook signature verification.

---

## 3. Dual Payment Gateway Engine (Stripe + Paystack)

The platform supports both **Stripe** and **Paystack** simultaneously:

```
                  ┌───────────────────────┐
                  │    /shop/checkout     │
                  └──────────┬────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [Option 1: Paystack]              [Option 2: Stripe]
            │                                 │
  POST /api/checkout/paystack/       POST /api/checkout/create-payment-intent
  initialize                                  │
            │                                 ▼
            ▼                        Client Secret returned
  Redirect to Paystack Portal                 │
            │                                 ▼
            ▼                        Embedded Stripe Elements
  Return to /shop/checkout/callback           │
            │                                 ▼
            └───────────────┬─────────────────┘
                            │
                            ▼
               Asynchronous Webhooks:
           /api/webhooks/paystack  OR  /api/webhooks/stripe
                            │
                            ▼
          1. Cryptographic Signature Validation
          2. Idempotency Check
          3. commit_stock_reservation(order_id)
          4. Update Order -> 'confirmed', Payment -> 'completed'
          5. Clear Customer Cart
```

---

## 4. Concurrency & Inventory Security (Atomic Reservations)

To prevent overselling race conditions when multiple customers buy scarce inventory concurrently:

1. **Reservation Phase**: When initiating checkout, `reserve_stock_for_checkout(p_order_id, p_items, p_ttl_minutes)` locks product rows using `SELECT FOR UPDATE`, verifies availability, and creates an active reservation in `stock_reservations` with a 15-minute TTL.
2. **Commit Phase**: On successful payment webhook, `commit_stock_reservation(p_order_id)` atomically deducts `stock_quantity` on `products` and marks reservations as `committed`.
3. **Release Phase**: If payment fails or is cancelled, `release_stock_reservation(p_order_id)` marks reservations as `released`.

---

## 5. Supabase & Database Architecture

### Row-Level Security (RLS) Policies
Every single table in schema `public` enforces Row-Level Security:
- **`profiles`**: Users can read/update their own profile; admins can view all.
- **`orders` & `order_items`**: Users can only query their own orders; admins can view all orders.
- **`cart_items` & `wishlist`**: Strictly scoped to `auth.uid() = user_id`.
- **`exchange_rates`**: Public read-only for currency conversion (`to anon, authenticated USING (true)`); modifications restricted to staff with `role IN ('admin', 'chief_admin')`.
- **`SECURITY DEFINER` Functions**: Hardened with `SET search_path = public` to prevent search path hijacking.

### Migration History
- `20260924000001_initial_schema.sql`: Core schema, constraints, sequences, and tables.
- `20260924000002_stripe_and_inventory_security.sql`: Stripe columns, atomic stock reservations, RLS hardening.
- `20261002000001_enable_exchange_rates_rls.sql`: RLS enabled on `exchange_rates` and function search paths locked.

---

## 6. Admin System & Role-Based Access Control (RBAC)

The admin dashboard operates on a strict 3-tier hierarchy:
- **`agent`**: Can view dashboard, products, and process orders.
- **`admin`**: Full product CRUD, order cancellation/refunds, sales analytics, and audit logs.
- **`chief_admin`**: User management, staff promotion/demotion, system configuration.

### Zero-Flicker Architecture
Admin pages receive pre-verified user credentials from `AdminLayout` (server component) via `AdminContext`. Access checks are evaluated synchronously without client-side permission roundtrips, eliminating any temporary "Access Restricted" flashes.

---

## 7. Testing Strategy & Verification

Run the universal automated test suite:
```powershell
npm test
```

Includes:
- Sanity tests
- `CartService` unit tests (VAT, discounts, free delivery thresholds)
- `CatalogService` unit tests (filtering, search, stock validation)
- `OrderService` unit tests (order number generation, state machine transitions)
- `CheckoutService` unit tests (server quote calculations)
- `StripePaymentGateway` unit tests (PaymentIntent creation, signature validation)
- `PaystackPaymentGateway` unit tests (initialization, verification, HMAC SHA-512 signatures)
- Stripe Webhook integration tests (idempotency, atomic stock commitment)
