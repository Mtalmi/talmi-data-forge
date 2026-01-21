
-- Add Moroccan business identification fields to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS rc TEXT,
ADD COLUMN IF NOT EXISTS ice TEXT,
ADD COLUMN IF NOT EXISTS identifiant_fiscal TEXT,
ADD COLUMN IF NOT EXISTS patente TEXT,
ADD COLUMN IF NOT EXISTS ville TEXT,
ADD COLUMN IF NOT EXISTS code_postal TEXT;

-- Add comments for clarity
COMMENT ON COLUMN public.clients.rc IS 'Registre de Commerce';
COMMENT ON COLUMN public.clients.ice IS 'Identifiant Commun de l''Entreprise (15 chiffres)';
COMMENT ON COLUMN public.clients.identifiant_fiscal IS 'Identifiant Fiscal (IF)';
COMMENT ON COLUMN public.clients.patente IS 'Numéro de Patente';
COMMENT ON COLUMN public.clients.ville IS 'Ville';
COMMENT ON COLUMN public.clients.code_postal IS 'Code Postal';

-- Create index on ICE for faster lookups (commonly used for verification)
CREATE INDEX IF NOT EXISTS idx_clients_ice ON public.clients(ice) WHERE ice IS NOT NULL;
