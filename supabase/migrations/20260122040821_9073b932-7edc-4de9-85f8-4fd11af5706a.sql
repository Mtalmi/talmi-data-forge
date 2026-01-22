-- Create helper function for auditeur role (using text comparison since enum value was added)
CREATE OR REPLACE FUNCTION public.is_auditeur(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = $1 AND role::text = 'auditeur'
  );
$$;