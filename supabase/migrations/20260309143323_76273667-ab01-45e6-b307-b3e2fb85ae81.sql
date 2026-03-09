CREATE TABLE public.contractor_performance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_type TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  trend TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contractor_performance_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on contractor_performance_scores"
ON public.contractor_performance_scores
FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX idx_contractor_perf_scores_type ON public.contractor_performance_scores (score_type, calculated_at DESC);