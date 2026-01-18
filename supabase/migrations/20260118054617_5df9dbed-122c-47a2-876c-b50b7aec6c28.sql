-- Function to update stock levels when a purchase is marked as delivered
CREATE OR REPLACE FUNCTION public.update_stock_on_achat_livree()
RETURNS TRIGGER AS $$
DECLARE
  ligne RECORD;
  v_stock RECORD;
  v_quantite_converted NUMERIC;
BEGIN
  -- Only trigger when status changes to 'livree'
  IF NEW.statut = 'livree' AND OLD.statut != 'livree' THEN
    
    -- Loop through all purchase line items
    FOR ligne IN 
      SELECT * FROM lignes_achat WHERE achat_id = NEW.id
    LOOP
      -- Get current stock for this material
      SELECT * INTO v_stock 
      FROM stocks 
      WHERE LOWER(materiau) = LOWER(ligne.materiau)
      LIMIT 1;
      
      IF v_stock IS NOT NULL THEN
        -- Convert quantity based on units if needed
        -- Ciment: convert T to kg (multiply by 1000)
        -- Other materials: use as-is (m³, L)
        IF LOWER(ligne.materiau) = 'ciment' AND ligne.unite = 'T' THEN
          v_quantite_converted := ligne.quantite * 1000; -- T to kg
        ELSE
          v_quantite_converted := ligne.quantite;
        END IF;
        
        -- Update stock level
        UPDATE stocks 
        SET 
          quantite_actuelle = quantite_actuelle + v_quantite_converted,
          derniere_reception_at = now(),
          updated_at = now()
        WHERE id = v_stock.id;
        
        -- Create stock movement record
        INSERT INTO mouvements_stock (
          materiau,
          type_mouvement,
          quantite,
          quantite_avant,
          quantite_apres,
          reference_id,
          reference_table,
          fournisseur,
          numero_bl_fournisseur,
          notes
        ) VALUES (
          ligne.materiau,
          'reception',
          v_quantite_converted,
          v_stock.quantite_actuelle,
          v_stock.quantite_actuelle + v_quantite_converted,
          NEW.id::TEXT,
          'achats',
          (SELECT nom_fournisseur FROM fournisseurs WHERE id = NEW.fournisseur_id),
          NEW.numero_achat,
          'Réception automatique - Commande ' || NEW.numero_achat
        );
        
      END IF;
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on achats table
DROP TRIGGER IF EXISTS update_stock_on_achat_livree_trigger ON public.achats;
CREATE TRIGGER update_stock_on_achat_livree_trigger
AFTER UPDATE ON public.achats
FOR EACH ROW
EXECUTE FUNCTION public.update_stock_on_achat_livree();