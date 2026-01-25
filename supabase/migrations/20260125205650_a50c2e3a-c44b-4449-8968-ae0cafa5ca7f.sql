-- ============================================
-- LOAN MANAGEMENT SYSTEM
-- Features: Associate loans, payment schedules, compliance tracking
-- ============================================

-- Create enum for loan types
CREATE TYPE public.loan_type AS ENUM (
  'to_company',   -- Associate lends to company
  'from_company'  -- Company lends to associate
);

-- Create enum for loan status
CREATE TYPE public.loan_status AS ENUM (
  'active',
  'paid_off',
  'defaulted',
  'cancelled'
);

-- Create enum for payment status
CREATE TYPE public.loan_payment_status AS ENUM (
  'pending',
  'paid',
  'late',
  'partial',
  'skipped'
);

-- ============================================
-- ASSOCIATE REGISTRY
-- ============================================
CREATE TABLE IF NOT EXISTS public.associates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  relationship TEXT NOT NULL, -- 'owner', 'partner', 'family', 'shareholder'
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.associates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for associates
CREATE POLICY "Authenticated users can view associates"
  ON public.associates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only managers can insert associates"
  ON public.associates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only managers can update associates"
  ON public.associates FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- LOANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_number TEXT NOT NULL UNIQUE,
  associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE RESTRICT,
  loan_type loan_type NOT NULL,
  principal_amount NUMERIC(14,2) NOT NULL CHECK (principal_amount > 0),
  interest_rate NUMERIC(5,4) DEFAULT 0 CHECK (interest_rate >= 0 AND interest_rate <= 1), -- Annual rate as decimal (0.03 = 3%)
  term_months INTEGER NOT NULL CHECK (term_months > 0 AND term_months <= 360),
  monthly_payment NUMERIC(12,2) NOT NULL CHECK (monthly_payment > 0),
  total_interest NUMERIC(14,2) DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL, -- Principal + Interest
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status loan_status NOT NULL DEFAULT 'active',
  contract_url TEXT,
  board_decision_url TEXT, -- For large loans requiring board approval
  approved_by UUID,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loans
CREATE POLICY "Authenticated users can view loans"
  ON public.loans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only managers can insert loans"
  ON public.loans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only managers can update loans"
  ON public.loans FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- LOAN PAYMENT SCHEDULE
-- ============================================
CREATE TABLE IF NOT EXISTS public.loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  payment_number INTEGER NOT NULL CHECK (payment_number > 0),
  due_date DATE NOT NULL,
  principal_portion NUMERIC(12,2) NOT NULL DEFAULT 0,
  interest_portion NUMERIC(12,2) NOT NULL DEFAULT 0,
  scheduled_amount NUMERIC(12,2) NOT NULL,
  actual_amount NUMERIC(12,2) DEFAULT 0,
  balance_after NUMERIC(14,2) NOT NULL,
  status loan_payment_status NOT NULL DEFAULT 'pending',
  paid_date DATE,
  paid_by UUID,
  paid_by_name TEXT,
  payment_method TEXT, -- 'bank_transfer', 'check', 'cash'
  payment_reference TEXT,
  receipt_url TEXT,
  notes TEXT,
  days_late INTEGER DEFAULT 0,
  late_fee NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(loan_id, payment_number)
);

-- Enable RLS
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loan payments
CREATE POLICY "Authenticated users can view loan payments"
  ON public.loan_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only managers can insert loan payments"
  ON public.loan_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only managers can update loan payments"
  ON public.loan_payments FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- ASSOCIATE TRANSACTIONS (General Ledger)
-- ============================================
CREATE TABLE IF NOT EXISTS public.associate_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT NOT NULL UNIQUE,
  associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL, -- 'withdrawal', 'deposit', 'loan_disbursement', 'loan_repayment', 'dividend', 'expense_reimbursement'
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  direction TEXT NOT NULL CHECK (direction IN ('debit', 'credit')), -- debit = money out from company, credit = money in
  description TEXT NOT NULL,
  justification TEXT,
  loan_id UUID REFERENCES public.loans(id),
  loan_payment_id UUID REFERENCES public.loan_payments(id),
  document_url TEXT,
  bank_reference TEXT,
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT false,
  approval_level TEXT, -- 'finance_manager', 'ceo', 'board'
  approved_by UUID,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Execution
  executed_by UUID,
  executed_by_name TEXT,
  executed_at TIMESTAMPTZ,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executed', 'rejected', 'cancelled')),
  
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.associate_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view associate transactions"
  ON public.associate_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only managers can insert associate transactions"
  ON public.associate_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only managers can update associate transactions"
  ON public.associate_transactions FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- COMPLIANCE ALERTS FOR LOANS
-- ============================================
CREATE TABLE IF NOT EXISTS public.loan_compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES public.loans(id) ON DELETE CASCADE,
  associate_id UUID REFERENCES public.associates(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'overdue_payment', 'missing_document', 'large_transaction', 'unusual_pattern'
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_by_name TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loan_compliance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view loan compliance alerts"
  ON public.loan_compliance_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can insert loan compliance alerts"
  ON public.loan_compliance_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Managers can update loan compliance alerts"
  ON public.loan_compliance_alerts FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate loan payment schedule
CREATE OR REPLACE FUNCTION public.calculate_loan_payment(
  p_principal NUMERIC,
  p_annual_rate NUMERIC,
  p_term_months INTEGER
) RETURNS NUMERIC AS $$
DECLARE
  monthly_rate NUMERIC;
  payment NUMERIC;
BEGIN
  IF p_annual_rate = 0 THEN
    RETURN ROUND(p_principal / p_term_months, 2);
  END IF;
  
  monthly_rate := p_annual_rate / 12;
  payment := p_principal * (monthly_rate * POWER(1 + monthly_rate, p_term_months)) / (POWER(1 + monthly_rate, p_term_months) - 1);
  
  RETURN ROUND(payment, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate loan number
CREATE OR REPLACE FUNCTION public.generate_loan_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(loan_number FROM 'LOAN-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.loans
  WHERE loan_number LIKE 'LOAN-' || year_part || '-%';
  
  new_number := 'LOAN-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION public.generate_associate_transaction_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM 'ASSOC-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.associate_transactions
  WHERE transaction_number LIKE 'ASSOC-' || year_part || '-%';
  
  new_number := 'ASSOC-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to get associate account balance
CREATE OR REPLACE FUNCTION public.get_associate_balance(p_associate_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_debit NUMERIC;
  total_credit NUMERIC;
BEGIN
  SELECT 
    COALESCE(SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END), 0)
  INTO total_debit, total_credit
  FROM public.associate_transactions
  WHERE associate_id = p_associate_id
    AND status = 'executed';
  
  -- Balance = Credits - Debits (positive = company owes associate)
  RETURN total_credit - total_debit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get loan outstanding balance
CREATE OR REPLACE FUNCTION public.get_loan_outstanding_balance(p_loan_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_principal NUMERIC;
  total_paid NUMERIC;
BEGIN
  SELECT principal_amount INTO total_principal
  FROM public.loans WHERE id = p_loan_id;
  
  SELECT COALESCE(SUM(actual_amount), 0) INTO total_paid
  FROM public.loan_payments
  WHERE loan_id = p_loan_id AND status IN ('paid', 'partial');
  
  RETURN total_principal - total_paid;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- AUDIT TRIGGER FOR LOANS
-- ============================================
CREATE OR REPLACE FUNCTION public.log_loan_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_superviseur (
    table_name,
    action,
    record_id,
    user_id,
    user_name,
    old_data,
    new_data,
    changes
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id)::TEXT,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    COALESCE(
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()),
      'System'
    ),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    CASE WHEN TG_OP = 'UPDATE' THEN 
      jsonb_build_object(
        'changed_fields', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(to_jsonb(NEW))
          WHERE to_jsonb(OLD) ->> key IS DISTINCT FROM value::TEXT
        )
      )
    ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply audit triggers
CREATE TRIGGER audit_loans_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.log_loan_changes();

CREATE TRIGGER audit_loan_payments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.loan_payments
  FOR EACH ROW EXECUTE FUNCTION public.log_loan_changes();

CREATE TRIGGER audit_associate_transactions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.associate_transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_loan_changes();

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER set_associates_updated_at
  BEFORE UPDATE ON public.associates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_loan_payments_updated_at
  BEFORE UPDATE ON public.loan_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_associate_transactions_updated_at
  BEFORE UPDATE ON public.associate_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_loans_associate_id ON public.loans(associate_id);
CREATE INDEX idx_loans_status ON public.loans(status);
CREATE INDEX idx_loans_start_date ON public.loans(start_date);
CREATE INDEX idx_loan_payments_loan_id ON public.loan_payments(loan_id);
CREATE INDEX idx_loan_payments_due_date ON public.loan_payments(due_date);
CREATE INDEX idx_loan_payments_status ON public.loan_payments(status);
CREATE INDEX idx_associate_transactions_associate_id ON public.associate_transactions(associate_id);
CREATE INDEX idx_associate_transactions_status ON public.associate_transactions(status);
CREATE INDEX idx_loan_compliance_alerts_loan_id ON public.loan_compliance_alerts(loan_id);
CREATE INDEX idx_loan_compliance_alerts_is_resolved ON public.loan_compliance_alerts(is_resolved);

-- ============================================
-- VIEW FOR LOAN SUMMARY
-- ============================================
CREATE OR REPLACE VIEW public.loan_summary AS
SELECT 
  l.id,
  l.loan_number,
  l.loan_type,
  a.name as associate_name,
  a.relationship,
  l.principal_amount,
  l.interest_rate,
  l.term_months,
  l.monthly_payment,
  l.total_amount,
  l.start_date,
  l.end_date,
  l.status,
  COALESCE(SUM(CASE WHEN lp.status IN ('paid', 'partial') THEN lp.actual_amount ELSE 0 END), 0) as total_paid,
  l.principal_amount - COALESCE(SUM(CASE WHEN lp.status IN ('paid', 'partial') THEN lp.actual_amount ELSE 0 END), 0) as outstanding_balance,
  COUNT(CASE WHEN lp.status = 'paid' THEN 1 END) as payments_completed,
  COUNT(CASE WHEN lp.status IN ('late', 'pending') AND lp.due_date < CURRENT_DATE THEN 1 END) as payments_overdue,
  l.term_months as total_payments,
  l.created_at
FROM public.loans l
JOIN public.associates a ON l.associate_id = a.id
LEFT JOIN public.loan_payments lp ON l.id = lp.loan_id
GROUP BY l.id, l.loan_number, l.loan_type, a.name, a.relationship, 
         l.principal_amount, l.interest_rate, l.term_months, l.monthly_payment,
         l.total_amount, l.start_date, l.end_date, l.status, l.created_at;