
-- 1. Create client_intelligence table
CREATE TABLE public.client_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text,
  nom_client text,
  intelligence_brief text,
  score_sante text,
  resume text,
  opportunites text,
  risques text,
  actions text,
  valeur_potentielle text,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access" ON public.client_intelligence
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Create cash_flow_forecasts table
CREATE TABLE public.cash_flow_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_type text,
  resume text,
  score_sante text,
  prevision_30j text,
  prevision_90j text,
  risques text,
  recommandations text,
  actions_urgentes text,
  total_facture numeric,
  solde_impaye numeric,
  taux_recouvrement text,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cash_flow_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access" ON public.cash_flow_forecasts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Add columns to devis (only if not exist)
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS score_ia integer;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS niveau_score text;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS ai_recommandation text;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS probabilite_conversion text;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS scored_at timestamptz;

-- 4. Add columns to ai_briefings (only if not exist)
ALTER TABLE public.ai_briefings ADD COLUMN IF NOT EXISTS briefing_type text;
ALTER TABLE public.ai_briefings ADD COLUMN IF NOT EXISTS score_journee text;
