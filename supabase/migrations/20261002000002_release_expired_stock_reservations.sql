-- ==============================================================================
-- Migration: 20261002000002_release_expired_stock_reservations.sql
-- Description:
-- 1. Create public.release_expired_stock_reservations() to automatically release
--    held stock reservations whose 15-minute TTL has expired without payment.
-- 2. Harden search_path on all inventory & stock reservation procedures to
--    satisfy Supabase security advisors (search_path mutable vulnerability).
-- ==============================================================================

-- 1. Automated Procedure: Release expired stock reservations
CREATE OR REPLACE FUNCTION public.release_expired_stock_reservations()
RETURNS jsonb AS $$
DECLARE
  v_released_count integer := 0;
BEGIN
  -- Mark all expired reservations that were never committed as 'released'
  WITH updated AS (
    UPDATE public.stock_reservations
    SET status = 'released',
        updated_at = now()
    WHERE status = 'reserved'
      AND expires_at < now()
    RETURNING id
  )
  SELECT count(*) INTO v_released_count FROM updated;

  RETURN jsonb_build_object(
    'success', true,
    'released_count', v_released_count,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution to authenticated, anon (for scheduled webhook/cron calls), and service_role
GRANT EXECUTE ON FUNCTION public.release_expired_stock_reservations() TO service_role;
GRANT EXECUTE ON FUNCTION public.release_expired_stock_reservations() TO authenticated;

-- 2. Harden search_path on existing stock procedures to eliminate security warnings
CREATE OR REPLACE FUNCTION public.reserve_stock_for_checkout(
  p_order_id uuid,
  p_items jsonb,
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

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    IF v_quantity <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid quantity requested');
    END IF;

    SELECT stock_quantity INTO v_current_stock
    FROM public.products
    WHERE id = v_product_id AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Product not available: ' || v_product_id);
    END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.commit_stock_reservation(p_order_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_res RECORD;
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.release_stock_reservation(p_order_id uuid)
RETURNS jsonb AS $$
BEGIN
  UPDATE public.stock_reservations
  SET status = 'released',
      updated_at = now()
  WHERE order_id = p_order_id AND status = 'reserved';

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
