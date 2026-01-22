-- Create the audits_externes table with IMMUTABILITY enforced
CREATE TABLE public.audits_externes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_period TEXT NOT NULL,
  
  -- Section A: Silo Reconciliation (stored as JSONB array for multiple silos)
  silo_checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  silo_variance_max_pct NUMERIC,
  
  -- Section B: Cash Audit
  cash_app_amount NUMERIC NOT NULL DEFAULT 0,
  cash_physical_amount NUMERIC NOT NULL DEFAULT 0,
  cash_variance NUMERIC GENERATED ALWAYS AS (cash_app_amount - cash_physical_amount) STORED,
  cash_variance_pct NUMERIC GENERATED ALWAYS AS (
    CASE WHEN cash_app_amount > 0 
    THEN ((cash_app_amount - cash_physical_amount) / cash_app_amount) * 100 
    ELSE 0 END
  ) STORED,
  cash_comment TEXT,
  
  -- Section C: Document Spot-Check
  document_checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  documents_verified_count INTEGER DEFAULT 0,
  documents_missing_count INTEGER DEFAULT 0,
  
  -- Section D: Truck Odometer Check
  truck_checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  truck_anomaly_detected BOOLEAN DEFAULT FALSE,
  
  -- Auditor info
  auditor_id UUID NOT NULL,
  auditor_notes TEXT,
  
  -- Compliance score (calculated)
  compliance_score NUMERIC,
  
  -- Status and immutability
  status TEXT NOT NULL DEFAULT 'draft',
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by UUID,
  
  -- Email tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audits_externes ENABLE ROW LEVEL SECURITY;

-- CEO can do everything
CREATE POLICY "CEO can manage all audits"
ON public.audits_externes
FOR ALL
USING (is_ceo(auth.uid()))
WITH CHECK (is_ceo(auth.uid()));

-- Auditeur can insert new audits
CREATE POLICY "Auditeur can create audits"
ON public.audits_externes
FOR INSERT
WITH CHECK (
  has_role_v2(auth.uid(), 'auditeur') AND 
  auditor_id = auth.uid()
);

-- Auditeur can view own audits
CREATE POLICY "Auditeur can view own audits"
ON public.audits_externes
FOR SELECT
USING (
  has_role_v2(auth.uid(), 'auditeur') AND 
  auditor_id = auth.uid()
);

-- Auditeur can only update UNLOCKED drafts they created
CREATE POLICY "Auditeur can update unlocked drafts"
ON public.audits_externes
FOR UPDATE
USING (
  has_role_v2(auth.uid(), 'auditeur') AND 
  auditor_id = auth.uid() AND 
  is_locked = FALSE AND
  status = 'draft'
)
WITH CHECK (
  has_role_v2(auth.uid(), 'auditeur') AND 
  auditor_id = auth.uid()
);

-- IMMUTABILITY TRIGGER: Lock audit on submission, prevent all changes except by CEO
CREATE OR REPLACE FUNCTION public.enforce_audit_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If transitioning to 'submitted' status, lock the record
  IF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
    NEW.is_locked := TRUE;
    NEW.locked_at := now();
    NEW.locked_by := auth.uid();
    NEW.submitted_at := now();
  END IF;
  
  -- If already locked, only CEO can modify
  IF OLD.is_locked = TRUE THEN
    IF NOT is_ceo(auth.uid()) THEN
      RAISE EXCEPTION 'Audit verrouillé. Seul le CEO peut modifier un audit soumis.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_audit_immutability_trigger
BEFORE UPDATE ON public.audits_externes
FOR EACH ROW
EXECUTE FUNCTION public.enforce_audit_immutability();

-- Calculate compliance score on insert/update
CREATE OR REPLACE FUNCTION public.calculate_audit_compliance_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_silo_score NUMERIC := 100;
  v_cash_score NUMERIC := 100;
  v_doc_score NUMERIC := 100;
  v_truck_score NUMERIC := 100;
  v_total_score NUMERIC;
  v_max_variance NUMERIC := 0;
  v_silo RECORD;
BEGIN
  -- Calculate silo variance max
  IF NEW.silo_checks IS NOT NULL AND jsonb_array_length(NEW.silo_checks) > 0 THEN
    FOR v_silo IN SELECT * FROM jsonb_array_elements(NEW.silo_checks)
    LOOP
      IF ABS((v_silo.value->>'variance_pct')::NUMERIC) > v_max_variance THEN
        v_max_variance := ABS((v_silo.value->>'variance_pct')::NUMERIC);
      END IF;
    END LOOP;
    NEW.silo_variance_max_pct := v_max_variance;
    -- Deduct points based on variance: >5% = -20, >10% = -40
    IF v_max_variance > 10 THEN
      v_silo_score := 60;
    ELSIF v_max_variance > 5 THEN
      v_silo_score := 80;
    END IF;
  END IF;
  
  -- Cash score: any variance > 0 loses points
  IF ABS(COALESCE(NEW.cash_variance_pct, 0)) > 5 THEN
    v_cash_score := 60;
  ELSIF ABS(COALESCE(NEW.cash_variance_pct, 0)) > 2 THEN
    v_cash_score := 80;
  ELSIF ABS(COALESCE(NEW.cash_variance_pct, 0)) > 0 THEN
    v_cash_score := 90;
  END IF;
  
  -- Document score: missing documents lose points
  IF NEW.documents_missing_count > 0 THEN
    v_doc_score := 100 - (NEW.documents_missing_count * 15);
    IF v_doc_score < 0 THEN v_doc_score := 0; END IF;
  END IF;
  
  -- Truck score: anomalies are serious
  IF NEW.truck_anomaly_detected = TRUE THEN
    v_truck_score := 50;
  END IF;
  
  -- Calculate weighted average
  v_total_score := (v_silo_score * 0.3) + (v_cash_score * 0.3) + (v_doc_score * 0.2) + (v_truck_score * 0.2);
  
  NEW.compliance_score := ROUND(v_total_score, 1);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_audit_compliance_score_trigger
BEFORE INSERT OR UPDATE ON public.audits_externes
FOR EACH ROW
EXECUTE FUNCTION public.calculate_audit_compliance_score();

-- Add updated_at trigger
CREATE TRIGGER update_audits_externes_updated_at
BEFORE UPDATE ON public.audits_externes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create helper function to check if user is auditeur
CREATE OR REPLACE FUNCTION public.is_auditeur_v2(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role_v2(_user_id, 'auditeur')
$$;