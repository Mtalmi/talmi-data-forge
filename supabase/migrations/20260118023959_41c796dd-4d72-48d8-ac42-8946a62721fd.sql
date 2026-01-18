-- Drop existing constraint and recreate with correct values
ALTER TABLE prix_achat_actuels DROP CONSTRAINT IF EXISTS prix_achat_actuels_unite_mesure_check;

ALTER TABLE prix_achat_actuels ADD CONSTRAINT prix_achat_actuels_unite_mesure_check 
  CHECK (unite_mesure IN ('Tonne', 'Litre', 'm³', 'kg'));

-- Add cut_dh_m3 column to formules_theoriques for calculated theoretical cost
ALTER TABLE formules_theoriques ADD COLUMN IF NOT EXISTS cut_dh_m3 numeric DEFAULT 0;

-- Add gravette_m3 for volume-based calculation
ALTER TABLE formules_theoriques ADD COLUMN IF NOT EXISTS gravette_m3 numeric DEFAULT 0;

-- Add sable_m3 for volume-based calculation  
ALTER TABLE formules_theoriques ADD COLUMN IF NOT EXISTS sable_m3 numeric DEFAULT 0;

-- Create database function to calculate CUT (Coût Unitaire Théorique)
CREATE OR REPLACE FUNCTION public.calculate_cut(
  p_ciment_kg numeric,
  p_sable_m3 numeric,
  p_gravette_m3 numeric,
  p_eau_l numeric,
  p_adjuvant_l numeric
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prix_ciment numeric := 0;
  v_prix_sable numeric := 0;
  v_prix_gravette numeric := 0;
  v_prix_eau numeric := 0;
  v_prix_adjuvant numeric := 0;
  v_cut numeric := 0;
BEGIN
  -- Get current prices
  SELECT COALESCE(prix_unitaire_dh, 0) INTO v_prix_ciment 
  FROM prix_achat_actuels WHERE LOWER(matiere_premiere) LIKE '%ciment%' LIMIT 1;
  
  SELECT COALESCE(prix_unitaire_dh, 0) INTO v_prix_sable 
  FROM prix_achat_actuels WHERE LOWER(matiere_premiere) LIKE '%sable%' LIMIT 1;
  
  SELECT COALESCE(prix_unitaire_dh, 0) INTO v_prix_gravette 
  FROM prix_achat_actuels WHERE LOWER(matiere_premiere) LIKE '%gravette%' OR LOWER(matiere_premiere) LIKE '%gravier%' LIMIT 1;
  
  SELECT COALESCE(prix_unitaire_dh, 0) INTO v_prix_eau 
  FROM prix_achat_actuels WHERE LOWER(matiere_premiere) LIKE '%eau%' LIMIT 1;
  
  SELECT COALESCE(prix_unitaire_dh, 0) INTO v_prix_adjuvant 
  FROM prix_achat_actuels WHERE LOWER(matiere_premiere) LIKE '%adjuvant%' LIMIT 1;
  
  -- Calculate CUT (Coût Unitaire Théorique)
  -- Ciment: price per tonne, convert kg to tonnes
  v_cut := (p_ciment_kg / 1000.0) * v_prix_ciment;
  -- Sable: price per m³
  v_cut := v_cut + (p_sable_m3 * v_prix_sable);
  -- Gravette: price per m³
  v_cut := v_cut + (p_gravette_m3 * v_prix_gravette);
  -- Eau: price per m³, convert liters to m³
  v_cut := v_cut + (p_eau_l / 1000.0) * v_prix_eau;
  -- Adjuvant: price per liter
  v_cut := v_cut + (p_adjuvant_l * v_prix_adjuvant);
  
  RETURN ROUND(v_cut, 2);
END;
$$;

-- Create function to calculate smart quote price
CREATE OR REPLACE FUNCTION public.calculate_quote_price(
  p_formule_id text,
  p_volume_m3 numeric,
  p_distance_km numeric DEFAULT 20
)
RETURNS TABLE(
  cut_per_m3 numeric,
  fixed_cost_per_m3 numeric,
  transport_extra_per_m3 numeric,
  total_cost_per_m3 numeric,
  margin_pct numeric,
  prix_vente_minimum numeric,
  total_quote numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_formule RECORD;
  v_cut numeric;
  v_fixed_cost numeric := 150; -- Fixed overhead per m³
  v_transport_extra numeric := 0;
  v_margin numeric := 0.25; -- 25% margin
  v_total_cost numeric;
  v_pvm numeric;
BEGIN
  -- Get formula details
  SELECT * INTO v_formule FROM formules_theoriques WHERE formule_id = p_formule_id;
  
  IF v_formule IS NULL THEN
    RAISE EXCEPTION 'Formule not found: %', p_formule_id;
  END IF;
  
  -- Calculate CUT
  v_cut := calculate_cut(
    v_formule.ciment_kg_m3,
    COALESCE(v_formule.sable_m3, v_formule.sable_kg_m3 / 1600.0), -- Convert kg to m³ if needed (density ~1600 kg/m³)
    COALESCE(v_formule.gravette_m3, v_formule.gravier_kg_m3 / 1500.0), -- Convert kg to m³ if needed (density ~1500 kg/m³)
    v_formule.eau_l_m3,
    v_formule.adjuvant_l_m3
  );
  
  -- Calculate extra transport cost beyond 20km (5 DH/m³/km)
  IF p_distance_km > 20 THEN
    v_transport_extra := (p_distance_km - 20) * 5;
  END IF;
  
  -- Total cost per m³
  v_total_cost := v_cut + v_fixed_cost + v_transport_extra;
  
  -- Prix de Vente Minimum with 25% margin
  v_pvm := v_total_cost / (1 - v_margin);
  
  RETURN QUERY SELECT 
    v_cut,
    v_fixed_cost,
    v_transport_extra,
    v_total_cost,
    v_margin * 100,
    ROUND(v_pvm, 2),
    ROUND(v_pvm * p_volume_m3, 2);
END;
$$;