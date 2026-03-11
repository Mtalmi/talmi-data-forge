CREATE TABLE public.production_briefing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_text text,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.production_briefing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on production_briefing"
  ON public.production_briefing
  FOR SELECT
  TO anon, authenticated
  USING (true);