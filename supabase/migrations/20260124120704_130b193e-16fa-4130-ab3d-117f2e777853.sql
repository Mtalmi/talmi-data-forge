-- Add tracking fields to bons_commande
ALTER TABLE public.bons_commande
ADD COLUMN IF NOT EXISTS tracking_token UUID DEFAULT gen_random_uuid() UNIQUE,
ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS client_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_confirmed_by_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_signature_url TEXT;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_bons_commande_tracking_token ON public.bons_commande(tracking_token) WHERE tracking_enabled = true;

-- Add tracking fields to bons_livraison_reels for delivery-level tracking
ALTER TABLE public.bons_livraison_reels
ADD COLUMN IF NOT EXISTS client_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_confirmed_by_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_signature_url TEXT,
ADD COLUMN IF NOT EXISTS tracking_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Create index for BL tracking
CREATE INDEX IF NOT EXISTS idx_bons_livraison_tracking_token ON public.bons_livraison_reels(tracking_token);

-- Create a public view for client tracking (no sensitive data)
CREATE OR REPLACE VIEW public.client_tracking_view AS
SELECT 
  bc.tracking_token,
  bc.bc_id,
  bc.tracking_enabled,
  bc.statut as bc_statut,
  bc.volume_m3 as bc_volume,
  bc.date_livraison_souhaitee,
  bc.heure_livraison_souhaitee,
  bc.adresse_livraison,
  bc.client_confirmed_at as bc_confirmed_at,
  bc.client_confirmed_by_name as bc_confirmed_by,
  c.nom_client,
  f.designation as formule_designation,
  z.nom_zone as zone_nom
FROM public.bons_commande bc
LEFT JOIN public.clients c ON bc.client_id = c.client_id
LEFT JOIN public.formules_theoriques f ON bc.formule_id = f.formule_id
LEFT JOIN public.zones_livraison z ON bc.zone_livraison_id = z.id
WHERE bc.tracking_enabled = true;

-- Create view for delivery tracking
CREATE OR REPLACE VIEW public.client_delivery_tracking_view AS
SELECT 
  bl.tracking_token,
  bl.bl_id,
  bl.bc_id,
  bl.workflow_status,
  bl.volume_m3,
  bl.date_livraison,
  bl.heure_prevue,
  bl.heure_depart_centrale,
  bl.heure_arrivee_chantier,
  bl.camion_assigne,
  bl.toupie_assignee,
  bl.chauffeur_nom,
  bl.affaissement_mm,
  bl.affaissement_conforme,
  bl.client_confirmed_at,
  bl.client_confirmed_by_name,
  f.chauffeur as truck_driver,
  f.telephone_chauffeur as driver_phone,
  z.nom_zone,
  cd.photo_slump_url,
  cd.photo_texture_url,
  cd.affaissement_conforme as quality_approved,
  cd.valide_par_name as quality_approved_by
FROM public.bons_livraison_reels bl
LEFT JOIN public.flotte f ON bl.camion_assigne = f.id_camion OR bl.toupie_assignee = f.id_camion
LEFT JOIN public.zones_livraison z ON bl.zone_livraison_id = z.id
LEFT JOIN public.controles_depart cd ON bl.bl_id = cd.bl_id;

-- Allow public (anon) read access to tracking views
CREATE POLICY "Public can view enabled tracking" 
ON public.bons_commande 
FOR SELECT 
USING (tracking_enabled = true);

-- Allow public updates for client confirmation (limited fields)
CREATE POLICY "Clients can confirm reception"
ON public.bons_livraison_reels
FOR UPDATE
USING (tracking_token IS NOT NULL)
WITH CHECK (
  client_confirmed_at IS NOT NULL AND 
  client_confirmed_by_name IS NOT NULL
);