
-- Add bc_id column to bons_livraison_reels to link BLs to parent BC
ALTER TABLE bons_livraison_reels ADD COLUMN IF NOT EXISTS bc_id text;

-- Add tracking columns to bons_commande for multi-delivery orders
ALTER TABLE bons_commande ADD COLUMN IF NOT EXISTS volume_livre numeric DEFAULT 0;
ALTER TABLE bons_commande ADD COLUMN IF NOT EXISTS volume_restant numeric GENERATED ALWAYS AS (volume_m3 - volume_livre) STORED;
ALTER TABLE bons_commande ADD COLUMN IF NOT EXISTS nb_livraisons integer DEFAULT 0;
ALTER TABLE bons_commande ADD COLUMN IF NOT EXISTS facture_consolidee_id text;
ALTER TABLE bons_commande ADD COLUMN IF NOT EXISTS facture_mode text DEFAULT 'consolidee' CHECK (facture_mode IN ('consolidee', 'par_livraison'));

-- Add bc_id reference to factures for consolidated invoicing
ALTER TABLE factures ADD COLUMN IF NOT EXISTS bc_id text;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS is_consolidee boolean DEFAULT false;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS bls_inclus text[];

-- Create index for BC-BL relationship
CREATE INDEX IF NOT EXISTS idx_bons_livraison_bc_id ON bons_livraison_reels(bc_id);
CREATE INDEX IF NOT EXISTS idx_factures_bc_id ON factures(bc_id);

-- Update the create_bl_from_bc function to:
-- 1. Allow partial volume delivery (not just full BC volume)
-- 2. Link BL to BC
-- 3. Track delivered volume
-- 4. Keep BC in production status until all volume is delivered
CREATE OR REPLACE FUNCTION public.create_bl_from_bc(
  p_bc_id text,
  p_bl_id text,
  p_date_livraison date DEFAULT CURRENT_DATE,
  p_volume_m3 numeric DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bc record;
  v_formule record;
  v_ciment_reel numeric;
  v_user_id uuid;
  v_volume numeric;
  v_new_volume_livre numeric;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check if user has permission (CEO, Directeur Operations, Commercial, Agent Admin)
  IF NOT (
    has_role_v2(v_user_id, 'ceo') OR
    has_role_v2(v_user_id, 'directeur_operations') OR
    has_role_v2(v_user_id, 'commercial') OR
    has_role_v2(v_user_id, 'agent_administratif')
  ) THEN
    RAISE EXCEPTION 'Permission denied: You cannot create BL from BC';
  END IF;
  
  -- Fetch BC
  SELECT * INTO v_bc FROM bons_commande WHERE bc_id = p_bc_id;
  
  IF v_bc IS NULL THEN
    RAISE EXCEPTION 'BC not found: %', p_bc_id;
  END IF;
  
  -- Check BC status allows production (pret_production OR en_production for multi-delivery)
  IF v_bc.statut NOT IN ('pret_production', 'en_production') THEN
    RAISE EXCEPTION 'BC must be in pret_production or en_production status. Current: %', v_bc.statut;
  END IF;
  
  -- Determine volume for this delivery
  v_volume := COALESCE(p_volume_m3, LEAST(v_bc.volume_m3 - COALESCE(v_bc.volume_livre, 0), 12));
  
  -- Check there's remaining volume
  IF v_volume <= 0 THEN
    RAISE EXCEPTION 'No remaining volume on BC. Already delivered: % m³', v_bc.volume_livre;
  END IF;
  
  -- Get formule for ciment calculation
  SELECT ciment_kg_m3 INTO v_formule FROM formules_theoriques WHERE formule_id = v_bc.formule_id;
  v_ciment_reel := COALESCE(v_formule.ciment_kg_m3, 350) * v_volume;
  
  -- Insert BL with all data from BC + bc_id link
  INSERT INTO bons_livraison_reels (
    bl_id,
    bc_id,
    client_id,
    formule_id,
    volume_m3,
    ciment_reel_kg,
    prix_vente_m3,
    date_livraison,
    heure_prevue,
    workflow_status,
    statut_paiement,
    zone_livraison_id,
    mode_paiement,
    prix_livraison_m3,
    prestataire_id,
    created_by
  ) VALUES (
    p_bl_id,
    p_bc_id,
    v_bc.client_id,
    v_bc.formule_id,
    v_volume,
    v_ciment_reel,
    v_bc.prix_vente_m3,
    COALESCE(v_bc.date_livraison_souhaitee, p_date_livraison),
    v_bc.heure_livraison_souhaitee,
    'planification',
    'En Attente',
    v_bc.zone_livraison_id,
    COALESCE(v_bc.mode_paiement, 'virement'),
    COALESCE(v_bc.prix_livraison_m3, 0),
    v_bc.prestataire_id,
    v_user_id
  );
  
  -- Calculate new volume_livre
  v_new_volume_livre := COALESCE(v_bc.volume_livre, 0) + v_volume;
  
  -- Update BC: increment volume_livre and nb_livraisons
  UPDATE bons_commande 
  SET 
    statut = CASE 
      WHEN v_new_volume_livre >= volume_m3 THEN 'termine'
      ELSE 'en_production'
    END,
    volume_livre = v_new_volume_livre,
    nb_livraisons = COALESCE(nb_livraisons, 0) + 1
  WHERE bc_id = p_bc_id;
  
  RETURN p_bl_id;
END;
$$;

-- Create function to generate consolidated invoice from BC
CREATE OR REPLACE FUNCTION public.generate_consolidated_invoice(
  p_bc_id text,
  p_facture_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bc record;
  v_user_id uuid;
  v_total_volume numeric;
  v_total_ht numeric;
  v_total_ttc numeric;
  v_bl_ids text[];
  v_cur_reel_total numeric;
  v_marge_brute_dh numeric;
  v_marge_brute_pct numeric;
BEGIN
  v_user_id := auth.uid();
  
  -- Check permissions
  IF NOT (has_role_v2(v_user_id, 'ceo') OR has_role_v2(v_user_id, 'agent_administratif')) THEN
    RAISE EXCEPTION 'Permission denied: Only CEO or Agent Administratif can generate invoices';
  END IF;
  
  -- Get BC
  SELECT * INTO v_bc FROM bons_commande WHERE bc_id = p_bc_id;
  IF v_bc IS NULL THEN
    RAISE EXCEPTION 'BC not found: %', p_bc_id;
  END IF;
  
  -- Get all delivered BLs for this BC
  SELECT 
    array_agg(bl_id),
    SUM(volume_m3),
    SUM(volume_m3 * COALESCE(prix_vente_m3, 0)),
    SUM(volume_m3 * COALESCE(cur_reel, 0))
  INTO v_bl_ids, v_total_volume, v_total_ht, v_cur_reel_total
  FROM bons_livraison_reels 
  WHERE bc_id = p_bc_id 
    AND workflow_status = 'livre'
    AND facture_generee IS NOT TRUE;
  
  IF v_bl_ids IS NULL OR array_length(v_bl_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No delivered BLs found for BC: %', p_bc_id;
  END IF;
  
  -- Calculate totals
  v_total_ttc := v_total_ht * 1.20; -- 20% TVA
  v_marge_brute_dh := v_total_ht - COALESCE(v_cur_reel_total, 0);
  v_marge_brute_pct := CASE WHEN v_total_ht > 0 THEN (v_marge_brute_dh / v_total_ht) * 100 ELSE 0 END;
  
  -- Create consolidated facture
  INSERT INTO factures (
    facture_id,
    bc_id,
    bl_id,
    client_id,
    formule_id,
    volume_m3,
    prix_vente_m3,
    total_ht,
    tva_pct,
    total_ttc,
    cur_reel,
    marge_brute_dh,
    marge_brute_pct,
    mode_paiement,
    prix_livraison_m3,
    is_consolidee,
    bls_inclus,
    created_by
  ) VALUES (
    p_facture_id,
    p_bc_id,
    v_bl_ids[1], -- Primary BL reference
    v_bc.client_id,
    v_bc.formule_id,
    v_total_volume,
    v_bc.prix_vente_m3,
    v_total_ht,
    20,
    v_total_ttc,
    v_cur_reel_total,
    v_marge_brute_dh,
    v_marge_brute_pct,
    COALESCE(v_bc.mode_paiement, 'virement'),
    COALESCE(v_bc.prix_livraison_m3, 0),
    TRUE,
    v_bl_ids,
    v_user_id
  );
  
  -- Mark all BLs as invoiced
  UPDATE bons_livraison_reels 
  SET 
    facture_generee = TRUE,
    facture_id = p_facture_id,
    workflow_status = 'facture'
  WHERE bl_id = ANY(v_bl_ids);
  
  -- Update BC with facture reference
  UPDATE bons_commande
  SET facture_consolidee_id = p_facture_id
  WHERE bc_id = p_bc_id;
  
  RETURN p_facture_id;
END;
$$;
