
-- ============================================================
-- NUCLEAR HARDENING MIGRATION: Eliminate ALL remaining USING(true)
-- ============================================================

-- Helper function for role checks (reusable across policies)
CREATE OR REPLACE FUNCTION public.is_management_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur')
  ) OR EXISTS (
    SELECT 1 FROM user_roles_v2 WHERE user_id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_operations_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur', 'resp_technique', 'responsable_technique', 'directeur_operationnel', 'directeur_operations', 'frontdesk', 'agent_administratif')
  ) OR EXISTS (
    SELECT 1 FROM user_roles_v2 WHERE user_id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur', 'resp_technique', 'responsable_technique', 'directeur_operationnel', 'directeur_operations', 'frontdesk', 'agent_administratif')
  )
$$;

-- ============================================================
-- 1. ai_briefings: Replace USING(true) SELECT with role-based
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view briefings" ON public.ai_briefings;
CREATE POLICY "Authenticated users can view briefings"
  ON public.ai_briefings FOR SELECT TO authenticated
  USING (is_management_role() OR is_operations_role());

-- 2. ai_cashflow_forecasts: Replace USING(true) SELECT
DROP POLICY IF EXISTS "Allow authenticated read ai_cashflow_forecasts" ON public.ai_cashflow_forecasts;
CREATE POLICY "Management can read ai_cashflow_forecasts"
  ON public.ai_cashflow_forecasts FOR SELECT TO authenticated
  USING (is_management_role());

-- 3. ai_client_briefs: Replace USING(true) SELECT
DROP POLICY IF EXISTS "Allow authenticated read ai_client_briefs" ON public.ai_client_briefs;
CREATE POLICY "Management can read ai_client_briefs"
  ON public.ai_client_briefs FOR SELECT TO authenticated
  USING (is_management_role());

-- 4. cash_flow_forecasts: Replace USING(true) SELECT
DROP POLICY IF EXISTS "Authenticated can read cash_flow_forecasts" ON public.cash_flow_forecasts;
CREATE POLICY "Management can read cash_flow_forecasts"
  ON public.cash_flow_forecasts FOR SELECT TO authenticated
  USING (is_management_role());

-- 5. client_intelligence: Replace USING(true) SELECT
DROP POLICY IF EXISTS "Authenticated can read client_intelligence" ON public.client_intelligence;
CREATE POLICY "Management can read client_intelligence"
  ON public.client_intelligence FOR SELECT TO authenticated
  USING (is_management_role());

-- 6. escalation_config: Replace USING(true) SELECT
DROP POLICY IF EXISTS "Authenticated users can read escalation config" ON public.escalation_config;
CREATE POLICY "Management can read escalation config"
  ON public.escalation_config FOR SELECT TO authenticated
  USING (is_management_role());

-- 7. flotte: Replace USING(true) SELECT with operations-only
DROP POLICY IF EXISTS "Authenticated can read flotte" ON public.flotte;
-- Keep existing "Operations roles can read flotte" which is already role-based

-- 8. stock_autonomy_cache: Replace USING(true) SELECT
DROP POLICY IF EXISTS "Allow authenticated read stock_autonomy_cache" ON public.stock_autonomy_cache;
CREATE POLICY "Operations can read stock_autonomy_cache"
  ON public.stock_autonomy_cache FOR SELECT TO authenticated
  USING (is_operations_role());

-- 9. maintenance_orders: Replace USING(true) SELECT with operations
DROP POLICY IF EXISTS "Authenticated users can view maintenance orders" ON public.maintenance_orders;
CREATE POLICY "Operations can view maintenance orders"
  ON public.maintenance_orders FOR SELECT TO authenticated
  USING (is_operations_role());

-- 10. purchase_orders: Replace USING(true) SELECT with operations  
DROP POLICY IF EXISTS "Authenticated users can view purchase orders" ON public.purchase_orders;
CREATE POLICY "Operations can view purchase orders"
  ON public.purchase_orders FOR SELECT TO authenticated
  USING (is_operations_role());

-- 11. quality_failure_tickets: Replace USING(true) SELECT with operations
DROP POLICY IF EXISTS "Authenticated users can view quality tickets" ON public.quality_failure_tickets;
CREATE POLICY "Operations can view quality tickets"
  ON public.quality_failure_tickets FOR SELECT TO authenticated
  USING (is_operations_role());

-- ============================================================
-- 12. forensic_blackbox: Restrict INSERT to CEO/Supervisor only
-- ============================================================
DROP POLICY IF EXISTS "system_insert_forensic_blackbox" ON public.forensic_blackbox;
CREATE POLICY "system_insert_forensic_blackbox"
  ON public.forensic_blackbox FOR INSERT TO authenticated
  WITH CHECK (is_ceo(auth.uid()) OR is_superviseur(auth.uid()));

-- ============================================================
-- 13. profiles: Fix SELECT to use authenticated role instead of public
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_ceo(auth.uid()) OR is_superviseur(auth.uid()));

-- ============================================================
-- 14. Service role WITH CHECK(true) - these are safe (service_role only)
-- but let's tighten the ai_briefings INSERT
-- ============================================================
DROP POLICY IF EXISTS "Service role can insert briefings" ON public.ai_briefings;
CREATE POLICY "Service role can insert briefings"
  ON public.ai_briefings FOR INSERT TO service_role
  WITH CHECK (true);
