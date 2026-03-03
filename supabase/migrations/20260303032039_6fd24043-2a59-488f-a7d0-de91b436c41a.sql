
-- ============================================================
-- SECURITY HARDENING: Tighten overly permissive RLS policies
-- ============================================================

-- 1. FIX: client_intelligence — restrict to CEO/Superviseur/FrontDesk
DROP POLICY IF EXISTS "Authenticated users full access" ON public.client_intelligence;

CREATE POLICY "CEO/Superviseur can manage client_intelligence"
ON public.client_intelligence FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
  OR EXISTS (SELECT 1 FROM public.user_roles_v2 WHERE user_id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
  OR EXISTS (SELECT 1 FROM public.user_roles_v2 WHERE user_id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
);

CREATE POLICY "Authenticated can read client_intelligence"
ON public.client_intelligence FOR SELECT
TO authenticated
USING (true);

-- 2. FIX: cash_flow_forecasts — restrict writes to CEO/Superviseur
DROP POLICY IF EXISTS "Authenticated users full access" ON public.cash_flow_forecasts;

CREATE POLICY "CEO/Superviseur can manage cash_flow_forecasts"
ON public.cash_flow_forecasts FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
  OR EXISTS (SELECT 1 FROM public.user_roles_v2 WHERE user_id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
  OR EXISTS (SELECT 1 FROM public.user_roles_v2 WHERE user_id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
);

CREATE POLICY "Authenticated can read cash_flow_forecasts"
ON public.cash_flow_forecasts FOR SELECT
TO authenticated
USING (true);

-- 3. FIX: flotte — remove dangerous public read policy
DROP POLICY IF EXISTS "Public can read flotte for GPS map" ON public.flotte;

-- Re-create as authenticated-only
CREATE POLICY "Authenticated can read flotte"
ON public.flotte FOR SELECT
TO authenticated
USING (true);

-- 4. FIX: ai_client_briefs — restrict writes to CEO/Superviseur
DROP POLICY IF EXISTS "Allow authenticated insert ai_client_briefs" ON public.ai_client_briefs;
DROP POLICY IF EXISTS "Allow authenticated update ai_client_briefs" ON public.ai_client_briefs;

CREATE POLICY "CEO/Superviseur can insert ai_client_briefs"
ON public.ai_client_briefs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
  OR EXISTS (SELECT 1 FROM public.user_roles_v2 WHERE user_id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
);

CREATE POLICY "CEO/Superviseur can update ai_client_briefs"
ON public.ai_client_briefs FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
  OR EXISTS (SELECT 1 FROM public.user_roles_v2 WHERE user_id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
);

-- 5. FIX: ai_cashflow_forecasts — restrict writes
DROP POLICY IF EXISTS "Allow authenticated insert ai_cashflow_forecasts" ON public.ai_cashflow_forecasts;
DROP POLICY IF EXISTS "Allow authenticated update ai_cashflow_forecasts" ON public.ai_cashflow_forecasts;

CREATE POLICY "CEO/Superviseur can insert ai_cashflow_forecasts"
ON public.ai_cashflow_forecasts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
  OR EXISTS (SELECT 1 FROM public.user_roles_v2 WHERE user_id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
);

CREATE POLICY "CEO/Superviseur can update ai_cashflow_forecasts"
ON public.ai_cashflow_forecasts FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
  OR EXISTS (SELECT 1 FROM public.user_roles_v2 WHERE user_id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur'))
);

-- 6. FIX: stock_autonomy_cache — restrict writes
DROP POLICY IF EXISTS "Allow authenticated insert stock_autonomy_cache" ON public.stock_autonomy_cache;
DROP POLICY IF EXISTS "Allow authenticated update stock_autonomy_cache" ON public.stock_autonomy_cache;

CREATE POLICY "CEO/Superviseur/RespTech can insert stock_autonomy_cache"
ON public.stock_autonomy_cache FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur', 'resp_technique', 'responsable_technique'))
  OR EXISTS (SELECT 1 FROM public.user_roles_v2 WHERE user_id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur', 'resp_technique', 'responsable_technique'))
);

CREATE POLICY "CEO/Superviseur/RespTech can update stock_autonomy_cache"
ON public.stock_autonomy_cache FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur', 'resp_technique', 'responsable_technique'))
  OR EXISTS (SELECT 1 FROM public.user_roles_v2 WHERE user_id = auth.uid() AND role IN ('ceo', 'supervisor', 'superviseur', 'resp_technique', 'responsable_technique'))
);
