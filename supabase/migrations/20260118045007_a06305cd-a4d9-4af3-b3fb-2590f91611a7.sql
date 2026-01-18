-- Add additional professional fields to bons_commande
ALTER TABLE public.bons_commande
ADD COLUMN IF NOT EXISTS contact_chantier TEXT,
ADD COLUMN IF NOT EXISTS telephone_chantier TEXT,
ADD COLUMN IF NOT EXISTS heure_livraison_souhaitee TIME,
ADD COLUMN IF NOT EXISTS reference_client TEXT,
ADD COLUMN IF NOT EXISTS conditions_acces TEXT,
ADD COLUMN IF NOT EXISTS pompe_requise BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS type_pompe TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.bons_commande.contact_chantier IS 'Nom du contact sur le chantier';
COMMENT ON COLUMN public.bons_commande.telephone_chantier IS 'Téléphone du contact chantier';
COMMENT ON COLUMN public.bons_commande.heure_livraison_souhaitee IS 'Heure de livraison souhaitée';
COMMENT ON COLUMN public.bons_commande.reference_client IS 'Référence interne du client (numéro de commande client)';
COMMENT ON COLUMN public.bons_commande.conditions_acces IS 'Conditions d accès au chantier';
COMMENT ON COLUMN public.bons_commande.pompe_requise IS 'Si une pompe est nécessaire';
COMMENT ON COLUMN public.bons_commande.type_pompe IS 'Type de pompe si requise';