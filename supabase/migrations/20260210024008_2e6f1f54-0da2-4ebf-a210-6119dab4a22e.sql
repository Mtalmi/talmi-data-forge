
-- ============================================
-- TITANIUM SHIELD HARDENING v3.0
-- Fix overly permissive RLS policies + search_path
-- ============================================

-- 1. Create helper functions
CREATE OR REPLACE FUNCTION public.is_management_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'superviseur', 'directeur_operationnel', 'responsable_technique', 'agent_administratif')) $$;

CREATE OR REPLACE FUNCTION public.is_finance_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('ceo', 'superviseur', 'agent_administratif')) $$;

CREATE OR REPLACE FUNCTION public.is_ceo_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'ceo') $$;

-- 2. CEO Override Tokens - CRITICAL
DROP POLICY IF EXISTS "Authenticated users can check token validity" ON public.ceo_emergency_overrides;
CREATE POLICY "Only CEO can view override tokens" ON public.ceo_emergency_overrides FOR SELECT USING (public.is_ceo_role());

-- 3. Financial tables
DROP POLICY IF EXISTS "Authenticated users can manage ar_ap_reconciliation" ON public.ar_ap_reconciliation;
CREATE POLICY "Finance roles can manage ar_ap_reconciliation" ON public.ar_ap_reconciliation FOR ALL USING (public.is_finance_role()) WITH CHECK (public.is_finance_role());

DROP POLICY IF EXISTS "Authenticated users can manage payment_schedules" ON public.payment_schedules;
CREATE POLICY "Finance roles can manage payment_schedules" ON public.payment_schedules FOR ALL USING (public.is_finance_role()) WITH CHECK (public.is_finance_role());

DROP POLICY IF EXISTS "Authenticated users can manage receivable_status" ON public.receivable_status;
CREATE POLICY "Finance roles can manage receivable_status" ON public.receivable_status FOR ALL USING (public.is_finance_role()) WITH CHECK (public.is_finance_role());

DROP POLICY IF EXISTS "Authenticated users can manage collection_logs" ON public.collection_logs;
CREATE POLICY "Finance roles can manage collection_logs" ON public.collection_logs FOR ALL USING (public.is_finance_role()) WITH CHECK (public.is_finance_role());

-- 4. Loan tables
DROP POLICY IF EXISTS "Only managers can insert loans" ON public.loans;
CREATE POLICY "Finance roles can insert loans" ON public.loans FOR INSERT WITH CHECK (public.is_finance_role());
DROP POLICY IF EXISTS "Only managers can update loans" ON public.loans;
CREATE POLICY "Finance roles can update loans" ON public.loans FOR UPDATE USING (public.is_finance_role());

DROP POLICY IF EXISTS "Only managers can insert loan payments" ON public.loan_payments;
CREATE POLICY "Finance roles can insert loan payments" ON public.loan_payments FOR INSERT WITH CHECK (public.is_finance_role());
DROP POLICY IF EXISTS "Only managers can update loan payments" ON public.loan_payments;
CREATE POLICY "Finance roles can update loan payments" ON public.loan_payments FOR UPDATE USING (public.is_finance_role());

-- 5. Associate tables
DROP POLICY IF EXISTS "Only managers can insert associates" ON public.associates;
CREATE POLICY "Finance roles can insert associates" ON public.associates FOR INSERT WITH CHECK (public.is_finance_role());
DROP POLICY IF EXISTS "Only managers can update associates" ON public.associates;
CREATE POLICY "Finance roles can update associates" ON public.associates FOR UPDATE USING (public.is_finance_role());

DROP POLICY IF EXISTS "Only managers can insert associate transactions" ON public.associate_transactions;
CREATE POLICY "Finance roles can insert associate transactions" ON public.associate_transactions FOR INSERT WITH CHECK (public.is_finance_role());
DROP POLICY IF EXISTS "Only managers can update associate transactions" ON public.associate_transactions;
CREATE POLICY "Finance roles can update associate transactions" ON public.associate_transactions FOR UPDATE USING (public.is_finance_role());

-- 6. GPS/Tracking
DROP POLICY IF EXISTS "Service role can insert GPS positions" ON public.gps_positions;
CREATE POLICY "Management can insert GPS positions" ON public.gps_positions FOR INSERT WITH CHECK (public.is_management_role());

DROP POLICY IF EXISTS "Authenticated users can manage geofences" ON public.geofences;
CREATE POLICY "Management can manage geofences" ON public.geofences FOR ALL USING (public.is_management_role()) WITH CHECK (public.is_management_role());

DROP POLICY IF EXISTS "Authenticated users can manage geofence events" ON public.geofence_events;
CREATE POLICY "Management can manage geofence events" ON public.geofence_events FOR ALL USING (public.is_management_role()) WITH CHECK (public.is_management_role());

-- 7. Emergency BC tables
DROP POLICY IF EXISTS "System can insert action items" ON public.emergency_bc_action_items;
CREATE POLICY "Management can insert action items" ON public.emergency_bc_action_items FOR INSERT WITH CHECK (public.is_management_role());
DROP POLICY IF EXISTS "Authenticated users can update action items" ON public.emergency_bc_action_items;
CREATE POLICY "Management can update action items" ON public.emergency_bc_action_items FOR UPDATE USING (public.is_management_role());

DROP POLICY IF EXISTS "System can insert action history" ON public.emergency_bc_action_history;
CREATE POLICY "Management can insert action history" ON public.emergency_bc_action_history FOR INSERT WITH CHECK (public.is_management_role());

DROP POLICY IF EXISTS "System can insert notifications" ON public.emergency_bc_notifications;
CREATE POLICY "Management can insert notifications" ON public.emergency_bc_notifications FOR INSERT WITH CHECK (public.is_management_role());

-- 8. Audit logs
DROP POLICY IF EXISTS "approval_audit_log_insert_authenticated" ON public.approval_audit_log;
CREATE POLICY "Management can insert approval audit log" ON public.approval_audit_log FOR INSERT WITH CHECK (public.is_management_role());

-- 9. System errors
DROP POLICY IF EXISTS "CEO can resolve errors" ON public.system_errors;
CREATE POLICY "CEO can resolve errors" ON public.system_errors FOR UPDATE USING (public.is_ceo_role());

-- 10. Supplier/cash tracking
DROP POLICY IF EXISTS "Authenticated users can insert cash tracking" ON public.supplier_cash_tracking;
CREATE POLICY "Finance can insert cash tracking" ON public.supplier_cash_tracking FOR INSERT WITH CHECK (public.is_finance_role());
DROP POLICY IF EXISTS "Authenticated users can update cash tracking" ON public.supplier_cash_tracking;
CREATE POLICY "Finance can update cash tracking" ON public.supplier_cash_tracking FOR UPDATE USING (public.is_finance_role());

DROP POLICY IF EXISTS "Authenticated users can insert cash audit" ON public.cash_payment_audit;
CREATE POLICY "Finance can insert cash audit" ON public.cash_payment_audit FOR INSERT WITH CHECK (public.is_finance_role());

-- 11. Fleet service records
DROP POLICY IF EXISTS "Authenticated users can insert service records" ON public.fleet_service_records;
CREATE POLICY "Management can insert service records" ON public.fleet_service_records FOR INSERT WITH CHECK (public.is_management_role());
DROP POLICY IF EXISTS "Authenticated users can update service records" ON public.fleet_service_records;
CREATE POLICY "Management can update service records" ON public.fleet_service_records FOR UPDATE USING (public.is_management_role());

-- 12. Loan compliance
DROP POLICY IF EXISTS "Managers can insert loan compliance alerts" ON public.loan_compliance_alerts;
CREATE POLICY "Finance can insert loan compliance alerts" ON public.loan_compliance_alerts FOR INSERT WITH CHECK (public.is_finance_role());
DROP POLICY IF EXISTS "Managers can update loan compliance alerts" ON public.loan_compliance_alerts;
CREATE POLICY "Finance can update loan compliance alerts" ON public.loan_compliance_alerts FOR UPDATE USING (public.is_finance_role());

-- 13. Contract alerts
DROP POLICY IF EXISTS "Authenticated users can insert contract alerts" ON public.contract_alerts;
CREATE POLICY "Management can insert contract alerts" ON public.contract_alerts FOR INSERT WITH CHECK (public.is_management_role());
DROP POLICY IF EXISTS "Authenticated users can update contract alerts" ON public.contract_alerts;
CREATE POLICY "Management can update contract alerts" ON public.contract_alerts FOR UPDATE USING (public.is_management_role());

-- 14. Fix function search_path
ALTER FUNCTION public.calculate_fleet_maintenance_status(numeric, numeric, numeric, timestamptz) SET search_path = public;
ALTER FUNCTION public.calculate_loan_payment(numeric, numeric, integer) SET search_path = public;
ALTER FUNCTION public.generate_associate_transaction_number() SET search_path = public;
ALTER FUNCTION public.generate_loan_number() SET search_path = public;
ALTER FUNCTION public.get_associate_balance(uuid) SET search_path = public;
ALTER FUNCTION public.get_loan_outstanding_balance(uuid) SET search_path = public;
ALTER FUNCTION public.reset_service_counter() SET search_path = public;
ALTER FUNCTION public.sync_km_from_fuel() SET search_path = public;
ALTER FUNCTION public.update_fleet_maintenance_status() SET search_path = public;
