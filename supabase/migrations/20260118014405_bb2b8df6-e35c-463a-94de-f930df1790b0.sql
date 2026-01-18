-- Drop the old enum-based approach and use TEXT with check constraint for flexibility
-- First drop existing functions that depend on the enum
DROP FUNCTION IF EXISTS public.is_superviseur(UUID);
DROP FUNCTION IF EXISTS public.is_responsable_technique(UUID);
DROP FUNCTION IF EXISTS public.is_directeur_operations(UUID);
DROP FUNCTION IF EXISTS public.is_agent_administratif(UUID);
DROP FUNCTION IF EXISTS public.is_centraliste(UUID);

-- Create a new text-based roles table
CREATE TABLE IF NOT EXISTS public.user_roles_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ceo', 'operator', 'accounting', 'commercial', 'superviseur', 'responsable_technique', 'directeur_operations', 'agent_administratif', 'centraliste')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Migrate existing data
INSERT INTO public.user_roles_v2 (id, user_id, role, created_at)
SELECT id, user_id, role::TEXT, created_at FROM public.user_roles
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.user_roles_v2 ENABLE ROW LEVEL SECURITY;

-- Copy policies
CREATE POLICY "CEO can manage user_roles_v2"
    ON public.user_roles_v2 FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles_v2 WHERE user_id = auth.uid() AND role = 'ceo'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles_v2 WHERE user_id = auth.uid() AND role = 'ceo'));

CREATE POLICY "Users can view own role v2"
    ON public.user_roles_v2 FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Create new has_role function for text-based roles
CREATE OR REPLACE FUNCTION public.has_role_v2(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles_v2
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Create helper functions for each role
CREATE OR REPLACE FUNCTION public.is_ceo_v2(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role_v2(_user_id, 'ceo')
$$;

CREATE OR REPLACE FUNCTION public.is_superviseur(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role_v2(_user_id, 'superviseur')
$$;

CREATE OR REPLACE FUNCTION public.is_responsable_technique(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role_v2(_user_id, 'responsable_technique')
$$;

CREATE OR REPLACE FUNCTION public.is_directeur_operations(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role_v2(_user_id, 'directeur_operations')
$$;

CREATE OR REPLACE FUNCTION public.is_agent_administratif(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role_v2(_user_id, 'agent_administratif')
$$;

CREATE OR REPLACE FUNCTION public.is_centraliste(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role_v2(_user_id, 'centraliste')
$$;

-- Update existing role functions to use v2
CREATE OR REPLACE FUNCTION public.is_ceo(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role_v2(_user_id, 'ceo')
$$;

CREATE OR REPLACE FUNCTION public.is_operator(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role_v2(_user_id, 'operator')
$$;

CREATE OR REPLACE FUNCTION public.is_accounting(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role_v2(_user_id, 'accounting')
$$;

CREATE OR REPLACE FUNCTION public.is_commercial(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role_v2(_user_id, 'commercial')
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role_v2(_user_id, _role::TEXT)
$$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_roles_v2_user_id ON public.user_roles_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_v2_role ON public.user_roles_v2(role);