-- Create enum for cash source types
CREATE TYPE public.cash_source_type AS ENUM (
  'customer_payment',
  'ceo_injection',
  'refund',
  'loan',
  'other'
);

-- Create cash_deposits table for tracking all cash inflows
CREATE TABLE public.cash_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(20) NOT NULL DEFAULT ('DEP-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 4)),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  source_type cash_source_type NOT NULL,
  source_description TEXT,
  client_id VARCHAR(10) REFERENCES public.clients(client_id),
  facture_id VARCHAR(20),
  deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_photo_url TEXT NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraint: customer_payment must have client_id
  CONSTRAINT customer_payment_requires_client CHECK (
    source_type != 'customer_payment' OR client_id IS NOT NULL
  )
);

-- Enable RLS
ALTER TABLE public.cash_deposits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view cash deposits"
ON public.cash_deposits FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Management can insert cash deposits"
ON public.cash_deposits FOR INSERT
TO authenticated
WITH CHECK (
  public.is_ceo(auth.uid()) OR 
  public.is_superviseur(auth.uid()) OR 
  public.is_agent_administratif(auth.uid())
);

CREATE POLICY "CEO and Superviseur can update cash deposits"
ON public.cash_deposits FOR UPDATE
TO authenticated
USING (
  public.is_ceo(auth.uid()) OR 
  public.is_superviseur(auth.uid())
);

CREATE POLICY "Only CEO can delete cash deposits"
ON public.cash_deposits FOR DELETE
TO authenticated
USING (public.is_ceo(auth.uid()));

-- Create audit trigger for cash deposits
CREATE TRIGGER audit_cash_deposits_changes
AFTER INSERT OR UPDATE OR DELETE ON public.cash_deposits
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes_universal();

-- Add index for faster lookups
CREATE INDEX idx_cash_deposits_date ON public.cash_deposits(deposit_date DESC);
CREATE INDEX idx_cash_deposits_client ON public.cash_deposits(client_id);
CREATE INDEX idx_cash_deposits_source ON public.cash_deposits(source_type);