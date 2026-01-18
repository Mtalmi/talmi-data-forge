-- Create flotte table for truck/vehicle management
CREATE TABLE public.flotte (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_camion TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('Toupie', 'Pompe')),
  proprietaire TEXT NOT NULL DEFAULT 'Interne',
  is_interne BOOLEAN NOT NULL DEFAULT true,
  chauffeur TEXT,
  telephone_chauffeur TEXT,
  statut TEXT NOT NULL DEFAULT 'Disponible' CHECK (statut IN ('Disponible', 'En Livraison', 'Maintenance', 'Hors Service')),
  capacite_m3 NUMERIC DEFAULT 8,
  immatriculation TEXT,
  derniere_maintenance_at TIMESTAMP WITH TIME ZONE,
  prochaine_maintenance_at TIMESTAMP WITH TIME ZONE,
  km_compteur NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suivi_carburant table for fuel monitoring
CREATE TABLE public.suivi_carburant (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_camion TEXT NOT NULL,
  date_releve DATE NOT NULL DEFAULT CURRENT_DATE,
  litres NUMERIC NOT NULL CHECK (litres > 0),
  km_compteur NUMERIC NOT NULL,
  km_parcourus NUMERIC,
  consommation_l_100km NUMERIC,
  cout_total_dh NUMERIC,
  station TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create incidents_flotte table for tracking issues
CREATE TABLE public.incidents_flotte (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_camion TEXT NOT NULL,
  type_incident TEXT NOT NULL CHECK (type_incident IN ('Panne', 'Accident', 'Retard', 'Autre')),
  description TEXT NOT NULL,
  date_incident TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolu BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  resolu_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add rotation tracking columns to bons_livraison_reels
ALTER TABLE public.bons_livraison_reels
ADD COLUMN IF NOT EXISTS heure_depart_centrale TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS heure_arrivee_chantier TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS heure_retour_centrale TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS temps_rotation_minutes NUMERIC,
ADD COLUMN IF NOT EXISTS temps_attente_chantier_minutes NUMERIC,
ADD COLUMN IF NOT EXISTS facturer_attente BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS chauffeur_nom TEXT;

-- Enable RLS
ALTER TABLE public.flotte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suivi_carburant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents_flotte ENABLE ROW LEVEL SECURITY;

-- RLS policies for flotte
CREATE POLICY "Operations roles can read flotte" ON public.flotte
  FOR SELECT USING (
    is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR 
    is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid())
  );

CREATE POLICY "Director and CEO can manage flotte" ON public.flotte
  FOR ALL USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()))
  WITH CHECK (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()));

-- RLS policies for suivi_carburant
CREATE POLICY "Operations can read fuel" ON public.suivi_carburant
  FOR SELECT USING (
    is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR 
    is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid())
  );

CREATE POLICY "Supervisor and Director can insert fuel" ON public.suivi_carburant
  FOR INSERT WITH CHECK (
    is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid())
  );

-- RLS policies for incidents_flotte
CREATE POLICY "Operations can read incidents" ON public.incidents_flotte
  FOR SELECT USING (
    is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR 
    is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid())
  );

CREATE POLICY "Operations can manage incidents" ON public.incidents_flotte
  FOR ALL USING (
    is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid())
  )
  WITH CHECK (
    is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid())
  );

-- Insert sample fleet data
INSERT INTO public.flotte (id_camion, type, proprietaire, is_interne, chauffeur, statut, capacite_m3, immatriculation) VALUES
  ('T-001', 'Toupie', 'Interne', true, 'Ahmed Benali', 'Disponible', 8, '12345-A-1'),
  ('T-002', 'Toupie', 'Interne', true, 'Mohammed Alami', 'Disponible', 8, '12346-A-1'),
  ('T-003', 'Toupie', 'TransBeton SARL', false, 'Karim Idrissi', 'Disponible', 10, '23456-B-2'),
  ('T-004', 'Toupie', 'TransBeton SARL', false, 'Hassan Tazi', 'En Livraison', 10, '23457-B-2'),
  ('P-001', 'Pompe', 'Interne', true, 'Youssef Mansouri', 'Disponible', 0, '34567-C-3'),
  ('P-002', 'Pompe', 'PompePlus', false, 'Omar Fassi', 'Maintenance', 0, '45678-D-4');

-- Create function to calculate rotation times
CREATE OR REPLACE FUNCTION public.calculate_rotation_times()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate rotation time (departure to return)
  IF NEW.heure_depart_centrale IS NOT NULL AND NEW.heure_retour_centrale IS NOT NULL THEN
    NEW.temps_rotation_minutes := EXTRACT(EPOCH FROM (NEW.heure_retour_centrale - NEW.heure_depart_centrale)) / 60;
  END IF;
  
  -- Calculate waiting time at site (arrival to departure from site, estimated as return - arrival - 30 min travel)
  -- Simplified: if we have arrival and return, waiting = (return - arrival) - estimated_travel_back
  IF NEW.heure_arrivee_chantier IS NOT NULL AND NEW.heure_retour_centrale IS NOT NULL THEN
    -- Estimate: time at site = return - arrival, minus estimated 20 min pour déchargement
    NEW.temps_attente_chantier_minutes := GREATEST(0, 
      (EXTRACT(EPOCH FROM (NEW.heure_retour_centrale - NEW.heure_arrivee_chantier)) / 60) - 
      (EXTRACT(EPOCH FROM (NEW.heure_arrivee_chantier - NEW.heure_depart_centrale)) / 60) - 20
    );
    
    -- Flag for billing if waiting > 30 minutes
    IF NEW.temps_attente_chantier_minutes > 30 THEN
      NEW.facturer_attente := true;
    ELSE
      NEW.facturer_attente := false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for rotation calculation
CREATE TRIGGER trigger_calculate_rotation_times
  BEFORE UPDATE ON public.bons_livraison_reels
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_rotation_times();

-- Create function to update truck status
CREATE OR REPLACE FUNCTION public.update_truck_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When BL starts delivery, set truck to "En Livraison"
  IF NEW.heure_depart_centrale IS NOT NULL AND OLD.heure_depart_centrale IS NULL AND NEW.toupie_assignee IS NOT NULL THEN
    UPDATE flotte SET statut = 'En Livraison', updated_at = now() WHERE id_camion = NEW.toupie_assignee;
  END IF;
  
  -- When BL returns, set truck to "Disponible"
  IF NEW.heure_retour_centrale IS NOT NULL AND OLD.heure_retour_centrale IS NULL AND NEW.toupie_assignee IS NOT NULL THEN
    UPDATE flotte SET statut = 'Disponible', updated_at = now() WHERE id_camion = NEW.toupie_assignee;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for truck status
CREATE TRIGGER trigger_update_truck_status
  AFTER UPDATE ON public.bons_livraison_reels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_truck_status();

-- Add indexes
CREATE INDEX idx_flotte_statut ON public.flotte(statut);
CREATE INDEX idx_flotte_proprietaire ON public.flotte(proprietaire);
CREATE INDEX idx_suivi_carburant_camion ON public.suivi_carburant(id_camion);
CREATE INDEX idx_incidents_flotte_camion ON public.incidents_flotte(id_camion);