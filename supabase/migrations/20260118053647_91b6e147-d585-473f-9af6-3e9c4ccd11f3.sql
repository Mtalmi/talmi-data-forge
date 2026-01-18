-- Create suppliers table
CREATE TABLE public.fournisseurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_fournisseur TEXT NOT NULL UNIQUE,
  nom_fournisseur TEXT NOT NULL,
  contact_nom TEXT,
  contact_telephone TEXT,
  contact_email TEXT,
  adresse TEXT,
  ville TEXT,
  conditions_paiement TEXT DEFAULT 'Net 30',
  delai_livraison_jours INTEGER DEFAULT 3,
  note_qualite INTEGER CHECK (note_qualite >= 1 AND note_qualite <= 5),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchases/orders table
CREATE TABLE public.achats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_achat TEXT NOT NULL UNIQUE,
  fournisseur_id UUID NOT NULL REFERENCES public.fournisseurs(id),
  date_commande DATE NOT NULL DEFAULT CURRENT_DATE,
  date_livraison_prevue DATE,
  date_livraison_reelle DATE,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirmee', 'en_transit', 'livree', 'annulee')),
  montant_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
  tva_pct NUMERIC(5,2) DEFAULT 20,
  montant_ttc NUMERIC(12,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase line items table
CREATE TABLE public.lignes_achat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  achat_id UUID NOT NULL REFERENCES public.achats(id) ON DELETE CASCADE,
  materiau TEXT NOT NULL,
  quantite NUMERIC(12,2) NOT NULL,
  unite TEXT NOT NULL DEFAULT 'T',
  prix_unitaire NUMERIC(12,2) NOT NULL,
  montant_ligne NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier invoices table
CREATE TABLE public.factures_fournisseur (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_facture TEXT NOT NULL,
  fournisseur_id UUID NOT NULL REFERENCES public.fournisseurs(id),
  achat_id UUID REFERENCES public.achats(id),
  date_facture DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance DATE NOT NULL,
  montant_ht NUMERIC(12,2) NOT NULL,
  tva NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant_ttc NUMERIC(12,2) NOT NULL,
  montant_paye NUMERIC(12,2) DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'partiel', 'payee', 'en_retard')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier payments table
CREATE TABLE public.paiements_fournisseur (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id UUID NOT NULL REFERENCES public.factures_fournisseur(id),
  fournisseur_id UUID NOT NULL REFERENCES public.fournisseurs(id),
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  montant NUMERIC(12,2) NOT NULL,
  mode_paiement TEXT NOT NULL CHECK (mode_paiement IN ('virement', 'cheque', 'especes', 'traite')),
  reference_paiement TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reorder alerts table
CREATE TABLE public.alertes_reapprovisionnement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  materiau TEXT NOT NULL,
  seuil_alerte NUMERIC(12,2) NOT NULL,
  quantite_reorder NUMERIC(12,2) NOT NULL,
  fournisseur_prefere_id UUID REFERENCES public.fournisseurs(id),
  delai_commande_jours INTEGER DEFAULT 3,
  actif BOOLEAN DEFAULT true,
  derniere_alerte TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_achat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factures_fournisseur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements_fournisseur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertes_reapprovisionnement ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fournisseurs (suppliers)
CREATE POLICY "Authenticated users can view suppliers"
ON public.fournisseurs FOR SELECT TO authenticated
USING (true);

CREATE POLICY "CEO and accounting can manage suppliers"
ON public.fournisseurs FOR ALL TO authenticated
USING (public.is_ceo(auth.uid()) OR public.is_accounting(auth.uid()))
WITH CHECK (public.is_ceo(auth.uid()) OR public.is_accounting(auth.uid()));

-- RLS Policies for achats (purchases)
CREATE POLICY "Authenticated users can view purchases"
ON public.achats FOR SELECT TO authenticated
USING (true);

CREATE POLICY "CEO and accounting can manage purchases"
ON public.achats FOR ALL TO authenticated
USING (public.is_ceo(auth.uid()) OR public.is_accounting(auth.uid()))
WITH CHECK (public.is_ceo(auth.uid()) OR public.is_accounting(auth.uid()));

-- RLS Policies for lignes_achat
CREATE POLICY "Authenticated users can view purchase lines"
ON public.lignes_achat FOR SELECT TO authenticated
USING (true);

CREATE POLICY "CEO and accounting can manage purchase lines"
ON public.lignes_achat FOR ALL TO authenticated
USING (public.is_ceo(auth.uid()) OR public.is_accounting(auth.uid()))
WITH CHECK (public.is_ceo(auth.uid()) OR public.is_accounting(auth.uid()));

-- RLS Policies for factures_fournisseur
CREATE POLICY "Authenticated users can view supplier invoices"
ON public.factures_fournisseur FOR SELECT TO authenticated
USING (true);

CREATE POLICY "CEO and accounting can manage supplier invoices"
ON public.factures_fournisseur FOR ALL TO authenticated
USING (public.is_ceo(auth.uid()) OR public.is_accounting(auth.uid()))
WITH CHECK (public.is_ceo(auth.uid()) OR public.is_accounting(auth.uid()));

-- RLS Policies for paiements_fournisseur
CREATE POLICY "Authenticated users can view supplier payments"
ON public.paiements_fournisseur FOR SELECT TO authenticated
USING (true);

CREATE POLICY "CEO and accounting can manage supplier payments"
ON public.paiements_fournisseur FOR ALL TO authenticated
USING (public.is_ceo(auth.uid()) OR public.is_accounting(auth.uid()))
WITH CHECK (public.is_ceo(auth.uid()) OR public.is_accounting(auth.uid()));

-- RLS Policies for alertes_reapprovisionnement
CREATE POLICY "Authenticated users can view reorder alerts"
ON public.alertes_reapprovisionnement FOR SELECT TO authenticated
USING (true);

CREATE POLICY "CEO can manage reorder alerts"
ON public.alertes_reapprovisionnement FOR ALL TO authenticated
USING (public.is_ceo(auth.uid()))
WITH CHECK (public.is_ceo(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_fournisseurs_updated_at
BEFORE UPDATE ON public.fournisseurs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_achats_updated_at
BEFORE UPDATE ON public.achats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_factures_fournisseur_updated_at
BEFORE UPDATE ON public.factures_fournisseur
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alertes_reapprovisionnement_updated_at
BEFORE UPDATE ON public.alertes_reapprovisionnement
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate TTC on purchase
CREATE OR REPLACE FUNCTION public.calculate_achat_ttc()
RETURNS TRIGGER AS $$
BEGIN
  NEW.montant_ttc := NEW.montant_ht * (1 + COALESCE(NEW.tva_pct, 20) / 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER calculate_achat_ttc_trigger
BEFORE INSERT OR UPDATE ON public.achats
FOR EACH ROW EXECUTE FUNCTION public.calculate_achat_ttc();

-- Function to check stock levels and create alerts
CREATE OR REPLACE FUNCTION public.check_stock_alerts()
RETURNS TRIGGER AS $$
DECLARE
  v_alert RECORD;
BEGIN
  -- Check if stock fell below alert threshold
  FOR v_alert IN 
    SELECT ar.*, s.quantite_actuelle 
    FROM alertes_reapprovisionnement ar
    JOIN stocks s ON LOWER(ar.materiau) = LOWER(s.materiau)
    WHERE ar.actif = true 
    AND s.quantite_actuelle <= ar.seuil_alerte
    AND (ar.derniere_alerte IS NULL OR ar.derniere_alerte < now() - INTERVAL '24 hours')
  LOOP
    -- Create system alert
    INSERT INTO alertes_systeme (
      type_alerte, niveau, titre, message, reference_id, reference_table, destinataire_role
    ) VALUES (
      'stock_critique',
      'warning',
      'Stock bas - ' || v_alert.materiau,
      'Le stock de ' || v_alert.materiau || ' est à ' || v_alert.quantite_actuelle || '. Seuil d''alerte: ' || v_alert.seuil_alerte || '. Quantité à commander: ' || v_alert.quantite_reorder,
      v_alert.id::TEXT,
      'alertes_reapprovisionnement',
      'ceo'
    );
    
    -- Update last alert time
    UPDATE alertes_reapprovisionnement SET derniere_alerte = now() WHERE id = v_alert.id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_stock_alerts_trigger
AFTER UPDATE ON public.stocks
FOR EACH ROW EXECUTE FUNCTION public.check_stock_alerts();

-- Insert sample suppliers
INSERT INTO public.fournisseurs (code_fournisseur, nom_fournisseur, contact_nom, contact_telephone, contact_email, ville, conditions_paiement, note_qualite)
VALUES 
  ('FOUR-001', 'Cimenterie Atlas', 'Mohammed Alami', '0522-123456', 'contact@cimenterie-atlas.ma', 'Casablanca', 'Net 30', 5),
  ('FOUR-002', 'Carrières du Sud', 'Ahmed Benani', '0528-987654', 'ventes@carrieres-sud.ma', 'Agadir', 'Net 45', 4),
  ('FOUR-003', 'Sablières Maroc', 'Fatima Chraibi', '0524-456789', 'commercial@sablieres.ma', 'Marrakech', 'Net 30', 4),
  ('FOUR-004', 'ChimiPro Adjuvants', 'Youssef Tazi', '0537-321654', 'orders@chimipro.ma', 'Rabat', 'Net 60', 5);

-- Insert sample reorder alerts
INSERT INTO public.alertes_reapprovisionnement (materiau, seuil_alerte, quantite_reorder, fournisseur_prefere_id, delai_commande_jours)
SELECT 'Ciment', 50000, 100000, id, 2 FROM fournisseurs WHERE code_fournisseur = 'FOUR-001'
UNION ALL
SELECT 'Sable', 100, 300, id, 3 FROM fournisseurs WHERE code_fournisseur = 'FOUR-003'
UNION ALL
SELECT 'Gravette', 100, 300, id, 3 FROM fournisseurs WHERE code_fournisseur = 'FOUR-002'
UNION ALL
SELECT 'Adjuvant', 500, 2000, id, 5 FROM fournisseurs WHERE code_fournisseur = 'FOUR-004';