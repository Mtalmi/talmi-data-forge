-- =====================================================
-- RECEIVABLES & PAYABLES MANAGEMENT SYSTEM
-- Recover 915k+ DH Outstanding Debt
-- =====================================================

-- 1. RECEIVABLES (Créances) - Collection tracking
CREATE TABLE IF NOT EXISTS public.collection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL REFERENCES public.clients(client_id) ON DELETE CASCADE,
  facture_id TEXT,
  bl_id TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('invoice_sent', 'reminder_7d', 'reminder_15d', 'reminder_30d', 'phone_call', 'dispute_opened', 'dispute_resolved', 'partial_payment', 'full_payment', 'written_off', 'escalated')),
  action_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  performed_by TEXT,
  performed_by_name TEXT,
  notes TEXT,
  next_action_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.collection_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage collection_logs"
  ON public.collection_logs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. RECEIVABLES STATUS TRACKING
CREATE TABLE IF NOT EXISTS public.receivable_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL REFERENCES public.clients(client_id) ON DELETE CASCADE,
  facture_id TEXT,
  bl_id TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'sent', 'pending', 'partial', 'paid', 'overdue', 'disputed', 'at_risk', 'written_off')),
  collection_stage INTEGER DEFAULT 0, -- 0=new, 1=7d reminder, 2=15d reminder, 3=30d call, 4=escalated
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  last_contact_date DATE,
  dispute_reason TEXT,
  write_off_approved_by TEXT,
  write_off_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, facture_id),
  UNIQUE(client_id, bl_id)
);

ALTER TABLE public.receivable_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage receivable_status"
  ON public.receivable_status FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. PAYMENT SCHEDULES (for both AR and AP)
CREATE TABLE IF NOT EXISTS public.payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('receivable', 'payable')),
  reference_id TEXT NOT NULL, -- facture_id or bl_id for receivables, facture_fournisseur_id for payables
  entity_id TEXT NOT NULL, -- client_id or fournisseur_id
  entity_name TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  scheduled_date DATE NOT NULL,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'executed', 'failed', 'cancelled')),
  executed_date DATE,
  executed_by TEXT,
  executed_by_name TEXT,
  reference_number TEXT,
  bank_account TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage payment_schedules"
  ON public.payment_schedules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. CLIENT RELATIONSHIP SCORING
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS payment_score INTEGER DEFAULT 100, -- 0-100 score
  ADD COLUMN IF NOT EXISTS total_invoiced DECIMAL(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_paid DECIMAL(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS on_time_payments INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_payments INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disputes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_date DATE,
  ADD COLUMN IF NOT EXISTS average_days_to_pay INTEGER;

-- 5. SUPPLIER RELATIONSHIP SCORING
ALTER TABLE public.fournisseurs
  ADD COLUMN IF NOT EXISTS reliability_score INTEGER DEFAULT 100, -- 0-100 score
  ADD COLUMN IF NOT EXISTS total_ordered DECIMAL(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_paid DECIMAL(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS on_time_payments INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_payments INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_date DATE,
  ADD COLUMN IF NOT EXISTS average_days_to_pay INTEGER,
  ADD COLUMN IF NOT EXISTS discount_terms TEXT,
  ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT;

-- 6. MONTHLY RECONCILIATION REPORTS
CREATE TABLE IF NOT EXISTS public.ar_ap_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receivables', 'payables')),
  opening_balance DECIMAL(12, 2) NOT NULL,
  invoices_issued DECIMAL(12, 2) DEFAULT 0,
  payments_received DECIMAL(12, 2) DEFAULT 0,
  adjustments DECIMAL(12, 2) DEFAULT 0,
  write_offs DECIMAL(12, 2) DEFAULT 0,
  closing_balance DECIMAL(12, 2) NOT NULL,
  dso_dpo_days INTEGER,
  on_time_rate DECIMAL(5, 2),
  variance DECIMAL(12, 2) DEFAULT 0,
  variance_explanation TEXT,
  reconciled_by TEXT,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'variance_detected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ar_ap_reconciliation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage ar_ap_reconciliation"
  ON public.ar_ap_reconciliation FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. FUNCTION: Calculate DSO (Days Sales Outstanding)
CREATE OR REPLACE FUNCTION public.calculate_dso(p_client_id TEXT DEFAULT NULL, p_period_days INTEGER DEFAULT 90)
RETURNS TABLE(
  client_id TEXT,
  client_name TEXT,
  total_receivables DECIMAL,
  total_revenue DECIMAL,
  dso_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH receivables AS (
    SELECT 
      bl.client_id,
      c.nom_client,
      SUM(
        CASE WHEN bl.statut_paiement != 'Payé' 
        THEN bl.volume_m3 * COALESCE(bl.prix_vente_m3, 0) + bl.volume_m3 * COALESCE(bl.prix_livraison_m3, 0)
        ELSE 0 END
      ) as total_ar,
      SUM(bl.volume_m3 * COALESCE(bl.prix_vente_m3, 0) + bl.volume_m3 * COALESCE(bl.prix_livraison_m3, 0)) as total_rev
    FROM public.bons_livraison_reels bl
    JOIN public.clients c ON bl.client_id = c.client_id
    WHERE bl.date_livraison >= CURRENT_DATE - p_period_days
      AND (p_client_id IS NULL OR bl.client_id = p_client_id)
    GROUP BY bl.client_id, c.nom_client
  )
  SELECT 
    r.client_id,
    r.nom_client as client_name,
    r.total_ar as total_receivables,
    r.total_rev as total_revenue,
    CASE 
      WHEN r.total_rev > 0 THEN ROUND((r.total_ar / r.total_rev) * p_period_days)::INTEGER
      ELSE 0
    END as dso_days
  FROM receivables r;
END;
$$;

-- 8. FUNCTION: Calculate DPO (Days Payable Outstanding)
CREATE OR REPLACE FUNCTION public.calculate_dpo(p_fournisseur_id TEXT DEFAULT NULL, p_period_days INTEGER DEFAULT 90)
RETURNS TABLE(
  fournisseur_id TEXT,
  fournisseur_name TEXT,
  total_payables DECIMAL,
  total_purchases DECIMAL,
  dpo_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH payables AS (
    SELECT 
      ff.fournisseur_id,
      f.nom_fournisseur,
      SUM(
        CASE WHEN ff.statut != 'payee' 
        THEN ff.montant_ttc - COALESCE(ff.montant_paye, 0)
        ELSE 0 END
      ) as total_ap,
      SUM(ff.montant_ttc) as total_purchases
    FROM public.factures_fournisseur ff
    JOIN public.fournisseurs f ON ff.fournisseur_id = f.id
    WHERE ff.date_facture >= CURRENT_DATE - p_period_days
      AND (p_fournisseur_id IS NULL OR ff.fournisseur_id = p_fournisseur_id)
    GROUP BY ff.fournisseur_id, f.nom_fournisseur
  )
  SELECT 
    p.fournisseur_id,
    p.nom_fournisseur as fournisseur_name,
    p.total_ap as total_payables,
    p.total_purchases,
    CASE 
      WHEN p.total_purchases > 0 THEN ROUND((p.total_ap / p.total_purchases) * p_period_days)::INTEGER
      ELSE 0
    END as dpo_days
  FROM payables p;
END;
$$;

-- 9. FUNCTION: Get Receivables Aging Summary
CREATE OR REPLACE FUNCTION public.get_receivables_aging_summary()
RETURNS TABLE(
  bucket TEXT,
  bucket_order INTEGER,
  invoice_count INTEGER,
  total_amount DECIMAL,
  percentage DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total DECIMAL;
BEGIN
  -- Calculate total outstanding
  SELECT COALESCE(SUM(
    CASE WHEN bl.statut_paiement != 'Payé' 
    THEN bl.volume_m3 * COALESCE(bl.prix_vente_m3, 0) + bl.volume_m3 * COALESCE(bl.prix_livraison_m3, 0)
    ELSE 0 END
  ), 0) INTO v_total
  FROM public.bons_livraison_reels bl;

  RETURN QUERY
  WITH aged_receivables AS (
    SELECT 
      bl.bl_id,
      bl.volume_m3 * COALESCE(bl.prix_vente_m3, 0) + bl.volume_m3 * COALESCE(bl.prix_livraison_m3, 0) as amount,
      CURRENT_DATE - (bl.date_livraison::date + COALESCE(c.delai_paiement_jours, 30)) as days_overdue
    FROM public.bons_livraison_reels bl
    JOIN public.clients c ON bl.client_id = c.client_id
    WHERE bl.statut_paiement != 'Payé'
  ),
  bucketed AS (
    SELECT 
      CASE 
        WHEN days_overdue <= 0 THEN 'Current (0-30 days)'
        WHEN days_overdue <= 30 THEN '1-30 days overdue'
        WHEN days_overdue <= 60 THEN '31-60 days overdue'
        WHEN days_overdue <= 90 THEN '61-90 days overdue'
        ELSE '90+ days overdue'
      END as aging_bucket,
      CASE 
        WHEN days_overdue <= 0 THEN 1
        WHEN days_overdue <= 30 THEN 2
        WHEN days_overdue <= 60 THEN 3
        WHEN days_overdue <= 90 THEN 4
        ELSE 5
      END as bucket_order,
      amount
    FROM aged_receivables
  )
  SELECT 
    b.aging_bucket as bucket,
    b.bucket_order,
    COUNT(*)::INTEGER as invoice_count,
    SUM(b.amount) as total_amount,
    CASE WHEN v_total > 0 THEN ROUND((SUM(b.amount) / v_total) * 100, 2) ELSE 0 END as percentage
  FROM bucketed b
  GROUP BY b.aging_bucket, b.bucket_order
  ORDER BY b.bucket_order;
END;
$$;

-- 10. FUNCTION: Get Payables Aging Summary
CREATE OR REPLACE FUNCTION public.get_payables_aging_summary()
RETURNS TABLE(
  bucket TEXT,
  bucket_order INTEGER,
  invoice_count INTEGER,
  total_amount DECIMAL,
  percentage DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total DECIMAL;
BEGIN
  -- Calculate total outstanding
  SELECT COALESCE(SUM(
    CASE WHEN ff.statut != 'payee' 
    THEN ff.montant_ttc - COALESCE(ff.montant_paye, 0)
    ELSE 0 END
  ), 0) INTO v_total
  FROM public.factures_fournisseur ff;

  RETURN QUERY
  WITH aged_payables AS (
    SELECT 
      ff.id,
      ff.montant_ttc - COALESCE(ff.montant_paye, 0) as amount,
      CURRENT_DATE - ff.date_echeance::date as days_overdue
    FROM public.factures_fournisseur ff
    WHERE ff.statut != 'payee'
  ),
  bucketed AS (
    SELECT 
      CASE 
        WHEN days_overdue <= 0 THEN 'Current (not due)'
        WHEN days_overdue <= 7 THEN 'Due within 7 days'
        WHEN days_overdue <= 30 THEN '1-30 days overdue'
        WHEN days_overdue <= 60 THEN '31-60 days overdue'
        ELSE '60+ days overdue'
      END as aging_bucket,
      CASE 
        WHEN days_overdue <= 0 THEN 1
        WHEN days_overdue <= 7 THEN 2
        WHEN days_overdue <= 30 THEN 3
        WHEN days_overdue <= 60 THEN 4
        ELSE 5
      END as bucket_order,
      amount
    FROM aged_payables
  )
  SELECT 
    b.aging_bucket as bucket,
    b.bucket_order,
    COUNT(*)::INTEGER as invoice_count,
    SUM(b.amount) as total_amount,
    CASE WHEN v_total > 0 THEN ROUND((SUM(b.amount) / v_total) * 100, 2) ELSE 0 END as percentage
  FROM bucketed b
  GROUP BY b.aging_bucket, b.bucket_order
  ORDER BY b.bucket_order;
END;
$$;

-- 11. TRIGGER: Update receivable status automatically
CREATE OR REPLACE FUNCTION public.update_receivable_status_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update status based on payment status
  IF NEW.statut_paiement = 'Payé' THEN
    UPDATE public.receivable_status 
    SET status = 'paid', updated_at = now()
    WHERE bl_id = NEW.bl_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bl_receivable_status_trigger ON public.bons_livraison_reels;
CREATE TRIGGER bl_receivable_status_trigger
  AFTER UPDATE OF statut_paiement ON public.bons_livraison_reels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receivable_status_trigger();

-- 12. CREATE INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_collection_logs_client ON public.collection_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_action_date ON public.collection_logs(action_date DESC);
CREATE INDEX IF NOT EXISTS idx_receivable_status_client ON public.receivable_status(client_id);
CREATE INDEX IF NOT EXISTS idx_receivable_status_status ON public.receivable_status(status);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_date ON public.payment_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_type ON public.payment_schedules(type);
CREATE INDEX IF NOT EXISTS idx_ar_ap_reconciliation_period ON public.ar_ap_reconciliation(period_month);

-- 13. Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.collection_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_schedules;