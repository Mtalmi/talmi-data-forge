-- Add fournisseur linking to contracts for proper supplier matching
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS fournisseur_id UUID REFERENCES public.fournisseurs(id),
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS equipment_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS equipment_description TEXT;

-- Create contract compliance view
CREATE OR REPLACE VIEW public.contract_compliance_summary AS
SELECT 
  f.id as fournisseur_id,
  f.nom_fournisseur,
  f.actif as fournisseur_actif,
  COUNT(c.id) as total_contracts,
  COUNT(CASE WHEN c.is_active = true THEN 1 END) as active_contracts,
  SUM(CASE WHEN c.is_active = true THEN c.monthly_amount ELSE 0 END) as monthly_total,
  SUM(CASE WHEN c.is_active = true THEN c.monthly_amount * 12 ELSE 0 END) as annual_total,
  BOOL_OR(c.id IS NOT NULL AND c.is_active = true) as has_active_contract,
  MIN(CASE WHEN c.is_active = true THEN c.end_date END) as nearest_expiration
FROM public.fournisseurs f
LEFT JOIN public.contracts c ON c.fournisseur_id = f.id
WHERE f.actif = true
GROUP BY f.id, f.nom_fournisseur, f.actif;

-- Create contract alerts table for expiration tracking
CREATE TABLE IF NOT EXISTS public.contract_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) NOT NULL,
  alert_type TEXT NOT NULL, -- 'expiring_30', 'expiring_7', 'expired', 'missing'
  alert_date DATE NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contract alerts"
ON public.contract_alerts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert contract alerts"
ON public.contract_alerts FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update contract alerts"
ON public.contract_alerts FOR UPDATE
TO authenticated
USING (true);

-- Create function to check and generate contract expiration alerts
CREATE OR REPLACE FUNCTION public.check_contract_expirations()
RETURNS void AS $$
DECLARE
  v_contract RECORD;
BEGIN
  FOR v_contract IN 
    SELECT id, title, provider_name, end_date 
    FROM public.contracts 
    WHERE is_active = true AND end_date IS NOT NULL
  LOOP
    -- 30-day warning
    IF v_contract.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN
      INSERT INTO public.contract_alerts (contract_id, alert_type, alert_date)
      VALUES (v_contract.id, 'expiring_30', v_contract.end_date)
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- 7-day warning
    IF v_contract.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN
      INSERT INTO public.contract_alerts (contract_id, alert_type, alert_date)
      VALUES (v_contract.id, 'expiring_7', v_contract.end_date)
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Expired
    IF v_contract.end_date < CURRENT_DATE THEN
      INSERT INTO public.contract_alerts (contract_id, alert_type, alert_date)
      VALUES (v_contract.id, 'expired', v_contract.end_date)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;