ALTER TABLE production_batches ALTER COLUMN photo_pupitre_url DROP NOT NULL;
ALTER TABLE production_batches ALTER COLUMN photo_pupitre_url SET DEFAULT NULL;