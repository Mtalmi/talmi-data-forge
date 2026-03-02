
-- TBOS AI Integration Sprint — Schema Migration (Prompt 0)

-- 1. Stock autonomy cache (for calculating days remaining per material)
CREATE TABLE IF NOT EXISTS public.stock_autonomy_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materiau TEXT NOT NULL UNIQUE,
  current_qty NUMERIC NOT NULL DEFAULT 0,
  avg_daily_consumption NUMERIC NOT NULL DEFAULT 0,
  days_remaining NUMERIC GENERATED ALWAYS AS (
    CASE WHEN avg_daily_consumption > 0 THEN current_qty / avg_daily_consumption ELSE 999 END
  ) STORED,
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stock_autonomy_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read stock_autonomy_cache"
  ON public.stock_autonomy_cache FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert stock_autonomy_cache"
  ON public.stock_autonomy_cache FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update stock_autonomy_cache"
  ON public.stock_autonomy_cache FOR UPDATE
  TO authenticated USING (true);

-- 2. AI deal scores on existing devis table
ALTER TABLE public.devis
  ADD COLUMN IF NOT EXISTS ai_score NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_score_reasons JSONB,
  ADD COLUMN IF NOT EXISTS ai_scored_at TIMESTAMPTZ;

-- 3. AI client intelligence briefs
CREATE TABLE IF NOT EXISTS public.ai_client_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  patterns JSONB,
  risk_level TEXT DEFAULT 'low',
  generated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_client_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read ai_client_briefs"
  ON public.ai_client_briefs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert ai_client_briefs"
  ON public.ai_client_briefs FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update ai_client_briefs"
  ON public.ai_client_briefs FOR UPDATE
  TO authenticated USING (true);

-- 4. Cash flow forecasts
CREATE TABLE IF NOT EXISTS public.ai_cashflow_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date DATE NOT NULL,
  period_days INTEGER DEFAULT 30,
  predicted_inflows NUMERIC,
  predicted_outflows NUMERIC,
  predicted_balance NUMERIC,
  confidence_pct NUMERIC,
  details JSONB,
  generated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_cashflow_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read ai_cashflow_forecasts"
  ON public.ai_cashflow_forecasts FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert ai_cashflow_forecasts"
  ON public.ai_cashflow_forecasts FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update ai_cashflow_forecasts"
  ON public.ai_cashflow_forecasts FOR UPDATE
  TO authenticated USING (true);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_autonomy_cache;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_client_briefs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_cashflow_forecasts;
