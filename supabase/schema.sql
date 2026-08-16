-- ==============================================================================
-- FOODBOOK PG MEAL BOOKING SYSTEM - SUPABASE SCHEMA & RLS POLICIES
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Pre-authorized Resident and Admin Whitelist)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  room_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('resident', 'admin')) DEFAULT 'resident',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant phone number lookups during OTP validation
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 2. MENUS TABLE
CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  title TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  cutoff_time TIMESTAMPTZ NOT NULL,
  serving_start TEXT,
  serving_end TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_date_meal UNIQUE (date, meal_type)
);

CREATE INDEX IF NOT EXISTS idx_menus_date_meal ON public.menus(date, meal_type);

-- 3. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('eating', 'skipping')),
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_menu_profile UNIQUE (menu_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_menu_id ON public.bookings(menu_id);
CREATE INDEX IF NOT EXISTS idx_bookings_profile_id ON public.bookings(profile_id);

-- 4. PUSH SUBSCRIPTIONS TABLE (Web Push API)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_profile_id ON public.push_subscriptions(profile_id);

-- ==============================================================================
-- DATABASE HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Helper: Check if the current authenticated user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

-- Helper: Get current user's profile ID
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.profiles
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

-- Secure Whitelist Verification (Used prior to OTP generation)
CREATE OR REPLACE FUNCTION public.verify_whitelist_phone(phone_input TEXT)
RETURNS TABLE (
  is_whitelisted BOOLEAN,
  profile_name TEXT,
  profile_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_phone TEXT;
BEGIN
  -- Normalize phone (strip non-digits except leading +)
  clean_phone := TRIM(phone_input);
  
  RETURN QUERY
  SELECT 
    true AS is_whitelisted,
    p.name AS profile_name,
    p.role AS profile_role
  FROM public.profiles p
  WHERE (p.phone_number = clean_phone OR p.phone_number = RIGHT(clean_phone, 10))
    AND p.is_active = true
  LIMIT 1;

  -- If no matching profile was found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$;

-- Auto-Link Profile on Auth Sign-in Trigger
CREATE OR REPLACE FUNCTION public.handle_auth_user_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Match auth user by phone number (or email if used)
  UPDATE public.profiles
  SET user_id = NEW.id
  WHERE (phone_number = NEW.phone OR phone_number = RIGHT(NEW.phone, 10))
    AND user_id IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_link();

-- Cutoff Time Enforcement Trigger for Bookings
CREATE OR REPLACE FUNCTION public.check_booking_cutoff()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if admin (admins can override cutoff)
  v_is_admin := public.is_admin();
  IF v_is_admin THEN
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  SELECT cutoff_time INTO v_cutoff
  FROM public.menus
  WHERE id = NEW.menu_id;

  IF v_cutoff IS NOT NULL AND NOW() > v_cutoff THEN
    RAISE EXCEPTION 'Booking deadline has passed for this meal (Cutoff was %)', v_cutoff;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_booking_cutoff ON public.bookings;
CREATE TRIGGER trigger_booking_cutoff
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_booking_cutoff();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- 1. Admins have full access to view, add, modify, delete resident whitelist
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Residents can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- MENUS POLICIES
-- ------------------------------------------------------------------------------
-- 1. Admins have full CRUD access to menus
CREATE POLICY "Admins have full access to menus"
  ON public.menus
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Authenticated residents can view published menus
CREATE POLICY "Residents can view published menus"
  ON public.menus
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- ------------------------------------------------------------------------------
-- BOOKINGS POLICIES
-- ------------------------------------------------------------------------------
-- 1. Admins can view and manage all bookings (Headcount dashboard)
CREATE POLICY "Admins can view and manage all bookings"
  ON public.bookings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Residents can view their own bookings
CREATE POLICY "Residents can view own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (profile_id = public.get_my_profile_id());

-- 3. Residents can insert their own booking
CREATE POLICY "Residents can insert own booking"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = public.get_my_profile_id());

-- 4. Residents can update their own booking
CREATE POLICY "Residents can update own booking"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (profile_id = public.get_my_profile_id())
  WITH CHECK (profile_id = public.get_my_profile_id());

-- ------------------------------------------------------------------------------
-- PUSH SUBSCRIPTIONS POLICIES
-- ------------------------------------------------------------------------------
-- 1. Users can register and manage their own push subscriptions
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (profile_id = public.get_my_profile_id())
  WITH CHECK (profile_id = public.get_my_profile_id());

-- 2. Admins can read push subscriptions to send notifications
CREATE POLICY "Admins read push subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- REAL-TIME SUBSCRIPTION CONFIGURATION
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.menus;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ==============================================================================
-- INITIAL SETUP (Admin & Resident Whitelist)
-- ==============================================================================

-- 1. Admin Profile (Manager Pramod Shelke)
INSERT INTO public.profiles (id, phone_number, name, room_number, role, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '+918208315074', 'Pramod Shelke', 'Office', 'admin', true)
ON CONFLICT (phone_number) DO UPDATE 
SET name = EXCLUDED.name, role = EXCLUDED.role, is_active = true;

-- 2. Resident Profile (Arya Kukkadwal)
INSERT INTO public.profiles (id, phone_number, name, room_number, role, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000002', '+919370291205', 'Arya Kukkadwal', '102-A', 'resident', true)
ON CONFLICT (phone_number) DO UPDATE 
SET name = EXCLUDED.name, room_number = EXCLUDED.room_number, role = EXCLUDED.role, is_active = true;

