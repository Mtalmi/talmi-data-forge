-- Fix overly permissive RLS policies on clients table
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "All authenticated can read clients" ON clients;

-- Create role-specific read policies based on business need
-- Only CEO, Commercial, Agent Administratif, and Directeur Operations need client data
CREATE POLICY "Business roles can read clients"
ON clients FOR SELECT TO authenticated
USING (
  is_ceo(auth.uid()) OR 
  is_commercial(auth.uid()) OR 
  is_agent_administratif(auth.uid()) OR 
  is_directeur_operations(auth.uid())
);

-- Similarly restrict bons_livraison_reels read access
-- Currently "All authenticated can read bons" is too permissive
DROP POLICY IF EXISTS "All authenticated can read bons" ON bons_livraison_reels;

-- Create role-specific read policy for bons
CREATE POLICY "Operations roles can read bons"
ON bons_livraison_reels FOR SELECT TO authenticated
USING (
  is_ceo(auth.uid()) OR
  is_superviseur(auth.uid()) OR
  is_responsable_technique(auth.uid()) OR
  is_directeur_operations(auth.uid()) OR
  is_agent_administratif(auth.uid()) OR
  is_centraliste(auth.uid())
);

-- Add database-level validation constraints for formules_theoriques
-- Ciment: 250 < value < 600 kg/m³
ALTER TABLE formules_theoriques DROP CONSTRAINT IF EXISTS check_ciment_range;
ALTER TABLE formules_theoriques ADD CONSTRAINT check_ciment_range 
CHECK (ciment_kg_m3 > 250 AND ciment_kg_m3 < 600);

-- Eau: reasonable range (100-250 L/m³)
ALTER TABLE formules_theoriques DROP CONSTRAINT IF EXISTS check_eau_range;
ALTER TABLE formules_theoriques ADD CONSTRAINT check_eau_range 
CHECK (eau_l_m3 >= 100 AND eau_l_m3 <= 250);

-- Add validation trigger for E/C ratio (must be < 0.65)
CREATE OR REPLACE FUNCTION validate_ec_ratio()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- E/C ratio check: eau_l / ciment_kg < 0.65
  IF NEW.ciment_kg_m3 > 0 AND (NEW.eau_l_m3 / NEW.ciment_kg_m3) >= 0.65 THEN
    RAISE EXCEPTION 'Ratio E/C (%) dépasse la limite de 0.65', (NEW.eau_l_m3 / NEW.ciment_kg_m3)::numeric(5,3);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_formule_ec_ratio ON formules_theoriques;
CREATE TRIGGER validate_formule_ec_ratio
BEFORE INSERT OR UPDATE ON formules_theoriques
FOR EACH ROW
EXECUTE FUNCTION validate_ec_ratio();

-- Add volume constraint for bons_livraison_reels (0 < volume < 12 m³)
ALTER TABLE bons_livraison_reels DROP CONSTRAINT IF EXISTS check_volume_range;
ALTER TABLE bons_livraison_reels ADD CONSTRAINT check_volume_range 
CHECK (volume_m3 > 0 AND volume_m3 < 12);

-- Add workflow validation trigger - enforce sequential status transitions
CREATE OR REPLACE FUNCTION validate_workflow_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  valid_transitions TEXT[];
  current_status TEXT;
BEGIN
  current_status := COALESCE(OLD.workflow_status, 'planification');
  
  -- Define valid transitions
  CASE current_status
    WHEN 'planification' THEN valid_transitions := ARRAY['production', 'annule'];
    WHEN 'production' THEN valid_transitions := ARRAY['validation_technique', 'annule'];
    WHEN 'validation_technique' THEN valid_transitions := ARRAY['en_livraison', 'annule'];
    WHEN 'en_livraison' THEN valid_transitions := ARRAY['livre', 'annule'];
    WHEN 'livre' THEN valid_transitions := ARRAY['facture'];
    WHEN 'facture' THEN valid_transitions := ARRAY[]::TEXT[];
    WHEN 'annule' THEN valid_transitions := ARRAY[]::TEXT[];
    ELSE valid_transitions := ARRAY['planification'];
  END CASE;
  
  -- Check if transition is valid (CEO can override)
  IF NEW.workflow_status IS DISTINCT FROM current_status THEN
    IF NOT (NEW.workflow_status = ANY(valid_transitions)) THEN
      -- Allow CEO to override
      IF NOT is_ceo(auth.uid()) THEN
        RAISE EXCEPTION 'Transition invalide: % -> %. Transitions valides: %', 
          current_status, NEW.workflow_status, array_to_string(valid_transitions, ', ');
      END IF;
    END IF;
  END IF;
  
  -- Ensure validation_technique is set when transitioning to en_livraison
  IF NEW.workflow_status = 'en_livraison' AND NEW.validation_technique IS NOT TRUE THEN
    RAISE EXCEPTION 'Validation technique requise avant passage en livraison';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_bon_workflow ON bons_livraison_reels;
CREATE TRIGGER validate_bon_workflow
BEFORE UPDATE ON bons_livraison_reels
FOR EACH ROW
EXECUTE FUNCTION validate_workflow_transition();

-- Create function to calculate CUR when BL is marked as Livré
CREATE OR REPLACE FUNCTION calculate_cur_on_livre()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  formule RECORD;
  prix_ciment NUMERIC;
  prix_adjuvant NUMERIC;
  prix_sable NUMERIC;
  prix_gravier NUMERIC;
  prix_eau NUMERIC;
  cur_calculated NUMERIC;
  ecart_pct NUMERIC;
BEGIN
  -- Only calculate when transitioning to 'livre'
  IF NEW.workflow_status = 'livre' AND OLD.workflow_status != 'livre' THEN
    -- Get formule data
    SELECT * INTO formule FROM formules_theoriques WHERE formule_id = NEW.formule_id;
    
    -- Get current prices (with fallbacks)
    SELECT COALESCE(prix_unitaire_dh, 0) INTO prix_ciment 
    FROM prix_achat_actuels WHERE LOWER(matiere_premiere) LIKE '%ciment%' LIMIT 1;
    
    SELECT COALESCE(prix_unitaire_dh, 0) INTO prix_adjuvant 
    FROM prix_achat_actuels WHERE LOWER(matiere_premiere) LIKE '%adjuvant%' OR LOWER(matiere_premiere) LIKE '%plastif%' LIMIT 1;
    
    SELECT COALESCE(prix_unitaire_dh, 0) INTO prix_sable 
    FROM prix_achat_actuels WHERE LOWER(matiere_premiere) LIKE '%sable%' LIMIT 1;
    
    SELECT COALESCE(prix_unitaire_dh, 0) INTO prix_gravier 
    FROM prix_achat_actuels WHERE LOWER(matiere_premiere) LIKE '%gravier%' LIMIT 1;
    
    SELECT COALESCE(prix_unitaire_dh, 0) INTO prix_eau 
    FROM prix_achat_actuels WHERE LOWER(matiere_premiere) LIKE '%eau%' LIMIT 1;
    
    -- Calculate CUR based on actual consumption
    cur_calculated := 
      (NEW.ciment_reel_kg / NULLIF(NEW.volume_m3, 0)) * (prix_ciment / 1000) +
      (COALESCE(NEW.adjuvant_reel_l, 0) / NULLIF(NEW.volume_m3, 0)) * prix_adjuvant +
      COALESCE(formule.sable_kg_m3, 0) * (prix_sable / 1000) +
      COALESCE(formule.gravier_kg_m3, 0) * (prix_gravier / 1000) +
      COALESCE(formule.eau_l_m3, 0) * (prix_eau / 1000);
    
    -- Update CUR
    NEW.cur_reel := cur_calculated;
    
    -- Calculate margin deviation if selling price exists
    IF NEW.prix_vente_m3 IS NOT NULL AND NEW.prix_vente_m3 > 0 THEN
      NEW.marge_brute_pct := ((NEW.prix_vente_m3 - cur_calculated) / NEW.prix_vente_m3) * 100;
      NEW.ecart_marge := cur_calculated;
      
      -- Set alert if margin is below 15% (5% deviation threshold)
      IF NEW.marge_brute_pct < 15 THEN
        NEW.alerte_marge := TRUE;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calculate_cur_trigger ON bons_livraison_reels;
CREATE TRIGGER calculate_cur_trigger
BEFORE UPDATE ON bons_livraison_reels
FOR EACH ROW
EXECUTE FUNCTION calculate_cur_on_livre();