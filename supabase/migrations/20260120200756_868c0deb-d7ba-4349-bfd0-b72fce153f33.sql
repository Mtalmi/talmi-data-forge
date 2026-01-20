-- Comprehensive RLS Security Hardening - Phase 2

-- ============================================================
-- 1. Fix zones_livraison - restrict to business roles only
-- ============================================================
DROP POLICY IF EXISTS "All authenticated can read zones" ON public.zones_livraison;

CREATE POLICY "Business roles can view zones" 
ON public.zones_livraison FOR SELECT
USING (
  is_ceo(auth.uid()) OR 
  is_commercial(auth.uid()) OR
  is_directeur_operations(auth.uid()) OR 
  is_agent_administratif(auth.uid())
);

-- ============================================================
-- 2. Fix formules_theoriques - restrict to technical/operations roles
-- ============================================================
DROP POLICY IF EXISTS "All authenticated can read formules" ON public.formules_theoriques;

CREATE POLICY "Technical and operations roles can view formules" 
ON public.formules_theoriques FOR SELECT
USING (
  is_ceo(auth.uid()) OR 
  is_responsable_technique(auth.uid()) OR
  is_directeur_operations(auth.uid()) OR 
  is_centraliste(auth.uid())
);

-- ============================================================
-- 3. Fix maintenance_schedules - restrict to operations roles
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view maintenance schedules" ON public.maintenance_schedules;

CREATE POLICY "Operations roles can view maintenance schedules" 
ON public.maintenance_schedules FOR SELECT
USING (
  is_ceo(auth.uid()) OR 
  is_responsable_technique(auth.uid()) OR
  is_directeur_operations(auth.uid()) OR 
  is_centraliste(auth.uid())
);

-- ============================================================
-- 4. Fix etalonnages - remove conflicting unrestricted policy
-- ============================================================
DROP POLICY IF EXISTS "All authenticated users can view calibrations" ON public.etalonnages;
-- Keep the existing "Operations can view calibrations" policy which is properly restricted

-- ============================================================
-- 5. Fix lignes_achat - restrict to management/accounting roles
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view purchase lines" ON public.lignes_achat;

CREATE POLICY "Management can view purchase lines" 
ON public.lignes_achat FOR SELECT
USING (
  is_ceo(auth.uid()) OR 
  is_accounting(auth.uid()) OR
  is_directeur_operations(auth.uid()) OR
  is_agent_administratif(auth.uid())
);

-- ============================================================
-- 6. Fix alertes_reapprovisionnement - restrict to operations/management
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view reorder alerts" ON public.alertes_reapprovisionnement;

CREATE POLICY "Operations and management can view reorder alerts" 
ON public.alertes_reapprovisionnement FOR SELECT
USING (
  is_ceo(auth.uid()) OR 
  is_directeur_operations(auth.uid()) OR
  is_agent_administratif(auth.uid())
);

-- ============================================================
-- 7. Fix paiements_fournisseur - restrict to accounting/management
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view supplier payments" ON public.paiements_fournisseur;

CREATE POLICY "Accounting can view supplier payments" 
ON public.paiements_fournisseur FOR SELECT
USING (
  is_ceo(auth.uid()) OR 
  is_accounting(auth.uid()) OR
  is_agent_administratif(auth.uid())
);