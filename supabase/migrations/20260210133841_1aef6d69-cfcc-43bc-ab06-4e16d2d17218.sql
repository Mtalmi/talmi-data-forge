
-- WS7 Batches table: stores raw batch data from WS7 central
CREATE TABLE public.ws7_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_number TEXT NOT NULL UNIQUE,
  batch_datetime TIMESTAMPTZ NOT NULL,
  client_name TEXT NOT NULL,
  formula TEXT NOT NULL,
  cement_kg NUMERIC NOT NULL DEFAULT 0,
  sand_kg NUMERIC NOT NULL DEFAULT 0,
  gravel_kg NUMERIC NOT NULL DEFAULT 0,
  water_liters NUMERIC NOT NULL DEFAULT 0,
  additives_liters NUMERIC NOT NULL DEFAULT 0,
  total_volume_m3 NUMERIC NOT NULL DEFAULT 0,
  operator_name TEXT,
  import_datetime TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_bl_id TEXT REFERENCES public.bons_livraison_reels(bl_id),
  link_confidence INTEGER DEFAULT 0 CHECK (link_confidence >= 0 AND link_confidence <= 100),
  link_status TEXT NOT NULL DEFAULT 'pending' CHECK (link_status IN ('pending', 'auto_linked', 'manual_linked', 'no_match')),
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WS7 Import Log table: tracks CSV import history
CREATE TABLE public.ws7_import_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_datetime TIMESTAMPTZ NOT NULL DEFAULT now(),
  filename TEXT NOT NULL,
  rows_imported INTEGER NOT NULL DEFAULT 0,
  rows_failed INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  imported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add ws7_batch_id to production_batches
ALTER TABLE public.production_batches
  ADD COLUMN ws7_batch_id UUID REFERENCES public.ws7_batches(id);

-- Indexes
CREATE INDEX idx_ws7_batches_datetime ON public.ws7_batches(batch_datetime);
CREATE INDEX idx_ws7_batches_link_status ON public.ws7_batches(link_status);
CREATE INDEX idx_ws7_batches_linked_bl ON public.ws7_batches(linked_bl_id);
CREATE INDEX idx_ws7_import_log_datetime ON public.ws7_import_log(import_datetime);
CREATE INDEX idx_production_batches_ws7 ON public.production_batches(ws7_batch_id);

-- Enable RLS
ALTER TABLE public.ws7_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ws7_import_log ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users can read, only specific roles can write
CREATE POLICY "Authenticated users can read ws7_batches"
  ON public.ws7_batches FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert ws7_batches"
  ON public.ws7_batches FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update ws7_batches"
  ON public.ws7_batches FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read ws7_import_log"
  ON public.ws7_import_log FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert ws7_import_log"
  ON public.ws7_import_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for ws7_batches
ALTER PUBLICATION supabase_realtime ADD TABLE public.ws7_batches;

-- Trigger for updated_at
CREATE TRIGGER update_ws7_batches_updated_at
  BEFORE UPDATE ON public.ws7_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
