-- Add source_donnees and machine_id columns to bons_livraison_reels
ALTER TABLE public.bons_livraison_reels 
ADD COLUMN IF NOT EXISTS source_donnees TEXT DEFAULT 'manual' CHECK (source_donnees IN ('manual', 'machine_sync')),
ADD COLUMN IF NOT EXISTS machine_id TEXT;

-- Add index for machine lookups
CREATE INDEX IF NOT EXISTS idx_bons_machine_id ON public.bons_livraison_reels(machine_id) WHERE machine_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.bons_livraison_reels.source_donnees IS 'Data source: manual entry or machine_sync from batching plant';
COMMENT ON COLUMN public.bons_livraison_reels.machine_id IS 'External machine/sensor ID for automated data sync';