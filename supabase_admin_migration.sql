-- ====================================================================
-- KIBABIIMARKET - ADMIN SYSTEM DATABASE MIGRATION
-- Run this script inside your Supabase SQL Editor to provision
-- all required admin tables, roles, security helper metrics,
-- and Row-Level Security (RLS) policies.
-- ====================================================================

-- 1. ROLE DEFINITION ENUM & USER ROLES TABLE
-- Create role enum app_role if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM (
            'student', 
            'shop_owner', 
            'service_provider', 
            'accommodation_owner', 
            'event_organizer', 
            'admin'
        );
    END IF;
END $$;

-- Create user_roles junction/mapping table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    role public.app_role DEFAULT 'student'::public.app_role NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users ON DELETE SET NULL,
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. SECURE ADMIN RPC helper check
-- Returns true if current logged-in user is an admin
CREATE OR REPLACE FUNCTION public.am_i_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'::public.app_role
    );
$$;

-- 3. MODERATION QUEUE TABLE
CREATE TABLE IF NOT EXISTS public.moderation_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_type TEXT CHECK (item_type IN ('product', 'accommodation', 'service', 'lost_found', 'event')) NOT NULL,
    item_id UUID NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')) NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved')) NOT NULL,
    assigned_to UUID REFERENCES auth.users ON DELETE SET NULL,
    resolution TEXT CHECK (resolution IN ('approved', 'rejected')),
    resolved_by UUID REFERENCES auth.users ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on moderation_queue
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

-- 4. REPORTED PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.product_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    reporter_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'resolved')) NOT NULL,
    reviewed_by UUID REFERENCES auth.users ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on product_reports
ALTER TABLE public.product_reports ENABLE ROW LEVEL SECURITY;

-- 5. USER VERIFICATION DOCUMENT CHECKS
CREATE TABLE IF NOT EXISTS public.user_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    verification_type TEXT CHECK (verification_type IN ('student_id', 'business_permit', 'national_id')) NOT NULL,
    document_url TEXT NOT NULL,
    reference_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')) NOT NULL,
    reviewed_by UUID REFERENCES auth.users ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_verifications
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- 6. CAMPUS MEMBERSHIPS VERIFICATION
CREATE TABLE IF NOT EXISTS public.campus_memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    campus_id UUID NOT NULL, -- references campuses table
    student_id_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')) NOT NULL,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on campus_memberships
ALTER TABLE public.campus_memberships ENABLE ROW LEVEL SECURITY;

-- 7. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID REFERENCES auth.users ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    before_state JSONB,
    after_state JSONB,
    reason TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 8. CATALOG BRANDS TABLE
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    logo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- 9. FLASH SALES & ADVERTISEMENTS PROMOTIONS
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    banner_url TEXT NOT NULL,
    target_url TEXT,
    status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'active', 'rejected')) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    owner_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on promotions
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.flash_sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired')) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on flash_sales
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;


-- ====================================================================
-- ROW-LEVEL SECURITY RLS GATE POLICIES (ADMIN PRIVILEGED WRITE ACCESS)
-- Only users with am_i_admin() authenticated matching return are 
-- permitted to read/write/modify these critical admin tables.
-- ====================================================================

-- policies for user_roles
CREATE POLICY "Admins have full access on user_roles" 
    ON public.user_roles 
    FOR ALL 
    USING (public.am_i_admin());

CREATE POLICY "Users can read their own roles" 
    ON public.user_roles 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- policies for moderation_queue
CREATE POLICY "Admins have full access on moderation_queue" 
    ON public.moderation_queue 
    FOR ALL 
    USING (public.am_i_admin());

-- policies for product_reports
CREATE POLICY "Admins have full access on product_reports" 
    ON public.product_reports 
    FOR ALL 
    USING (public.am_i_admin());

-- policies for user_verifications
CREATE POLICY "Admins have full access on user_verifications" 
    ON public.user_verifications 
    FOR ALL 
    USING (public.am_i_admin());

CREATE POLICY "Users can insert their own verification submissions" 
    ON public.user_verifications 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- policies for campus_memberships
CREATE POLICY "Admins have full access on campus_memberships" 
    ON public.campus_memberships 
    FOR ALL 
    USING (public.am_i_admin());

-- policies for audit_logs
CREATE POLICY "Admins have read access on audit_logs" 
    ON public.audit_logs 
    FOR SELECT 
    USING (public.am_i_admin());

-- policies for brands
CREATE POLICY "Admins have full access on brands" 
    ON public.brands 
    FOR ALL 
    USING (public.am_i_admin());

CREATE POLICY "Anyone can view active brands" 
    ON public.brands 
    FOR SELECT 
    USING (is_active = true);

-- policies for promotions
CREATE POLICY "Admins can view and edit promotions" 
    ON public.promotions 
    FOR ALL 
    USING (public.am_i_admin());

-- ====================================================================
-- QUICK INITIAL SEED FOR TESTING: PROMOTE FIRST ADMIN USER
-- Replace auth_id below with your authentic auth.users ID
-- ====================================================================
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('<YOUR-USER-UUID>', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;
