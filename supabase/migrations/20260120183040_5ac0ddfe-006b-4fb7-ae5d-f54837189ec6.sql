-- Create a trigger to enforce column-level restrictions for non-CEO users
-- This prevents Centraliste from modifying columns they shouldn't touch
CREATE OR REPLACE FUNCTION public.enforce_role_column_restrictions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CEO can modify anything
  IF is_ceo(auth.uid()) THEN
    RETURN NEW;
  END IF;
  
  -- Centraliste can ONLY modify consumption-related fields and workflow_status (for transition)
  IF is_centraliste(auth.uid()) THEN
    -- Check if trying to modify protected fields
    IF NEW.prix_vente_m3 IS DISTINCT FROM OLD.prix_vente_m3 THEN
      RAISE EXCEPTION 'Centraliste ne peut pas modifier le prix de vente';
    END IF;
    IF NEW.client_id IS DISTINCT FROM OLD.client_id THEN
      RAISE EXCEPTION 'Centraliste ne peut pas modifier le client';
    END IF;
    IF NEW.formule_id IS DISTINCT FROM OLD.formule_id THEN
      RAISE EXCEPTION 'Centraliste ne peut pas modifier la formule';
    END IF;
    IF NEW.volume_m3 IS DISTINCT FROM OLD.volume_m3 THEN
      RAISE EXCEPTION 'Centraliste ne peut pas modifier le volume';
    END IF;
    IF NEW.toupie_assignee IS DISTINCT FROM OLD.toupie_assignee THEN
      RAISE EXCEPTION 'Centraliste ne peut pas assigner la toupie';
    END IF;
    IF NEW.statut_paiement IS DISTINCT FROM OLD.statut_paiement THEN
      RAISE EXCEPTION 'Centraliste ne peut pas modifier le statut de paiement';
    END IF;
  END IF;
  
  -- Agent Administratif can ONLY modify payment-related fields
  IF is_agent_administratif(auth.uid()) THEN
    -- Check if trying to modify production fields
    IF NEW.ciment_reel_kg IS DISTINCT FROM OLD.ciment_reel_kg THEN
      RAISE EXCEPTION 'Agent administratif ne peut pas modifier les consommations';
    END IF;
    IF NEW.adjuvant_reel_l IS DISTINCT FROM OLD.adjuvant_reel_l THEN
      RAISE EXCEPTION 'Agent administratif ne peut pas modifier les consommations';
    END IF;
    IF NEW.eau_reel_l IS DISTINCT FROM OLD.eau_reel_l THEN
      RAISE EXCEPTION 'Agent administratif ne peut pas modifier les consommations';
    END IF;
    IF NEW.validation_technique IS DISTINCT FROM OLD.validation_technique THEN
      RAISE EXCEPTION 'Agent administratif ne peut pas valider techniquement';
    END IF;
  END IF;
  
  -- Directeur Operations can ONLY modify assignment-related fields
  IF is_directeur_operations(auth.uid()) THEN
    IF NEW.prix_vente_m3 IS DISTINCT FROM OLD.prix_vente_m3 THEN
      RAISE EXCEPTION 'Directeur ne peut pas modifier le prix de vente';
    END IF;
    IF NEW.statut_paiement IS DISTINCT FROM OLD.statut_paiement THEN
      RAISE EXCEPTION 'Directeur ne peut pas modifier le statut de paiement';
    END IF;
  END IF;
  
  -- Responsable Technique can ONLY modify validation-related fields
  IF is_responsable_technique(auth.uid()) THEN
    IF NEW.prix_vente_m3 IS DISTINCT FROM OLD.prix_vente_m3 THEN
      RAISE EXCEPTION 'Responsable Technique ne peut pas modifier le prix de vente';
    END IF;
    IF NEW.ciment_reel_kg IS DISTINCT FROM OLD.ciment_reel_kg THEN
      RAISE EXCEPTION 'Responsable Technique ne peut pas modifier les consommations enregistrées';
    END IF;
    IF NEW.statut_paiement IS DISTINCT FROM OLD.statut_paiement THEN
      RAISE EXCEPTION 'Responsable Technique ne peut pas modifier le statut de paiement';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_role_column_restrictions_trigger ON public.bons_livraison_reels;
CREATE TRIGGER enforce_role_column_restrictions_trigger
BEFORE UPDATE ON public.bons_livraison_reels
FOR EACH ROW
EXECUTE FUNCTION public.enforce_role_column_restrictions();