-- Create the missing workflow tables and add new columns

-- 1. Create approvals table for CEO approvals
CREATE TABLE public.approbations_ceo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_approbation TEXT NOT NULL CHECK (type_approbation IN ('credit', 'prix', 'derogation', 'annulation')),
    reference_id TEXT NOT NULL,
    reference_table TEXT NOT NULL,
    demande_par UUID REFERENCES auth.users(id) NOT NULL,
    demande_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuve', 'rejete')),
    approuve_par UUID REFERENCES auth.users(id),
    approuve_at TIMESTAMP WITH TIME ZONE,
    commentaire TEXT,
    montant NUMERIC,
    details JSONB
);

-- 2. Create alerts table
CREATE TABLE public.alertes_systeme (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_alerte TEXT NOT NULL CHECK (type_alerte IN ('fuite', 'marge', 'credit', 'planification', 'retard', 'technique')),
    niveau TEXT NOT NULL CHECK (niveau IN ('info', 'warning', 'critical')),
    titre TEXT NOT NULL,
    message TEXT NOT NULL,
    reference_id TEXT,
    reference_table TEXT,
    destinataire_role TEXT,
    lu BOOLEAN DEFAULT FALSE,
    lu_par UUID REFERENCES auth.users(id),
    lu_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Add workflow columns to bons_livraison_reels
ALTER TABLE public.bons_livraison_reels 
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'planification' CHECK (workflow_status IN ('planification', 'production', 'validation_technique', 'en_livraison', 'livre', 'facture', 'annule')),
ADD COLUMN IF NOT EXISTS toupie_assignee TEXT,
ADD COLUMN IF NOT EXISTS heure_depart_prevue TIME,
ADD COLUMN IF NOT EXISTS heure_depart_reelle TIME,
ADD COLUMN IF NOT EXISTS temps_attente_site NUMERIC,
ADD COLUMN IF NOT EXISTS justification_ecart TEXT,
ADD COLUMN IF NOT EXISTS validation_technique BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS prix_vente_m3 NUMERIC,
ADD COLUMN IF NOT EXISTS marge_brute_pct NUMERIC,
ADD COLUMN IF NOT EXISTS alerte_marge BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS facture_generee BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS facture_id TEXT,
ADD COLUMN IF NOT EXISTS assignation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS alerte_planification BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS annule_par UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS annule_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS raison_annulation TEXT;

-- 4. Add credit tracking to clients
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS limite_credit_dh NUMERIC DEFAULT 50000,
ADD COLUMN IF NOT EXISTS solde_du NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_bloque BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS derniere_commande_at TIMESTAMP WITH TIME ZONE;

-- 5. Enable RLS
ALTER TABLE public.approbations_ceo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertes_systeme ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for approbations_ceo
CREATE POLICY "CEO can manage all approvals"
    ON public.approbations_ceo FOR ALL
    TO authenticated
    USING (public.is_ceo(auth.uid()))
    WITH CHECK (public.is_ceo(auth.uid()));

CREATE POLICY "Users can view their own requests"
    ON public.approbations_ceo FOR SELECT
    TO authenticated
    USING (demande_par = auth.uid());

CREATE POLICY "Authenticated users can create approval requests"
    ON public.approbations_ceo FOR INSERT
    TO authenticated
    WITH CHECK (demande_par = auth.uid());

-- 7. RLS Policies for alertes_systeme
CREATE POLICY "CEO can view all alerts"
    ON public.alertes_systeme FOR SELECT
    TO authenticated
    USING (public.is_ceo(auth.uid()));

CREATE POLICY "System can create alerts"
    ON public.alertes_systeme FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

CREATE POLICY "Users can mark their alerts as read"
    ON public.alertes_systeme FOR UPDATE
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- 8. Update BL policies for workflow roles
DROP POLICY IF EXISTS "CEO and Operator can insert bons" ON public.bons_livraison_reels;
DROP POLICY IF EXISTS "Operator can update own bons within 1 hour" ON public.bons_livraison_reels;
DROP POLICY IF EXISTS "Accounting can update payment status" ON public.bons_livraison_reels;
DROP POLICY IF EXISTS "CEO can delete bons" ON public.bons_livraison_reels;

CREATE POLICY "Admin and Directeur can insert bons"
    ON public.bons_livraison_reels FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_ceo(auth.uid()) OR 
        public.is_agent_administratif(auth.uid()) OR 
        public.is_directeur_operations(auth.uid())
    );

CREATE POLICY "Centraliste can update consumption"
    ON public.bons_livraison_reels FOR UPDATE
    TO authenticated
    USING (public.is_centraliste(auth.uid()))
    WITH CHECK (public.is_centraliste(auth.uid()));

CREATE POLICY "Responsable Technique can validate"
    ON public.bons_livraison_reels FOR UPDATE
    TO authenticated
    USING (public.is_responsable_technique(auth.uid()))
    WITH CHECK (public.is_responsable_technique(auth.uid()));

CREATE POLICY "Superviseur can update logistics"
    ON public.bons_livraison_reels FOR UPDATE
    TO authenticated
    USING (public.is_superviseur(auth.uid()))
    WITH CHECK (public.is_superviseur(auth.uid()));

CREATE POLICY "Directeur can update assignment"
    ON public.bons_livraison_reels FOR UPDATE
    TO authenticated
    USING (public.is_directeur_operations(auth.uid()))
    WITH CHECK (public.is_directeur_operations(auth.uid()));

CREATE POLICY "Agent Admin can update payment and invoice"
    ON public.bons_livraison_reels FOR UPDATE
    TO authenticated
    USING (public.is_agent_administratif(auth.uid()))
    WITH CHECK (public.is_agent_administratif(auth.uid()));

-- 9. Update clients policies
DROP POLICY IF EXISTS "CEO can delete clients" ON public.clients;
DROP POLICY IF EXISTS "CEO and Commercial can insert clients" ON public.clients;
DROP POLICY IF EXISTS "CEO and Commercial can update clients" ON public.clients;

CREATE POLICY "Admin and Commercial can insert clients"
    ON public.clients FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_ceo(auth.uid()) OR 
        public.is_agent_administratif(auth.uid()) OR 
        public.is_commercial(auth.uid())
    );

CREATE POLICY "Admin and Commercial can update clients"
    ON public.clients FOR UPDATE
    TO authenticated
    USING (
        public.is_ceo(auth.uid()) OR 
        public.is_agent_administratif(auth.uid()) OR 
        public.is_commercial(auth.uid())
    )
    WITH CHECK (
        public.is_ceo(auth.uid()) OR 
        public.is_agent_administratif(auth.uid()) OR 
        public.is_commercial(auth.uid())
    );

-- 10. Prix only for CEO
DROP POLICY IF EXISTS "All authenticated can read prix" ON public.prix_achat_actuels;

CREATE POLICY "CEO can read prix"
    ON public.prix_achat_actuels FOR SELECT
    TO authenticated
    USING (public.is_ceo(auth.uid()));

-- 11. Indexes
CREATE INDEX IF NOT EXISTS idx_approbations_statut ON public.approbations_ceo(statut);
CREATE INDEX IF NOT EXISTS idx_alertes_lu ON public.alertes_systeme(lu);
CREATE INDEX IF NOT EXISTS idx_bons_workflow ON public.bons_livraison_reels(workflow_status);
CREATE INDEX IF NOT EXISTS idx_clients_credit ON public.clients(credit_bloque);