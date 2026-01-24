-- Department Budget Allocation System
-- Each department has a monthly cap with automatic spending tracking

-- Create department budgets table
CREATE TABLE public.department_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT NOT NULL,
  department_label TEXT NOT NULL,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  budget_cap NUMERIC NOT NULL DEFAULT 0,
  alert_threshold_pct NUMERIC NOT NULL DEFAULT 80, -- Alert when spending reaches this %
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one budget per department per month
  CONSTRAINT unique_department_month UNIQUE (department, month_year)
);

-- Enable RLS
ALTER TABLE public.department_budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "CEO and Superviseur can manage department budgets"
ON public.department_budgets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles_v2
    WHERE user_id = auth.uid() AND role IN ('ceo', 'superviseur')
  )
);

CREATE POLICY "All authenticated users can view department budgets"
ON public.department_budgets
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add department field to expenses_controlled if tracking by department
-- First check if the column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses_controlled' AND column_name = 'department'
  ) THEN
    ALTER TABLE public.expenses_controlled ADD COLUMN department TEXT;
  END IF;
END $$;

-- Create a view to calculate department spending
CREATE OR REPLACE VIEW public.department_spending_summary AS
SELECT 
  COALESCE(e.department, e.categorie::text) as department,
  TO_CHAR(e.requested_at, 'YYYY-MM') as month_year,
  COUNT(*) as expense_count,
  SUM(CASE WHEN e.statut IN ('approuve', 'paye') THEN e.montant_ttc ELSE 0 END) as total_approved,
  SUM(CASE WHEN e.statut = 'en_attente' THEN e.montant_ttc ELSE 0 END) as total_pending,
  SUM(CASE WHEN e.statut = 'paye' THEN e.montant_ttc ELSE 0 END) as total_paid,
  SUM(e.montant_ttc) as total_all
FROM public.expenses_controlled e
WHERE e.requested_at IS NOT NULL
GROUP BY COALESCE(e.department, e.categorie::text), TO_CHAR(e.requested_at, 'YYYY-MM');

-- Create function to get department budget status
CREATE OR REPLACE FUNCTION public.get_department_budget_status(p_month_year TEXT DEFAULT NULL)
RETURNS TABLE (
  department TEXT,
  department_label TEXT,
  budget_cap NUMERIC,
  total_spent NUMERIC,
  total_pending NUMERIC,
  remaining NUMERIC,
  utilization_pct NUMERIC,
  alert_threshold_pct NUMERIC,
  is_over_budget BOOLEAN,
  is_alert_triggered BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_year TEXT;
BEGIN
  -- Default to current month
  v_month_year := COALESCE(p_month_year, TO_CHAR(NOW(), 'YYYY-MM'));
  
  RETURN QUERY
  SELECT 
    db.department,
    db.department_label,
    db.budget_cap,
    COALESCE(ds.total_approved, 0) as total_spent,
    COALESCE(ds.total_pending, 0) as total_pending,
    db.budget_cap - COALESCE(ds.total_approved, 0) as remaining,
    CASE 
      WHEN db.budget_cap > 0 THEN ROUND((COALESCE(ds.total_approved, 0) / db.budget_cap) * 100, 1)
      ELSE 0 
    END as utilization_pct,
    db.alert_threshold_pct,
    COALESCE(ds.total_approved, 0) > db.budget_cap as is_over_budget,
    CASE 
      WHEN db.budget_cap > 0 THEN (COALESCE(ds.total_approved, 0) / db.budget_cap) * 100 >= db.alert_threshold_pct
      ELSE false 
    END as is_alert_triggered
  FROM public.department_budgets db
  LEFT JOIN public.department_spending_summary ds 
    ON db.department = ds.department AND db.month_year = ds.month_year
  WHERE db.month_year = v_month_year AND db.is_active = true
  ORDER BY db.department_label;
END;
$$;

-- Create trigger to check department budget before approving expense
CREATE OR REPLACE FUNCTION public.check_department_budget()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_year TEXT;
  v_department TEXT;
  v_budget_cap NUMERIC;
  v_current_spent NUMERIC;
  v_new_total NUMERIC;
BEGIN
  -- Only check when status changes to approved
  IF NEW.statut = 'approuve' AND (OLD.statut IS NULL OR OLD.statut != 'approuve') THEN
    v_month_year := TO_CHAR(NEW.requested_at, 'YYYY-MM');
    v_department := COALESCE(NEW.department, NEW.categorie::text);
    
    -- Get budget cap for this department
    SELECT budget_cap INTO v_budget_cap
    FROM public.department_budgets
    WHERE department = v_department 
      AND month_year = v_month_year 
      AND is_active = true;
    
    -- If budget exists, check if we'd exceed it
    IF v_budget_cap IS NOT NULL THEN
      -- Get current approved spending
      SELECT COALESCE(SUM(montant_ttc), 0) INTO v_current_spent
      FROM public.expenses_controlled
      WHERE COALESCE(department, categorie::text) = v_department
        AND TO_CHAR(requested_at, 'YYYY-MM') = v_month_year
        AND statut IN ('approuve', 'paye')
        AND id != NEW.id;
      
      v_new_total := v_current_spent + NEW.montant_ttc;
      
      -- If over budget, create an alert but still allow (CEO can override)
      IF v_new_total > v_budget_cap THEN
        INSERT INTO public.alertes_systeme (
          type_alerte,
          niveau,
          titre,
          message,
          reference_table,
          reference_id,
          destinataire_role
        ) VALUES (
          'budget_exceeded',
          'critical',
          'Dépassement Budget Département',
          format('Le département %s a dépassé son budget mensuel de %s MAD. Nouveau total: %s MAD', 
                 v_department, v_budget_cap::text, v_new_total::text),
          'expenses_controlled',
          NEW.id::text,
          'ceo'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS check_department_budget_trigger ON public.expenses_controlled;
CREATE TRIGGER check_department_budget_trigger
  BEFORE UPDATE ON public.expenses_controlled
  FOR EACH ROW
  EXECUTE FUNCTION public.check_department_budget();

-- Insert default department budgets for current month
INSERT INTO public.department_budgets (department, department_label, month_year, budget_cap, alert_threshold_pct)
VALUES 
  ('carburant', 'Carburant', TO_CHAR(NOW(), 'YYYY-MM'), 25000, 80),
  ('maintenance', 'Maintenance', TO_CHAR(NOW(), 'YYYY-MM'), 15000, 80),
  ('fournitures', 'Fournitures', TO_CHAR(NOW(), 'YYYY-MM'), 8000, 80),
  ('transport', 'Transport', TO_CHAR(NOW(), 'YYYY-MM'), 12000, 80),
  ('reparation', 'Réparation', TO_CHAR(NOW(), 'YYYY-MM'), 20000, 80),
  ('nettoyage', 'Nettoyage', TO_CHAR(NOW(), 'YYYY-MM'), 5000, 80),
  ('petit_equipement', 'Petit Équipement', TO_CHAR(NOW(), 'YYYY-MM'), 10000, 80),
  ('services_externes', 'Services Externes', TO_CHAR(NOW(), 'YYYY-MM'), 15000, 80),
  ('frais_administratifs', 'Frais Administratifs', TO_CHAR(NOW(), 'YYYY-MM'), 8000, 80),
  ('autre', 'Autre', TO_CHAR(NOW(), 'YYYY-MM'), 5000, 80)
ON CONFLICT (department, month_year) DO NOTHING;

-- Add updated_at trigger
CREATE TRIGGER update_department_budgets_updated_at
  BEFORE UPDATE ON public.department_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();