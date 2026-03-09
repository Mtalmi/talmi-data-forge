
CREATE TABLE public.reorder_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materiau TEXT NOT NULL,
  recommended_qty NUMERIC NOT NULL DEFAULT 0,
  urgency TEXT NOT NULL DEFAULT 'planifie',
  fournisseur TEXT,
  unite TEXT NOT NULL DEFAULT 'kg',
  days_remaining NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actioned_at TIMESTAMPTZ,
  actioned_by TEXT
);

ALTER TABLE public.reorder_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read reorder_recommendations"
  ON public.reorder_recommendations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert reorder_recommendations"
  ON public.reorder_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update reorder_recommendations"
  ON public.reorder_recommendations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.reorder_recommendations;
