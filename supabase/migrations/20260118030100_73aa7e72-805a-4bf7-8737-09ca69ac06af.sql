-- Create stocks table for inventory management
CREATE TABLE public.stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  materiau TEXT NOT NULL UNIQUE CHECK (materiau IN ('Ciment', 'Sable', 'Gravette', 'Adjuvant', 'Eau')),
  quantite_actuelle NUMERIC NOT NULL DEFAULT 0 CHECK (quantite_actuelle >= 0),
  seuil_alerte NUMERIC NOT NULL DEFAULT 0,
  unite TEXT NOT NULL CHECK (unite IN ('kg', 'm3', 'L', 'Tonne')),
  capacite_max NUMERIC,
  derniere_reception_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock movements table for tracking inflows/outflows
CREATE TABLE public.mouvements_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  materiau TEXT NOT NULL,
  type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('reception', 'consommation', 'ajustement')),
  quantite NUMERIC NOT NULL,
  quantite_avant NUMERIC NOT NULL,
  quantite_apres NUMERIC NOT NULL,
  reference_id TEXT,
  reference_table TEXT,
  fournisseur TEXT,
  numero_bl_fournisseur TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvements_stock ENABLE ROW LEVEL SECURITY;

-- RLS policies for stocks
CREATE POLICY "Operations roles can read stocks" ON public.stocks
  FOR SELECT USING (
    is_ceo(auth.uid()) OR is_agent_administratif(auth.uid()) OR 
    is_directeur_operations(auth.uid()) OR is_centraliste(auth.uid()) OR
    is_superviseur(auth.uid())
  );

CREATE POLICY "Admin and CEO can manage stocks" ON public.stocks
  FOR ALL USING (is_ceo(auth.uid()) OR is_agent_administratif(auth.uid()))
  WITH CHECK (is_ceo(auth.uid()) OR is_agent_administratif(auth.uid()));

-- RLS policies for mouvements_stock
CREATE POLICY "Operations roles can read movements" ON public.mouvements_stock
  FOR SELECT USING (
    is_ceo(auth.uid()) OR is_agent_administratif(auth.uid()) OR 
    is_directeur_operations(auth.uid()) OR is_centraliste(auth.uid())
  );

CREATE POLICY "Admin and CEO can insert movements" ON public.mouvements_stock
  FOR INSERT WITH CHECK (is_ceo(auth.uid()) OR is_agent_administratif(auth.uid()) OR is_centraliste(auth.uid()));

-- Insert initial stock records
INSERT INTO public.stocks (materiau, quantite_actuelle, seuil_alerte, unite, capacite_max) VALUES
  ('Ciment', 50000, 10000, 'kg', 100000),
  ('Sable', 200, 50, 'm3', 500),
  ('Gravette', 180, 40, 'm3', 400),
  ('Adjuvant', 500, 100, 'L', 2000),
  ('Eau', 10000, 2000, 'L', 50000);

-- Function to update stock on consumption
CREATE OR REPLACE FUNCTION public.deduct_stock_on_production()
RETURNS TRIGGER AS $$
DECLARE
  v_formule RECORD;
  v_ciment_kg NUMERIC;
  v_adjuvant_l NUMERIC;
  v_eau_l NUMERIC;
  v_sable_m3 NUMERIC;
  v_gravette_m3 NUMERIC;
  v_stock RECORD;
BEGIN
  -- Only deduct when transitioning to validation_technique from production
  IF NEW.workflow_status = 'validation_technique' AND OLD.workflow_status = 'production' THEN
    
    -- Get formule for sable/gravette theoretical values
    SELECT * INTO v_formule FROM formules_theoriques WHERE formule_id = NEW.formule_id;
    
    -- Use real consumption values
    v_ciment_kg := NEW.ciment_reel_kg;
    v_adjuvant_l := COALESCE(NEW.adjuvant_reel_l, 0);
    v_eau_l := COALESCE(NEW.eau_reel_l, v_formule.eau_l_m3 * NEW.volume_m3);
    v_sable_m3 := COALESCE(v_formule.sable_m3, 0) * NEW.volume_m3;
    v_gravette_m3 := COALESCE(v_formule.gravette_m3, 0) * NEW.volume_m3;
    
    -- Deduct Ciment
    SELECT * INTO v_stock FROM stocks WHERE materiau = 'Ciment';
    UPDATE stocks SET 
      quantite_actuelle = GREATEST(0, quantite_actuelle - v_ciment_kg),
      updated_at = now()
    WHERE materiau = 'Ciment';
    
    INSERT INTO mouvements_stock (materiau, type_mouvement, quantite, quantite_avant, quantite_apres, reference_id, reference_table, created_by)
    VALUES ('Ciment', 'consommation', v_ciment_kg, v_stock.quantite_actuelle, GREATEST(0, v_stock.quantite_actuelle - v_ciment_kg), NEW.bl_id, 'bons_livraison_reels', auth.uid());
    
    -- Deduct Adjuvant
    IF v_adjuvant_l > 0 THEN
      SELECT * INTO v_stock FROM stocks WHERE materiau = 'Adjuvant';
      UPDATE stocks SET 
        quantite_actuelle = GREATEST(0, quantite_actuelle - v_adjuvant_l),
        updated_at = now()
      WHERE materiau = 'Adjuvant';
      
      INSERT INTO mouvements_stock (materiau, type_mouvement, quantite, quantite_avant, quantite_apres, reference_id, reference_table, created_by)
      VALUES ('Adjuvant', 'consommation', v_adjuvant_l, v_stock.quantite_actuelle, GREATEST(0, v_stock.quantite_actuelle - v_adjuvant_l), NEW.bl_id, 'bons_livraison_reels', auth.uid());
    END IF;
    
    -- Deduct Eau
    IF v_eau_l > 0 THEN
      SELECT * INTO v_stock FROM stocks WHERE materiau = 'Eau';
      UPDATE stocks SET 
        quantite_actuelle = GREATEST(0, quantite_actuelle - v_eau_l),
        updated_at = now()
      WHERE materiau = 'Eau';
      
      INSERT INTO mouvements_stock (materiau, type_mouvement, quantite, quantite_avant, quantite_apres, reference_id, reference_table, created_by)
      VALUES ('Eau', 'consommation', v_eau_l, v_stock.quantite_actuelle, GREATEST(0, v_stock.quantite_actuelle - v_eau_l), NEW.bl_id, 'bons_livraison_reels', auth.uid());
    END IF;
    
    -- Deduct Sable
    IF v_sable_m3 > 0 THEN
      SELECT * INTO v_stock FROM stocks WHERE materiau = 'Sable';
      UPDATE stocks SET 
        quantite_actuelle = GREATEST(0, quantite_actuelle - v_sable_m3),
        updated_at = now()
      WHERE materiau = 'Sable';
      
      INSERT INTO mouvements_stock (materiau, type_mouvement, quantite, quantite_avant, quantite_apres, reference_id, reference_table, created_by)
      VALUES ('Sable', 'consommation', v_sable_m3, v_stock.quantite_actuelle, GREATEST(0, v_stock.quantite_actuelle - v_sable_m3), NEW.bl_id, 'bons_livraison_reels', auth.uid());
    END IF;
    
    -- Deduct Gravette
    IF v_gravette_m3 > 0 THEN
      SELECT * INTO v_stock FROM stocks WHERE materiau = 'Gravette';
      UPDATE stocks SET 
        quantite_actuelle = GREATEST(0, quantite_actuelle - v_gravette_m3),
        updated_at = now()
      WHERE materiau = 'Gravette';
      
      INSERT INTO mouvements_stock (materiau, type_mouvement, quantite, quantite_avant, quantite_apres, reference_id, reference_table, created_by)
      VALUES ('Gravette', 'consommation', v_gravette_m3, v_stock.quantite_actuelle, GREATEST(0, v_stock.quantite_actuelle - v_gravette_m3), NEW.bl_id, 'bons_livraison_reels', auth.uid());
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic stock deduction
CREATE TRIGGER trigger_deduct_stock_on_production
  AFTER UPDATE ON public.bons_livraison_reels
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_stock_on_production();

-- Add indexes
CREATE INDEX idx_stocks_materiau ON public.stocks(materiau);
CREATE INDEX idx_mouvements_stock_materiau ON public.mouvements_stock(materiau);
CREATE INDEX idx_mouvements_stock_created_at ON public.mouvements_stock(created_at DESC);