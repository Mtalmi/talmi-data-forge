-- Add photo_pupitre_url column for control panel photos
ALTER TABLE public.bons_livraison_reels 
ADD COLUMN IF NOT EXISTS photo_pupitre_url TEXT,
ADD COLUMN IF NOT EXISTS sable_reel_kg NUMERIC,
ADD COLUMN IF NOT EXISTS gravette_reel_kg NUMERIC,
ADD COLUMN IF NOT EXISTS production_batch_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS variance_ciment_pct NUMERIC,
ADD COLUMN IF NOT EXISTS variance_sable_pct NUMERIC,
ADD COLUMN IF NOT EXISTS variance_gravette_pct NUMERIC,
ADD COLUMN IF NOT EXISTS variance_eau_pct NUMERIC,
ADD COLUMN IF NOT EXISTS variance_adjuvant_pct NUMERIC,
ADD COLUMN IF NOT EXISTS quality_status TEXT DEFAULT 'pending' CHECK (quality_status IN ('pending', 'ok', 'warning', 'critical'));

-- Create a dedicated production_batches table for detailed batch tracking
CREATE TABLE IF NOT EXISTS public.production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bl_id TEXT NOT NULL REFERENCES bons_livraison_reels(bl_id) ON DELETE CASCADE,
  batch_number INTEGER NOT NULL DEFAULT 1,
  
  -- Theoretical values (from formule)
  ciment_theo_kg NUMERIC NOT NULL,
  sable_theo_kg NUMERIC,
  gravette_theo_kg NUMERIC,
  eau_theo_l NUMERIC NOT NULL,
  adjuvant_theo_l NUMERIC,
  
  -- Actual values entered by Centraliste
  ciment_reel_kg NUMERIC NOT NULL,
  sable_reel_kg NUMERIC,
  gravette_reel_kg NUMERIC,
  eau_reel_l NUMERIC NOT NULL,
  adjuvant_reel_l NUMERIC,
  
  -- Variance percentages (calculated)
  variance_ciment_pct NUMERIC,
  variance_sable_pct NUMERIC,
  variance_gravette_pct NUMERIC,
  variance_eau_pct NUMERIC,
  variance_adjuvant_pct NUMERIC,
  
  -- Quality status
  quality_status TEXT NOT NULL DEFAULT 'pending' CHECK (quality_status IN ('pending', 'ok', 'warning', 'critical')),
  has_critical_variance BOOLEAN DEFAULT FALSE,
  
  -- Photo proof (mandatory)
  photo_pupitre_url TEXT NOT NULL,
  
  -- Metadata
  entered_by UUID REFERENCES auth.users(id),
  entered_by_name TEXT,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for production_batches
CREATE POLICY "CEO can do everything on production_batches"
  ON public.production_batches FOR ALL
  USING (public.is_ceo(auth.uid()));

CREATE POLICY "Centraliste can insert production batches"
  ON public.production_batches FOR INSERT
  WITH CHECK (public.is_centraliste(auth.uid()) OR public.is_ceo(auth.uid()));

CREATE POLICY "Centraliste can view production batches"
  ON public.production_batches FOR SELECT
  USING (public.is_centraliste(auth.uid()) OR public.is_responsable_technique(auth.uid()) OR public.is_directeur_operations(auth.uid()) OR public.is_ceo(auth.uid()));

CREATE POLICY "Resp Technique can view production batches"
  ON public.production_batches FOR SELECT
  USING (public.is_responsable_technique(auth.uid()));

-- Trigger to calculate variances automatically
CREATE OR REPLACE FUNCTION public.calculate_batch_variances()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate variance percentages (2% threshold for warning, 5% for critical)
  IF NEW.ciment_theo_kg > 0 THEN
    NEW.variance_ciment_pct := ABS((NEW.ciment_reel_kg - NEW.ciment_theo_kg) / NEW.ciment_theo_kg) * 100;
  END IF;
  
  IF NEW.sable_theo_kg > 0 AND NEW.sable_theo_kg IS NOT NULL THEN
    NEW.variance_sable_pct := ABS((COALESCE(NEW.sable_reel_kg, 0) - NEW.sable_theo_kg) / NEW.sable_theo_kg) * 100;
  END IF;
  
  IF NEW.gravette_theo_kg > 0 AND NEW.gravette_theo_kg IS NOT NULL THEN
    NEW.variance_gravette_pct := ABS((COALESCE(NEW.gravette_reel_kg, 0) - NEW.gravette_theo_kg) / NEW.gravette_theo_kg) * 100;
  END IF;
  
  IF NEW.eau_theo_l > 0 THEN
    NEW.variance_eau_pct := ABS((NEW.eau_reel_l - NEW.eau_theo_l) / NEW.eau_theo_l) * 100;
  END IF;
  
  IF NEW.adjuvant_theo_l > 0 AND NEW.adjuvant_theo_l IS NOT NULL THEN
    NEW.variance_adjuvant_pct := ABS((COALESCE(NEW.adjuvant_reel_l, 0) - NEW.adjuvant_theo_l) / NEW.adjuvant_theo_l) * 100;
  END IF;
  
  -- Determine quality status based on variances
  IF COALESCE(NEW.variance_ciment_pct, 0) > 5 
     OR COALESCE(NEW.variance_eau_pct, 0) > 5 
     OR COALESCE(NEW.variance_sable_pct, 0) > 5 
     OR COALESCE(NEW.variance_gravette_pct, 0) > 5 
     OR COALESCE(NEW.variance_adjuvant_pct, 0) > 5 THEN
    NEW.quality_status := 'critical';
    NEW.has_critical_variance := TRUE;
  ELSIF COALESCE(NEW.variance_ciment_pct, 0) > 2 
        OR COALESCE(NEW.variance_eau_pct, 0) > 2 
        OR COALESCE(NEW.variance_sable_pct, 0) > 2 
        OR COALESCE(NEW.variance_gravette_pct, 0) > 2 
        OR COALESCE(NEW.variance_adjuvant_pct, 0) > 2 THEN
    NEW.quality_status := 'warning';
    NEW.has_critical_variance := FALSE;
  ELSE
    NEW.quality_status := 'ok';
    NEW.has_critical_variance := FALSE;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER calculate_batch_variances_trigger
  BEFORE INSERT OR UPDATE ON public.production_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_batch_variances();

-- Create alert when critical variance is detected
CREATE OR REPLACE FUNCTION public.alert_on_critical_batch()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.has_critical_variance = TRUE AND (OLD IS NULL OR OLD.has_critical_variance = FALSE) THEN
    INSERT INTO public.alertes_systeme (
      type_alerte,
      niveau,
      titre,
      message,
      reference_id,
      reference_table,
      destinataire_role
    ) VALUES (
      'ecart_production',
      'critical',
      '🚨 Écart Critique Détecté sur Batch',
      'BL ' || NEW.bl_id || ' - Batch #' || NEW.batch_number || ': Variance > 5% détectée. Ciment: ' || 
      COALESCE(ROUND(NEW.variance_ciment_pct::numeric, 1)::TEXT, '—') || '%, Eau: ' || 
      COALESCE(ROUND(NEW.variance_eau_pct::numeric, 1)::TEXT, '—') || '%',
      NEW.id::TEXT,
      'production_batches',
      'ceo'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER alert_on_critical_batch_trigger
  AFTER INSERT OR UPDATE ON public.production_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.alert_on_critical_batch();

-- Enable realtime for live feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_batches;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_production_batches_bl_id ON public.production_batches(bl_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_entered_at ON public.production_batches(entered_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_batches_quality_status ON public.production_batches(quality_status);

-- Storage policy for plant-photos bucket (Centraliste upload)
CREATE POLICY "Centraliste can upload plant photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'plant-photos' 
    AND (public.is_centraliste(auth.uid()) OR public.is_ceo(auth.uid()))
  );

CREATE POLICY "Anyone authenticated can view plant photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plant-photos' AND auth.role() = 'authenticated');