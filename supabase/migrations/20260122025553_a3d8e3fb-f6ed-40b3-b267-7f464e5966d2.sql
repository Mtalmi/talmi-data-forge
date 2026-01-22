-- Function to sync BC status based on linked BLs workflow status
CREATE OR REPLACE FUNCTION public.sync_bc_status_from_bl()
RETURNS TRIGGER AS $$
DECLARE
  linked_bc_id TEXT;
  total_bls INTEGER;
  livres_count INTEGER;
  factures_count INTEGER;
  en_livraison_count INTEGER;
  en_production_count INTEGER;
  new_bc_status TEXT;
BEGIN
  -- Get the BC ID from the changed BL
  linked_bc_id := COALESCE(NEW.bc_id, OLD.bc_id);
  
  -- If no BC linked, exit
  IF linked_bc_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count BLs in each status for this BC
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE workflow_status IN ('livre', 'facture')),
    COUNT(*) FILTER (WHERE workflow_status = 'facture'),
    COUNT(*) FILTER (WHERE workflow_status = 'en_livraison'),
    COUNT(*) FILTER (WHERE workflow_status IN ('production', 'en_chargement', 'validation_technique', 'planification'))
  INTO total_bls, livres_count, factures_count, en_livraison_count, en_production_count
  FROM bons_livraison_reels
  WHERE bc_id = linked_bc_id
    AND workflow_status != 'annule';

  -- Determine new BC status based on BL statuses
  IF total_bls = 0 THEN
    -- No active BLs, keep BC as is
    RETURN NEW;
  ELSIF factures_count = total_bls THEN
    -- All BLs invoiced
    new_bc_status := 'facture';
  ELSIF livres_count = total_bls THEN
    -- All BLs delivered (but not all invoiced)
    new_bc_status := 'termine';
  ELSIF en_livraison_count > 0 THEN
    -- At least one BL in delivery
    new_bc_status := 'en_livraison';
  ELSIF en_production_count > 0 THEN
    -- At least one BL in production
    new_bc_status := 'en_production';
  ELSE
    -- Default to production if we have BLs
    new_bc_status := 'en_production';
  END IF;

  -- Update BC status and volume_livre
  UPDATE bons_commande
  SET 
    statut = new_bc_status,
    volume_livre = (
      SELECT COALESCE(SUM(volume_m3), 0)
      FROM bons_livraison_reels
      WHERE bc_id = linked_bc_id
        AND workflow_status IN ('livre', 'facture')
    ),
    updated_at = now()
  WHERE bc_id = linked_bc_id
    AND statut != new_bc_status;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on bons_livraison_reels for workflow_status changes
DROP TRIGGER IF EXISTS sync_bc_on_bl_status_change ON bons_livraison_reels;

CREATE TRIGGER sync_bc_on_bl_status_change
AFTER INSERT OR UPDATE OF workflow_status ON bons_livraison_reels
FOR EACH ROW
EXECUTE FUNCTION sync_bc_status_from_bl();

-- Add comment for documentation
COMMENT ON FUNCTION sync_bc_status_from_bl() IS 'Automatically syncs BC status when linked BL workflow_status changes. Updates BC to en_production, en_livraison, termine, or facture based on aggregate BL statuses.';