-- ================================================================
-- TALMI BETON ZERO-TRUST SECURITY OVERHAUL
-- (Using existing is_superviseur function)
-- ================================================================

-- ================================================================
-- 1. Stock Reception Pending Table for Double-Lock Protocol
-- Quality Gate (Resp. Technique) -> Financial Gate (Agent Admin)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.stock_receptions_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materiau TEXT NOT NULL,
  quantite NUMERIC NOT NULL,
  fournisseur TEXT NOT NULL,
  numero_bl TEXT NOT NULL,
  
  -- Quality Evidence (Step 1 - Resp. Technique)
  photo_materiel_url TEXT,
  photo_bl_url TEXT,
  humidite_pct NUMERIC,
  qualite_visuelle TEXT CHECK (qualite_visuelle IN ('conforme', 'non_conforme', 'reserve')),
  notes_qualite TEXT,
  qualite_approuvee_par UUID REFERENCES auth.users(id),
  qualite_approuvee_at TIMESTAMP WITH TIME ZONE,
  
  -- Financial Approval (Step 2 - Agent Admin)
  poids_pesee NUMERIC,
  montant_facture NUMERIC,
  numero_facture TEXT,
  notes_admin TEXT,
  admin_approuve_par UUID REFERENCES auth.users(id),
  admin_approuve_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  statut TEXT NOT NULL DEFAULT 'en_attente_qualite' CHECK (statut IN ('en_attente_qualite', 'approuve_qualite', 'valide', 'rejete')),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_receptions_pending ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "stock_pending_read_authorized" ON public.stock_receptions_pending;
DROP POLICY IF EXISTS "stock_pending_insert_resp_technique" ON public.stock_receptions_pending;
DROP POLICY IF EXISTS "stock_pending_update_authorized" ON public.stock_receptions_pending;

-- Policies for stock_receptions_pending
CREATE POLICY "stock_pending_read_authorized" ON public.stock_receptions_pending
  FOR SELECT USING (
    is_ceo(auth.uid()) OR 
    is_superviseur(auth.uid()) OR 
    is_responsable_technique(auth.uid()) OR 
    is_agent_administratif(auth.uid())
  );

CREATE POLICY "stock_pending_insert_resp_technique" ON public.stock_receptions_pending
  FOR INSERT WITH CHECK (
    is_ceo(auth.uid()) OR 
    is_superviseur(auth.uid()) OR 
    is_responsable_technique(auth.uid())
  );

CREATE POLICY "stock_pending_update_authorized" ON public.stock_receptions_pending
  FOR UPDATE USING (
    is_ceo(auth.uid()) OR 
    is_superviseur(auth.uid()) OR 
    is_responsable_technique(auth.uid()) OR 
    is_agent_administratif(auth.uid())
  );

-- ================================================================
-- 2. DEVIS RLS Policies Update - Add Superviseur + Dir Ops draft
-- ================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "CEO can delete devis" ON public.devis;
DROP POLICY IF EXISTS "Commercial and Admin can create devis" ON public.devis;
DROP POLICY IF EXISTS "Commercial can update own devis" ON public.devis;
DROP POLICY IF EXISTS "Commercial roles can read devis" ON public.devis;
DROP POLICY IF EXISTS "devis_read_authorized" ON public.devis;
DROP POLICY IF EXISTS "devis_insert_authorized" ON public.devis;
DROP POLICY IF EXISTS "devis_update_authorized" ON public.devis;
DROP POLICY IF EXISTS "devis_delete_ceo_superviseur" ON public.devis;

-- New comprehensive devis policies
CREATE POLICY "devis_read_authorized" ON public.devis
  FOR SELECT USING (
    is_ceo(auth.uid()) OR 
    is_superviseur(auth.uid()) OR 
    is_agent_administratif(auth.uid()) OR 
    is_commercial(auth.uid()) OR 
    is_directeur_operations(auth.uid())
  );

CREATE POLICY "devis_insert_authorized" ON public.devis
  FOR INSERT WITH CHECK (
    is_ceo(auth.uid()) OR 
    is_superviseur(auth.uid()) OR 
    is_agent_administratif(auth.uid()) OR 
    is_commercial(auth.uid()) OR 
    is_directeur_operations(auth.uid())
  );

CREATE POLICY "devis_update_authorized" ON public.devis
  FOR UPDATE USING (
    is_ceo(auth.uid()) OR 
    is_superviseur(auth.uid()) OR 
    is_agent_administratif(auth.uid()) OR
    (
      (is_commercial(auth.uid()) OR is_directeur_operations(auth.uid()))
      AND statut = 'en_attente'
    )
  );

CREATE POLICY "devis_delete_ceo_superviseur" ON public.devis
  FOR DELETE USING (
    is_ceo(auth.uid()) OR is_superviseur(auth.uid())
  );

-- ================================================================
-- 3. Function: Quality Approval for Stock Reception (Step 1)
-- ================================================================
CREATE OR REPLACE FUNCTION public.approve_stock_quality(
  p_reception_id UUID,
  p_humidite_pct NUMERIC DEFAULT NULL,
  p_qualite_visuelle TEXT DEFAULT 'conforme',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_user_name TEXT;
BEGIN
  v_user_id := auth.uid();
  
  SELECT role INTO v_user_role FROM user_roles_v2 WHERE user_id = v_user_id;
  
  IF v_user_role NOT IN ('ceo', 'superviseur', 'responsable_technique') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée: Seul le Resp. Technique, CEO ou Superviseur peut approuver la qualité');
  END IF;
  
  SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_user_name
  FROM auth.users WHERE id = v_user_id;
  
  UPDATE stock_receptions_pending
  SET 
    humidite_pct = COALESCE(p_humidite_pct, humidite_pct),
    qualite_visuelle = p_qualite_visuelle,
    notes_qualite = p_notes,
    qualite_approuvee_par = v_user_id,
    qualite_approuvee_at = NOW(),
    statut = 'approuve_qualite',
    updated_at = NOW()
  WHERE id = p_reception_id AND statut = 'en_attente_qualite';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Réception non trouvée ou déjà traitée');
  END IF;
  
  INSERT INTO audit_superviseur (user_id, user_name, action, table_name, record_id, new_data)
  VALUES (v_user_id, v_user_name, 'QUALITY_APPROVE', 'stock_receptions_pending', p_reception_id::TEXT,
    jsonb_build_object('humidite_pct', p_humidite_pct, 'qualite_visuelle', p_qualite_visuelle)
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Qualité approuvée - En attente validation Admin');
END;
$$;

-- ================================================================
-- 4. Function: Admin Validation for Stock Reception (Step 2)
-- ================================================================
CREATE OR REPLACE FUNCTION public.validate_stock_reception(
  p_reception_id UUID,
  p_poids_pesee NUMERIC DEFAULT NULL,
  p_numero_facture TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_user_name TEXT;
  v_reception RECORD;
  v_final_quantite NUMERIC;
  v_quality_user_name TEXT;
BEGIN
  v_user_id := auth.uid();
  
  SELECT role INTO v_user_role FROM user_roles_v2 WHERE user_id = v_user_id;
  
  IF v_user_role NOT IN ('ceo', 'superviseur', 'agent_administratif') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée: Seul l''Agent Admin, CEO ou Superviseur peut valider');
  END IF;
  
  SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_user_name
  FROM auth.users WHERE id = v_user_id;
  
  SELECT * INTO v_reception FROM stock_receptions_pending 
  WHERE id = p_reception_id AND statut = 'approuve_qualite';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Réception non trouvée ou pas encore approuvée par Qualité');
  END IF;
  
  v_final_quantite := COALESCE(p_poids_pesee, v_reception.quantite);
  
  SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_quality_user_name
  FROM auth.users WHERE id = v_reception.qualite_approuvee_par;
  
  UPDATE stock_receptions_pending
  SET 
    poids_pesee = p_poids_pesee,
    numero_facture = p_numero_facture,
    notes_admin = p_notes,
    admin_approuve_par = v_user_id,
    admin_approuve_at = NOW(),
    statut = 'valide',
    updated_at = NOW()
  WHERE id = p_reception_id;
  
  PERFORM secure_add_reception(
    v_reception.materiau,
    v_final_quantite,
    v_reception.fournisseur,
    v_reception.numero_bl,
    v_reception.photo_bl_url,
    CONCAT('Double-Lock: Qualité par ', v_quality_user_name, ' | Admin par ', v_user_name)
  );
  
  INSERT INTO audit_superviseur (user_id, user_name, action, table_name, record_id, new_data)
  VALUES (v_user_id, v_user_name, 'ADMIN_VALIDATE_RECEPTION', 'stock_receptions_pending', p_reception_id::TEXT,
    jsonb_build_object('materiau', v_reception.materiau, 'quantite_finale', v_final_quantite)
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Stock ajouté aux silos - Double-Lock complété');
END;
$$;

-- ================================================================
-- 5. Function: Create Stock Entry Request (Resp. Technique)
-- ================================================================
CREATE OR REPLACE FUNCTION public.create_quality_stock_entry(
  p_materiau TEXT,
  p_quantite NUMERIC,
  p_fournisseur TEXT,
  p_numero_bl TEXT,
  p_photo_materiel_url TEXT,
  p_photo_bl_url TEXT DEFAULT NULL,
  p_humidite_pct NUMERIC DEFAULT NULL,
  p_qualite_visuelle TEXT DEFAULT 'conforme',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_user_name TEXT;
  v_reception_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  SELECT role INTO v_user_role FROM user_roles_v2 WHERE user_id = v_user_id;
  
  IF v_user_role NOT IN ('ceo', 'superviseur', 'responsable_technique') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée: Seul le Resp. Technique peut créer une entrée qualité');
  END IF;
  
  IF p_photo_materiel_url IS NULL OR p_photo_materiel_url = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Photo du matériau obligatoire!');
  END IF;
  
  SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_user_name
  FROM auth.users WHERE id = v_user_id;
  
  INSERT INTO stock_receptions_pending (
    materiau, quantite, fournisseur, numero_bl,
    photo_materiel_url, photo_bl_url, humidite_pct, qualite_visuelle, notes_qualite,
    qualite_approuvee_par, qualite_approuvee_at, statut, created_by
  ) VALUES (
    p_materiau, p_quantite, p_fournisseur, p_numero_bl,
    p_photo_materiel_url, p_photo_bl_url, p_humidite_pct, p_qualite_visuelle, p_notes,
    v_user_id, NOW(), 'approuve_qualite', v_user_id
  )
  RETURNING id INTO v_reception_id;
  
  INSERT INTO audit_superviseur (user_id, user_name, action, table_name, record_id, new_data)
  VALUES (v_user_id, v_user_name, 'CREATE_QUALITY_ENTRY', 'stock_receptions_pending', v_reception_id::TEXT,
    jsonb_build_object('materiau', p_materiau, 'quantite', p_quantite, 'fournisseur', p_fournisseur)
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Entrée qualité créée - En attente validation Admin', 'id', v_reception_id);
END;
$$;

-- ================================================================
-- 6. Indexes and realtime
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_stock_receptions_pending_statut ON public.stock_receptions_pending(statut);
CREATE INDEX IF NOT EXISTS idx_stock_receptions_pending_created ON public.stock_receptions_pending(created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_receptions_pending;