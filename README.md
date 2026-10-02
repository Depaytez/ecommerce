# JRADIANCE E-Commerce Platform

## 🏪 Enterprise Luxury E-Commerce Solution

<div align="center">

![JRADIANCE](https://img.shields.io/badge/JRADIANCE-E--Commerce-gold?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.5.10-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![Stripe](https://img.shields.io/badge/Payment-Stripe-635BFF?style=for-the-badge&logo=stripe)
![Paystack](https://img.shields.io/badge/Payment-Paystack-00C3F7?style=for-the-badge)

**Premium Cosmetics & Skincare E-Commerce Platform**

[Features](#-features) • [Architecture](#-architecture) • [Documentation Hub](./docs/README.md) • [Runbook](./docs/PRODUCTION_RUNBOOK.md)

</div>

---

## 🎯 Platform Highlights

- 🌍 **Automated Multi-Currency Engine**: Dynamic NGN (Nigeria) ↔ USD (International) conversions backed by Supabase `exchange_rates` and geolocation detection.
- 💳 **Production Dual-Gateway Payments**:
  - **Stripe**: Optimized for global credit/debit cards, Apple Pay, and Google Pay.
  - **Paystack**: Optimized for Nigerian Naira cards, Bank Transfers, USSD, and Mobile Money.
- 🔒 **Concurrency & Inventory Defense**: Atomic inventory reservation locks (`reserve_stock_for_checkout`) with 15-minute TTL preventing overselling race conditions.
- 🛡️ **Hardened Row-Level Security (RLS)**: Enforced across all 14 tables in the `public` schema with staff-only role restrictions (`admin`, `chief_admin`).
- ⚡ **Zero-Flicker Admin Dashboard**: Instantaneous, synchronized RBAC permission evaluation eliminating temporary access restriction flashes.

---

## 📚 Documentation Hub

All comprehensive architectural and operational documentation is organized inside the [`docs/`](./docs/README.md) directory:

| Guide | Description | Path |
|---|---|---|
| **System Architecture** | Domain-Driven Design (DDD), bounded contexts, layer structure | [docs/SYSTEM_ARCHITECTURE.md](./docs/SYSTEM_ARCHITECTURE.md) |
| **Payment Gateway** | Dual-Gateway specifications, webhooks, signature verification | [docs/PAYMENT_GATEWAY_ARCHITECTURE.md](./docs/PAYMENT_GATEWAY_ARCHITECTURE.md) |
| **Production Runbook** | Deployment steps, live webhook configuration, smoke testing | [docs/PRODUCTION_RUNBOOK.md](./docs/PRODUCTION_RUNBOOK.md) |
| **Code Reference** | TypeScript models, repositories, and services | [docs/CODE_DOCUMENTATION.md](./docs/CODE_DOCUMENTATION.md) |
| **Product Requirements** | PRD specifications, feature matrix, and business rules | [docs/PRODUCT_REQUIREMENTS.md](./docs/PRODUCT_REQUIREMENTS.md) |

---

## 🛠️ Quick Start

### 1. Prerequisites
- Node.js 18+ / 20+
- Active Supabase project
- Stripe and Paystack developer accounts

### 2. Installation
```powershell
npm install
```

### 3. Environment Setup
```powershell
cp .env.example .env.local
```
Fill in your credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=whsec_...
```

### 4. Running Locally
```powershell
npm run dev
```

### 5. Automated Tests
```powershell
npm test
```
Runs 8 test suites with 100% passing domain coverage.
