-- Create zones table for delivery pricing
CREATE TABLE public.zones_livraison (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_zone text NOT NULL UNIQUE,
  nom_zone text NOT NULL,
  description text,
  prix_livraison_m3 numeric NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default zones
INSERT INTO public.zones_livraison (code_zone, nom_zone, description, prix_livraison_m3) VALUES
  ('A', 'Zone A - Ain Aouda/Tamesna', 'Ain Aouda et Tamesna', 50),
  ('B', 'Zone B - Temara', 'Temara et environs', 75),
  ('C', 'Zone C - Rabat', 'Rabat centre et périphérie', 100),
  ('D', 'Zone D - Salé', 'Salé et environs', 120),
  ('E', 'Zone E - Hors Zone', 'Destinations hors zones définies', 150);

-- Create prestataires_transport table
CREATE TABLE public.prestataires_transport (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_prestataire text NOT NULL UNIQUE,
  nom_prestataire text NOT NULL,
  contact_nom text,
  contact_telephone text,
  tarif_base_m3 numeric NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  note_service integer CHECK (note_service >= 1 AND note_service <= 5),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert demo prestataires
INSERT INTO public.prestataires_transport (code_prestataire, nom_prestataire, contact_nom, contact_telephone, tarif_base_m3, note_service) VALUES
  ('PREST-001', 'Transport Maroc Express', 'Ahmed Benjelloun', '+212 6XX XXX XXX', 45, 4),
  ('PREST-002', 'Livraison Rapide SARL', 'Karim Alaoui', '+212 6XX XXX XXX', 50, 5),
  ('PREST-003', 'Atlas Transport', 'Youssef Tazi', '+212 6XX XXX XXX', 40, 3);

-- Add zone and payment mode to bons_commande
ALTER TABLE public.bons_commande 
  ADD COLUMN zone_livraison_id uuid REFERENCES public.zones_livraison(id),
  ADD COLUMN mode_paiement text DEFAULT 'virement',
  ADD COLUMN prix_livraison_m3 numeric DEFAULT 0,
  ADD COLUMN prestataire_id uuid REFERENCES public.prestataires_transport(id);

-- Add zone and payment mode to bons_livraison_reels
ALTER TABLE public.bons_livraison_reels
  ADD COLUMN zone_livraison_id uuid REFERENCES public.zones_livraison(id),
  ADD COLUMN mode_paiement text DEFAULT 'virement',
  ADD COLUMN prix_livraison_m3 numeric DEFAULT 0,
  ADD COLUMN prestataire_id uuid REFERENCES public.prestataires_transport(id);

-- Add payment mode to factures
ALTER TABLE public.factures
  ADD COLUMN mode_paiement text DEFAULT 'virement',
  ADD COLUMN prix_livraison_m3 numeric DEFAULT 0;

-- Add zone to devis
ALTER TABLE public.devis
  ADD COLUMN zone_livraison_id uuid REFERENCES public.zones_livraison(id),
  ADD COLUMN prix_livraison_m3 numeric DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.zones_livraison ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestataires_transport ENABLE ROW LEVEL SECURITY;

-- RLS policies for zones_livraison
CREATE POLICY "All authenticated can read zones"
  ON public.zones_livraison FOR SELECT
  USING (true);

CREATE POLICY "CEO can manage zones"
  ON public.zones_livraison FOR ALL
  USING (is_ceo(auth.uid()))
  WITH CHECK (is_ceo(auth.uid()));

-- RLS policies for prestataires_transport
CREATE POLICY "Operations roles can read prestataires"
  ON public.prestataires_transport FOR SELECT
  USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_agent_administratif(auth.uid()) OR is_commercial(auth.uid()));

CREATE POLICY "CEO and Director can manage prestataires"
  ON public.prestataires_transport FOR ALL
  USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()))
  WITH CHECK (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()));

-- Trigger for updated_at on zones
CREATE TRIGGER update_zones_livraison_updated_at
  BEFORE UPDATE ON public.zones_livraison
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on prestataires
CREATE TRIGGER update_prestataires_transport_updated_at
  BEFORE UPDATE ON public.prestataires_transport
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();