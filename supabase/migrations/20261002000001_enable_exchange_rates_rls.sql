-- ================================================================
-- JRADIANCE E-Commerce - RLS Hardening for Exchange Rates & Functions
-- Migration: 20261002000001_enable_exchange_rates_rls.sql
-- Description: Enables Row Level Security on public.exchange_rates
--              Grants read-only access to public (anon & authenticated)
--              Restricts modifications to admin and chief_admin roles
--              Hardens SECURITY DEFINER function search paths
-- ================================================================

-- 1. ROW LEVEL SECURITY ON EXCHANGE_RATES
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Allow public read access (essential for client currency conversions)
DROP POLICY IF EXISTS "exchange_rates_select_public" ON public.exchange_rates;
CREATE POLICY "exchange_rates_select_public"
  ON public.exchange_rates
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Restrict mutations (insert, update, delete) to staff with admin or chief_admin roles
DROP POLICY IF EXISTS "exchange_rates_admin_all" ON public.exchange_rates;
CREATE POLICY "exchange_rates_admin_all"
  ON public.exchange_rates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'chief_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'chief_admin')
    )
  );

-- 2. HARDEN SECURITY DEFINER SEARCH PATHS (DEFENSE IN DEPTH)
-- Explicitly lock search_path to prevent malicious schema hijacking

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.reserve_stock_for_checkout(uuid, jsonb, integer) SET search_path = public;
ALTER FUNCTION public.commit_stock_reservation(uuid) SET search_path = public;
ALTER FUNCTION public.release_stock_reservation(uuid) SET search_path = public;
