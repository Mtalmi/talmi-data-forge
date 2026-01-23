
-- TITANIUM SHIELD: Tighten RLS policies to block anon write access
-- Remove any policies that allow public/anon write access to sensitive tables

-- Fix devis insert policy - require authenticated role
DROP POLICY IF EXISTS "devis_insert_authorized" ON devis;
CREATE POLICY "devis_insert_authenticated_only" ON devis
  FOR INSERT TO authenticated
  WITH CHECK (
    is_ceo(auth.uid()) OR 
    is_superviseur(auth.uid()) OR 
    is_agent_administratif(auth.uid()) OR 
    is_commercial(auth.uid()) OR
    is_directeur_operations(auth.uid())
  );

-- Fix formules insert policy - require authenticated and CEO/Superviseur
DROP POLICY IF EXISTS "formules_insert_ceo_superviseur" ON formules_theoriques;
CREATE POLICY "formules_insert_ceo_superviseur_auth" ON formules_theoriques
  FOR INSERT TO authenticated
  WITH CHECK (is_ceo(auth.uid()) OR is_superviseur(auth.uid()));

-- Fix stocks insert policy - require authenticated
DROP POLICY IF EXISTS "stocks_insert_ceo_superviseur" ON stocks;
CREATE POLICY "stocks_insert_authenticated_admin" ON stocks
  FOR INSERT TO authenticated
  WITH CHECK (is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid()));

-- Ensure audit_superviseur only allows authenticated inserts
DROP POLICY IF EXISTS "audit_superviseur_insert" ON audit_superviseur;
CREATE POLICY "audit_superviseur_insert_auth" ON audit_superviseur
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add restrictive policy for stock_receptions_pending
DROP POLICY IF EXISTS "stock_receptions_insert_quality" ON stock_receptions_pending;
CREATE POLICY "stock_receptions_insert_quality_auth" ON stock_receptions_pending
  FOR INSERT TO authenticated
  WITH CHECK (
    is_ceo(auth.uid()) OR 
    is_superviseur(auth.uid()) OR 
    is_responsable_technique(auth.uid()) OR
    is_agent_administratif(auth.uid())
  );
