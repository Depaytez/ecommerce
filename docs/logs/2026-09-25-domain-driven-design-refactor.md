# Engineering Log: Domain-Driven Design (DDD) Refactor & Concurrency Hardening

- **Date**: 2026-09-25
- **Branch**: `feature/cart-checkout-ddd-refactor`
- **Milestone**: Milestone 2 — Domain-Driven Design Refactor & Cart/Checkout Decoupling
- **Status**: Completed & Verified

---

## 1. Objectives & Overview
Refactored the application's core transactional architecture to adhere strictly to Domain-Driven Design (DDD) principles:
- Decoupled scattered, direct database queries from UI components into distinct domain contexts.
- Implemented pure domain math and business rules (Nigerian VAT 7.5%, free shipping threshold > ₦50,000, standard shipping ₦2,500).
- Implemented tamper-proof server-side checkout quote calculations to prevent client pricing manipulations.
- Enforced a formal finite state machine for order lifecycle transitions (`pending` -> `confirmed` -> `shipped` -> `delivered`, with terminal states `cancelled`, `returned`).
- Created abstract interfaces adhering to Dependency Inversion (`IPaymentGateway`, `ICatalogRepository`, `ICartRepository`, `IOrderRepository`, `IIdentityRepository`).
- Refactored `CartContext` and `ProductCard` to eliminate ad-hoc Supabase queries.
- Added comprehensive unit tests for all domain services.

---

## 2. Domain Architecture Implemented

### A. Catalog Domain (`src/domains/catalog/`)
- [`types.ts`](../../src/domains/catalog/types.ts): Catalog entity and filter types (`Product`, `ProductFilters`, `ProductRatingSummary`).
- [`catalog.repository.ts`](../../src/domains/catalog/catalog.repository.ts): `ICatalogRepository` and `SupabaseCatalogRepository` for product queries and stock availability checks.
- [`catalog.service.ts`](../../src/domains/catalog/catalog.service.ts): `CatalogService` for calculating effective prices (discount prioritization), percentage discounts, USD conversions, and batch availability validation.

### B. Cart Domain (`src/domains/cart/`)
- [`types.ts`](../../src/domains/cart/types.ts): `CartItemEntity`, `CartTotals`, `CartSummary`.
- [`cart.service.ts`](../../src/domains/cart/cart.service.ts): Pure mathematical service computing item subtotals, VAT (7.5%), free shipping thresholds (₦50,000 threshold), and total cost.
- [`cart.repository.ts`](../../src/domains/cart/cart.repository.ts): `ICartRepository` and `SupabaseCartRepository` encapsulating cart fetching, atomic upsert, quantity modifications, and deletions.

### C. Checkout Domain (`src/domains/checkout/`)
- [`types.ts`](../../src/domains/checkout/types.ts): `CheckoutQuote`, `CheckoutItemQuote`, `StockReservationItem`, `StockReservationResult`.
- [`checkout.service.ts`](../../src/domains/checkout/checkout.service.ts): Server-side source of truth for quote generation directly from active catalog records, and orchestration of the database stored procedures `reserve_stock_for_checkout` and `release_stock_reservation`.

### D. Orders Domain (`src/domains/orders/`)
- [`types.ts`](../../src/domains/orders/types.ts): `Order`, `OrderItem`, `CreateOrderInput`, `OrderStatus`, `PaymentStatus`.
- [`order.repository.ts`](../../src/domains/orders/order.repository.ts): `IOrderRepository` and `SupabaseOrderRepository` managing order lifecycle persistence and Stripe attribute updates.
- [`order.service.ts`](../../src/domains/orders/order.service.ts): `OrderService` implementing the strict state machine (`canTransition`, `transitionStatus`) and standardized order numbering (`JR-YYYYMMDD-XXXXX`).

### E. Payments Domain (`src/domains/payments/`)
- [`types.ts`](../../src/domains/payments/types.ts): Standardized types for payment intents and webhook events.
- [`payment.gateway.ts`](../../src/domains/payments/payment.gateway.ts): `IPaymentGateway` interface decoupling payment provider logic from business workflows.

### F. Identity Domain (`src/domains/identity/`)
- [`types.ts`](../../src/domains/identity/types.ts): `UserProfile`, `AdminStaff`, `UserRole`, `AdminStaffRole`.
- [`identity.repository.ts`](../../src/domains/identity/identity.repository.ts): Role and permission verification methods (`isStaffAdmin`, `isChiefAdmin`).

---

## 3. UI Decoupling
- **`CartContext.tsx`**: Completely refactored to consume `SupabaseCartRepository` and `CartService.calculateTotals`. Direct database queries removed.
- **`ProductCard.tsx`**: Removed inline dynamic imports of Supabase client and raw database mutations. Now delegates directly to `addItem` from `CartContext`.

---

## 4. Verification & Testing Gate
- **Unit Tests**: Added 33 new domain unit tests across 4 test suites:
  - `src/__tests__/domains/catalog.service.test.ts` (11 tests)
  - `src/__tests__/domains/cart.service.test.ts` (9 tests)
  - `src/__tests__/domains/checkout.service.test.ts` (5 tests)
  - `src/__tests__/domains/order.service.test.ts` (8 tests)
- **Results**:
  - `npm test`: **35 passed (35 total, 100%)**
  - `tsc --noEmit`: **0 errors**
  - `npm run lint`: **0 errors**
