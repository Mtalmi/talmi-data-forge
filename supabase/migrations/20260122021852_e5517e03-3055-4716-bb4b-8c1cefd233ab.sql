-- Add bc_mission_id column to flotte table to track current BC assignment
ALTER TABLE public.flotte ADD COLUMN IF NOT EXISTS bc_mission_id TEXT;
ALTER TABLE public.flotte ADD COLUMN IF NOT EXISTS mission_updated_at TIMESTAMPTZ;

-- Create or replace trigger function to sync truck status when assigned to BL
CREATE OR REPLACE FUNCTION public.sync_truck_status_on_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When a truck is assigned to a BL
  IF (NEW.toupie_assignee IS NOT NULL AND 
      (OLD.toupie_assignee IS NULL OR NEW.toupie_assignee IS DISTINCT FROM OLD.toupie_assignee)) THEN
    -- Update truck status to 'En Livraison' and link to BC
    UPDATE flotte 
    SET 
      statut = 'En Livraison',
      bc_mission_id = NEW.bc_id,
      mission_updated_at = now(),
      updated_at = now()
    WHERE id_camion = NEW.toupie_assignee;
  END IF;
  
  -- Also handle camion_assigne if different
  IF (NEW.camion_assigne IS NOT NULL AND 
      NEW.camion_assigne IS DISTINCT FROM NEW.toupie_assignee AND
      (OLD.camion_assigne IS NULL OR NEW.camion_assigne IS DISTINCT FROM OLD.camion_assigne)) THEN
    UPDATE flotte 
    SET 
      statut = 'En Livraison',
      bc_mission_id = NEW.bc_id,
      mission_updated_at = now(),
      updated_at = now()
    WHERE id_camion = NEW.camion_assigne;
  END IF;
  
  -- When truck is unassigned, release it
  IF (OLD.toupie_assignee IS NOT NULL AND NEW.toupie_assignee IS NULL) THEN
    -- Check if this truck has any other active BLs before releasing
    IF NOT EXISTS (
      SELECT 1 FROM bons_livraison_reels 
      WHERE toupie_assignee = OLD.toupie_assignee 
      AND bl_id != NEW.bl_id
      AND workflow_status NOT IN ('livre', 'facture', 'annule')
    ) THEN
      UPDATE flotte 
      SET 
        statut = 'Disponible',
        bc_mission_id = NULL,
        mission_updated_at = now(),
        updated_at = now()
      WHERE id_camion = OLD.toupie_assignee;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for truck assignment sync
DROP TRIGGER IF EXISTS sync_truck_on_bl_assignment ON bons_livraison_reels;
CREATE TRIGGER sync_truck_on_bl_assignment
  AFTER INSERT OR UPDATE OF toupie_assignee, camion_assigne ON bons_livraison_reels
  FOR EACH ROW
  EXECUTE FUNCTION sync_truck_status_on_assignment();

-- Create function to update BC volume when BL is marked as delivered (livre/signe)
CREATE OR REPLACE FUNCTION public.sync_bc_volume_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_bc RECORD;
  v_total_delivered NUMERIC;
  v_truck_id TEXT;
BEGIN
  -- Only trigger when workflow_status changes to 'livre' 
  IF NEW.workflow_status = 'livre' AND OLD.workflow_status != 'livre' AND NEW.bc_id IS NOT NULL THEN
    
    -- Calculate total delivered volume for this BC from all delivered BLs
    SELECT COALESCE(SUM(volume_m3), 0) INTO v_total_delivered
    FROM bons_livraison_reels
    WHERE bc_id = NEW.bc_id
    AND workflow_status = 'livre';
    
    -- Get BC details
    SELECT * INTO v_bc FROM bons_commande WHERE bc_id = NEW.bc_id;
    
    IF v_bc IS NOT NULL THEN
      -- Update BC with new volume_livre and potentially auto-complete
      UPDATE bons_commande
      SET 
        volume_livre = v_total_delivered,
        volume_restant = volume_m3 - v_total_delivered,
        statut = CASE 
          WHEN v_total_delivered >= volume_m3 THEN 'termine'
          ELSE statut
        END,
        updated_at = now()
      WHERE bc_id = NEW.bc_id;
      
      -- If BC is now complete, release all trucks assigned to this BC
      IF v_total_delivered >= v_bc.volume_m3 THEN
        UPDATE flotte 
        SET 
          statut = 'Disponible',
          bc_mission_id = NULL,
          mission_updated_at = now(),
          updated_at = now()
        WHERE bc_mission_id = NEW.bc_id;
      END IF;
    END IF;
    
    -- Also release the specific truck that just completed this delivery
    v_truck_id := COALESCE(NEW.toupie_assignee, NEW.camion_assigne);
    IF v_truck_id IS NOT NULL THEN
      -- Only release if no other active BLs for this truck
      IF NOT EXISTS (
        SELECT 1 FROM bons_livraison_reels 
        WHERE (toupie_assignee = v_truck_id OR camion_assigne = v_truck_id)
        AND bl_id != NEW.bl_id
        AND workflow_status NOT IN ('livre', 'facture', 'annule')
      ) THEN
        UPDATE flotte 
        SET 
          statut = 'Disponible',
          bc_mission_id = NULL,
          mission_updated_at = now(),
          updated_at = now()
        WHERE id_camion = v_truck_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for BC volume sync on delivery
DROP TRIGGER IF EXISTS sync_bc_volume_on_bl_delivery ON bons_livraison_reels;
CREATE TRIGGER sync_bc_volume_on_bl_delivery
  AFTER UPDATE OF workflow_status ON bons_livraison_reels
  FOR EACH ROW
  EXECUTE FUNCTION sync_bc_volume_on_delivery();

-- Enable realtime for flotte table to get instant status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.flotte;