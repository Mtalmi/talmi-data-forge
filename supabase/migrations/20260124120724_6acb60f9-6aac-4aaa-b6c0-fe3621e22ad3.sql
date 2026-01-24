-- Fix security definer views by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.client_tracking_view;
DROP VIEW IF EXISTS public.client_delivery_tracking_view;

-- Recreate views with proper security
CREATE VIEW public.client_tracking_view 
WITH (security_invoker = true) AS
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

CREATE VIEW public.client_delivery_tracking_view 
WITH (security_invoker = true) AS
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