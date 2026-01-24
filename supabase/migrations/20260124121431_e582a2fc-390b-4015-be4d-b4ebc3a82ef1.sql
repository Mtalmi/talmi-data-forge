-- Add maintenance tracking columns to flotte table
ALTER TABLE public.flotte
ADD COLUMN IF NOT EXISTS km_last_vidange NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS km_last_pneumatiques NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS date_last_visite_technique TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS date_next_visite_technique TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS maintenance_status TEXT DEFAULT 'healthy' CHECK (maintenance_status IN ('healthy', 'due_soon', 'overdue'));

-- Create fleet service records table
CREATE TABLE public.fleet_service_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_camion TEXT NOT NULL REFERENCES public.flotte(id_camion) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('vidange', 'visite_technique', 'pneumatiques', 'reparation', 'autre')),
  km_at_service NUMERIC NOT NULL,
  date_service DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  cout_pieces NUMERIC DEFAULT 0,
  cout_main_oeuvre NUMERIC DEFAULT 0,
  cout_total NUMERIC GENERATED ALWAYS AS (cout_pieces + cout_main_oeuvre) STORED,
  pieces_utilisees TEXT[],
  prestataire TEXT,
  photo_facture_url TEXT,
  photo_pieces_url TEXT,
  effectue_par UUID,
  effectue_par_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fleet_service_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for fleet_service_records
CREATE POLICY "Users can view all fleet service records"
ON public.fleet_service_records
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert service records"
ON public.fleet_service_records
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update service records"
ON public.fleet_service_records
FOR UPDATE
TO authenticated
USING (true);

-- Create function to update fleet maintenance status based on thresholds
CREATE OR REPLACE FUNCTION public.calculate_fleet_maintenance_status(
  p_km_compteur NUMERIC,
  p_km_last_vidange NUMERIC,
  p_km_last_pneumatiques NUMERIC,
  p_date_next_visite TIMESTAMP WITH TIME ZONE
) RETURNS TEXT AS $$
DECLARE
  km_since_vidange NUMERIC;
  km_since_pneus NUMERIC;
  vidange_threshold NUMERIC := 10000;
  pneus_threshold NUMERIC := 40000;
  warning_buffer NUMERIC := 500;
BEGIN
  km_since_vidange := COALESCE(p_km_compteur, 0) - COALESCE(p_km_last_vidange, 0);
  km_since_pneus := COALESCE(p_km_compteur, 0) - COALESCE(p_km_last_pneumatiques, 0);
  
  -- Check overdue conditions
  IF km_since_vidange >= vidange_threshold THEN
    RETURN 'overdue';
  END IF;
  
  IF km_since_pneus >= pneus_threshold THEN
    RETURN 'overdue';
  END IF;
  
  IF p_date_next_visite IS NOT NULL AND p_date_next_visite < NOW() THEN
    RETURN 'overdue';
  END IF;
  
  -- Check due soon conditions
  IF km_since_vidange >= (vidange_threshold - warning_buffer) THEN
    RETURN 'due_soon';
  END IF;
  
  IF km_since_pneus >= (pneus_threshold - warning_buffer) THEN
    RETURN 'due_soon';
  END IF;
  
  IF p_date_next_visite IS NOT NULL AND p_date_next_visite < (NOW() + INTERVAL '14 days') THEN
    RETURN 'due_soon';
  END IF;
  
  RETURN 'healthy';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-update maintenance status on flotte updates
CREATE OR REPLACE FUNCTION public.update_fleet_maintenance_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.maintenance_status := public.calculate_fleet_maintenance_status(
    NEW.km_compteur,
    NEW.km_last_vidange,
    NEW.km_last_pneumatiques,
    NEW.date_next_visite_technique
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_fleet_maintenance_status ON public.flotte;
CREATE TRIGGER trigger_update_fleet_maintenance_status
BEFORE INSERT OR UPDATE ON public.flotte
FOR EACH ROW
EXECUTE FUNCTION public.update_fleet_maintenance_status();

-- Create trigger to update flotte km from fuel entries
CREATE OR REPLACE FUNCTION public.sync_km_from_fuel()
RETURNS TRIGGER AS $$
BEGIN
  -- Update flotte km_compteur when fuel entry has higher km
  UPDATE public.flotte
  SET km_compteur = NEW.km_compteur
  WHERE id_camion = NEW.id_camion
    AND (km_compteur IS NULL OR km_compteur < NEW.km_compteur);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_km_from_fuel ON public.suivi_carburant;
CREATE TRIGGER trigger_sync_km_from_fuel
AFTER INSERT ON public.suivi_carburant
FOR EACH ROW
EXECUTE FUNCTION public.sync_km_from_fuel();

-- Create trigger to reset service counters when a service is recorded
CREATE OR REPLACE FUNCTION public.reset_service_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.service_type = 'vidange' THEN
    UPDATE public.flotte
    SET km_last_vidange = NEW.km_at_service,
        derniere_maintenance_at = NEW.date_service::timestamp with time zone
    WHERE id_camion = NEW.id_camion;
  
  ELSIF NEW.service_type = 'pneumatiques' THEN
    UPDATE public.flotte
    SET km_last_pneumatiques = NEW.km_at_service
    WHERE id_camion = NEW.id_camion;
  
  ELSIF NEW.service_type = 'visite_technique' THEN
    UPDATE public.flotte
    SET date_last_visite_technique = NEW.date_service::timestamp with time zone,
        date_next_visite_technique = (NEW.date_service + INTERVAL '6 months')::timestamp with time zone
    WHERE id_camion = NEW.id_camion;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reset_service_counter ON public.fleet_service_records;
CREATE TRIGGER trigger_reset_service_counter
AFTER INSERT ON public.fleet_service_records
FOR EACH ROW
EXECUTE FUNCTION public.reset_service_counter();

-- Enable realtime for fleet_service_records
ALTER PUBLICATION supabase_realtime ADD TABLE public.fleet_service_records;

-- Add index for performance
CREATE INDEX idx_fleet_service_records_camion ON public.fleet_service_records(id_camion);
CREATE INDEX idx_fleet_service_records_type ON public.fleet_service_records(service_type);
CREATE INDEX idx_fleet_service_records_date ON public.fleet_service_records(date_service DESC);

-- Comments for documentation
COMMENT ON TABLE public.fleet_service_records IS 'Tracks all maintenance services performed on fleet vehicles';
COMMENT ON COLUMN public.flotte.km_last_vidange IS 'Odometer reading at last oil change - service due every 10,000 km';
COMMENT ON COLUMN public.flotte.km_last_pneumatiques IS 'Odometer reading at last tire service - service due every 40,000 km';
COMMENT ON COLUMN public.flotte.date_next_visite_technique IS 'Next technical inspection due date - every 6 months';