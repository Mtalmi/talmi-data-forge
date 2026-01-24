
-- ============================================================
-- TITANIUM SHIELD HARDENING v2.0 - PART 1: RLS POLICIES ONLY
-- ============================================================

-- ============================================
-- 1. HARDEN mouvements_stock RLS
-- ============================================

-- Remove the overly permissive public read policy
DROP POLICY IF EXISTS "mouvements_read_all" ON mouvements_stock;

-- Create restricted policy: Only authenticated operations roles can view
DROP POLICY IF EXISTS "mouvements_stock_authenticated_read" ON mouvements_stock;
CREATE POLICY "mouvements_stock_authenticated_read"
  ON mouvements_stock
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles_v2 
      WHERE user_roles_v2.user_id = auth.uid() 
      AND user_roles_v2.role IN ('ceo', 'superviseur', 'agent_administratif', 'directeur_operations', 'responsable_technique', 'centraliste')
    )
  );

-- ============================================
-- 2. HARDEN bons_commande TRACKING POLICY
-- ============================================

-- Drop the insecure public tracking policy
DROP POLICY IF EXISTS "Public can view enabled tracking" ON bons_commande;

-- ============================================
-- 3. HARDEN profiles TABLE
-- ============================================

-- Add explicit denial for anonymous access
DROP POLICY IF EXISTS "deny_anon_profiles" ON profiles;
CREATE POLICY "deny_anon_profiles"
  ON profiles
  FOR ALL
  TO anon
  USING (false);

-- ============================================
-- 4. HARDEN clients TABLE  
-- ============================================

-- Add explicit denial for anonymous
DROP POLICY IF EXISTS "deny_anon_clients" ON clients;
CREATE POLICY "deny_anon_clients"
  ON clients
  FOR ALL
  TO anon
  USING (false);

-- ============================================
-- 5. HARDEN fleet_service_records
-- ============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage service records" ON fleet_service_records;
DROP POLICY IF EXISTS "Authenticated users can view service records" ON fleet_service_records;

-- Create role-restricted policies
DROP POLICY IF EXISTS "fleet_records_management_roles" ON fleet_service_records;
CREATE POLICY "fleet_records_management_roles"
  ON fleet_service_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles_v2 
      WHERE user_roles_v2.user_id = auth.uid() 
      AND user_roles_v2.role IN ('ceo', 'superviseur', 'directeur_operations')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles_v2 
      WHERE user_roles_v2.user_id = auth.uid() 
      AND user_roles_v2.role IN ('ceo', 'superviseur', 'directeur_operations')
    )
  );

-- ============================================
-- 6. FIX audit_logs INSERT POLICY
-- ============================================

-- Replace overly permissive WITH CHECK (true)
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

DROP POLICY IF EXISTS "authenticated_insert_audit_logs" ON audit_logs;
CREATE POLICY "authenticated_insert_audit_logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
