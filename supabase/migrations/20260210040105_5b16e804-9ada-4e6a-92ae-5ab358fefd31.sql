
-- =====================================================
-- TITANIUM SHIELD v3.1 - SECONDARY TABLE LOCKDOWN
-- Removes remaining USING(true) SELECT policies on
-- secondary/supporting tables.
-- =====================================================

-- ============ ASSET_DEPRECIATION_SCHEDULE ============
DROP POLICY IF EXISTS "Authenticated users can view depreciation schedule" ON public.asset_depreciation_schedule;
CREATE POLICY "Management can view depreciation schedule"
  ON public.asset_depreciation_schedule FOR SELECT
  TO authenticated
  USING (
    has_role_v2(auth.uid(), 'ceo') OR 
    has_role_v2(auth.uid(), 'superviseur') OR 
    has_role_v2(auth.uid(), 'agent_administratif') OR 
    has_role_v2(auth.uid(), 'responsable_technique')
  );

-- ============ ASSET_DISPOSALS ============
DROP POLICY IF EXISTS "Authenticated users can view disposals" ON public.asset_disposals;
CREATE POLICY "Management can view asset disposals"
  ON public.asset_disposals FOR SELECT
  TO authenticated
  USING (
    has_role_v2(auth.uid(), 'ceo') OR 
    has_role_v2(auth.uid(), 'superviseur') OR 
    has_role_v2(auth.uid(), 'agent_administratif')
  );

-- ============ ASSET_INVENTORY_CHECKS ============
DROP POLICY IF EXISTS "Authenticated users can view inventory checks" ON public.asset_inventory_checks;
CREATE POLICY "Management can view inventory checks"
  ON public.asset_inventory_checks FOR SELECT
  TO authenticated
  USING (
    has_role_v2(auth.uid(), 'ceo') OR 
    has_role_v2(auth.uid(), 'superviseur') OR 
    has_role_v2(auth.uid(), 'agent_administratif')
  );

-- ============ CASH_PAYMENT_AUDIT ============
DROP POLICY IF EXISTS "Authenticated users can view cash audit" ON public.cash_payment_audit;
CREATE POLICY "Finance roles can view cash audit"
  ON public.cash_payment_audit FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid()));

-- ============ COMMUNICATION_LOGS ============
DROP POLICY IF EXISTS "Authenticated users can view communication logs" ON public.communication_logs;
CREATE POLICY "Operations can view communication logs"
  ON public.communication_logs FOR SELECT
  TO authenticated
  USING (
    is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR 
    is_agent_administratif(auth.uid()) OR is_commercial(auth.uid()) OR
    is_directeur_operations(auth.uid())
  );

-- ============ CONTRACT_ALERTS ============
DROP POLICY IF EXISTS "Authenticated users can view contract alerts" ON public.contract_alerts;
CREATE POLICY "Management can view contract alerts"
  ON public.contract_alerts FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid()));

-- ============ DEPOSIT_PATTERN_ALERTS ============
DROP POLICY IF EXISTS "Authenticated users can view deposit alerts" ON public.deposit_pattern_alerts;
CREATE POLICY "Finance roles can view deposit alerts"
  ON public.deposit_pattern_alerts FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid()));

-- ============ EMERGENCY_BC_ACTION_HISTORY ============
DROP POLICY IF EXISTS "Authenticated users can view action history" ON public.emergency_bc_action_history;
CREATE POLICY "Management can view emergency BC action history"
  ON public.emergency_bc_action_history FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid()) OR is_directeur_operations(auth.uid()));

-- ============ EMERGENCY_BC_ACTION_ITEMS ============
DROP POLICY IF EXISTS "Authenticated users can view action items" ON public.emergency_bc_action_items;
CREATE POLICY "Management can view emergency BC action items"
  ON public.emergency_bc_action_items FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid()) OR is_directeur_operations(auth.uid()));

-- ============ ESCALATION_CONTACTS ============
DROP POLICY IF EXISTS "Authenticated users can view escalation contacts" ON public.escalation_contacts;
CREATE POLICY "Management can view escalation contacts"
  ON public.escalation_contacts FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()));

-- ============ FLEET_SERVICE_RECORDS ============
DROP POLICY IF EXISTS "Users can view all fleet service records" ON public.fleet_service_records;
CREATE POLICY "Operations can view fleet service records"
  ON public.fleet_service_records FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_directeur_operations(auth.uid()));

-- ============ GEOFENCE_EVENTS ============
DROP POLICY IF EXISTS "Authenticated users can view geofence events" ON public.geofence_events;
CREATE POLICY "Operations can view geofence events"
  ON public.geofence_events FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_directeur_operations(auth.uid()));

-- ============ GEOFENCES ============
DROP POLICY IF EXISTS "Authenticated users can view geofences" ON public.geofences;
CREATE POLICY "Operations can view geofences"
  ON public.geofences FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_directeur_operations(auth.uid()));

-- ============ LOAN_COMPLIANCE_ALERTS ============
DROP POLICY IF EXISTS "Authenticated users can view loan compliance alerts" ON public.loan_compliance_alerts;
CREATE POLICY "Finance roles can view loan compliance alerts"
  ON public.loan_compliance_alerts FOR SELECT
  TO authenticated
  USING (is_finance_role());

-- ============ LOAN_PAYMENTS ============
DROP POLICY IF EXISTS "Authenticated users can view loan payments" ON public.loan_payments;
CREATE POLICY "Finance roles can view loan payments"
  ON public.loan_payments FOR SELECT
  TO authenticated
  USING (is_finance_role());

-- ============ QUOTE_APPROVALS ============
DROP POLICY IF EXISTS "quote_approvals_select_authenticated" ON public.quote_approvals;
CREATE POLICY "Sales and management can view quote approvals"
  ON public.quote_approvals FOR SELECT
  TO authenticated
  USING (
    is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR 
    is_agent_administratif(auth.uid()) OR is_commercial(auth.uid()) OR
    is_directeur_operations(auth.uid()) OR is_responsable_technique(auth.uid())
  );

-- ============ SUPPLIER_CASH_TRACKING ============
DROP POLICY IF EXISTS "Authenticated users can view cash tracking" ON public.supplier_cash_tracking;
CREATE POLICY "Finance roles can view supplier cash tracking"
  ON public.supplier_cash_tracking FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid()));

-- ============ SYSTEM_ERRORS ============
DROP POLICY IF EXISTS "CEO and supervisors can view system errors" ON public.system_errors;
CREATE POLICY "CEO and superviseur can view system errors"
  ON public.system_errors FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()));

-- ============ TAX_OBLIGATION_TEMPLATES ============
DROP POLICY IF EXISTS "Authenticated users can view templates" ON public.tax_obligation_templates;
CREATE POLICY "Finance roles can view tax templates"
  ON public.tax_obligation_templates FOR SELECT
  TO authenticated
  USING (is_ceo(auth.uid()) OR is_agent_administratif(auth.uid()));
