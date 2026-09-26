-- ================================================================
-- CHIEF ADMIN ROLE UPGRADE
-- Location: /supabase/scripts/upgrade_chief_admin.sql
-- Description: Upgrades a specified user to Chief Administrator role.
-- Updates both public.profiles and public.admin_staff tables.
-- ================================================================

-- Replace 'depaytez@gmail.com' with the target user's email
DO $$
DECLARE
  v_target_email text := 'depaytez@gmail.com';
  v_user_id uuid;
BEGIN
  -- Get user ID from profiles
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE email = v_target_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', v_target_email;
  END IF;
  
  -- Step 1: Update profile to chief_admin role
  UPDATE public.profiles
  SET role = 'chief_admin',
      is_active = true,
      updated_at = now()
  WHERE id = v_user_id;
  
  -- Step 2: Create or update admin_staff record
  INSERT INTO public.admin_staff (
    id, 
    profile_id, 
    staff_id, 
    department, 
    position, 
    permissions,
    is_active,
    last_login_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_user_id,
    'CHIEF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('public.order_number_seq')::text, 4, '0'),
    'Executive',
    'Chief Administrator',
    '{"manage_users": true, "manage_roles": true, "manage_settings": true, "view_all": true, "delete_orders": true, "manage_catalog": true}'::jsonb,
    true,
    NULL,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    position = 'Chief Administrator',
    department = 'Executive',
    permissions = '{"manage_users": true, "manage_roles": true, "manage_settings": true, "view_all": true, "delete_orders": true, "manage_catalog": true}'::jsonb,
    is_active = true,
    updated_at = now();
  
  RAISE NOTICE '✅ User % successfully upgraded to Chief Administrator (ID: %)!', v_target_email, v_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to upgrade user: %', SQLERRM;
END $$;
