ALTER TABLE formules_theoriques 
  ADD COLUMN IF NOT EXISTS resistance integer,
  ADD COLUMN IF NOT EXISTS prix_vente_min integer,
  ADD COLUMN IF NOT EXISTS marge_cible integer;

UPDATE formules_theoriques SET resistance = 25, prix_vente_min = 850, marge_cible = 37 WHERE formule_id = 'F-B25';
UPDATE formules_theoriques SET resistance = 30, prix_vente_min = 980, marge_cible = 38 WHERE formule_id = 'F-B30';
UPDATE formules_theoriques SET resistance = 20, prix_vente_min = 750, marge_cible = 39 WHERE formule_id = 'F-B20';