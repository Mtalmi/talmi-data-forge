-- Fix RLS policies with USING (true) / WITH CHECK (true) for INSERT/UPDATE/DELETE

-- ============================================================
-- 1. Fix pointages table - restrict INSERT to appropriate roles
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can insert pointages" ON public.pointages;

CREATE POLICY "Authorized roles can insert pointages" 
ON public.pointages FOR INSERT
WITH CHECK (
  is_ceo(auth.uid()) OR 
  is_directeur_operations(auth.uid()) OR 
  is_agent_administratif(auth.uid()) OR
  is_superviseur(auth.uid())
);

-- ============================================================
-- 2. Fix rapports_journaliers table - restrict INSERT to appropriate roles
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can insert rapports" ON public.rapports_journaliers;

CREATE POLICY "Authorized roles can insert rapports" 
ON public.rapports_journaliers FOR INSERT
WITH CHECK (
  is_ceo(auth.uid()) OR 
  is_directeur_operations(auth.uid()) OR 
  is_superviseur(auth.uid()) OR
  is_agent_administratif(auth.uid())
);

-- ============================================================
-- 3. Tighten bank_transactions SELECT - CEO and accounting only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view bank transactions" ON public.bank_transactions;

CREATE POLICY "CEO and accounting can view bank transactions" 
ON public.bank_transactions FOR SELECT
USING (
  is_ceo(auth.uid()) OR 
  is_accounting(auth.uid()) OR
  is_agent_administratif(auth.uid())
);

-- ============================================================
-- 4. Tighten achats SELECT - restrict to management/operations roles
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view purchases" ON public.achats;

CREATE POLICY "Operations and management can view purchases" 
ON public.achats FOR SELECT
USING (
  is_ceo(auth.uid()) OR 
  is_accounting(auth.uid()) OR
  is_directeur_operations(auth.uid()) OR
  is_agent_administratif(auth.uid())
);

-- ============================================================
-- 5. Tighten factures_fournisseur SELECT - CEO and accounting only  
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view supplier invoices" ON public.factures_fournisseur;

CREATE POLICY "CEO and accounting can view supplier invoices" 
ON public.factures_fournisseur FOR SELECT
USING (
  is_ceo(auth.uid()) OR 
  is_accounting(auth.uid()) OR
  is_agent_administratif(auth.uid())
);

-- ============================================================
-- 6. Tighten credit_score_history SELECT - CEO, accounting, commercial
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view credit score history" ON public.credit_score_history;

CREATE POLICY "Management can view credit score history" 
ON public.credit_score_history FOR SELECT
USING (
  is_ceo(auth.uid()) OR 
  is_accounting(auth.uid()) OR
  is_commercial(auth.uid()) OR
  is_agent_administratif(auth.uid())
);

-- ============================================================
-- 7. Tighten rapprochements_bancaires SELECT - CEO and accounting only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view reconciliations" ON public.rapprochements_bancaires;

CREATE POLICY "CEO and accounting can view reconciliations" 
ON public.rapprochements_bancaires FOR SELECT
USING (
  is_ceo(auth.uid()) OR 
  is_accounting(auth.uid()) OR
  is_agent_administratif(auth.uid())
);

-- ============================================================
-- 8. Tighten fournisseurs SELECT - restrict to operations/management
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.fournisseurs;

CREATE POLICY "Operations and management can view suppliers" 
ON public.fournisseurs FOR SELECT
USING (
  is_ceo(auth.uid()) OR 
  is_accounting(auth.uid()) OR
  is_directeur_operations(auth.uid()) OR
  is_agent_administratif(auth.uid())
);