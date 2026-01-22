-- =====================================================
-- HIGH-SECURITY STOCK MANAGEMENT - SEPARATION OF POWERS
-- =====================================================

-- Add photo_bl_url column to mouvements_stock for delivery note uploads
ALTER TABLE public.mouvements_stock ADD COLUMN IF NOT EXISTS photo_bl_url TEXT;
ALTER TABLE public.mouvements_stock ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.mouvements_stock ADD COLUMN IF NOT EXISTS reason_code TEXT;

-- Add columns to track who performed stock adjustments
ALTER TABLE public.stocks ADD COLUMN IF NOT EXISTS derniere_modification_par UUID;
ALTER TABLE public.stocks ADD COLUMN IF NOT EXISTS derniere_modification_type TEXT;
ALTER TABLE public.stocks ADD COLUMN IF NOT EXISTS derniere_modification_notes TEXT;

-- =====================================================
-- RLS POLICIES FOR STOCKS TABLE
-- =====================================================
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "stocks_read_all" ON public.stocks;
DROP POLICY IF EXISTS "stocks_update_ceo_superviseur" ON public.stocks;
DROP POLICY IF EXISTS "stocks_insert_admin_ceo_superviseur" ON public.stocks;

-- Everyone can READ stocks (for dashboard visibility)
CREATE POLICY "stocks_read_all" ON public.stocks
FOR SELECT USING (true);

-- Only CEO and Superviseur can UPDATE stocks (manual adjustments)
-- Agent Admin can update via reception ONLY (handled by RPC)
CREATE POLICY "stocks_update_ceo_superviseur" ON public.stocks
FOR UPDATE USING (
  is_ceo(auth.uid()) OR is_superviseur(auth.uid())
);

-- Only CEO, Superviseur can INSERT stocks
CREATE POLICY "stocks_insert_ceo_superviseur" ON public.stocks
FOR INSERT WITH CHECK (
  is_ceo(auth.uid()) OR is_superviseur(auth.uid())
);

-- =====================================================
-- RLS POLICIES FOR MOUVEMENTS_STOCK TABLE
-- =====================================================
ALTER TABLE public.mouvements_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mouvements_read_all" ON public.mouvements_stock;
DROP POLICY IF EXISTS "mouvements_insert_authorized" ON public.mouvements_stock;

-- Everyone can READ movement history
CREATE POLICY "mouvements_read_all" ON public.mouvements_stock
FOR SELECT USING (true);

-- Only CEO, Superviseur, Agent Admin can INSERT movements (receptions)
-- Centraliste can ONLY trigger via production (handled by trigger with service role)
CREATE POLICY "mouvements_insert_authorized" ON public.mouvements_stock
FOR INSERT WITH CHECK (
  is_ceo(auth.uid()) OR 
  is_superviseur(auth.uid()) OR 
  is_agent_administratif(auth.uid())
);

-- =====================================================
-- SECURE RECEPTION FUNCTION (Agent Admin + CEO/Superviseur)
-- Requires photo upload for Agent Admin
-- =====================================================
CREATE OR REPLACE FUNCTION public.secure_add_reception(
  p_materiau TEXT,
  p_quantite NUMERIC,
  p_fournisseur TEXT,
  p_numero_bl TEXT,
  p_photo_bl_url TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_stock RECORD;
  v_quantite_avant NUMERIC;
  v_quantite_apres NUMERIC;
BEGIN
  v_user_id := auth.uid();
  
  -- Check permissions: Only CEO, Superviseur, or Agent Admin
  IF NOT (is_ceo(v_user_id) OR is_superviseur(v_user_id) OR is_agent_administratif(v_user_id)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée: Seul le CEO, Superviseur ou Agent Admin peut ajouter des réceptions');
  END IF;
  
  -- Agent Admin MUST provide photo of supplier BL
  IF is_agent_administratif(v_user_id) AND (p_photo_bl_url IS NULL OR p_photo_bl_url = '') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Photo du BL fournisseur obligatoire pour les réceptions');
  END IF;
  
  -- Get current stock
  SELECT * INTO v_stock FROM stocks WHERE materiau = p_materiau;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Matériau non trouvé: ' || p_materiau);
  END IF;
  
  v_quantite_avant := v_stock.quantite_actuelle;
  v_quantite_apres := v_quantite_avant + p_quantite;
  
  -- Update stock
  UPDATE stocks SET
    quantite_actuelle = v_quantite_apres,
    derniere_reception_at = now(),
    derniere_modification_par = v_user_id,
    derniere_modification_type = 'reception',
    derniere_modification_notes = 'Réception de ' || p_fournisseur,
    updated_at = now()
  WHERE materiau = p_materiau;
  
  -- Record movement
  INSERT INTO mouvements_stock (
    materiau, type_mouvement, quantite, quantite_avant, quantite_apres,
    fournisseur, numero_bl_fournisseur, photo_bl_url, notes, created_by
  ) VALUES (
    p_materiau, 'reception', p_quantite, v_quantite_avant, v_quantite_apres,
    p_fournisseur, p_numero_bl, p_photo_bl_url, p_notes, v_user_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', p_quantite || ' ajoutés au stock de ' || p_materiau,
    'quantite_avant', v_quantite_avant,
    'quantite_apres', v_quantite_apres
  );
END;
$$;

-- =====================================================
-- SECURE MANUAL ADJUSTMENT (CEO/Superviseur ONLY)
-- Requires reason code and creates audit trail
-- =====================================================
CREATE OR REPLACE FUNCTION public.secure_adjust_stock(
  p_materiau TEXT,
  p_nouvelle_quantite NUMERIC,
  p_reason_code TEXT,
  p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_info RECORD;
  v_stock RECORD;
  v_quantite_avant NUMERIC;
  v_delta NUMERIC;
BEGIN
  v_user_id := auth.uid();
  
  -- STRICT: Only CEO or Superviseur can manually adjust
  IF NOT (is_ceo(v_user_id) OR is_superviseur(v_user_id)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée: Seul le CEO ou Superviseur peut effectuer des ajustements manuels');
  END IF;
  
  -- Reason code is MANDATORY
  IF p_reason_code IS NULL OR p_reason_code = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code raison obligatoire pour les ajustements manuels');
  END IF;
  
  -- Get user info for audit
  SELECT * INTO v_user_info FROM get_user_display_info(v_user_id);
  
  -- Get current stock
  SELECT * INTO v_stock FROM stocks WHERE materiau = p_materiau;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Matériau non trouvé: ' || p_materiau);
  END IF;
  
  v_quantite_avant := v_stock.quantite_actuelle;
  v_delta := p_nouvelle_quantite - v_quantite_avant;
  
  -- Update stock
  UPDATE stocks SET
    quantite_actuelle = p_nouvelle_quantite,
    derniere_modification_par = v_user_id,
    derniere_modification_type = 'ajustement',
    derniere_modification_notes = 'Ajustement: ' || p_reason_code || ' - ' || p_notes,
    updated_at = now()
  WHERE materiau = p_materiau;
  
  -- Record movement with reason code
  INSERT INTO mouvements_stock (
    materiau, type_mouvement, quantite, quantite_avant, quantite_apres,
    reason_code, notes, created_by
  ) VALUES (
    p_materiau, 'ajustement', v_delta, v_quantite_avant, p_nouvelle_quantite,
    p_reason_code, p_notes || ' (Ajusté par: ' || COALESCE(v_user_info.full_name, 'Inconnu') || ')', v_user_id
  );
  
  -- Create CEO audit alert for visibility
  INSERT INTO alertes_systeme (
    type_alerte, niveau, titre, message, reference_id, reference_table, destinataire_role
  ) VALUES (
    'audit_stock',
    CASE WHEN ABS(v_delta) > v_stock.quantite_actuelle * 0.1 THEN 'warning' ELSE 'info' END,
    'Ajustement Stock: ' || p_materiau,
    'Ajusté par ' || COALESCE(v_user_info.full_name, 'Inconnu') || ' | ' || 
    'Avant: ' || v_quantite_avant || ' → Après: ' || p_nouvelle_quantite || ' | ' ||
    'Raison: ' || p_reason_code,
    v_stock.id,
    'stocks',
    'ceo'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Stock ajusté avec succès',
    'quantite_avant', v_quantite_avant,
    'quantite_apres', p_nouvelle_quantite,
    'delta', v_delta
  );
END;
$$;

-- =====================================================
-- SILO GHOST ALERT TRIGGER (Low Level at 15%)
-- Auto-creates alerts for Admin (reorder) and CEO (leakage check)
-- =====================================================
CREATE OR REPLACE FUNCTION public.trigger_silo_ghost_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity NUMERIC;
  v_percentage NUMERIC;
  v_alert_threshold NUMERIC := 15; -- 15% of capacity
BEGIN
  -- Calculate percentage of capacity
  v_capacity := COALESCE(NEW.capacite_max, NEW.seuil_alerte * 3);
  IF v_capacity > 0 THEN
    v_percentage := (NEW.quantite_actuelle / v_capacity) * 100;
  ELSE
    v_percentage := 100;
  END IF;
  
  -- Trigger at 15% or below
  IF v_percentage <= v_alert_threshold AND 
     (OLD.quantite_actuelle IS NULL OR (OLD.quantite_actuelle / v_capacity * 100) > v_alert_threshold) THEN
    
    -- Alert to Agent Admin for reorder
    INSERT INTO alertes_systeme (
      type_alerte, niveau, titre, message, reference_id, reference_table, destinataire_role
    ) VALUES (
      'stock_reorder',
      'warning',
      '📦 Réapprovisionnement Requis: ' || NEW.materiau,
      NEW.materiau || ' est à ' || ROUND(v_percentage, 1) || '% de capacité. Commande urgente recommandée. Stock actuel: ' || NEW.quantite_actuelle || ' ' || NEW.unite,
      NEW.id,
      'stocks',
      'agent_administratif'
    );
    
    -- Alert to CEO for leakage investigation
    INSERT INTO alertes_systeme (
      type_alerte, niveau, titre, message, reference_id, reference_table, destinataire_role
    ) VALUES (
      'stock_leakage_check',
      'warning',
      '🔍 Vérification Stock Requise: ' || NEW.materiau,
      'Stock de ' || NEW.materiau || ' à ' || ROUND(v_percentage, 1) || '%. Veuillez vérifier la cohérence entre production et stock physique pour détecter toute fuite potentielle.',
      NEW.id,
      'stocks',
      'ceo'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for silo ghost alert
DROP TRIGGER IF EXISTS trigger_silo_ghost_alert ON stocks;
CREATE TRIGGER trigger_silo_ghost_alert
  AFTER UPDATE OF quantite_actuelle ON stocks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_silo_ghost_alert();

-- =====================================================
-- GRANT EXECUTE ON FUNCTIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.secure_add_reception TO authenticated;
GRANT EXECUTE ON FUNCTION public.secure_adjust_stock TO authenticated;