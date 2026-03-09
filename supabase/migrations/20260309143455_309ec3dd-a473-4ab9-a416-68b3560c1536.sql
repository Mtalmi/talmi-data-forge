CREATE TABLE public.mission_prolongation_advice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  confidence INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mission_prolongation_advice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on mission_prolongation_advice"
ON public.mission_prolongation_advice
FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX idx_mission_prolongation_advice_mission ON public.mission_prolongation_advice (mission_id, calculated_at DESC);