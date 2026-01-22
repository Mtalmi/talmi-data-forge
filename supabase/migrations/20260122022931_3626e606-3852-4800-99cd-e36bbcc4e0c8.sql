-- Add debrief_valide column to track completed debriefs
ALTER TABLE public.bons_livraison_reels 
ADD COLUMN IF NOT EXISTS debrief_valide boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS temps_attente_reel_minutes numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS km_final numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS litres_ajoutes numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS consommation_calculee numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS debrief_at timestamp with time zone DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.bons_livraison_reels.debrief_valide IS 'True when dispatcher has validated end-of-rotation debrief with KM/fuel data';
COMMENT ON COLUMN public.bons_livraison_reels.temps_attente_reel_minutes IS 'Manually entered waiting time if different from calculated';
COMMENT ON COLUMN public.bons_livraison_reels.km_final IS 'Final odometer reading at return';
COMMENT ON COLUMN public.bons_livraison_reels.litres_ajoutes IS 'Liters of fuel added during this rotation';
COMMENT ON COLUMN public.bons_livraison_reels.consommation_calculee IS 'Calculated L/100km for this specific rotation';