-- Create Tests Laboratoire table
CREATE TABLE public.tests_laboratoire (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bl_id TEXT NOT NULL REFERENCES public.bons_livraison_reels(bl_id),
  formule_id TEXT NOT NULL,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  date_test_7j DATE GENERATED ALWAYS AS (date_prelevement + INTERVAL '7 days') STORED,
  date_test_28j DATE GENERATED ALWAYS AS (date_prelevement + INTERVAL '28 days') STORED,
  affaissement_mm NUMERIC,
  affaissement_conforme BOOLEAN DEFAULT NULL,
  resistance_7j_mpa NUMERIC,
  resistance_28j_mpa NUMERIC,
  resistance_conforme BOOLEAN DEFAULT NULL,
  technicien_prelevement TEXT,
  technicien_test TEXT,
  notes TEXT,
  alerte_qualite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add affaissement columns to bons_livraison_reels
ALTER TABLE public.bons_livraison_reels 
ADD COLUMN affaissement_mm NUMERIC,
ADD COLUMN affaissement_conforme BOOLEAN DEFAULT NULL;

-- Add target slump tolerance to formules_theoriques
ALTER TABLE public.formules_theoriques
ADD COLUMN affaissement_cible_mm NUMERIC DEFAULT 150,
ADD COLUMN affaissement_tolerance_mm NUMERIC DEFAULT 20,
ADD COLUMN resistance_cible_28j_mpa NUMERIC DEFAULT 25;

-- Enable RLS
ALTER TABLE public.tests_laboratoire ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tests_laboratoire
CREATE POLICY "Operations roles can read tests"
ON public.tests_laboratoire FOR SELECT
USING (
  is_ceo(auth.uid()) OR 
  is_responsable_technique(auth.uid()) OR 
  is_centraliste(auth.uid()) OR
  is_directeur_operations(auth.uid()) OR
  is_superviseur(auth.uid())
);

CREATE POLICY "Technical roles can insert tests"
ON public.tests_laboratoire FOR INSERT
WITH CHECK (
  is_ceo(auth.uid()) OR 
  is_responsable_technique(auth.uid()) OR 
  is_centraliste(auth.uid())
);

CREATE POLICY "Technical roles can update tests"
ON public.tests_laboratoire FOR UPDATE
USING (
  is_ceo(auth.uid()) OR 
  is_responsable_technique(auth.uid())
)
WITH CHECK (
  is_ceo(auth.uid()) OR 
  is_responsable_technique(auth.uid())
);

-- Create trigger for updated_at
CREATE TRIGGER update_tests_laboratoire_updated_at
BEFORE UPDATE ON public.tests_laboratoire
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check quality and create alerts
CREATE OR REPLACE FUNCTION public.check_quality_alert()
RETURNS TRIGGER AS $$
DECLARE
  v_formule RECORD;
  v_bl RECORD;
BEGIN
  -- Get formula details
  SELECT * INTO v_formule FROM formules_theoriques WHERE formule_id = NEW.formule_id;
  SELECT * INTO v_bl FROM bons_livraison_reels WHERE bl_id = NEW.bl_id;
  
  -- Check resistance at 28 days
  IF NEW.resistance_28j_mpa IS NOT NULL AND v_formule.resistance_cible_28j_mpa IS NOT NULL THEN
    IF NEW.resistance_28j_mpa < v_formule.resistance_cible_28j_mpa THEN
      NEW.resistance_conforme := FALSE;
      NEW.alerte_qualite := TRUE;
      
      -- Create critical quality alert
      INSERT INTO alertes_systeme (
        type_alerte,
        niveau,
        titre,
        message,
        reference_id,
        reference_table,
        destinataire_role
      ) VALUES (
        'qualite_critique',
        'critical',
        'ALERTE QUALITÉ CRITIQUE - Résistance 28j insuffisante',
        'BL ' || NEW.bl_id || ' - Résistance 28j: ' || NEW.resistance_28j_mpa || ' MPa < Cible: ' || v_formule.resistance_cible_28j_mpa || ' MPa. Client: ' || v_bl.client_id,
        NEW.bl_id,
        'tests_laboratoire',
        'ceo'
      );
    ELSE
      NEW.resistance_conforme := TRUE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for quality alerts
CREATE TRIGGER check_quality_on_resistance
BEFORE INSERT OR UPDATE OF resistance_28j_mpa ON public.tests_laboratoire
FOR EACH ROW
EXECUTE FUNCTION public.check_quality_alert();

-- Update existing formulas with default values
UPDATE public.formules_theoriques SET 
  affaissement_cible_mm = 150,
  affaissement_tolerance_mm = 20,
  resistance_cible_28j_mpa = 25
WHERE affaissement_cible_mm IS NULL;

-- Create index for performance
CREATE INDEX idx_tests_lab_bl_id ON public.tests_laboratoire(bl_id);
CREATE INDEX idx_tests_lab_dates ON public.tests_laboratoire(date_test_7j, date_test_28j);