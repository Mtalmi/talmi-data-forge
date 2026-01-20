-- Add missing alert types used by edge functions
ALTER TABLE alertes_systeme DROP CONSTRAINT IF EXISTS alertes_systeme_type_alerte_check;

ALTER TABLE alertes_systeme ADD CONSTRAINT alertes_systeme_type_alerte_check 
CHECK (type_alerte = ANY (ARRAY[
  'fuite'::text,
  'marge'::text, 
  'credit'::text, 
  'planification'::text, 
  'retard'::text, 
  'technique'::text, 
  'stock_critique'::text,
  'qualite_critique'::text,
  'retard_paiement'::text,
  'client_bloque'::text,
  'mise_en_demeure'::text,
  'rappel_paiement'::text,
  'rappels_automatiques'::text,
  'ecart_production'::text
]));