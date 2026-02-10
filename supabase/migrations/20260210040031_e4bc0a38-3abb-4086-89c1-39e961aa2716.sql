
-- =====================================================
-- TITANIUM SHIELD v3.0 - COMPLETE RLS LOCKDOWN
-- Fixes 31 security scan errors by removing overly
-- permissive USING(true) SELECT policies and replacing
-- with proper role-based access control.
-- =====================================================

-- ============ 1. STOCKS ============
-- Already has proper 'Operations roles can read stocks' policy
DROP POLICY IF EXISTS "stocks_read_all" ON public.stocks;

-- ============ 2. CASH_DEPOSITS ============
-- Remove permissive, add role-based
DROP POLICY IF EXISTS "Authenticated users can view cash deposits" ON public.cash_deposits;
CREATE POLICY "Finance roles can view cash deposits"
  ON public.cash_deposits FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid()));

-- ============ 3. GPS_POSITIONS ============
-- Remove permissive, add role-based
DROP POLICY IF EXISTS "Authenticated users can view GPS positions" ON public.gps_positions;
CREATE POLICY "Operations roles can view GPS positions"
  ON public.gps_positions FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_directeur_operations(auth.uid()));

-- ============ 4. LOANS ============
-- Remove permissive, add role-based
DROP POLICY IF EXISTS "Authenticated users can view loans" ON public.loans;
CREATE POLICY "Finance roles can view loans"
  ON public.loans FOR SELECT
  TO authenticated
  USING (is_finance_role());

-- ============ 5. ASSOCIATE_TRANSACTIONS ============
DROP POLICY IF EXISTS "Authenticated users can view associate transactions" ON public.associate_transactions;
CREATE POLICY "Finance roles can view associate transactions"
  ON public.associate_transactions FOR SELECT
  TO authenticated
  USING (is_finance_role());

-- ============ 6. ASSOCIATES ============
DROP POLICY IF EXISTS "Authenticated users can view associates" ON public.associates;
CREATE POLICY "Finance roles can view associates"
  ON public.associates FOR SELECT
  TO authenticated
  USING (is_finance_role());

-- ============ 7. FIXED_ASSETS ============
DROP POLICY IF EXISTS "Authenticated users can view fixed assets" ON public.fixed_assets;
CREATE POLICY "Management can view fixed assets"
  ON public.fixed_assets FOR SELECT
  TO authenticated
  USING (
    has_role_v2(auth.uid(), 'ceo') OR 
    has_role_v2(auth.uid(), 'superviseur') OR 
    has_role_v2(auth.uid(), 'agent_administratif') OR 
    has_role_v2(auth.uid(), 'responsable_technique')
  );

-- ============ 8. ASSET_MAINTENANCE ============
DROP POLICY IF EXISTS "Authenticated users can view maintenance" ON public.asset_maintenance;
CREATE POLICY "Management can view asset maintenance"
  ON public.asset_maintenance FOR SELECT
  TO authenticated
  USING (
    has_role_v2(auth.uid(), 'ceo') OR 
    has_role_v2(auth.uid(), 'superviseur') OR 
    has_role_v2(auth.uid(), 'agent_administratif') OR 
    has_role_v2(auth.uid(), 'responsable_technique')
  );

-- ============ 9. CONTRACTS ============
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON public.contracts;
CREATE POLICY "Management can view contracts"
  ON public.contracts FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid()));

-- ============ 10. CONTROLES_DEPART ============
DROP POLICY IF EXISTS "controles_depart_read_all" ON public.controles_depart;
CREATE POLICY "Technical and operations can view controles depart"
  ON public.controles_depart FOR SELECT
  TO authenticated
  USING (
    is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR 
    is_responsable_technique(auth.uid()) OR is_centraliste(auth.uid()) OR
    is_directeur_operations(auth.uid()) OR is_agent_administratif(auth.uid())
  );

-- ============ 11. TAX_OBLIGATIONS ============
DROP POLICY IF EXISTS "Authenticated users can view tax obligations" ON public.tax_obligations;
CREATE POLICY "Finance roles can view tax obligations"
  ON public.tax_obligations FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_agent_administratif(auth.uid()));

-- ============ 12. TAX_COMPLIANCE_ALERTS ============
DROP POLICY IF EXISTS "Authenticated users can view compliance alerts" ON public.tax_compliance_alerts;
CREATE POLICY "Finance roles can view compliance alerts"
  ON public.tax_compliance_alerts FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_agent_administratif(auth.uid()));

-- ============ 13. CLIENT_TRACKING_VIEW ============
-- Secure the view with security_invoker
ALTER VIEW public.client_tracking_view SET (security_invoker = on);

-- ============ 14. CLIENT_DELIVERY_TRACKING_VIEW ============
ALTER VIEW public.client_delivery_tracking_view SET (security_invoker = on);

-- ============ 15. FORENSIC_BLACKBOX insert policy ============
-- Ensure insert is restricted to authenticated
DROP POLICY IF EXISTS "forensic_blackbox_insert_auth" ON public.forensic_blackbox;
CREATE POLICY "Authenticated can insert forensic blackbox"
  ON public.forensic_blackbox FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============ 16. NOTIFICATION_LOG insert policy ============
DROP POLICY IF EXISTS "notification_log_insert_auth" ON public.notification_log;
CREATE POLICY "Authenticated can insert notification log"
  ON public.notification_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
