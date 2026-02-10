
-- Add GPS configuration columns to flotte
ALTER TABLE public.flotte
  ADD COLUMN IF NOT EXISTS gps_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gps_device_id text,
  ADD COLUMN IF NOT EXISTS gps_imei text,
  ADD COLUMN IF NOT EXISTS gps_provider text DEFAULT 'mobile';

-- Add source column to gps_positions
ALTER TABLE public.gps_positions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'gps_device';

-- Add index on gps_device_id for fast lookups from ingest endpoint
CREATE INDEX IF NOT EXISTS idx_flotte_gps_device_id ON public.flotte(gps_device_id) WHERE gps_device_id IS NOT NULL;

-- Add index on gps_imei
CREATE INDEX IF NOT EXISTS idx_flotte_gps_imei ON public.flotte(gps_imei) WHERE gps_imei IS NOT NULL;
