-- Add planning fields to bons_livraison_reels table
ALTER TABLE public.bons_livraison_reels
ADD COLUMN IF NOT EXISTS heure_prevue TIME,
ADD COLUMN IF NOT EXISTS camion_assigne TEXT REFERENCES public.flotte(id_camion);

-- Add index for planning queries
CREATE INDEX IF NOT EXISTS idx_bons_livraison_date_heure_prevue 
ON public.bons_livraison_reels(date_livraison, heure_prevue);

-- Add index for workflow status queries
CREATE INDEX IF NOT EXISTS idx_bons_livraison_workflow_status 
ON public.bons_livraison_reels(workflow_status);

COMMENT ON COLUMN public.bons_livraison_reels.heure_prevue IS 'Heure prévue de départ pour la livraison';
COMMENT ON COLUMN public.bons_livraison_reels.camion_assigne IS 'ID du camion assigné à cette livraison';