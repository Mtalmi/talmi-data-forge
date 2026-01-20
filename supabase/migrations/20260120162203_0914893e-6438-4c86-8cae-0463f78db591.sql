-- Drop and recreate the check constraint to include 'stock_critique'
ALTER TABLE alertes_systeme DROP CONSTRAINT IF EXISTS alertes_systeme_type_alerte_check;

ALTER TABLE alertes_systeme ADD CONSTRAINT alertes_systeme_type_alerte_check 
CHECK (type_alerte = ANY (ARRAY['fuite'::text, 'marge'::text, 'credit'::text, 'planification'::text, 'retard'::text, 'technique'::text, 'stock_critique'::text]));