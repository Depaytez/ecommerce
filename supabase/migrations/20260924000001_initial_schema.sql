-- ================================================================
-- JRADIANCE E-Commerce - Baseline Migration
-- Migration: 20260924000001_initial_schema.sql
-- Description: Core types, tables, indexes, triggers, and baseline RLS
-- ================================================================

-- 1. CUSTOM ENUMS
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
  CREATE TYPE public.user_role AS ENUM ('customer', 'admin', 'agent', 'chief_admin');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
  CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
END IF; END $$;

-- 2. CORE TABLES

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  phone text,
  role public.user_role DEFAULT 'customer',
  avatar_url text,
  date_of_birth date,
  gender text,
  preferred_language text DEFAULT 'en',
  preferred_currency text DEFAULT 'NGN',
  country_code text DEFAULT 'NG',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin Staff
CREATE TABLE IF NOT EXISTS public.admin_staff (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_id text UNIQUE,
  department text,
  position text,
  manager_id uuid REFERENCES public.admin_staff(id),
  permissions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  category text NOT NULL,
  price decimal(10, 2) NOT NULL,
  discount_price decimal(10, 2),
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  sku text UNIQUE,
  images jsonb DEFAULT '[]'::jsonb,
  attributes jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.admin_staff(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz NULL,
  currency text DEFAULT 'NGN',
  usd_price decimal(10, 2),
  usd_discount_price decimal(10, 2),
  exchange_rate decimal(10, 4) DEFAULT 1.0
);

-- Cart Items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Wishlist
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  subtotal decimal(10, 2) NOT NULL,
  tax decimal(10, 2) DEFAULT 0,
  shipping_cost decimal(10, 2) DEFAULT 0,
  total_amount decimal(10, 2) NOT NULL,
  discount_applied decimal(10, 2) DEFAULT 0,
  status public.order_status DEFAULT 'pending',
  payment_status public.payment_status DEFAULT 'pending',
  currency text DEFAULT 'NGN',
  notes text,
  shipping_address text,
  billing_address text,
  estimated_delivery_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz NULL
);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10, 2) NOT NULL,
  total_price decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Product Reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  title text,
  review_text text,
  is_verified_purchase boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- Admin Activity Logs
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.admin_staff(id),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  changes jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Issues (Feedback / Bug Reports)
CREATE TABLE IF NOT EXISTS public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('bug', 'complaint', 'feature_request')),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'pending', 'solved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  reported_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.admin_staff(id) ON DELETE SET NULL,
  resolved_by uuid REFERENCES public.admin_staff(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  customer_email text,
  customer_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sales Analytics
CREATE TABLE IF NOT EXISTS public.sales_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_revenue decimal(10, 2) NOT NULL DEFAULT 0,
  total_orders integer NOT NULL DEFAULT 0,
  completed_orders integer NOT NULL DEFAULT 0,
  cancelled_orders integer NOT NULL DEFAULT 0,
  average_order_value decimal(10, 2) NOT NULL DEFAULT 0,
  top_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(period_start, period_end)
);

-- Admin Notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('new_order', 'payment_received', 'order_updated', 'low_stock', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  related_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text DEFAULT 'NGN',
  target_currency text NOT NULL,
  rate decimal(10, 4) NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

INSERT INTO public.exchange_rates (base_currency, target_currency, rate) VALUES
  ('NGN', 'USD', 0.00065),
  ('NGN', 'EUR', 0.00060),
  ('NGN', 'GBP', 0.00051)
ON CONFLICT (base_currency, target_currency) DO NOTHING;

-- 3. SEQUENCES
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1000 INCREMENT BY 1;

-- 4. ESSENTIAL FUNCTIONS & TRIGGERS

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    (COALESCE(NEW.raw_user_meta_data->>'role', 'customer'))::public.user_role,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate Product Slug
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS trigger AS $$
DECLARE
  v_slug text;
  v_counter integer := 0;
  v_unique_slug text;
BEGIN
  v_slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := REGEXP_REPLACE(v_slug, '^-+|-+$', '', 'g');
  
  IF v_slug = '' THEN
    v_slug := 'product-' || substr(NEW.id::text, 1, 8);
  END IF;
  
  v_unique_slug := v_slug;
  
  WHILE EXISTS (
    SELECT 1 FROM public.products 
    WHERE slug = v_unique_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    v_counter := v_counter + 1;
    v_unique_slug := v_slug || '-' || v_counter;
  END LOOP;
  
  NEW.slug := v_unique_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_product_slug ON public.products;
CREATE TRIGGER generate_product_slug
  BEFORE INSERT OR UPDATE OF name ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.generate_product_slug();

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
