-- Create depenses table for expense tracking
CREATE TABLE public.depenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_depense DATE NOT NULL DEFAULT CURRENT_DATE,
  categorie TEXT NOT NULL CHECK (categorie IN ('Pièces Rechange', 'Carburant', 'Bureau', 'Divers')),
  montant NUMERIC NOT NULL CHECK (montant > 0),
  description TEXT,
  photo_recu_url TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "CEO can manage all depenses"
ON public.depenses FOR ALL
USING (is_ceo(auth.uid()))
WITH CHECK (is_ceo(auth.uid()));

CREATE POLICY "Agent Admin can create depenses"
ON public.depenses FOR INSERT
WITH CHECK (is_agent_administratif(auth.uid()));

CREATE POLICY "Agent Admin can view depenses"
ON public.depenses FOR SELECT
USING (is_agent_administratif(auth.uid()));

CREATE POLICY "Director can manage depenses"
ON public.depenses FOR ALL
USING (is_directeur_operations(auth.uid()))
WITH CHECK (is_directeur_operations(auth.uid()));

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- Storage policies for receipts bucket
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');

CREATE POLICY "CEO and Admin can delete receipts"
ON storage.objects FOR DELETE
USING (bucket_id = 'receipts' AND (is_ceo(auth.uid()) OR is_agent_administratif(auth.uid())));

-- Index for performance
CREATE INDEX idx_depenses_date ON public.depenses(date_depense);
CREATE INDEX idx_depenses_categorie ON public.depenses(categorie);