-- Create credit score history table for tracking changes over time
CREATE TABLE public.credit_score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  grade TEXT NOT NULL, -- A, B, C, D, F
  risk_level TEXT NOT NULL, -- excellent, good, fair, poor, critical
  payment_history_score NUMERIC(5,2),
  delay_frequency_score NUMERIC(5,2),
  balance_trend_score NUMERIC(5,2),
  account_age_score NUMERIC(5,2),
  credit_utilization_score NUMERIC(5,2),
  total_outstanding NUMERIC(12,2),
  total_overdue NUMERIC(12,2),
  avg_days_overdue NUMERIC(5,1),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_score_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view credit score history"
ON public.credit_score_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "CEO and accounting can insert credit score history"
ON public.credit_score_history FOR INSERT
TO authenticated
WITH CHECK (
  public.is_ceo(auth.uid()) OR 
  public.is_accounting(auth.uid())
);

-- Indexes for performance
CREATE INDEX idx_credit_score_history_client ON public.credit_score_history(client_id);
CREATE INDEX idx_credit_score_history_date ON public.credit_score_history(snapshot_date);
CREATE INDEX idx_credit_score_history_client_date ON public.credit_score_history(client_id, snapshot_date DESC);

-- Unique constraint to prevent duplicate snapshots per client per day
CREATE UNIQUE INDEX idx_credit_score_history_unique ON public.credit_score_history(client_id, snapshot_date);