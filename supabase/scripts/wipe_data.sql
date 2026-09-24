-- ================================================================
-- JRADIANCE E-Commerce - DATA WIPE SCRIPT (DEVELOPMENT ONLY)
-- Location: /supabase/scripts/wipe_data.sql
-- ================================================================
-- ⚠️  WARNING: This will DELETE ALL APPLICATION DATA!
-- Only run this in development/staging when resetting the database.
-- Supabase auth.users will NOT be deleted.
-- ================================================================

-- Delete all data in reverse dependency order
DELETE FROM public.stock_reservations;
DELETE FROM public.admin_notifications;
DELETE FROM public.sales_analytics;
DELETE FROM public.issues;
DELETE FROM public.admin_activity_logs;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.wishlist;
DELETE FROM public.cart_items;
DELETE FROM public.product_reviews;
DELETE FROM public.products;
DELETE FROM public.admin_staff;
DELETE FROM public.profiles;

-- Reset sequences
ALTER SEQUENCE public.order_number_seq RESTART WITH 1000;

-- Verification
DO $$
DECLARE
  v_profiles integer;
  v_products integer;
  v_orders integer;
BEGIN
  SELECT COUNT(*) INTO v_profiles FROM public.profiles;
  SELECT COUNT(*) INTO v_products FROM public.products;
  SELECT COUNT(*) INTO v_orders FROM public.orders;
  
  RAISE NOTICE '✅ DATA WIPE COMPLETE!';
  RAISE NOTICE 'Remaining - Profiles: %, Products: %, Orders: %', v_profiles, v_products, v_orders;
END $$;
