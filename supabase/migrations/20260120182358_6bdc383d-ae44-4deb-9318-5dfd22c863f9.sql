-- Drop the existing overly permissive insert policy
DROP POLICY IF EXISTS "Admin and Directeur can insert bons" ON public.bons_livraison_reels;

-- Create CEO-only manual insert policy
CREATE POLICY "Only CEO can manually insert bons"
ON public.bons_livraison_reels
FOR INSERT
TO authenticated
WITH CHECK (public.has_role_v2(auth.uid(), 'ceo'));

-- Create a SECURITY DEFINER function to convert BC to BL
-- This allows authorized roles to create BL ONLY from an existing BC
CREATE OR REPLACE FUNCTION public.create_bl_from_bc(
  p_bc_id text,
  p_bl_id text,
  p_date_livraison date DEFAULT CURRENT_DATE
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
  
  -- Check BC status is ready for production
  IF v_bc.statut != 'pret_production' THEN
    RAISE EXCEPTION 'BC must be in pret_production status. Current: %', v_bc.statut;
  END IF;
  
  -- Get formule for ciment calculation
  SELECT ciment_kg_m3 INTO v_formule FROM formules_theoriques WHERE formule_id = v_bc.formule_id;
  v_ciment_reel := COALESCE(v_formule.ciment_kg_m3, 350) * v_bc.volume_m3;
  
  -- Insert BL with all data from BC
  INSERT INTO bons_livraison_reels (
    bl_id,
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
    v_bc.client_id,
    v_bc.formule_id,
    v_bc.volume_m3,
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
  
  -- Update BC status
  UPDATE bons_commande 
  SET statut = 'en_production' 
  WHERE bc_id = p_bc_id;
  
  RETURN p_bl_id;
END;
$$;