# Engineering Log: Supabase Database Migration & Testing Setup

**Date:** 2026-09-24  
**Branch:** `feature/setup-and-migrations`  
**Author:** Antigravity AI Agent  
**Status:** Completed & Verified  

---

## 1. Overview & Context

This engineering update consolidates the JRADIANCE E-Commerce database architecture, eliminates redundant root SQL files, structures idempotent database migrations, sets up automated testing with Vitest, and hardens the schema for Stripe payment integration and high-concurrency inventory protection.

---

## 2. Directory Structure Reorganization

The previous loose SQL files (`SUPABASE_SCHEMA_V4.sql` and `SUPABASE_WIPE_DATA.sql`) in the repository root have been replaced with a versioned, scalable hierarchy:

```
supabase/
├── migrations/
│   ├── 20260924000001_initial_schema.sql             # Enterprise baseline schema
│   └── 20260924000002_stripe_and_inventory_security.sql # Stripe attributes, inventory locking & RLS
└── scripts/
    ├── upgrade_chief_admin.sql                       # Idempotent Chief Admin promotion script
    └── wipe_data.sql                                 # Development-only clean wipe utility
```

---

## 3. Database Architecture & Scalability Highlights

### A. Core Schema (`20260924000001_initial_schema.sql`)
1. **Types & Enums**: `user_role` (`customer`, `admin`, `agent`, `chief_admin`), `order_status`, `payment_status`.
2. **Tables**:
   - `profiles`: Multi-currency preferences, locale, role, and automated profile generation via `on_auth_user_created` trigger.
   - `admin_staff`: Role-Based Access Control (RBAC) with granular `permissions` JSONB and manager hierarchies.
   - `products`: Product catalog with slug generator trigger, SKU uniqueness, discount calculation fields, soft-delete (`deleted_at`), and `stock_quantity >= 0` check.
   - `cart_items` & `wishlist`: Composite unique constraints per user/product to prevent duplicate rows.
   - `orders` & `order_items`: Full financial fields (`subtotal`, `tax`, `shipping_cost`, `total_amount`), currency support, and delivery tracking.
   - `admin_activity_logs`: Auditing table with nullable `admin_id` to allow recording system-triggered customer order actions.
   - `issues`: Bug tracking and customer complaint resolution pipeline.
   - `sales_analytics`: Pre-aggregated daily/monthly metrics for efficient dashboard queries.
   - `admin_notifications`: Instant alert queue with compound index `(admin_id, is_read)` for high-speed badge queries.
3. **Storage Buckets & Policies**:
   - Automatically initializes `product-images` and `avatars` buckets.
   - Restricts avatar mutations to the user's dedicated folder (`/auth.uid()/*`) and catalog image management to admin staff.

### B. Stripe & Concurrency Protection (`20260924000002_stripe_and_inventory_security.sql`)
1. **Stripe Integration Attributes**:
   - Added `stripe_payment_intent_id`, `stripe_customer_id`, `stripe_client_secret`, and `stripe_status` to `orders`.
2. **Inventory Reservation System (Overselling Defense)**:
   - Added `stock_reservations` table with expiration tracking (`expires_at`) and status lifecycle (`reserved` -> `committed` / `released`).
   - Stored procedure `reserve_stock_for_checkout(p_order_id, p_items, p_ttl_minutes)`: Uses `SELECT ... FOR UPDATE` row locks to verify real available stock (`current_stock - active_reservations >= requested`) before issuing a reservation.
   - Stored procedure `commit_stock_reservation(p_order_id)`: Deducts actual inventory upon verified Stripe payment (`payment_intent.succeeded`).
   - Stored procedure `release_stock_reservation(p_order_id)`: Frees reserved units if payment fails or checkout is abandoned.
   - Purged the dangerous `deduct_stock_on_order_item` trigger which previously decremented stock prior to payment confirmation.
3. **Chief Admin Upgrade Stored Procedure**:
   - Added `upgrade_user_to_chief_admin(p_email text)` procedure so administrators can be promoted safely via:
     ```sql
     SELECT upgrade_user_to_chief_admin('depaytez@gmail.com');
     ```
4. **Hardened Multi-Tenant RLS**:
   - `orders`: Authenticated users can insert their own orders strictly with initial `pending` status. Only admin or service role can mutate statuses.
   - `order_items`: Users can only insert line items into orders that match their `auth.uid()`.
   - `stock_reservations`: Protected with RLS and dedicated SECURITY DEFINER RPCs.

---

## 4. Automated Testing & Verification

- Configured Vitest runner in `vitest.config.ts` with JSDOM and `@testing-library/jest-dom`.
- Single universal test command: `npm test` (executed 100% passing).
- Static typechecking: `tsc --noEmit` verified with 0 errors.
- Linting: `npm run lint` verified with 0 errors.
