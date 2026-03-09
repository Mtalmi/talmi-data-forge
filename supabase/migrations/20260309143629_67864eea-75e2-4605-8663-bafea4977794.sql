CREATE TABLE public.budget_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id TEXT NOT NULL,
  anomaly_type TEXT,
  deviation_pct NUMERIC NOT NULL DEFAULT 0,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on budget_anomalies"
ON public.budget_anomalies
FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX idx_budget_anomalies_contractor ON public.budget_anomalies (contractor_id, detected_at DESC);