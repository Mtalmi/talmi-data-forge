CREATE TABLE public.mission_risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'low',
  risk_reason TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mission_risk_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on mission_risk_alerts"
ON public.mission_risk_alerts
FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX idx_mission_risk_alerts_mission ON public.mission_risk_alerts (mission_id, calculated_at DESC);