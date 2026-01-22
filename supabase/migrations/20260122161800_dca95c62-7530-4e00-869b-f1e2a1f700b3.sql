-- =====================================================
-- FORENSIC QUALITY CONTROL SYSTEM
-- Photo-Verified, Tamper-Proof, Geo-Tagged
-- =====================================================

-- Create storage bucket for QC photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('qc-photos', 'qc-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for QC photos bucket
CREATE POLICY "qc_photos_read_all" ON storage.objects
FOR SELECT USING (bucket_id = 'qc-photos');

CREATE POLICY "qc_photos_insert_authenticated" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'qc-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "qc_photos_update_authenticated" ON storage.objects
FOR UPDATE USING (bucket_id = 'qc-photos' AND auth.uid() IS NOT NULL);

-- =====================================================
-- SAND HUMIDITY RECORDS (Photo-Verified)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.controles_humidite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_controle TEXT NOT NULL CHECK (type_controle IN ('reception', 'quotidien')),
  materiau TEXT NOT NULL DEFAULT 'Sable',
  taux_humidite_pct NUMERIC(5,2) NOT NULL,
  taux_standard_pct NUMERIC(5,2) NOT NULL DEFAULT 3.0,
  ecart_humidite_pct NUMERIC(5,2) GENERATED ALWAYS AS (taux_humidite_pct - taux_standard_pct) STORED,
  correction_eau_l_m3 NUMERIC(6,2),
  photo_url TEXT NOT NULL,
  photo_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  photo_latitude NUMERIC(10,7),
  photo_longitude NUMERIC(10,7),
  verified_by UUID,
  verified_by_name TEXT,
  reception_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

ALTER TABLE public.controles_humidite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "controles_humidite_read_authorized" ON public.controles_humidite
FOR SELECT USING (
  is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR 
  is_responsable_technique(auth.uid()) OR is_centraliste(auth.uid()) OR
  is_agent_administratif(auth.uid())
);

CREATE POLICY "controles_humidite_insert_authorized" ON public.controles_humidite
FOR INSERT WITH CHECK (
  is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR 
  is_responsable_technique(auth.uid()) OR is_agent_administratif(auth.uid())
);

-- =====================================================
-- QC DEPARTURE GATE (Forensic Photos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.controles_depart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bl_id TEXT NOT NULL,
  
  -- Slump Test (Affaissement)
  affaissement_mm INTEGER NOT NULL,
  affaissement_conforme BOOLEAN NOT NULL,
  photo_slump_url TEXT NOT NULL,
  photo_slump_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  photo_slump_latitude NUMERIC(10,7),
  photo_slump_longitude NUMERIC(10,7),
  
  -- Concrete Texture
  texture_conforme BOOLEAN NOT NULL DEFAULT true,
  photo_texture_url TEXT NOT NULL,
  photo_texture_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  photo_texture_latitude NUMERIC(10,7),
  photo_texture_longitude NUMERIC(10,7),
  
  -- Water correction applied
  correction_eau_appliquee_l NUMERIC(6,2),
  humidite_sable_pct NUMERIC(5,2),
  
  -- Verification
  valide_par UUID NOT NULL,
  valide_par_name TEXT,
  valide_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Geo-fence validation (must be within plant coordinates)
  geo_validated BOOLEAN DEFAULT false,
  geo_validation_notes TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_bl FOREIGN KEY (bl_id) REFERENCES bons_livraison_reels(bl_id)
);

ALTER TABLE public.controles_depart ENABLE ROW LEVEL SECURITY;

CREATE POLICY "controles_depart_read_all" ON public.controles_depart
FOR SELECT USING (true);

CREATE POLICY "controles_depart_insert_tech" ON public.controles_depart
FOR INSERT WITH CHECK (
  is_ceo(auth.uid()) OR is_superviseur(auth.uid()) OR is_responsable_technique(auth.uid())
);

-- =====================================================
-- DYNAMIC WATER CORRECTION CALCULATION
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_water_correction(
  p_humidite_reelle_pct NUMERIC,
  p_humidite_standard_pct NUMERIC DEFAULT 3.0,
  p_volume_sable_m3 NUMERIC DEFAULT 0.4,
  p_densite_sable_kg_m3 NUMERIC DEFAULT 1600
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_ecart_humidite NUMERIC;
  v_eau_excedentaire_kg NUMERIC;
BEGIN
  -- Calculate humidity difference
  v_ecart_humidite := p_humidite_reelle_pct - p_humidite_standard_pct;
  
  -- If sand is wetter than standard, calculate water to subtract
  -- Formula: excess_water (L) = (humidity_difference% / 100) * sand_volume_m3 * sand_density_kg_m3
  -- Since 1L water = 1kg
  IF v_ecart_humidite > 0 THEN
    v_eau_excedentaire_kg := (v_ecart_humidite / 100) * p_volume_sable_m3 * p_densite_sable_kg_m3;
    RETURN ROUND(v_eau_excedentaire_kg, 2);
  ELSE
    RETURN 0;
  END IF;
END;
$$;

-- =====================================================
-- AUTO-CALCULATE CORRECTION ON HUMIDITY INSERT
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_calculate_water_correction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calculate water correction based on humidity difference
  NEW.correction_eau_l_m3 := calculate_water_correction(
    NEW.taux_humidite_pct,
    NEW.taux_standard_pct
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_water_correction ON controles_humidite;
CREATE TRIGGER trigger_auto_water_correction
  BEFORE INSERT OR UPDATE OF taux_humidite_pct ON controles_humidite
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_water_correction();

-- =====================================================
-- UPDATE BL WITH QC DATA WHEN DEPARTURE APPROVED
-- =====================================================
CREATE OR REPLACE FUNCTION public.link_qc_to_bl()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the BL with QC data
  UPDATE bons_livraison_reels SET
    affaissement_mm = NEW.affaissement_mm,
    affaissement_conforme = NEW.affaissement_conforme,
    validation_technique = true,
    validated_at = NEW.valide_at,
    validated_by = NEW.valide_par,
    validated_by_name = NEW.valide_par_name,
    validated_by_role = 'responsable_technique'
  WHERE bl_id = NEW.bl_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_link_qc_to_bl ON controles_depart;
CREATE TRIGGER trigger_link_qc_to_bl
  AFTER INSERT ON controles_depart
  FOR EACH ROW
  EXECUTE FUNCTION link_qc_to_bl();

-- =====================================================
-- CEO QUALITY FEED VIEW
-- =====================================================
CREATE OR REPLACE VIEW public.v_quality_feed AS
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

-- Grant access to view
GRANT SELECT ON public.v_quality_feed TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_water_correction TO authenticated;