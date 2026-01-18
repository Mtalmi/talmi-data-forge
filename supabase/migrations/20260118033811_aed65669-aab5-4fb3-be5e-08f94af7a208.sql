-- Create Devis (Quotes) table
CREATE TABLE public.devis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  devis_id TEXT NOT NULL UNIQUE,
  client_id TEXT REFERENCES public.clients(client_id),
  formule_id TEXT NOT NULL REFERENCES public.formules_theoriques(formule_id),
  volume_m3 NUMERIC NOT NULL,
  distance_km NUMERIC NOT NULL DEFAULT 20,
  cut_per_m3 NUMERIC NOT NULL,
  fixed_cost_per_m3 NUMERIC NOT NULL DEFAULT 150,
  transport_extra_per_m3 NUMERIC NOT NULL DEFAULT 0,
  total_cost_per_m3 NUMERIC NOT NULL,
  margin_pct NUMERIC NOT NULL DEFAULT 25,
  prix_vente_m3 NUMERIC NOT NULL,
  total_ht NUMERIC NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente',
  validite_jours INTEGER NOT NULL DEFAULT 30,
  date_expiration DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Bons de Commande table
CREATE TABLE public.bons_commande (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bc_id TEXT NOT NULL UNIQUE,
  devis_id TEXT REFERENCES public.devis(devis_id),
  client_id TEXT NOT NULL REFERENCES public.clients(client_id),
  formule_id TEXT NOT NULL REFERENCES public.formules_theoriques(formule_id),
  volume_m3 NUMERIC NOT NULL,
  prix_vente_m3 NUMERIC NOT NULL,
  total_ht NUMERIC NOT NULL,
  statut TEXT NOT NULL DEFAULT 'pret_production',
  date_livraison_souhaitee DATE,
  adresse_livraison TEXT,
  notes TEXT,
  prix_verrouille BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bons_commande ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Devis
CREATE POLICY "Commercial and Admin can create devis"
ON public.devis FOR INSERT
WITH CHECK (is_ceo(auth.uid()) OR is_commercial(auth.uid()) OR is_agent_administratif(auth.uid()));

CREATE POLICY "Commercial roles can read devis"
ON public.devis FOR SELECT
USING (is_ceo(auth.uid()) OR is_commercial(auth.uid()) OR is_agent_administratif(auth.uid()) OR is_directeur_operations(auth.uid()));

CREATE POLICY "Commercial can update own devis"
ON public.devis FOR UPDATE
USING (is_ceo(auth.uid()) OR is_commercial(auth.uid()) OR is_agent_administratif(auth.uid()))
WITH CHECK (is_ceo(auth.uid()) OR is_commercial(auth.uid()) OR is_agent_administratif(auth.uid()));

CREATE POLICY "CEO can delete devis"
ON public.devis FOR DELETE
USING (is_ceo(auth.uid()));

-- RLS Policies for Bons de Commande
CREATE POLICY "Commercial and Admin can create BC"
ON public.bons_commande FOR INSERT
WITH CHECK (is_ceo(auth.uid()) OR is_commercial(auth.uid()) OR is_agent_administratif(auth.uid()));

CREATE POLICY "Operations roles can read BC"
ON public.bons_commande FOR SELECT
USING (is_ceo(auth.uid()) OR is_commercial(auth.uid()) OR is_agent_administratif(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_centraliste(auth.uid()));

CREATE POLICY "Admin can update BC status"
ON public.bons_commande FOR UPDATE
USING (is_ceo(auth.uid()) OR is_agent_administratif(auth.uid()) OR is_directeur_operations(auth.uid()))
WITH CHECK (is_ceo(auth.uid()) OR is_agent_administratif(auth.uid()) OR is_directeur_operations(auth.uid()));

-- Function to lock price on BC (only CEO can override)
CREATE OR REPLACE FUNCTION public.lock_bc_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.prix_verrouille = true AND NEW.prix_vente_m3 IS DISTINCT FROM OLD.prix_vente_m3 THEN
    IF NOT is_ceo(auth.uid()) THEN
      RAISE EXCEPTION 'Prix de vente verrouillé sur ce BC. Seul le CEO peut modifier.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_bc_price_lock
BEFORE UPDATE ON public.bons_commande
FOR EACH ROW
EXECUTE FUNCTION public.lock_bc_price();

-- Triggers for updated_at
CREATE TRIGGER update_devis_updated_at
BEFORE UPDATE ON public.devis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bons_commande_updated_at
BEFORE UPDATE ON public.bons_commande
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();