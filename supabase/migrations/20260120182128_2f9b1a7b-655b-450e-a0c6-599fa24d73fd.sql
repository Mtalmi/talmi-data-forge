-- Create a helper function to check roles from user_roles_v2 table
CREATE OR REPLACE FUNCTION public.has_role_v2(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles_v2
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Enable RLS on etalonnages if not already
ALTER TABLE public.etalonnages ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first to avoid conflicts
DROP POLICY IF EXISTS "CEO and Responsable Technique can manage calibrations" ON public.etalonnages;
DROP POLICY IF EXISTS "All authenticated users can view calibrations" ON public.etalonnages;

-- CEO and Responsable Technique can insert/update/delete calibrations
CREATE POLICY "CEO and Responsable Technique can manage calibrations"
ON public.etalonnages
FOR ALL
TO authenticated
USING (
  public.has_role_v2(auth.uid(), 'ceo') OR 
  public.has_role_v2(auth.uid(), 'responsable_technique')
)
WITH CHECK (
  public.has_role_v2(auth.uid(), 'ceo') OR 
  public.has_role_v2(auth.uid(), 'responsable_technique')
);

-- All authenticated users can view calibrations (read-only for others)
CREATE POLICY "All authenticated users can view calibrations"
ON public.etalonnages
FOR SELECT
TO authenticated
USING (true);