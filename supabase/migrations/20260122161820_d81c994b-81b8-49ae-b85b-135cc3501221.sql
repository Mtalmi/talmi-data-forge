-- Fix Security Definer View issue and function search path
DROP VIEW IF EXISTS public.v_quality_feed;

-- Recreate view with SECURITY INVOKER (default, safe)
CREATE VIEW public.v_quality_feed
WITH (security_invoker = true)
AS
SELECT 
  'depart' as type,
  cd.id,
  cd.bl_id as reference_id,
  cd.affaissement_mm as valeur,
  cd.affaissement_conforme as conforme,
  cd.photo_slump_url as photo_url,
  cd.photo_slump_timestamp as photo_timestamp,
  cd.photo_slump_latitude as latitude,
  cd.photo_slump_longitude as longitude,
  cd.valide_par_name as operateur,
  cd.valide_at as created_at,
  'Contrôle Départ - Slump' as description,
  bl.camion_assigne as camion,
  c.nom_client as client
FROM controles_depart cd
JOIN bons_livraison_reels bl ON bl.bl_id = cd.bl_id
JOIN clients c ON c.client_id = bl.client_id

UNION ALL

SELECT 
  'humidite' as type,
  ch.id,
  ch.id::TEXT as reference_id,
  ch.taux_humidite_pct as valeur,
  (ch.taux_humidite_pct <= 8) as conforme,
  ch.photo_url as photo_url,
  ch.photo_timestamp as photo_timestamp,
  ch.photo_latitude as latitude,
  ch.photo_longitude as longitude,
  ch.verified_by_name as operateur,
  ch.created_at as created_at,
  'Contrôle Humidité - ' || ch.materiau as description,
  NULL as camion,
  NULL as client
FROM controles_humidite ch

ORDER BY created_at DESC;

-- Fix function search path for calculate_water_correction
CREATE OR REPLACE FUNCTION public.calculate_water_correction(
  p_humidite_reelle_pct NUMERIC,
  p_humidite_standard_pct NUMERIC DEFAULT 3.0,
  p_volume_sable_m3 NUMERIC DEFAULT 0.4,
  p_densite_sable_kg_m3 NUMERIC DEFAULT 1600
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_ecart_humidite NUMERIC;
  v_eau_excedentaire_kg NUMERIC;
BEGIN
  v_ecart_humidite := p_humidite_reelle_pct - p_humidite_standard_pct;
  
  IF v_ecart_humidite > 0 THEN
    v_eau_excedentaire_kg := (v_ecart_humidite / 100) * p_volume_sable_m3 * p_densite_sable_kg_m3;
    RETURN ROUND(v_eau_excedentaire_kg, 2);
  ELSE
    RETURN 0;
  END IF;
END;
$$;

GRANT SELECT ON public.v_quality_feed TO authenticated;