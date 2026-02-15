
-- Add stock_leakage_check to alertes_systeme constraint
ALTER TABLE public.alertes_systeme DROP CONSTRAINT alertes_systeme_type_alerte_check;
ALTER TABLE public.alertes_systeme ADD CONSTRAINT alertes_systeme_type_alerte_check CHECK (
  type_alerte = ANY (ARRAY[
    'fuite','marge','credit','planification','retard','technique',
    'stock_critique','qualite_critique','retard_paiement','client_bloque',
    'mise_en_demeure','rappel_paiement','rappels_automatiques','ecart_production',
    'devis_rollback','approbation_requise','stock_reorder','stock_leakage_check'
  ])
);
