
-- Add justification status and pattern detection fields to cash_deposits
ALTER TABLE public.cash_deposits 
ADD COLUMN IF NOT EXISTS justification_status VARCHAR(20) DEFAULT 'pending' CHECK (justification_status IN ('pending', 'justified', 'unjustified', 'flagged')),
ADD COLUMN IF NOT EXISTS matched_invoice_amount NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS match_variance_pct NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS pattern_flags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_by_name TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bank_reference TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS loan_agreement_url TEXT,
ADD COLUMN IF NOT EXISTS capital_decision_url TEXT,
ADD COLUMN IF NOT EXISTS reimbursement_expense_id UUID;

-- Create deposit_pattern_alerts table for suspicious pattern tracking
CREATE TABLE IF NOT EXISTS public.deposit_pattern_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
    'multiple_same_day', 
    'round_numbers', 
    'frequent_no_source', 
    'exceeds_revenue', 
    'large_undocumented'
  )),
  alert_date DATE NOT NULL,
  deposit_ids UUID[] NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  details JSONB,
  risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on pattern alerts
ALTER TABLE public.deposit_pattern_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view deposit alerts"
ON public.deposit_pattern_alerts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Management can insert deposit alerts"
ON public.deposit_pattern_alerts FOR INSERT
TO authenticated
WITH CHECK (
  public.is_ceo(auth.uid()) OR 
  public.is_superviseur(auth.uid())
);

CREATE POLICY "Management can update deposit alerts"
ON public.deposit_pattern_alerts FOR UPDATE
TO authenticated
USING (
  public.is_ceo(auth.uid()) OR 
  public.is_superviseur(auth.uid())
);

-- Create monthly deposit summary view
CREATE OR REPLACE VIEW public.monthly_deposit_summary AS
SELECT 
  date_trunc('month', deposit_date)::date as month,
  COUNT(*) as total_deposits,
  SUM(amount) as total_amount,
  COUNT(*) FILTER (WHERE justification_status = 'justified') as justified_count,
  SUM(amount) FILTER (WHERE justification_status = 'justified') as justified_amount,
  COUNT(*) FILTER (WHERE justification_status = 'unjustified' OR justification_status = 'pending') as unjustified_count,
  SUM(amount) FILTER (WHERE justification_status = 'unjustified' OR justification_status = 'pending') as unjustified_amount,
  COUNT(*) FILTER (WHERE justification_status = 'flagged') as flagged_count,
  SUM(amount) FILTER (WHERE justification_status = 'flagged') as flagged_amount,
  ROUND(
    (COUNT(*) FILTER (WHERE justification_status = 'justified')::numeric / NULLIF(COUNT(*), 0)) * 100, 
    1
  ) as justification_rate
FROM public.cash_deposits
GROUP BY date_trunc('month', deposit_date)
ORDER BY month DESC;

-- Create function to detect deposit patterns
CREATE OR REPLACE FUNCTION public.detect_deposit_patterns(check_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  pattern_type TEXT,
  risk_level TEXT,
  deposit_count INT,
  total_amount NUMERIC,
  description TEXT,
  deposit_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Pattern 1: Multiple deposits same day
  RETURN QUERY
  SELECT 
    'multiple_same_day'::TEXT as pattern_type,
    CASE WHEN COUNT(*) >= 5 THEN 'high' WHEN COUNT(*) >= 3 THEN 'medium' ELSE 'low' END::TEXT as risk_level,
    COUNT(*)::INT as deposit_count,
    SUM(cd.amount) as total_amount,
    format('%s dépôts le même jour totalisant %s DH', COUNT(*), SUM(cd.amount))::TEXT as description,
    array_agg(cd.id) as deposit_ids
  FROM public.cash_deposits cd
  WHERE cd.deposit_date = check_date
  GROUP BY cd.deposit_date
  HAVING COUNT(*) >= 3;

  -- Pattern 2: Round numbers (amounts ending in 000)
  RETURN QUERY
  SELECT 
    'round_numbers'::TEXT as pattern_type,
    'medium'::TEXT as risk_level,
    COUNT(*)::INT as deposit_count,
    SUM(cd.amount) as total_amount,
    format('%s dépôts avec montants ronds', COUNT(*))::TEXT as description,
    array_agg(cd.id) as deposit_ids
  FROM public.cash_deposits cd
  WHERE cd.deposit_date >= check_date - INTERVAL '7 days'
    AND cd.deposit_date <= check_date
    AND cd.amount >= 5000
    AND MOD(cd.amount::int, 1000) = 0
  GROUP BY true
  HAVING COUNT(*) >= 3;

  -- Pattern 3: Large undocumented deposits
  RETURN QUERY
  SELECT 
    'large_undocumented'::TEXT as pattern_type,
    'critical'::TEXT as risk_level,
    COUNT(*)::INT as deposit_count,
    SUM(cd.amount) as total_amount,
    format('Dépôt(s) > 50,000 DH sans source claire', COUNT(*))::TEXT as description,
    array_agg(cd.id) as deposit_ids
  FROM public.cash_deposits cd
  WHERE cd.deposit_date >= check_date - INTERVAL '30 days'
    AND cd.deposit_date <= check_date
    AND cd.amount >= 50000
    AND (cd.source_type = 'other' OR cd.source_description IS NULL OR cd.source_description = '')
    AND cd.justification_status != 'justified';

  -- Pattern 4: Frequent deposits without clear source
  RETURN QUERY
  SELECT 
    'frequent_no_source'::TEXT as pattern_type,
    'high'::TEXT as risk_level,
    COUNT(*)::INT as deposit_count,
    SUM(cd.amount) as total_amount,
    format('%s dépôts ce mois sans source claire', COUNT(*))::TEXT as description,
    array_agg(cd.id) as deposit_ids
  FROM public.cash_deposits cd
  WHERE cd.deposit_date >= date_trunc('month', check_date)
    AND cd.deposit_date <= check_date
    AND (cd.source_type = 'other' OR cd.client_id IS NULL)
    AND cd.justification_status != 'justified'
  GROUP BY true
  HAVING COUNT(*) >= 5;
END;
$$;

-- Function to auto-match deposits with invoices
CREATE OR REPLACE FUNCTION public.match_deposit_to_invoice(
  deposit_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deposit_rec RECORD;
  invoice_rec RECORD;
  variance_pct NUMERIC;
  result JSONB;
BEGIN
  -- Get deposit details
  SELECT * INTO deposit_rec FROM public.cash_deposits WHERE id = deposit_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('matched', false, 'error', 'Deposit not found');
  END IF;
  
  -- Only match customer payments
  IF deposit_rec.source_type != 'customer_payment' THEN
    RETURN jsonb_build_object('matched', false, 'reason', 'Not a customer payment');
  END IF;
  
  -- Try to find matching invoice
  SELECT * INTO invoice_rec 
  FROM public.factures f
  WHERE f.client_id = deposit_rec.client_id
    AND f.statut_paiement != 'Payé'
    AND ABS(f.montant_ttc - deposit_rec.amount) <= (f.montant_ttc * 0.05)
  ORDER BY ABS(f.montant_ttc - deposit_rec.amount)
  LIMIT 1;
  
  IF FOUND THEN
    variance_pct := ((deposit_rec.amount - invoice_rec.montant_ttc) / invoice_rec.montant_ttc) * 100;
    
    -- Update deposit with match info
    UPDATE public.cash_deposits
    SET 
      facture_id = invoice_rec.facture_id,
      matched_invoice_amount = invoice_rec.montant_ttc,
      match_variance_pct = variance_pct,
      justification_status = CASE 
        WHEN ABS(variance_pct) <= 1 THEN 'justified'
        WHEN ABS(variance_pct) <= 5 THEN 'pending'
        ELSE 'flagged'
      END
    WHERE id = deposit_id;
    
    result := jsonb_build_object(
      'matched', true,
      'invoice_id', invoice_rec.facture_id,
      'invoice_amount', invoice_rec.montant_ttc,
      'variance_pct', variance_pct,
      'status', CASE 
        WHEN ABS(variance_pct) <= 1 THEN 'perfect_match'
        WHEN ABS(variance_pct) <= 5 THEN 'close_match'
        ELSE 'variance_warning'
      END
    );
  ELSE
    -- No match found
    UPDATE public.cash_deposits
    SET justification_status = 'unjustified'
    WHERE id = deposit_id
      AND source_type = 'customer_payment';
      
    result := jsonb_build_object(
      'matched', false,
      'reason', 'No matching invoice found'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Create index for pattern detection performance
CREATE INDEX IF NOT EXISTS idx_cash_deposits_justification ON public.cash_deposits(justification_status);
CREATE INDEX IF NOT EXISTS idx_cash_deposits_amount ON public.cash_deposits(amount);

-- Create audit trigger for pattern alerts
CREATE TRIGGER audit_deposit_pattern_alerts_changes
AFTER INSERT OR UPDATE OR DELETE ON public.deposit_pattern_alerts
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes_universal();
