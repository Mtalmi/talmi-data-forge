ALTER TABLE production_batches DROP CONSTRAINT IF EXISTS production_batches_bl_id_fkey;
ALTER TABLE production_batches ALTER COLUMN bl_id DROP NOT NULL;
ALTER TABLE production_batches ALTER COLUMN bl_id SET DEFAULT NULL;