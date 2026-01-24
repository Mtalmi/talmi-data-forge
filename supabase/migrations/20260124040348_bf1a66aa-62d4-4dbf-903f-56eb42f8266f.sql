
-- Create RPC functions to fetch security data for the compliance report
-- These functions use SECURITY DEFINER to access system catalogs

CREATE OR REPLACE FUNCTION public.get_rls_policies_for_report()
RETURNS TABLE (
  schemaname TEXT,
  tablename TEXT,
  policyname TEXT,
  permissive TEXT,
  roles TEXT,
  cmd TEXT,
  qual TEXT,
  with_check TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.schemaname::TEXT,
    p.tablename::TEXT,
    p.policyname::TEXT,
    p.permissive::TEXT,
    p.roles::TEXT,
    p.cmd::TEXT,
    p.qual::TEXT,
    p.with_check::TEXT
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  ORDER BY p.tablename, p.policyname;
$$;

CREATE OR REPLACE FUNCTION public.get_security_functions_for_report()
RETURNS TABLE (
  routine_name TEXT,
  routine_type TEXT,
  security_type TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.routine_name::TEXT,
    r.routine_type::TEXT,
    r.security_type::TEXT
  FROM information_schema.routines r
  WHERE r.routine_schema = 'public'
  AND (
    r.routine_name LIKE '%enforce%' 
    OR r.routine_name LIKE '%secure%'
    OR r.routine_name LIKE '%audit%'
    OR r.routine_name LIKE '%block%'
    OR r.routine_name LIKE '%prevent%'
    OR r.routine_name LIKE '%check%'
    OR r.routine_name LIKE '%validate%'
    OR r.routine_name LIKE '%is_ceo%'
    OR r.routine_name LIKE '%is_superviseur%'
    OR r.routine_name LIKE '%has_role%'
  )
  ORDER BY r.routine_name;
$$;

-- Grant execute to authenticated users (CEO/Superviseur will filter in app)
GRANT EXECUTE ON FUNCTION public.get_rls_policies_for_report() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_security_functions_for_report() TO authenticated;
