ALTER TABLE formules_theoriques ADD COLUMN classe text, ADD COLUMN slump_cible integer;

UPDATE formules_theoriques SET classe = 'C25/30', slump_cible = 180 WHERE formule_id = 'F-B25';
UPDATE formules_theoriques SET classe = 'C30/37', slump_cible = 160 WHERE formule_id = 'F-B30';
UPDATE formules_theoriques SET classe = 'C20/25', slump_cible = 200 WHERE formule_id = 'F-B20';