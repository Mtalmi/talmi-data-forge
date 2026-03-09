CREATE TABLE public.contractor_match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  besoin_id TEXT NOT NULL,
  contractor_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  recommandation TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contractor_match_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on contractor_match_scores"
ON public.contractor_match_scores
FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX idx_contractor_match_scores_besoin ON public.contractor_match_scores (besoin_id, calculated_at DESC);