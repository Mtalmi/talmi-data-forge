-- Fix statut_paiement value to satisfy bons_livraison_reels_statut_paiement_check
-- Allowed values are: 'Payé', 'En Attente', 'Retard'
CREATE OR REPLACE FUNCTION public.create_bl_from_bc(
  p_bc_id TEXT,
  p_bl_id TEXT,
  p_date_livraison DATE,
  p_volume_m3 NUMERIC
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bc record;
  v_formule record;
  v_ciment_reel numeric;
  v_user_id uuid;
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

  -- Check BC status is ready for production or in production (for multi-delivery)
  IF v_bc.statut NOT IN ('pret_production', 'en_production') THEN
    RAISE EXCEPTION 'BC must be in pret_production or en_production status. Current: %', v_bc.statut;
  END IF;

  -- Get formule for ciment calculation
  SELECT ciment_kg_m3 INTO v_formule FROM formules_theoriques WHERE formule_id = v_bc.formule_id;
  v_ciment_reel := COALESCE(v_formule.ciment_kg_m3, 350) * p_volume_m3;

  -- Insert BL with 'en_attente_validation' status (pending dispatcher confirmation)
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
    p_volume_m3,
    v_ciment_reel,
    v_bc.prix_vente_m3,
    p_date_livraison,
    v_bc.heure_livraison_souhaitee,
    'en_attente_validation',
    'En Attente',
    v_bc.zone_livraison_id,
    v_bc.mode_paiement,
    v_bc.prix_livraison_m3,
    v_bc.prestataire_id,
    v_user_id
  );

  -- Update BC: track volume delivered and update status
  UPDATE bons_commande
  SET
    volume_livre = COALESCE(volume_livre, 0) + p_volume_m3,
    volume_restant = volume_m3 - (COALESCE(volume_livre, 0) + p_volume_m3),
    nb_livraisons = COALESCE(nb_livraisons, 0) + 1,
    statut = CASE
      WHEN (volume_m3 - (COALESCE(volume_livre, 0) + p_volume_m3)) <= 0 THEN 'termine'
      ELSE 'en_production'
    END,
    updated_at = now()
  WHERE bc_id = p_bc_id;

  RETURN p_bl_id;
END;
$$;