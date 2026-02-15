
-- ============================================================
-- SECURITY HARDENING v2 - Critical fixes
-- ============================================================

-- 1. Harden audit_logs INSERT - only management roles can insert
-- (database triggers run as SECURITY DEFINER so bypass RLS)
DROP POLICY IF EXISTS "system_roles_insert_audit_logs" ON public.audit_logs;
CREATE POLICY "management_insert_audit_logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid())
  );

-- 2. Restrict profiles SELECT to own profile + CEO/Superviseur
-- (CEO can read all is fine, but let's add superviseur too for management)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (user_id = auth.uid() OR is_ceo(auth.uid()) OR is_superviseur(auth.uid()));

DROP POLICY IF EXISTS "CEO can read all profiles" ON public.profiles;
-- Merged into the policy above

-- 3. Add audit access logging trigger for cash_deposits reads
-- (We log when sensitive financial data is accessed)
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (
    action_type, table_name, record_id, user_id, description
  ) VALUES (
    'SENSITIVE_READ',
    TG_TABLE_NAME,
    NEW.id::text,
    auth.uid(),
    'Sensitive data accessed: ' || TG_TABLE_NAME
  );
  RETURN NEW;
END;
$$;
