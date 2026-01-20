-- Remove 'traite' from payment mode constraints

-- Update paiements_fournisseur constraint
ALTER TABLE public.paiements_fournisseur 
DROP CONSTRAINT IF EXISTS paiements_fournisseur_mode_paiement_check;

ALTER TABLE public.paiements_fournisseur 
ADD CONSTRAINT paiements_fournisseur_mode_paiement_check 
CHECK (mode_paiement IN ('virement', 'cheque', 'especes'));

-- Update any existing 'traite' records to 'cheque' (similar payment type)
UPDATE public.paiements_fournisseur 
SET mode_paiement = 'cheque' 
WHERE mode_paiement = 'traite';

-- Update bons_livraison_reels if any traite records exist
UPDATE public.bons_livraison_reels 
SET mode_paiement = 'cheque' 
WHERE mode_paiement = 'traite';

-- Update bons_commande if any traite records exist
UPDATE public.bons_commande 
SET mode_paiement = 'cheque' 
WHERE mode_paiement = 'traite';