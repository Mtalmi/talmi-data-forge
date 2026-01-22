-- Add volume_perdu tracking to bons_livraison_reels
ALTER TABLE public.bons_livraison_reels 
ADD COLUMN IF NOT EXISTS volume_perdu NUMERIC DEFAULT 0;

-- Add incident tracking to incidents_flotte
ALTER TABLE public.incidents_flotte 
ADD COLUMN IF NOT EXISTS bl_id TEXT,
ADD COLUMN IF NOT EXISTS bc_id TEXT,
ADD COLUMN IF NOT EXISTS volume_perdu NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS camion_rescue TEXT,
ADD COLUMN IF NOT EXISTS ceo_notified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ceo_notified_at TIMESTAMPTZ;

-- Create function to handle stock deduction on volume_perdu
CREATE OR REPLACE FUNCTION public.deduct_stock_on_volume_perdu()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_formule RECORD;
  v_ciment_kg NUMERIC;
  v_sable_m3 NUMERIC;
  v_gravette_m3 NUMERIC;
  v_stock RECORD;
BEGIN
  -- Only trigger when volume_perdu is set/increased
  IF NEW.volume_perdu > COALESCE(OLD.volume_perdu, 0) THEN
    DECLARE
      v_volume_lost NUMERIC := NEW.volume_perdu - COALESCE(OLD.volume_perdu, 0);
    BEGIN
      -- Get formule for this incident's BL
      SELECT ft.* INTO v_formule 
      FROM formules_theoriques ft
      JOIN bons_livraison_reels bl ON bl.formule_id = ft.formule_id
      WHERE bl.bl_id = NEW.bl_id;
      
      IF v_formule IS NULL THEN
        RETURN NEW;
      END IF;
      
      -- Calculate materials lost based on theoretical formula
      v_ciment_kg := COALESCE(v_formule.ciment_kg_m3, 350) * v_volume_lost;
      v_sable_m3 := COALESCE(v_formule.sable_m3, 0.4) * v_volume_lost;
      v_gravette_m3 := COALESCE(v_formule.gravette_m3, 0.8) * v_volume_lost;
      
      -- Deduct Ciment (already deducted during production, so this is tracking loss)
      INSERT INTO mouvements_stock (
        materiau, type_mouvement, quantite, 
        quantite_avant, quantite_apres, 
        reference_id, reference_table, notes
      )
      SELECT 
        'Ciment', 'perte', v_ciment_kg,
        s.quantite_actuelle, s.quantite_actuelle,
        NEW.id::TEXT, 'incidents_flotte', 
        'Volume perdu incident - ' || NEW.id_camion || ' - ' || COALESCE(NEW.bl_id, '')
      FROM stocks s WHERE s.materiau = 'Ciment';
      
      -- Log movement for Sable
      INSERT INTO mouvements_stock (
        materiau, type_mouvement, quantite,
        quantite_avant, quantite_apres,
        reference_id, reference_table, notes
      )
      SELECT 
        'Sable', 'perte', v_sable_m3,
        s.quantite_actuelle, s.quantite_actuelle,
        NEW.id::TEXT, 'incidents_flotte',
        'Volume perdu incident - ' || NEW.id_camion
      FROM stocks s WHERE s.materiau = 'Sable';
      
      -- Log movement for Gravette
      INSERT INTO mouvements_stock (
        materiau, type_mouvement, quantite,
        quantite_avant, quantite_apres,
        reference_id, reference_table, notes
      )
      SELECT 
        'Gravette', 'perte', v_gravette_m3,
        s.quantite_actuelle, s.quantite_actuelle,
        NEW.id::TEXT, 'incidents_flotte',
        'Volume perdu incident - ' || NEW.id_camion
      FROM stocks s WHERE s.materiau = 'Gravette';
      
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for volume_perdu stock tracking
DROP TRIGGER IF EXISTS track_volume_perdu_stock ON incidents_flotte;
CREATE TRIGGER track_volume_perdu_stock
  AFTER INSERT OR UPDATE OF volume_perdu ON incidents_flotte
  FOR EACH ROW
  EXECUTE FUNCTION deduct_stock_on_volume_perdu();