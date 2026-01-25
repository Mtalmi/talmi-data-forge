
-- Create enum for tax obligation types
CREATE TYPE public.tax_obligation_type AS ENUM (
  'cnss',
  'mutuelle',
  'ir',
  'tva',
  'timbre',
  'patente',
  'taxe_professionnelle',
  'other'
);

-- Create enum for obligation frequency
CREATE TYPE public.obligation_frequency AS ENUM (
  'monthly',
  'quarterly',
  'annual',
  'one_time'
);

-- Create enum for obligation status
CREATE TYPE public.obligation_status AS ENUM (
  'pending',
  'paid',
  'overdue',
  'partially_paid'
);

-- Create tax_obligations table
CREATE TABLE public.tax_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_type tax_obligation_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency obligation_frequency NOT NULL DEFAULT 'monthly',
  amount DECIMAL(12,2) NOT NULL,
  due_day INTEGER NOT NULL DEFAULT 15,
  period_month INTEGER,
  period_quarter INTEGER,
  period_year INTEGER NOT NULL,
  due_date DATE NOT NULL,
  status obligation_status NOT NULL DEFAULT 'pending',
  paid_amount DECIMAL(12,2) DEFAULT 0,
  paid_date DATE,
  payment_reference TEXT,
  payment_method TEXT,
  payment_proof_url TEXT,
  penalty_amount DECIMAL(12,2) DEFAULT 0,
  days_overdue INTEGER DEFAULT 0,
  reminder_30_sent BOOLEAN DEFAULT FALSE,
  reminder_7_sent BOOLEAN DEFAULT FALSE,
  reminder_1_sent BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  paid_by UUID,
  paid_by_name TEXT
);

-- Create tax_obligation_templates for recurring obligations
CREATE TABLE public.tax_obligation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_type tax_obligation_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency obligation_frequency NOT NULL DEFAULT 'monthly',
  base_amount DECIMAL(12,2) NOT NULL,
  due_day INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  auto_generate BOOLEAN DEFAULT TRUE,
  penalty_rate DECIMAL(5,4) DEFAULT 0.06,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tax_compliance_alerts table
CREATE TABLE public.tax_compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_id UUID REFERENCES public.tax_obligations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  read_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_obligation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_compliance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tax_obligations (using correct app_role values)
CREATE POLICY "Authenticated users can view tax obligations"
ON public.tax_obligations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authorized roles can manage tax obligations"
ON public.tax_obligations FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('ceo', 'accounting')
  )
);

-- RLS Policies for templates
CREATE POLICY "Authenticated users can view templates"
ON public.tax_obligation_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authorized roles can manage templates"
ON public.tax_obligation_templates FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'ceo'
  )
);

-- RLS Policies for alerts
CREATE POLICY "Authenticated users can view compliance alerts"
ON public.tax_compliance_alerts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authorized roles can manage compliance alerts"
ON public.tax_compliance_alerts FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('ceo', 'accounting')
  )
);

-- Create function to calculate penalty
CREATE OR REPLACE FUNCTION public.calculate_tax_penalty(
  p_amount DECIMAL,
  p_due_date DATE,
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_penalty_rate DECIMAL DEFAULT 0.06
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days_late INTEGER;
  v_penalty DECIMAL;
BEGIN
  IF p_payment_date <= p_due_date THEN
    RETURN 0;
  END IF;
  
  v_days_late := p_payment_date - p_due_date;
  v_penalty := p_amount * p_penalty_rate * (v_days_late::DECIMAL / 30);
  
  RETURN ROUND(v_penalty, 2);
END;
$$;

-- Create function to update obligation status
CREATE OR REPLACE FUNCTION public.update_obligation_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calculate days overdue
  IF NEW.status != 'paid' AND NEW.due_date < CURRENT_DATE THEN
    NEW.days_overdue := CURRENT_DATE - NEW.due_date;
    NEW.status := 'overdue';
    NEW.penalty_amount := calculate_tax_penalty(NEW.amount, NEW.due_date);
  END IF;
  
  -- Update status based on payment
  IF NEW.paid_amount >= NEW.amount THEN
    NEW.status := 'paid';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.status := 'partially_paid';
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_obligation_status_trigger
BEFORE INSERT OR UPDATE ON public.tax_obligations
FOR EACH ROW EXECUTE FUNCTION public.update_obligation_status();

-- Create view for compliance summary
CREATE OR REPLACE VIEW public.tax_compliance_summary AS
SELECT 
  obligation_type,
  COUNT(*) as total_obligations,
  COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count,
  COUNT(*) FILTER (WHERE status = 'partially_paid') as partial_count,
  SUM(amount) as total_amount,
  SUM(paid_amount) as total_paid,
  SUM(amount - paid_amount) FILTER (WHERE status != 'paid') as total_outstanding,
  SUM(penalty_amount) as total_penalties,
  SUM(days_overdue) FILTER (WHERE status = 'overdue') as total_days_overdue
FROM public.tax_obligations
WHERE period_year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY obligation_type;

-- Create view for upcoming obligations
CREATE OR REPLACE VIEW public.upcoming_tax_obligations AS
SELECT 
  id,
  obligation_type,
  name,
  amount,
  due_date,
  status,
  days_overdue,
  penalty_amount,
  (due_date - CURRENT_DATE) as days_until_due
FROM public.tax_obligations
WHERE status IN ('pending', 'overdue', 'partially_paid')
ORDER BY due_date ASC;

-- Insert default templates for common Moroccan tax obligations
INSERT INTO public.tax_obligation_templates (obligation_type, name, description, frequency, base_amount, due_day, penalty_rate) VALUES
('cnss', 'Cotisation CNSS', 'Cotisation mensuelle sécurité sociale', 'monthly', 4000, 15, 0.06),
('mutuelle', 'Cotisation Mutuelle', 'Cotisation mensuelle assurance maladie', 'monthly', 2000, 20, 0.06),
('ir', 'Acompte IR', 'Acompte trimestriel impôt sur le revenu', 'quarterly', 5000, 15, 0.06),
('tva', 'Déclaration TVA', 'Déclaration mensuelle TVA', 'monthly', 0, 28, 0.06),
('patente', 'Taxe Professionnelle', 'Taxe professionnelle annuelle', 'annual', 5000, 31, 0.06);

-- Generate monthly CNSS obligations for 2026
INSERT INTO public.tax_obligations (obligation_type, name, frequency, amount, due_day, period_month, period_year, due_date)
SELECT 
  'cnss'::tax_obligation_type,
  'Cotisation CNSS - ' || TO_CHAR(make_date(2026, m, 1), 'Month YYYY'),
  'monthly'::obligation_frequency,
  4000,
  15,
  m,
  2026,
  make_date(2026, m, 15)
FROM generate_series(1, 12) as m;

-- Generate monthly Mutuelle obligations for 2026
INSERT INTO public.tax_obligations (obligation_type, name, frequency, amount, due_day, period_month, period_year, due_date)
SELECT 
  'mutuelle'::tax_obligation_type,
  'Cotisation Mutuelle - ' || TO_CHAR(make_date(2026, m, 1), 'Month YYYY'),
  'monthly'::obligation_frequency,
  2000,
  20,
  m,
  2026,
  make_date(2026, m, 20)
FROM generate_series(1, 12) as m;

-- Insert quarterly IR obligations
INSERT INTO public.tax_obligations (obligation_type, name, frequency, amount, due_day, period_quarter, period_year, due_date) VALUES
('ir', 'Acompte IR - Q1 2026', 'quarterly', 6057, 15, 1, 2026, '2026-03-15'),
('ir', 'Acompte IR - Q2 2026', 'quarterly', 6057, 15, 2, 2026, '2026-06-15'),
('ir', 'Acompte IR - Q3 2026', 'quarterly', 6057, 15, 3, 2026, '2026-09-15'),
('ir', 'Acompte IR - Q4 2026', 'quarterly', 6057, 15, 4, 2026, '2026-12-15');

-- Insert historical arrears (from audit findings)
INSERT INTO public.tax_obligations (obligation_type, name, frequency, amount, due_day, period_month, period_year, due_date, status) VALUES
('cnss', 'CNSS Arriérés 2024', 'monthly', 47909.71, 15, 12, 2024, '2024-12-15', 'overdue'),
('mutuelle', 'Mutuelles Arriérés 2024', 'monthly', 27306.40, 20, 12, 2024, '2024-12-20', 'overdue'),
('ir', 'IR Arriérés 2024', 'quarterly', 24228.71, 15, 4, 2024, '2024-12-15', 'overdue'),
('other', 'Autres Crédits Fiscaux 2024', 'one_time', 17640.00, 31, 12, 2024, '2024-12-31', 'overdue');
