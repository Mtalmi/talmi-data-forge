
CREATE TABLE public.stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materiau TEXT NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'stock_bas',
  severity TEXT NOT NULL DEFAULT 'warning',
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  reference_stock_id UUID REFERENCES public.stocks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read stock_alerts"
  ON public.stock_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert stock_alerts"
  ON public.stock_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update stock_alerts"
  ON public.stock_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_alerts;
