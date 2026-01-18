-- Create bank_transactions table for imported wire transfers
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_transaction DATE NOT NULL,
  date_valeur DATE,
  libelle TEXT NOT NULL,
  reference_bancaire TEXT,
  montant NUMERIC(12,2) NOT NULL,
  devise TEXT DEFAULT 'MAD',
  type_transaction TEXT DEFAULT 'credit', -- 'credit' or 'debit'
  statut_rapprochement TEXT DEFAULT 'non_rapproche', -- 'non_rapproche', 'rapproche', 'ignore'
  client_id_suggere TEXT,
  facture_id_suggeree TEXT,
  score_confiance NUMERIC(3,2), -- 0.00 to 1.00
  rapproche_par UUID REFERENCES auth.users(id),
  rapproche_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reconciliations table to track matches
CREATE TABLE public.rapprochements_bancaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.bank_transactions(id) ON DELETE CASCADE,
  facture_id TEXT,
  bl_id TEXT,
  client_id TEXT,
  montant_facture NUMERIC(12,2),
  montant_transaction NUMERIC(12,2),
  ecart_montant NUMERIC(12,2),
  type_match TEXT NOT NULL, -- 'automatique', 'manuel', 'partiel'
  score_confiance NUMERIC(3,2),
  motif_match TEXT, -- 'montant_exact', 'reference_client', 'proximite_date', 'combinaison'
  valide_par UUID REFERENCES auth.users(id),
  valide_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapprochements_bancaires ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_transactions
CREATE POLICY "Authenticated users can view bank transactions"
ON public.bank_transactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "CEO and accounting can insert bank transactions"
ON public.bank_transactions FOR INSERT
TO authenticated
WITH CHECK (
  public.is_ceo(auth.uid()) OR 
  public.is_accounting(auth.uid())
);

CREATE POLICY "CEO and accounting can update bank transactions"
ON public.bank_transactions FOR UPDATE
TO authenticated
USING (
  public.is_ceo(auth.uid()) OR 
  public.is_accounting(auth.uid())
);

CREATE POLICY "CEO can delete bank transactions"
ON public.bank_transactions FOR DELETE
TO authenticated
USING (public.is_ceo(auth.uid()));

-- RLS policies for rapprochements_bancaires
CREATE POLICY "Authenticated users can view reconciliations"
ON public.rapprochements_bancaires FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "CEO and accounting can insert reconciliations"
ON public.rapprochements_bancaires FOR INSERT
TO authenticated
WITH CHECK (
  public.is_ceo(auth.uid()) OR 
  public.is_accounting(auth.uid())
);

CREATE POLICY "CEO and accounting can update reconciliations"
ON public.rapprochements_bancaires FOR UPDATE
TO authenticated
USING (
  public.is_ceo(auth.uid()) OR 
  public.is_accounting(auth.uid())
);

-- Indexes for performance
CREATE INDEX idx_bank_transactions_date ON public.bank_transactions(date_transaction);
CREATE INDEX idx_bank_transactions_statut ON public.bank_transactions(statut_rapprochement);
CREATE INDEX idx_bank_transactions_montant ON public.bank_transactions(montant);
CREATE INDEX idx_rapprochements_transaction ON public.rapprochements_bancaires(transaction_id);
CREATE INDEX idx_rapprochements_facture ON public.rapprochements_bancaires(facture_id);

-- Trigger for updated_at
CREATE TRIGGER update_bank_transactions_updated_at
BEFORE UPDATE ON public.bank_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();