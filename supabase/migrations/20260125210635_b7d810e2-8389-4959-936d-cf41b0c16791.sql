-- Fixed Assets Management System
-- Complete asset registry with depreciation, lifecycle tracking, and audit compliance

-- Asset Categories Enum
CREATE TYPE public.asset_category AS ENUM (
  'batiments',
  'vehicules',
  'equipements',
  'mobilier',
  'informatique',
  'outils',
  'autre'
);

-- Depreciation Methods Enum
CREATE TYPE public.depreciation_method AS ENUM (
  'linear',
  'accelerated',
  'units_of_production'
);

-- Asset Status Enum
CREATE TYPE public.asset_status AS ENUM (
  'new',
  'active',
  'maintenance',
  'inactive',
  'pending_disposal',
  'disposed'
);

-- Main Fixed Assets Table
CREATE TABLE public.fixed_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT NOT NULL UNIQUE,
  
  category public.asset_category NOT NULL,
  description TEXT NOT NULL,
  serial_number TEXT,
  barcode TEXT,
  
  purchase_date DATE NOT NULL,
  purchase_price NUMERIC(15,2) NOT NULL CHECK (purchase_price > 0),
  supplier_id UUID REFERENCES public.fournisseurs(id),
  invoice_number TEXT,
  invoice_url TEXT,
  
  location TEXT NOT NULL DEFAULT 'Non spécifié',
  responsible_person TEXT,
  
  warranty_end_date DATE,
  warranty_certificate_url TEXT,
  
  useful_life_months INTEGER NOT NULL CHECK (useful_life_months > 0),
  depreciation_method public.depreciation_method NOT NULL DEFAULT 'linear',
  residual_value NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (residual_value >= 0),
  depreciation_start_date DATE NOT NULL,
  
  accumulated_depreciation NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_book_value NUMERIC(15,2) NOT NULL,
  monthly_depreciation NUMERIC(15,2) NOT NULL,
  
  status public.asset_status NOT NULL DEFAULT 'new',
  
  photos JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  updated_by_name TEXT,
  
  CONSTRAINT valid_residual_value CHECK (residual_value < purchase_price)
);

-- Depreciation Schedule Table
CREATE TABLE public.asset_depreciation_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
  
  period_date DATE NOT NULL,
  period_number INTEGER NOT NULL,
  
  depreciation_amount NUMERIC(15,2) NOT NULL,
  accumulated_depreciation NUMERIC(15,2) NOT NULL,
  net_book_value NUMERIC(15,2) NOT NULL,
  
  is_posted BOOLEAN DEFAULT FALSE,
  posted_at TIMESTAMPTZ,
  posted_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(asset_id, period_date)
);

-- Asset Maintenance Records
CREATE TABLE public.asset_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
  
  maintenance_date DATE NOT NULL,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  performed_by TEXT,
  
  next_maintenance_date DATE,
  next_maintenance_type TEXT,
  
  invoice_url TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT
);

-- Asset Disposal Records
CREATE TABLE public.asset_disposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
  
  disposal_date DATE NOT NULL,
  disposal_type TEXT NOT NULL,
  disposal_reason TEXT,
  
  net_book_value_at_disposal NUMERIC(15,2) NOT NULL,
  disposal_price NUMERIC(15,2) DEFAULT 0,
  gain_loss NUMERIC(15,2) NOT NULL,
  
  buyer_name TEXT,
  buyer_contact TEXT,
  
  invoice_url TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  
  approved_by UUID,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT
);

-- Physical Inventory Records
CREATE TABLE public.asset_inventory_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  inventory_date DATE NOT NULL,
  inventory_year INTEGER NOT NULL,
  
  total_assets_system INTEGER NOT NULL DEFAULT 0,
  total_assets_found INTEGER NOT NULL DEFAULT 0,
  missing_count INTEGER NOT NULL DEFAULT 0,
  extra_count INTEGER NOT NULL DEFAULT 0,
  location_errors INTEGER NOT NULL DEFAULT 0,
  condition_issues INTEGER NOT NULL DEFAULT 0,
  
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  status TEXT NOT NULL DEFAULT 'in_progress',
  
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID,
  reconciled_by_name TEXT,
  reconciliation_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT
);

-- Function to generate asset ID
CREATE OR REPLACE FUNCTION public.generate_asset_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  sequence_num INTEGER;
  new_id TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(asset_id, '^ASS-' || current_year || '-', ''), asset_id)::INTEGER
  ), 0) + 1
  INTO sequence_num
  FROM public.fixed_assets
  WHERE asset_id LIKE 'ASS-' || current_year || '-%';
  
  new_id := 'ASS-' || current_year || '-' || LPAD(sequence_num::TEXT, 3, '0');
  RETURN new_id;
END;
$$;

-- Function to calculate linear depreciation
CREATE OR REPLACE FUNCTION public.calculate_monthly_depreciation(
  p_purchase_price NUMERIC,
  p_residual_value NUMERIC,
  p_useful_life_months INTEGER,
  p_method public.depreciation_method DEFAULT 'linear'
)
RETURNS NUMERIC
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF p_method = 'linear' THEN
    RETURN ROUND((p_purchase_price - p_residual_value) / p_useful_life_months, 2);
  ELSIF p_method = 'accelerated' THEN
    RETURN ROUND((p_purchase_price - p_residual_value) * 2 / p_useful_life_months, 2);
  ELSE
    RETURN ROUND((p_purchase_price - p_residual_value) / p_useful_life_months, 2);
  END IF;
END;
$$;

-- Trigger to auto-generate asset_id and calculate depreciation values
CREATE OR REPLACE FUNCTION public.fixed_assets_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.asset_id IS NULL OR NEW.asset_id = '' THEN
    NEW.asset_id := public.generate_asset_id();
  END IF;
  
  NEW.monthly_depreciation := public.calculate_monthly_depreciation(
    NEW.purchase_price,
    NEW.residual_value,
    NEW.useful_life_months,
    NEW.depreciation_method
  );
  
  NEW.net_book_value := NEW.purchase_price;
  
  IF NEW.depreciation_start_date IS NULL THEN
    NEW.depreciation_start_date := NEW.purchase_date;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER fixed_assets_before_insert_trigger
  BEFORE INSERT ON public.fixed_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.fixed_assets_before_insert();

-- Function to check for duplicate assets
CREATE OR REPLACE FUNCTION public.check_duplicate_asset(
  p_serial_number TEXT,
  p_purchase_date DATE,
  p_supplier_id UUID,
  p_purchase_price NUMERIC,
  p_category public.asset_category,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS TABLE(
  is_duplicate BOOLEAN,
  duplicate_id UUID,
  duplicate_asset_id TEXT,
  match_type TEXT
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF p_serial_number IS NOT NULL AND p_serial_number != '' THEN
    RETURN QUERY
    SELECT 
      TRUE as is_duplicate,
      fa.id as duplicate_id,
      fa.asset_id as duplicate_asset_id,
      'serial_number' as match_type
    FROM public.fixed_assets fa
    WHERE fa.serial_number = p_serial_number
      AND (p_exclude_id IS NULL OR fa.id != p_exclude_id)
    LIMIT 1;
    
    IF FOUND THEN RETURN; END IF;
  END IF;
  
  RETURN QUERY
  SELECT 
    TRUE as is_duplicate,
    fa.id as duplicate_id,
    fa.asset_id as duplicate_asset_id,
    'purchase_match' as match_type
  FROM public.fixed_assets fa
  WHERE fa.purchase_date = p_purchase_date
    AND fa.supplier_id = p_supplier_id
    AND fa.purchase_price = p_purchase_price
    AND fa.category = p_category
    AND (p_exclude_id IS NULL OR fa.id != p_exclude_id)
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$;

-- Function to generate depreciation schedule
CREATE OR REPLACE FUNCTION public.generate_depreciation_schedule(p_asset_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_asset RECORD;
  v_period_date DATE;
  v_accumulated NUMERIC := 0;
  v_nbv NUMERIC;
  v_period_num INTEGER := 1;
  v_months_generated INTEGER := 0;
BEGIN
  SELECT * INTO v_asset FROM public.fixed_assets WHERE id = p_asset_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  DELETE FROM public.asset_depreciation_schedule WHERE asset_id = p_asset_id;
  
  v_period_date := date_trunc('month', v_asset.depreciation_start_date)::DATE;
  v_nbv := v_asset.purchase_price;
  
  WHILE v_period_num <= v_asset.useful_life_months LOOP
    v_accumulated := v_accumulated + v_asset.monthly_depreciation;
    v_nbv := GREATEST(v_asset.purchase_price - v_accumulated, v_asset.residual_value);
    
    INSERT INTO public.asset_depreciation_schedule (
      asset_id,
      period_date,
      period_number,
      depreciation_amount,
      accumulated_depreciation,
      net_book_value
    ) VALUES (
      p_asset_id,
      v_period_date,
      v_period_num,
      v_asset.monthly_depreciation,
      v_accumulated,
      v_nbv
    );
    
    v_period_date := v_period_date + INTERVAL '1 month';
    v_period_num := v_period_num + 1;
    v_months_generated := v_months_generated + 1;
  END LOOP;
  
  RETURN v_months_generated;
END;
$$;

-- Function to get asset summary by category
CREATE OR REPLACE FUNCTION public.get_fixed_assets_summary()
RETURNS TABLE(
  category public.asset_category,
  asset_count BIGINT,
  gross_value NUMERIC,
  accumulated_depreciation NUMERIC,
  net_value NUMERIC
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    fa.category,
    COUNT(*) as asset_count,
    SUM(fa.purchase_price) as gross_value,
    SUM(fa.accumulated_depreciation) as accumulated_depreciation,
    SUM(fa.net_book_value) as net_value
  FROM public.fixed_assets fa
  WHERE fa.status != 'disposed'
  GROUP BY fa.category
  ORDER BY fa.category;
$$;

-- Function to update accumulated depreciation (run monthly)
CREATE OR REPLACE FUNCTION public.update_asset_depreciation()
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_current_month DATE;
  v_updated INTEGER := 0;
BEGIN
  v_current_month := date_trunc('month', CURRENT_DATE)::DATE;
  
  UPDATE public.fixed_assets fa
  SET 
    accumulated_depreciation = COALESCE((
      SELECT MAX(ads.accumulated_depreciation)
      FROM public.asset_depreciation_schedule ads
      WHERE ads.asset_id = fa.id
        AND ads.period_date <= v_current_month
    ), 0),
    net_book_value = fa.purchase_price - COALESCE((
      SELECT MAX(ads.accumulated_depreciation)
      FROM public.asset_depreciation_schedule ads
      WHERE ads.asset_id = fa.id
        AND ads.period_date <= v_current_month
    ), 0),
    updated_at = now()
  WHERE fa.status IN ('new', 'active', 'maintenance', 'inactive');
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

-- Trigger to generate schedule after asset creation
CREATE OR REPLACE FUNCTION public.fixed_assets_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.generate_depreciation_schedule(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER fixed_assets_after_insert_trigger
  AFTER INSERT ON public.fixed_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.fixed_assets_after_insert();

-- Audit trigger for fixed assets
CREATE OR REPLACE FUNCTION public.log_fixed_asset_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_superviseur (
    user_id,
    user_name,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    COALESCE(NEW.updated_by_name, NEW.created_by_name, 'System'),
    TG_OP,
    'fixed_assets',
    COALESCE(NEW.id, OLD.id)::TEXT,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER fixed_assets_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.fixed_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_fixed_asset_changes();

-- Enable RLS
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_depreciation_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_disposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_inventory_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies using has_role_v2 function
CREATE POLICY "Authenticated users can view fixed assets"
  ON public.fixed_assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management roles can insert fixed assets"
  ON public.fixed_assets FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role_v2(auth.uid(), 'ceo') OR
    public.has_role_v2(auth.uid(), 'superviseur') OR
    public.has_role_v2(auth.uid(), 'agent_administratif') OR
    public.has_role_v2(auth.uid(), 'responsable_technique')
  );

CREATE POLICY "Management roles can update fixed assets"
  ON public.fixed_assets FOR UPDATE
  TO authenticated
  USING (
    public.has_role_v2(auth.uid(), 'ceo') OR
    public.has_role_v2(auth.uid(), 'superviseur') OR
    public.has_role_v2(auth.uid(), 'agent_administratif') OR
    public.has_role_v2(auth.uid(), 'responsable_technique')
  );

CREATE POLICY "CEO and superviseur can delete fixed assets"
  ON public.fixed_assets FOR DELETE
  TO authenticated
  USING (
    public.has_role_v2(auth.uid(), 'ceo') OR
    public.has_role_v2(auth.uid(), 'superviseur')
  );

-- Depreciation schedule policies
CREATE POLICY "Authenticated users can view depreciation schedule"
  ON public.asset_depreciation_schedule FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can manage depreciation schedule"
  ON public.asset_depreciation_schedule FOR ALL
  TO authenticated
  USING (
    public.has_role_v2(auth.uid(), 'ceo') OR
    public.has_role_v2(auth.uid(), 'superviseur') OR
    public.has_role_v2(auth.uid(), 'agent_administratif')
  );

-- Maintenance policies
CREATE POLICY "Authenticated users can view maintenance"
  ON public.asset_maintenance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can manage maintenance"
  ON public.asset_maintenance FOR ALL
  TO authenticated
  USING (
    public.has_role_v2(auth.uid(), 'ceo') OR
    public.has_role_v2(auth.uid(), 'superviseur') OR
    public.has_role_v2(auth.uid(), 'agent_administratif') OR
    public.has_role_v2(auth.uid(), 'responsable_technique')
  );

-- Disposal policies
CREATE POLICY "Authenticated users can view disposals"
  ON public.asset_disposals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "CEO and superviseur can manage disposals"
  ON public.asset_disposals FOR ALL
  TO authenticated
  USING (
    public.has_role_v2(auth.uid(), 'ceo') OR
    public.has_role_v2(auth.uid(), 'superviseur')
  );

-- Inventory check policies
CREATE POLICY "Authenticated users can view inventory checks"
  ON public.asset_inventory_checks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can manage inventory checks"
  ON public.asset_inventory_checks FOR ALL
  TO authenticated
  USING (
    public.has_role_v2(auth.uid(), 'ceo') OR
    public.has_role_v2(auth.uid(), 'superviseur') OR
    public.has_role_v2(auth.uid(), 'agent_administratif')
  );

-- Indexes for performance
CREATE INDEX idx_fixed_assets_category ON public.fixed_assets(category);
CREATE INDEX idx_fixed_assets_status ON public.fixed_assets(status);
CREATE INDEX idx_fixed_assets_serial_number ON public.fixed_assets(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX idx_depreciation_schedule_asset ON public.asset_depreciation_schedule(asset_id);
CREATE INDEX idx_depreciation_schedule_period ON public.asset_depreciation_schedule(period_date);
CREATE INDEX idx_asset_maintenance_asset ON public.asset_maintenance(asset_id);
CREATE INDEX idx_asset_maintenance_date ON public.asset_maintenance(maintenance_date);
CREATE INDEX idx_asset_disposals_asset ON public.asset_disposals(asset_id);