-- ================================================================
-- JRADIANCE E-Commerce - Stripe Migration & Inventory Security
-- Migration: 20260924000002_stripe_and_inventory_security.sql
-- Description: Stripe gateway columns, atomic stock reservations, 
--              and hardened multi-tenant Row Level Security.
-- ================================================================

-- 1. STRIPE ATTRIBUTES ON ORDERS
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_client_secret text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_status text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON public.orders(stripe_payment_intent_id);

-- 2. STOCK RESERVATIONS TABLE (CONCURRENCY & OVERSELLING DEFENSE)
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'committed', 'released')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_product_status ON public.stock_reservations(product_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_order_id ON public.stock_reservations(order_id);

-- 3. REMOVE PREMATURE STOCK DEDUCTION TRIGGER
DROP TRIGGER IF EXISTS deduct_stock_on_order_item ON public.order_items;
DROP FUNCTION IF EXISTS public.deduct_stock_on_order_item();

-- 4. ATOMIC STOCK RESERVATION PROCEDURES

-- Function: Atomically reserve stock for checkout (prevents overselling race condition)
CREATE OR REPLACE FUNCTION public.reserve_stock_for_checkout(
  p_order_id uuid,
  p_items jsonb, -- Array of { "product_id": uuid, "quantity": integer }
  p_ttl_minutes integer DEFAULT 15
)
RETURNS jsonb AS $$
DECLARE
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_current_stock integer;
  v_active_reserved integer;
  v_available integer;
  v_expires_at timestamptz;
BEGIN
  v_expires_at := now() + (p_ttl_minutes || ' minutes')::interval;

  -- First pass: Lock product rows and verify availability
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    IF v_quantity <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid quantity requested');
    END IF;

    -- Lock row exclusively for update
    SELECT stock_quantity INTO v_current_stock
    FROM public.products
    WHERE id = v_product_id AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Product not available: ' || v_product_id);
    END IF;

    -- Compute active reservations
    SELECT COALESCE(SUM(quantity), 0) INTO v_active_reserved
    FROM public.stock_reservations
    WHERE product_id = v_product_id
      AND status = 'reserved'
      AND expires_at > now();

    v_available := v_current_stock - v_active_reserved;

    IF v_available < v_quantity THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Insufficient stock for product',
        'product_id', v_product_id,
        'available', v_available,
        'requested', v_quantity
      );
    END IF;
  END LOOP;

  -- Second pass: Insert reservations
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    INSERT INTO public.stock_reservations (
      order_id,
      product_id,
      quantity,
      expires_at,
      status
    ) VALUES (
      p_order_id,
      v_product_id,
      v_quantity,
      v_expires_at,
      'reserved'
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'expires_at', v_expires_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Commit stock reservations on successful payment (Stripe Webhook)
CREATE OR REPLACE FUNCTION public.commit_stock_reservation(p_order_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_res RECORD;
BEGIN
  -- For each active reservation, deduct actual stock
  FOR v_res IN
    SELECT id, product_id, quantity 
    FROM public.stock_reservations
    WHERE order_id = p_order_id AND status = 'reserved'
    FOR UPDATE
  LOOP
    UPDATE public.products
    SET stock_quantity = GREATEST(0, stock_quantity - v_res.quantity),
        updated_at = now()
    WHERE id = v_res.product_id;

    UPDATE public.stock_reservations
    SET status = 'committed',
        updated_at = now()
    WHERE id = v_res.id;
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Release stock reservations (payment failed or cancelled)
CREATE OR REPLACE FUNCTION public.release_stock_reservation(p_order_id uuid)
RETURNS jsonb AS $$
BEGIN
  UPDATE public.stock_reservations
  SET status = 'released',
      updated_at = now()
  WHERE order_id = p_order_id AND status = 'reserved';

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES HARMONIZATION

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

-- Clean existing order and order_item policies
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;

DROP POLICY IF EXISTS "order_items_select_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_authenticated" ON public.order_items;

-- Recreate strict Orders policies
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "orders_select_admin" ON public.orders
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'agent', 'chief_admin')));

-- Users can only insert their own orders in initial pending state
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND status = 'pending' 
    AND payment_status = 'pending'
  );

-- Only admins and service role can update order statuses directly
CREATE POLICY "orders_update_admin" ON public.orders
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'agent', 'chief_admin')));

-- Recreate strict Order Items policies
CREATE POLICY "order_items_select_own" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));

CREATE POLICY "order_items_select_admin" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'agent', 'chief_admin')));

-- Users can only insert items into orders they own
CREATE POLICY "order_items_insert_own" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));

-- Stock Reservations policies
DROP POLICY IF EXISTS "stock_reservations_select_own" ON public.stock_reservations;
DROP POLICY IF EXISTS "stock_reservations_select_admin" ON public.stock_reservations;

CREATE POLICY "stock_reservations_select_own" ON public.stock_reservations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));

CREATE POLICY "stock_reservations_select_admin" ON public.stock_reservations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'agent', 'chief_admin')));

-- 6. CHIEF ADMIN UPGRADE PROCEDURE
CREATE OR REPLACE FUNCTION public.upgrade_user_to_chief_admin(p_email text)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_staff_id text;
BEGIN
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found with email: ' || p_email);
  END IF;

  UPDATE public.profiles
  SET role = 'chief_admin',
      is_active = true,
      updated_at = now()
  WHERE id = v_user_id;

  v_staff_id := 'CHIEF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('public.order_number_seq')::text, 4, '0');

  INSERT INTO public.admin_staff (
    id,
    profile_id,
    staff_id,
    department,
    position,
    permissions,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_user_id,
    v_staff_id,
    'Executive',
    'Chief Administrator',
    '{"manage_users": true, "manage_roles": true, "manage_settings": true, "view_all": true, "delete_orders": true, "manage_catalog": true}'::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    position = 'Chief Administrator',
    department = 'Executive',
    permissions = '{"manage_users": true, "manage_roles": true, "manage_settings": true, "view_all": true, "delete_orders": true, "manage_catalog": true}'::jsonb,
    is_active = true,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'email', p_email, 'role', 'chief_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION public.reserve_stock_for_checkout TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.commit_stock_reservation TO service_role;
GRANT EXECUTE ON FUNCTION public.release_stock_reservation TO service_role;
GRANT EXECUTE ON FUNCTION public.upgrade_user_to_chief_admin TO service_role;
