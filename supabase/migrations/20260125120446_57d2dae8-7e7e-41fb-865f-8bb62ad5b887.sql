-- Create enum for contract types
CREATE TYPE public.contract_type AS ENUM ('camion_rental', 'trax_rental', 'terrain_rental');

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type public.contract_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  provider_name TEXT NOT NULL,
  monthly_amount NUMERIC(12,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  pdf_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  ras_applicable BOOLEAN DEFAULT false,
  ras_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies using correct function names
CREATE POLICY "Authenticated users can view contracts"
ON public.contracts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Management can insert contracts"
ON public.contracts FOR INSERT
TO authenticated
WITH CHECK (
  public.is_ceo(auth.uid()) OR 
  public.is_superviseur(auth.uid()) OR 
  public.is_agent_administratif(auth.uid())
);

CREATE POLICY "Management can update contracts"
ON public.contracts FOR UPDATE
TO authenticated
USING (
  public.is_ceo(auth.uid()) OR 
  public.is_superviseur(auth.uid()) OR 
  public.is_agent_administratif(auth.uid())
);

CREATE POLICY "CEO only can delete contracts"
ON public.contracts FOR DELETE
TO authenticated
USING (public.is_ceo(auth.uid()));

-- Add contract_id column to expenses_controlled
ALTER TABLE public.expenses_controlled 
ADD COLUMN contract_id UUID REFERENCES public.contracts(id);

-- Add ras_amount column for terrain rental tax liability
ALTER TABLE public.expenses_controlled 
ADD COLUMN ras_amount NUMERIC(12,2) DEFAULT 0;

-- Create trigger to auto-calculate RAS for terrain rentals
CREATE OR REPLACE FUNCTION public.calculate_ras_for_terrain_rental()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if expense is linked to a terrain rental contract
  IF NEW.contract_id IS NOT NULL THEN
    SELECT 
      CASE 
        WHEN c.contract_type = 'terrain_rental' AND c.ras_applicable 
        THEN NEW.montant_ht * (c.ras_rate / 100)
        ELSE 0 
      END
    INTO NEW.ras_amount
    FROM public.contracts c
    WHERE c.id = NEW.contract_id;
  ELSE
    NEW.ras_amount := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_calculate_ras
BEFORE INSERT OR UPDATE ON public.expenses_controlled
FOR EACH ROW
EXECUTE FUNCTION public.calculate_ras_for_terrain_rental();

-- Add audit trigger for contracts
CREATE TRIGGER log_contracts_changes
AFTER INSERT OR UPDATE OR DELETE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.log_table_changes_universal();

-- Create storage bucket for contract PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for contracts bucket
CREATE POLICY "Authenticated can view contract PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'contracts');

CREATE POLICY "Management can upload contract PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Management can update contract PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'contracts');

CREATE POLICY "CEO can delete contract PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contracts');