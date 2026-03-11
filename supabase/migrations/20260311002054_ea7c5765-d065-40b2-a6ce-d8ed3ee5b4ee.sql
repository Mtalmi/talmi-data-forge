CREATE TABLE IF NOT EXISTS public.ventes_briefing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_text TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ventes_briefing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on ventes_briefing"
ON public.ventes_briefing
FOR SELECT
TO anon, authenticated
USING (true);