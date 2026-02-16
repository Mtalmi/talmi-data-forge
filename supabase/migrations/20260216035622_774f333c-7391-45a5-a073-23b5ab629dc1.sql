
-- Partial payments tracking
CREATE TABLE public.paiements_partiels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id TEXT NOT NULL,
  montant_paye NUMERIC NOT NULL,
  mode_paiement TEXT NOT NULL DEFAULT 'virement',
  reference_paiement TEXT,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  receipt_url TEXT,
  created_by TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.paiements_partiels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view partial payments"
  ON public.paiements_partiels FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert partial payments"
  ON public.paiements_partiels FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update partial payments"
  ON public.paiements_partiels FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Invoice reminder history / escalation tracking
CREATE TABLE public.relances_factures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  niveau_relance INTEGER NOT NULL DEFAULT 1,
  type_relance TEXT NOT NULL DEFAULT 'email',
  message TEXT,
  statut TEXT NOT NULL DEFAULT 'envoyee',
  date_relance TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_prochaine_relance TIMESTAMPTZ,
  envoyee_par TEXT,
  envoyee_par_name TEXT,
  reponse_client TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.relances_factures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reminders"
  ON public.relances_factures FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert reminders"
  ON public.relances_factures FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update reminders"
  ON public.relances_factures FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX idx_paiements_partiels_facture ON public.paiements_partiels(facture_id);
CREATE INDEX idx_relances_factures_facture ON public.relances_factures(facture_id);
CREATE INDEX idx_relances_factures_client ON public.relances_factures(client_id);

-- Trigger for updated_at on paiements_partiels
CREATE TRIGGER update_paiements_partiels_updated_at
  BEFORE UPDATE ON public.paiements_partiels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
