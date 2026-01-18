-- Fix infinite recursion in user_roles_v2 RLS policies
-- The problem is the CEO policy queries user_roles_v2 to check if user is CEO,
-- but that query itself triggers the same policy, causing infinite recursion.

-- Drop the problematic policies
DROP POLICY IF EXISTS "CEO can manage user_roles_v2" ON public.user_roles_v2;
DROP POLICY IF EXISTS "Users can view own role v2" ON public.user_roles_v2;

-- Create new non-recursive policies
-- Users can always read their own role (simple check, no recursion)
CREATE POLICY "Users can read own role v2"
ON public.user_roles_v2
FOR SELECT
USING (user_id = auth.uid());

-- For INSERT/UPDATE/DELETE, we need a SECURITY DEFINER function to avoid recursion
-- First create a helper function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_ceo_direct(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles_v2
    WHERE user_id = _user_id AND role = 'ceo'
  )
$$;

-- CEO can manage all user roles (using the direct function)
CREATE POLICY "CEO can insert user_roles_v2"
ON public.user_roles_v2
FOR INSERT
WITH CHECK (public.is_ceo_direct(auth.uid()));

CREATE POLICY "CEO can update user_roles_v2"
ON public.user_roles_v2
FOR UPDATE
USING (public.is_ceo_direct(auth.uid()))
WITH CHECK (public.is_ceo_direct(auth.uid()));

CREATE POLICY "CEO can delete user_roles_v2"
ON public.user_roles_v2
FOR DELETE
USING (public.is_ceo_direct(auth.uid()));