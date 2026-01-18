-- Create factures table to track invoices
CREATE TABLE public.factures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id TEXT NOT NULL UNIQUE,
  bl_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  formule_id TEXT NOT NULL,
  volume_m3 NUMERIC NOT NULL,
  prix_vente_m3 NUMERIC NOT NULL,
  total_ht NUMERIC NOT NULL,
  tva_pct NUMERIC NOT NULL DEFAULT 20,
  total_ttc NUMERIC NOT NULL,
  cur_reel NUMERIC,
  marge_brute_dh NUMERIC,
  marge_brute_pct NUMERIC,
  date_facture DATE NOT NULL DEFAULT CURRENT_DATE,
  statut TEXT NOT NULL DEFAULT 'emise',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "CEO can manage all factures"
ON public.factures FOR ALL
USING (is_ceo(auth.uid()))
WITH CHECK (is_ceo(auth.uid()));

CREATE POLICY "Agent Admin can create factures"
ON public.factures FOR INSERT
WITH CHECK (is_agent_administratif(auth.uid()));

CREATE POLICY "Agent Admin can view factures"
ON public.factures FOR SELECT
USING (is_agent_administratif(auth.uid()));

CREATE POLICY "Operations roles can view factures"
ON public.factures FOR SELECT
USING (is_directeur_operations(auth.uid()) OR is_commercial(auth.uid()));

-- Create trigger to lock prix_vente_m3 after facturation
CREATE OR REPLACE FUNCTION public.lock_prix_after_facture()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is facture, prevent prix_vente_m3 changes (except CEO)
  IF OLD.workflow_status = 'facture' AND NEW.prix_vente_m3 IS DISTINCT FROM OLD.prix_vente_m3 THEN
    IF NOT is_ceo(auth.uid()) THEN
      RAISE EXCEPTION 'Prix de vente verrouillé après facturation. Modification interdite.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_prix_lock
BEFORE UPDATE ON public.bons_livraison_reels
FOR EACH ROW
EXECUTE FUNCTION public.lock_prix_after_facture();

-- Add index for performance
CREATE INDEX idx_factures_bl_id ON public.factures(bl_id);
CREATE INDEX idx_factures_client_id ON public.factures(client_id);
CREATE INDEX idx_factures_date ON public.factures(date_facture);