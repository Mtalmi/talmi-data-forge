-- ==========================================================
-- PHASE 2: CONTRÔLE INTERNE DES DÉPENSES (Financial Constitution)
-- ==========================================================

-- Expense categories enum
CREATE TYPE public.expense_category AS ENUM (
  'carburant',           -- Fuel
  'maintenance',         -- Maintenance
  'fournitures',         -- Supplies
  'transport',           -- Transport
  'reparation',          -- Repairs
  'nettoyage',           -- Cleaning
  'petit_equipement',    -- Small equipment
  'services_externes',   -- External services
  'frais_administratifs', -- Administrative fees
  'autre'                -- Other
);

-- Expense approval level enum
CREATE TYPE public.expense_approval_level AS ENUM (
  'level_1',  -- Up to 2000 MAD - Exploitation/Admin
  'level_2',  -- 2001-20000 MAD - Superviseur
  'level_3'   -- >20000 MAD - CEO only
);

-- Expense status enum
CREATE TYPE public.expense_status AS ENUM (
  'brouillon',          -- Draft
  'en_attente',         -- Pending approval
  'approuve',           -- Approved
  'rejete',             -- Rejected
  'bloque_plafond',     -- Blocked due to monthly cap
  'paye'                -- Paid
);

-- Main expenses table with complete financial controls
CREATE TABLE IF NOT EXISTS public.expenses_controlled (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  reference TEXT UNIQUE NOT NULL DEFAULT ('DEP-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD((floor(random() * 10000))::text, 4, '0')),
  description TEXT NOT NULL,
  montant_ht NUMERIC NOT NULL CHECK (montant_ht > 0),
  montant_ttc NUMERIC NOT NULL CHECK (montant_ttc >= montant_ht),
  tva_pct NUMERIC DEFAULT 20,
  
  -- Categorization
  categorie expense_category NOT NULL,
  sous_categorie TEXT,
  
  -- Approval workflow
  approval_level expense_approval_level NOT NULL,
  statut expense_status NOT NULL DEFAULT 'brouillon',
  
  -- Fuel-specific fields (required when categorie = 'carburant')
  vehicule_id TEXT,
  kilometrage NUMERIC,
  
  -- Evidence (MANDATORY)
  receipt_photo_url TEXT, -- Made nullable for draft, but required before submission
  receipt_verified BOOLEAN DEFAULT FALSE,
  
  -- Requestor info
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  requested_by_name TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Level 1 approval (Exploitation/Admin)
  level1_approved_by UUID REFERENCES auth.users(id),
  level1_approved_by_name TEXT,
  level1_approved_at TIMESTAMP WITH TIME ZONE,
  level1_notes TEXT,
  
  -- Level 2 approval (Superviseur)
  level2_approved_by UUID REFERENCES auth.users(id),
  level2_approved_by_name TEXT,
  level2_approved_at TIMESTAMP WITH TIME ZONE,
  level2_notes TEXT,
  
  -- Level 3 approval (CEO)
  level3_approved_by UUID REFERENCES auth.users(id),
  level3_approved_by_name TEXT,
  level3_approved_at TIMESTAMP WITH TIME ZONE,
  level3_notes TEXT,
  
  -- Rejection info
  rejected_by UUID REFERENCES auth.users(id),
  rejected_by_name TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Payment tracking
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by UUID REFERENCES auth.users(id),
  payment_method TEXT,
  payment_reference TEXT,
  
  -- Monthly cap tracking
  month_year TEXT, -- Format: 'YYYY-MM' for easy grouping
  was_blocked_by_cap BOOLEAN DEFAULT FALSE,
  cap_override_by UUID REFERENCES auth.users(id),
  cap_override_reason TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Monthly spending caps table
CREATE TABLE IF NOT EXISTS public.monthly_expense_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year TEXT NOT NULL UNIQUE, -- Format: 'YYYY-MM'
  level1_cap NUMERIC NOT NULL DEFAULT 15000,
  level1_spent NUMERIC NOT NULL DEFAULT 0,
  cap_exceeded BOOLEAN DEFAULT FALSE,
  cap_exceeded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses_controlled ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_expense_caps ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- RLS POLICIES FOR EXPENSES
-- ==========================================================

-- CEO can do everything
CREATE POLICY "CEO full access on expenses"
  ON public.expenses_controlled FOR ALL
  USING (public.is_ceo(auth.uid()));

-- Superviseur can view and approve Level 1 & 2
CREATE POLICY "Superviseur can view all expenses"
  ON public.expenses_controlled FOR SELECT
  USING (public.is_superviseur(auth.uid()));

CREATE POLICY "Superviseur can approve expenses"
  ON public.expenses_controlled FOR UPDATE
  USING (public.is_superviseur(auth.uid()));

-- Agent Admin can create and approve Level 1
CREATE POLICY "Agent Admin can create expenses"
  ON public.expenses_controlled FOR INSERT
  WITH CHECK (public.is_agent_administratif(auth.uid()) OR public.is_ceo(auth.uid()) OR public.is_superviseur(auth.uid()));

CREATE POLICY "Agent Admin can view expenses"
  ON public.expenses_controlled FOR SELECT
  USING (public.is_agent_administratif(auth.uid()));

CREATE POLICY "Agent Admin can update own expenses or approve level 1"
  ON public.expenses_controlled FOR UPDATE
  USING (
    public.is_agent_administratif(auth.uid()) AND 
    (requested_by = auth.uid() OR approval_level = 'level_1')
  );

-- Dir Ops can create and view expenses
CREATE POLICY "Dir Ops can create expenses"
  ON public.expenses_controlled FOR INSERT
  WITH CHECK (public.is_directeur_operations(auth.uid()));

CREATE POLICY "Dir Ops can view expenses"
  ON public.expenses_controlled FOR SELECT
  USING (public.is_directeur_operations(auth.uid()));

CREATE POLICY "Dir Ops can update own draft expenses"
  ON public.expenses_controlled FOR UPDATE
  USING (
    public.is_directeur_operations(auth.uid()) AND 
    requested_by = auth.uid() AND 
    statut = 'brouillon'
  );

-- Monthly caps - only CEO/Superviseur can manage
CREATE POLICY "CEO/Superviseur can manage monthly caps"
  ON public.monthly_expense_caps FOR ALL
  USING (public.is_ceo(auth.uid()) OR public.is_superviseur(auth.uid()));

CREATE POLICY "All authenticated can view monthly caps"
  ON public.monthly_expense_caps FOR SELECT
  USING (auth.role() = 'authenticated');

-- ==========================================================
-- TRIGGERS FOR FINANCIAL CONTROLS
-- ==========================================================

-- 1. Auto-calculate approval level based on amount
CREATE OR REPLACE FUNCTION public.calculate_expense_approval_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Set month_year for cap tracking
  NEW.month_year := to_char(COALESCE(NEW.requested_at, now()), 'YYYY-MM');
  
  -- Determine approval level based on amount
  IF NEW.montant_ttc <= 2000 THEN
    NEW.approval_level := 'level_1';
  ELSIF NEW.montant_ttc <= 20000 THEN
    NEW.approval_level := 'level_2';
  ELSE
    NEW.approval_level := 'level_3';
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER calculate_expense_level_trigger
  BEFORE INSERT OR UPDATE OF montant_ttc ON public.expenses_controlled
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_expense_approval_level();

-- 2. Enforce evidence requirements
CREATE OR REPLACE FUNCTION public.enforce_expense_evidence()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check when submitting (moving from brouillon to en_attente)
  IF NEW.statut = 'en_attente' AND (OLD IS NULL OR OLD.statut = 'brouillon') THEN
    -- No Ticket, No Money: require receipt photo
    IF NEW.receipt_photo_url IS NULL OR NEW.receipt_photo_url = '' THEN
      RAISE EXCEPTION 'EVIDENCE_REQUIRED: Justificatif obligatoire! Aucune dépense sans ticket/facture.';
    END IF;
    
    -- Fuel Protocol: require vehicle ID and kilometrage
    IF NEW.categorie = 'carburant' THEN
      IF NEW.vehicule_id IS NULL OR NEW.vehicule_id = '' THEN
        RAISE EXCEPTION 'FUEL_PROTOCOL: ID Véhicule obligatoire pour les dépenses carburant.';
      END IF;
      IF NEW.kilometrage IS NULL OR NEW.kilometrage <= 0 THEN
        RAISE EXCEPTION 'FUEL_PROTOCOL: Kilométrage obligatoire pour les dépenses carburant.';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER enforce_expense_evidence_trigger
  BEFORE INSERT OR UPDATE OF statut ON public.expenses_controlled
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_expense_evidence();

-- 3. Monthly Safety Valve - check and enforce 15K cap
CREATE OR REPLACE FUNCTION public.check_monthly_expense_cap()
RETURNS TRIGGER AS $$
DECLARE
  v_month_year TEXT;
  v_current_spent NUMERIC;
  v_cap NUMERIC := 15000;
  v_cap_exceeded BOOLEAN;
BEGIN
  -- Only check for Level 1 expenses being approved
  IF NEW.statut = 'approuve' AND NEW.approval_level = 'level_1' THEN
    v_month_year := NEW.month_year;
    
    -- Ensure monthly cap record exists
    INSERT INTO public.monthly_expense_caps (month_year, level1_cap, level1_spent)
    VALUES (v_month_year, 15000, 0)
    ON CONFLICT (month_year) DO NOTHING;
    
    -- Get current month's spending
    SELECT level1_spent, cap_exceeded INTO v_current_spent, v_cap_exceeded
    FROM public.monthly_expense_caps
    WHERE month_year = v_month_year;
    
    -- If cap already exceeded, block unless CEO/Superviseur override
    IF v_cap_exceeded = TRUE AND NEW.cap_override_by IS NULL THEN
      NEW.statut := 'bloque_plafond';
      NEW.was_blocked_by_cap := TRUE;
      
      -- Create alert for Superviseur
      INSERT INTO public.alertes_systeme (
        type_alerte, niveau, titre, message, 
        reference_id, reference_table, destinataire_role
      ) VALUES (
        'depense_bloquee', 'warning',
        '🚫 Dépense Bloquée - Plafond Mensuel Dépassé',
        'Dépense ' || NEW.reference || ' de ' || NEW.montant_ttc || ' MAD bloquée. Plafond Level 1 (' || v_cap || ' MAD) atteint.',
        NEW.id::TEXT, 'expenses_controlled', 'superviseur'
      );
      
      RETURN NEW;
    END IF;
    
    -- Check if this expense would exceed the cap
    IF (v_current_spent + NEW.montant_ttc) > v_cap AND NEW.cap_override_by IS NULL THEN
      -- Mark cap as exceeded
      UPDATE public.monthly_expense_caps
      SET cap_exceeded = TRUE, cap_exceeded_at = now(), updated_at = now()
      WHERE month_year = v_month_year;
      
      -- Block this expense
      NEW.statut := 'bloque_plafond';
      NEW.was_blocked_by_cap := TRUE;
      
      -- Create alert
      INSERT INTO public.alertes_systeme (
        type_alerte, niveau, titre, message,
        reference_id, reference_table, destinataire_role
      ) VALUES (
        'plafond_depasse', 'critical',
        '🚨 PLAFOND MENSUEL ATTEINT - Level 1',
        'Le plafond de ' || v_cap || ' MAD pour les dépenses Level 1 a été atteint ce mois. Toutes les nouvelles dépenses nécessitent approbation SUPERVISEUR.',
        v_month_year, 'monthly_expense_caps', 'ceo'
      );
      
      RETURN NEW;
    END IF;
    
    -- Update monthly spent
    UPDATE public.monthly_expense_caps
    SET level1_spent = level1_spent + NEW.montant_ttc, updated_at = now()
    WHERE month_year = v_month_year;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_monthly_cap_trigger
  BEFORE UPDATE OF statut ON public.expenses_controlled
  FOR EACH ROW
  WHEN (NEW.statut = 'approuve')
  EXECUTE FUNCTION public.check_monthly_expense_cap();

-- 4. Enforce approval chain
CREATE OR REPLACE FUNCTION public.enforce_expense_approval_chain()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_is_ceo BOOLEAN;
  v_is_superviseur BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  v_is_ceo := public.is_ceo(v_user_id);
  v_is_superviseur := public.is_superviseur(v_user_id);
  v_is_admin := public.is_agent_administratif(v_user_id);
  
  -- When approving an expense
  IF NEW.statut = 'approuve' AND OLD.statut != 'approuve' THEN
    
    -- Level 1: Admin, Superviseur, or CEO can approve
    IF NEW.approval_level = 'level_1' THEN
      IF NOT (v_is_admin OR v_is_superviseur OR v_is_ceo) THEN
        RAISE EXCEPTION 'CHAIN_OF_COMMAND: Seul Admin, Superviseur ou CEO peut approuver les dépenses Level 1';
      END IF;
      -- Record approval
      NEW.level1_approved_by := v_user_id;
      NEW.level1_approved_at := now();
    
    -- Level 2: Only Superviseur or CEO can approve
    ELSIF NEW.approval_level = 'level_2' THEN
      IF NOT (v_is_superviseur OR v_is_ceo) THEN
        RAISE EXCEPTION 'CHAIN_OF_COMMAND: Seul le Superviseur ou CEO peut approuver les dépenses Level 2 (2,001-20,000 MAD)';
      END IF;
      NEW.level2_approved_by := v_user_id;
      NEW.level2_approved_at := now();
    
    -- Level 3: CEO ONLY
    ELSIF NEW.approval_level = 'level_3' THEN
      IF NOT v_is_ceo THEN
        RAISE EXCEPTION 'CHAIN_OF_COMMAND: Seul le CEO peut approuver les dépenses Level 3 (>20,000 MAD)';
      END IF;
      NEW.level3_approved_by := v_user_id;
      NEW.level3_approved_at := now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER enforce_approval_chain_trigger
  BEFORE UPDATE OF statut ON public.expenses_controlled
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_expense_approval_chain();

-- ==========================================================
-- INDEXES FOR PERFORMANCE
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_expenses_month_year ON public.expenses_controlled(month_year);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses_controlled(statut);
CREATE INDEX IF NOT EXISTS idx_expenses_approval_level ON public.expenses_controlled(approval_level);
CREATE INDEX IF NOT EXISTS idx_expenses_requested_by ON public.expenses_controlled(requested_by);
CREATE INDEX IF NOT EXISTS idx_expenses_requested_at ON public.expenses_controlled(requested_at DESC);

-- Enable realtime for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses_controlled;
ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_expense_caps;

-- ==========================================================
-- STORAGE BUCKET FOR EXPENSE RECEIPTS
-- ==========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload expense receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'expense-receipts' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view expense receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'expense-receipts' AND
    auth.role() = 'authenticated'
  );