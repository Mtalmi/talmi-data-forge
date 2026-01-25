-- Add supplier tracking to expenses for cash payment limit monitoring
ALTER TABLE public.expenses_controlled
ADD COLUMN IF NOT EXISTS fournisseur_id UUID REFERENCES public.fournisseurs(id),
ADD COLUMN IF NOT EXISTS fournisseur_nom TEXT,
ADD COLUMN IF NOT EXISTS cash_penalty_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_stamp_duty NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_limit_override_by UUID,
ADD COLUMN IF NOT EXISTS cash_limit_override_reason TEXT,
ADD COLUMN IF NOT EXISTS cash_limit_override_at TIMESTAMPTZ;

-- Create table to track monthly supplier cash payments
CREATE TABLE IF NOT EXISTS public.supplier_cash_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fournisseur_id UUID REFERENCES public.fournisseurs(id) NOT NULL,
  fournisseur_nom TEXT NOT NULL,
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
  total_cash_amount NUMERIC NOT NULL DEFAULT 0,
  payment_count INTEGER NOT NULL DEFAULT 0,
  limit_exceeded BOOLEAN DEFAULT false,
  penalty_incurred NUMERIC DEFAULT 0,
  stamp_duty_incurred NUMERIC DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fournisseur_id, month_year)
);

-- Enable RLS
ALTER TABLE public.supplier_cash_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies for supplier_cash_tracking
CREATE POLICY "Authenticated users can view cash tracking"
ON public.supplier_cash_tracking FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert cash tracking"
ON public.supplier_cash_tracking FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update cash tracking"
ON public.supplier_cash_tracking FOR UPDATE
TO authenticated
USING (true);

-- Create table to log cash payment decisions for audit
CREATE TABLE IF NOT EXISTS public.cash_payment_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES public.expenses_controlled(id),
  fournisseur_id UUID REFERENCES public.fournisseurs(id),
  fournisseur_nom TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  monthly_total_before NUMERIC NOT NULL,
  monthly_total_after NUMERIC NOT NULL,
  penalty_applicable BOOLEAN DEFAULT false,
  penalty_amount NUMERIC DEFAULT 0,
  stamp_duty_amount NUMERIC DEFAULT 0,
  decision TEXT NOT NULL, -- 'proceed', 'switch_to_bank', 'override'
  decision_reason TEXT,
  override_by UUID,
  override_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  created_by_name TEXT
);

-- Enable RLS for audit table
ALTER TABLE public.cash_payment_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit table
CREATE POLICY "Authenticated users can view cash audit"
ON public.cash_payment_audit FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert cash audit"
ON public.cash_payment_audit FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to update supplier cash tracking when expense is paid
CREATE OR REPLACE FUNCTION update_supplier_cash_tracking()
RETURNS TRIGGER AS $$
DECLARE
  v_month_year TEXT;
  v_current_total NUMERIC;
  v_penalty NUMERIC := 0;
  v_stamp_duty NUMERIC := 0;
  v_excess NUMERIC;
  v_cash_limit CONSTANT NUMERIC := 50000;
BEGIN
  -- Only process if payment is cash and expense is being marked as paid
  IF NEW.statut = 'paye' AND LOWER(COALESCE(NEW.payment_method, '')) IN ('espèces', 'especes', 'cash') AND NEW.fournisseur_id IS NOT NULL THEN
    v_month_year := to_char(COALESCE(NEW.paid_at, now()), 'YYYY-MM');
    
    -- Get current total for this supplier this month
    SELECT COALESCE(total_cash_amount, 0) INTO v_current_total
    FROM public.supplier_cash_tracking
    WHERE fournisseur_id = NEW.fournisseur_id AND month_year = v_month_year;
    
    IF v_current_total IS NULL THEN
      v_current_total := 0;
    END IF;
    
    -- Calculate if this payment causes limit to be exceeded
    IF (v_current_total + NEW.montant_ttc) > v_cash_limit THEN
      v_excess := (v_current_total + NEW.montant_ttc) - v_cash_limit;
      v_penalty := v_excess * 0.06; -- 6% penalty
      v_stamp_duty := v_excess * 0.0025; -- 0.25% stamp duty
    END IF;
    
    -- Upsert the tracking record
    INSERT INTO public.supplier_cash_tracking (
      fournisseur_id, 
      fournisseur_nom, 
      month_year, 
      total_cash_amount, 
      payment_count,
      limit_exceeded,
      penalty_incurred,
      stamp_duty_incurred,
      last_updated_at
    )
    VALUES (
      NEW.fournisseur_id,
      COALESCE(NEW.fournisseur_nom, 'Unknown'),
      v_month_year,
      NEW.montant_ttc,
      1,
      (NEW.montant_ttc > v_cash_limit),
      v_penalty,
      v_stamp_duty,
      now()
    )
    ON CONFLICT (fournisseur_id, month_year) DO UPDATE SET
      total_cash_amount = supplier_cash_tracking.total_cash_amount + NEW.montant_ttc,
      payment_count = supplier_cash_tracking.payment_count + 1,
      limit_exceeded = (supplier_cash_tracking.total_cash_amount + NEW.montant_ttc) > v_cash_limit,
      penalty_incurred = CASE 
        WHEN (supplier_cash_tracking.total_cash_amount + NEW.montant_ttc) > v_cash_limit 
        THEN ((supplier_cash_tracking.total_cash_amount + NEW.montant_ttc) - v_cash_limit) * 0.06
        ELSE 0 
      END,
      stamp_duty_incurred = CASE 
        WHEN (supplier_cash_tracking.total_cash_amount + NEW.montant_ttc) > v_cash_limit 
        THEN ((supplier_cash_tracking.total_cash_amount + NEW.montant_ttc) - v_cash_limit) * 0.0025
        ELSE 0 
      END,
      last_updated_at = now();
    
    -- Update expense record with penalty info
    NEW.cash_penalty_amount := v_penalty;
    NEW.cash_stamp_duty := v_stamp_duty;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for cash tracking
DROP TRIGGER IF EXISTS trg_update_supplier_cash_tracking ON public.expenses_controlled;
CREATE TRIGGER trg_update_supplier_cash_tracking
BEFORE UPDATE ON public.expenses_controlled
FOR EACH ROW
WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
EXECUTE FUNCTION update_supplier_cash_tracking();

-- Add audit logging trigger for cash payments
CREATE OR REPLACE FUNCTION log_cash_payment_decision()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'paye' AND LOWER(COALESCE(NEW.payment_method, '')) IN ('espèces', 'especes', 'cash') AND NEW.fournisseur_id IS NOT NULL THEN
    INSERT INTO public.cash_payment_audit (
      expense_id,
      fournisseur_id,
      fournisseur_nom,
      amount,
      payment_method,
      monthly_total_before,
      monthly_total_after,
      penalty_applicable,
      penalty_amount,
      stamp_duty_amount,
      decision,
      decision_reason,
      override_by,
      override_by_name,
      created_by,
      created_by_name
    )
    SELECT
      NEW.id,
      NEW.fournisseur_id,
      COALESCE(NEW.fournisseur_nom, 'Unknown'),
      NEW.montant_ttc,
      NEW.payment_method,
      COALESCE((SELECT total_cash_amount FROM public.supplier_cash_tracking WHERE fournisseur_id = NEW.fournisseur_id AND month_year = to_char(now(), 'YYYY-MM')), 0),
      COALESCE((SELECT total_cash_amount FROM public.supplier_cash_tracking WHERE fournisseur_id = NEW.fournisseur_id AND month_year = to_char(now(), 'YYYY-MM')), 0) + NEW.montant_ttc,
      NEW.cash_penalty_amount > 0,
      COALESCE(NEW.cash_penalty_amount, 0),
      COALESCE(NEW.cash_stamp_duty, 0),
      CASE WHEN NEW.cash_limit_override_by IS NOT NULL THEN 'override' ELSE 'proceed' END,
      NEW.cash_limit_override_reason,
      NEW.cash_limit_override_by,
      (SELECT full_name FROM public.profiles WHERE user_id = NEW.cash_limit_override_by),
      NEW.paid_by,
      (SELECT full_name FROM public.profiles WHERE user_id = NEW.paid_by);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_cash_payment ON public.expenses_controlled;
CREATE TRIGGER trg_log_cash_payment
AFTER UPDATE ON public.expenses_controlled
FOR EACH ROW
WHEN (OLD.statut IS DISTINCT FROM NEW.statut AND NEW.statut = 'paye')
EXECUTE FUNCTION log_cash_payment_decision();