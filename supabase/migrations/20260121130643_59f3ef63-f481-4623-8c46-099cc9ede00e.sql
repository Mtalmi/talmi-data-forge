-- Drop existing function variants first
DROP FUNCTION IF EXISTS public.create_bl_from_bc(TEXT);
DROP FUNCTION IF EXISTS public.create_bl_from_bc(TEXT, NUMERIC);

-- Recreate with the new pending validation workflow
CREATE OR REPLACE FUNCTION public.create_bl_from_bc(
  p_bc_id TEXT,
  p_volume_m3 NUMERIC DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bc RECORD;
  v_bl_id TEXT;
  v_volume NUMERIC;
  v_new_volume_livre NUMERIC;
  v_new_volume_restant NUMERIC;
  v_new_nb_livraisons INT;
BEGIN
  -- Get the BC details
  SELECT * INTO v_bc FROM bons_commande WHERE bc_id = p_bc_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bon de commande % not found', p_bc_id;
  END IF;
  
  -- Check BC status
  IF v_bc.statut NOT IN ('pret_production', 'en_production') THEN
    RAISE EXCEPTION 'BC must be in pret_production or en_production status. Current: %', v_bc.statut;
  END IF;
  
  -- Check user permission
  IF NOT (
    is_ceo(auth.uid()) OR 
    is_directeur_operations(auth.uid()) OR 
    is_commercial(auth.uid()) OR
    is_agent_administratif(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Permission denied: You cannot create delivery slips';
  END IF;
  
  -- Determine volume
  v_volume := COALESCE(p_volume_m3, v_bc.volume_restant, v_bc.volume_m3);
  
  -- Check remaining volume
  IF v_bc.volume_restant IS NOT NULL AND v_volume > v_bc.volume_restant THEN
    RAISE EXCEPTION 'Volume % exceeds remaining volume %', v_volume, v_bc.volume_restant;
  END IF;
  
  -- Generate BL ID
  v_bl_id := 'BL-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || 
             LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(bl_id FROM 13) AS INTEGER)), 0) + 1 
                   FROM bons_livraison_reels 
                   WHERE bl_id LIKE 'BL-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-%')::TEXT, 4, '0');
  
  -- Create BL with 'en_attente_validation' status (pending dispatcher confirmation)
  INSERT INTO bons_livraison_reels (
    bl_id,
    bc_id,
    client_id,
    formule_id,
    volume_m3,
    date_livraison,
    mode_paiement,
    prix_vente_m3,
    workflow_status,
    zone_livraison_id,
    prix_livraison_m3,
    prestataire_id,
    heure_prevue,
    created_by
  ) VALUES (
    v_bl_id,
    p_bc_id,
    v_bc.client_id,
    v_bc.formule_id,
    v_volume,
    COALESCE(v_bc.date_livraison_souhaitee, CURRENT_DATE),
    v_bc.mode_paiement,
    v_bc.prix_vente_m3,
    'en_attente_validation',
    v_bc.zone_livraison_id,
    v_bc.prix_livraison_m3,
    v_bc.prestataire_id,
    v_bc.heure_livraison_souhaitee,
    auth.uid()
  );
  
  -- Update BC tracking
  v_new_volume_livre := COALESCE(v_bc.volume_livre, 0) + v_volume;
  v_new_volume_restant := v_bc.volume_m3 - v_new_volume_livre;
  v_new_nb_livraisons := COALESCE(v_bc.nb_livraisons, 0) + 1;
  
  UPDATE bons_commande
  SET 
    volume_livre = v_new_volume_livre,
    volume_restant = v_new_volume_restant,
    nb_livraisons = v_new_nb_livraisons,
    statut = CASE 
      WHEN v_new_volume_restant <= 0 THEN 'termine'
      ELSE 'en_production'
    END,
    updated_at = now()
  WHERE bc_id = p_bc_id;
  
  RETURN v_bl_id;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.create_bl_from_bc(TEXT, NUMERIC) IS 'Creates a BL from BC with en_attente_validation status. Dispatcher must confirm on Planning page.';