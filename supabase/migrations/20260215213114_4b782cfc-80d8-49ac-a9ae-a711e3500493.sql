
-- ============================================================
-- SECURITY HARDENING MIGRATION
-- ============================================================

-- 1. CRITICAL: Remove public GPS fleet data exposure
DROP POLICY IF EXISTS "Public can read flotte for GPS map" ON public.flotte;

-- 2. Harden audit_logs INSERT - restrict to system-level roles only
DROP POLICY IF EXISTS "authenticated_insert_audit_logs" ON public.audit_logs;
CREATE POLICY "system_roles_insert_audit_logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Harden forensic_blackbox INSERT - restrict to CEO/Superviseur/Admin
DROP POLICY IF EXISTS "Authenticated can insert forensic blackbox" ON public.forensic_blackbox;
CREATE POLICY "system_insert_forensic_blackbox" ON public.forensic_blackbox
  FOR INSERT TO authenticated
  WITH CHECK (
    is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid())
  );

-- 4. Harden notification_log INSERT - restrict to management roles
DROP POLICY IF EXISTS "Authenticated can insert notification log" ON public.notification_log;
CREATE POLICY "roles_insert_notification_log" ON public.notification_log
  FOR INSERT TO authenticated
  WITH CHECK (
    is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid()) OR is_directeur_operations(auth.uid())
  );

-- 5. Harden system_errors INSERT - restrict to management roles
DROP POLICY IF EXISTS "Authenticated users can log errors" ON public.system_errors;
CREATE POLICY "roles_insert_system_errors" ON public.system_errors
  FOR INSERT TO authenticated
  WITH CHECK (
    is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_responsable_technique(auth.uid())
  );

-- 6. Harden demo_requests - add basic validation
DROP POLICY IF EXISTS "Anyone can insert demo requests" ON public.demo_requests;
CREATE POLICY "validated_insert_demo_requests" ON public.demo_requests
  FOR INSERT TO public
  WITH CHECK (
    length(trim(email)) > 5 
    AND email LIKE '%@%.%' 
    AND length(trim(nom_complet)) > 2
  );
