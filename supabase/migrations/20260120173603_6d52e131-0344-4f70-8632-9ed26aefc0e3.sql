-- =====================================================
-- PLANT COMMAND CENTER - Full Monitoring System
-- =====================================================

-- 1. EQUIPEMENTS - All plant machinery
CREATE TABLE public.equipements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code_equipement TEXT NOT NULL UNIQUE,
    nom TEXT NOT NULL,
    type TEXT NOT NULL, -- 'malaxeur', 'silo', 'convoyeur', 'balance', 'pompe', 'compresseur', 'generateur'
    marque TEXT,
    modele TEXT,
    numero_serie TEXT,
    date_installation DATE,
    statut TEXT NOT NULL DEFAULT 'operationnel', -- 'operationnel', 'maintenance', 'panne', 'hors_service'
    criticite TEXT NOT NULL DEFAULT 'normal', -- 'critique', 'important', 'normal'
    derniere_maintenance_at TIMESTAMP WITH TIME ZONE,
    prochaine_maintenance_at TIMESTAMP WITH TIME ZONE,
    dernier_etalonnage_at TIMESTAMP WITH TIME ZONE,
    prochain_etalonnage_at TIMESTAMP WITH TIME ZONE,
    heures_fonctionnement NUMERIC DEFAULT 0,
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. DAILY CLEANING CHECKLISTS - With mandatory photos
CREATE TABLE public.nettoyage_quotidien (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date_nettoyage DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Malaxeur cleaning
    malaxeur_nettoye BOOLEAN NOT NULL DEFAULT false,
    malaxeur_photo_url TEXT, -- MANDATORY
    malaxeur_heure TIME,
    malaxeur_commentaire TEXT,
    -- Goulotte (chute) cleaning
    goulotte_nettoyee BOOLEAN NOT NULL DEFAULT false,
    goulotte_photo_url TEXT, -- MANDATORY
    goulotte_heure TIME,
    goulotte_commentaire TEXT,
    -- Leftover cement removal
    residus_ciment_enleves BOOLEAN NOT NULL DEFAULT false,
    residus_photo_url TEXT, -- MANDATORY
    residus_heure TIME,
    residus_commentaire TEXT,
    -- General site cleaning
    zone_centrale_propre BOOLEAN NOT NULL DEFAULT false,
    zone_photo_url TEXT,
    -- Silos check
    silos_inspectes BOOLEAN NOT NULL DEFAULT false,
    silos_photo_url TEXT,
    -- Convoyeurs
    convoyeurs_nettoyes BOOLEAN NOT NULL DEFAULT false,
    convoyeurs_photo_url TEXT,
    -- Water system
    systeme_eau_verifie BOOLEAN NOT NULL DEFAULT false,
    -- Validation
    valide BOOLEAN NOT NULL DEFAULT false,
    valide_par UUID,
    valide_at TIMESTAMP WITH TIME ZONE,
    score_proprete INTEGER, -- 0-100 score assigned by validator
    -- Meta
    effectue_par UUID NOT NULL,
    notes_generales TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    -- One entry per day constraint
    CONSTRAINT unique_nettoyage_date UNIQUE (date_nettoyage)
);

-- 3. MAINTENANCE RECORDS
CREATE TABLE public.maintenance_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    equipement_id UUID NOT NULL REFERENCES public.equipements(id) ON DELETE CASCADE,
    type_maintenance TEXT NOT NULL, -- 'preventive', 'corrective', 'urgente'
    description TEXT NOT NULL,
    date_planifiee DATE,
    date_executee DATE,
    duree_heures NUMERIC,
    cout_pieces NUMERIC DEFAULT 0,
    cout_main_oeuvre NUMERIC DEFAULT 0,
    cout_total NUMERIC GENERATED ALWAYS AS (cout_pieces + cout_main_oeuvre) STORED,
    pieces_utilisees TEXT[],
    executant_interne TEXT,
    prestataire_externe TEXT,
    statut TEXT NOT NULL DEFAULT 'planifie', -- 'planifie', 'en_cours', 'termine', 'reporte'
    rapport_intervention TEXT,
    photos_avant TEXT[],
    photos_apres TEXT[],
    prochaine_maintenance_jours INTEGER,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. CALIBRATION / ÉTALONNAGE RECORDS
CREATE TABLE public.etalonnages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    equipement_id UUID NOT NULL REFERENCES public.equipements(id) ON DELETE CASCADE,
    type_etalonnage TEXT NOT NULL, -- 'balance_ciment', 'balance_agregats', 'debitmetre_eau', 'doseur_adjuvant'
    date_etalonnage DATE NOT NULL DEFAULT CURRENT_DATE,
    technicien TEXT NOT NULL,
    organisme_certificateur TEXT,
    reference_certificat TEXT,
    -- Measurements
    valeur_reference NUMERIC,
    valeur_mesuree NUMERIC,
    ecart_pct NUMERIC,
    tolerance_pct NUMERIC DEFAULT 1,
    conforme BOOLEAN NOT NULL DEFAULT true,
    -- Actions
    ajustements_effectues TEXT,
    certificat_url TEXT,
    prochaine_date DATE,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. PLANT INCIDENTS (breakdowns, safety issues)
CREATE TABLE public.incidents_centrale (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    equipement_id UUID REFERENCES public.equipements(id) ON DELETE SET NULL,
    type_incident TEXT NOT NULL, -- 'panne', 'accident', 'securite', 'qualite', 'environnement'
    niveau_gravite TEXT NOT NULL DEFAULT 'mineur', -- 'critique', 'majeur', 'mineur'
    titre TEXT NOT NULL,
    description TEXT NOT NULL,
    date_incident TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    duree_arret_heures NUMERIC,
    impact_production BOOLEAN DEFAULT false,
    volume_perdu_m3 NUMERIC DEFAULT 0,
    -- Resolution
    resolu BOOLEAN NOT NULL DEFAULT false,
    resolu_at TIMESTAMP WITH TIME ZONE,
    resolu_par UUID,
    resolution_description TEXT,
    -- Root cause analysis
    cause_racine TEXT,
    actions_correctives TEXT,
    -- Evidence
    photos TEXT[],
    -- Meta
    signale_par UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. SAFETY INSPECTIONS
CREATE TABLE public.inspections_securite (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date_inspection DATE NOT NULL DEFAULT CURRENT_DATE,
    type_inspection TEXT NOT NULL, -- 'quotidienne', 'hebdomadaire', 'mensuelle', 'audit'
    inspecteur UUID NOT NULL,
    -- Checklist items (all scored 0-10)
    extincteurs_ok BOOLEAN DEFAULT false,
    issues_secours_ok BOOLEAN DEFAULT false,
    epi_disponibles BOOLEAN DEFAULT false,
    signalisation_ok BOOLEAN DEFAULT false,
    eclairage_ok BOOLEAN DEFAULT false,
    garde_corps_ok BOOLEAN DEFAULT false,
    sol_propre_antiderapant BOOLEAN DEFAULT false,
    stockage_produits_ok BOOLEAN DEFAULT false,
    -- Overall
    score_global INTEGER, -- 0-100
    non_conformites_detectees INTEGER DEFAULT 0,
    non_conformites_details TEXT,
    actions_requises TEXT,
    photos TEXT[],
    -- Validation
    valide BOOLEAN NOT NULL DEFAULT false,
    valide_par UUID,
    valide_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. ENERGY & CONSUMPTION TRACKING
CREATE TABLE public.consommation_energie (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date_releve DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Electricity
    compteur_electrique_kwh NUMERIC,
    cout_electricite_dh NUMERIC,
    -- Water
    compteur_eau_m3 NUMERIC,
    cout_eau_dh NUMERIC,
    -- Fuel (generator, etc)
    carburant_groupe_l NUMERIC,
    cout_carburant_dh NUMERIC,
    -- Calculated per m³ produced
    volume_produit_m3 NUMERIC,
    kwh_par_m3 NUMERIC,
    eau_par_m3 NUMERIC,
    -- Notes
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_energie_date UNIQUE (date_releve)
);

-- Enable RLS on all tables
ALTER TABLE public.equipements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nettoyage_quotidien ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etalonnages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents_centrale ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections_securite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consommation_energie ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Equipements
CREATE POLICY "CEO and Director can manage equipements"
ON public.equipements FOR ALL
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()))
WITH CHECK (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()));

CREATE POLICY "Operations roles can view equipements"
ON public.equipements FOR SELECT
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()) OR is_centraliste(auth.uid()));

-- Nettoyage Quotidien
CREATE POLICY "Centraliste can manage daily cleaning"
ON public.nettoyage_quotidien FOR ALL
USING (is_ceo(auth.uid()) OR is_centraliste(auth.uid()) OR is_directeur_operations(auth.uid()))
WITH CHECK (is_ceo(auth.uid()) OR is_centraliste(auth.uid()) OR is_directeur_operations(auth.uid()));

CREATE POLICY "Operations can view cleaning records"
ON public.nettoyage_quotidien FOR SELECT
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()) OR is_centraliste(auth.uid()));

-- Maintenance Records
CREATE POLICY "CEO and Director can manage maintenance"
ON public.maintenance_records FOR ALL
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()))
WITH CHECK (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()));

CREATE POLICY "Operations can view maintenance"
ON public.maintenance_records FOR SELECT
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()) OR is_centraliste(auth.uid()));

-- Étalonnages
CREATE POLICY "CEO and Director can manage calibrations"
ON public.etalonnages FOR ALL
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_responsable_technique(auth.uid()))
WITH CHECK (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_responsable_technique(auth.uid()));

CREATE POLICY "Operations can view calibrations"
ON public.etalonnages FOR SELECT
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()) OR is_centraliste(auth.uid()) OR is_responsable_technique(auth.uid()));

-- Incidents Centrale
CREATE POLICY "Operations can manage incidents"
ON public.incidents_centrale FOR ALL
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()) OR is_centraliste(auth.uid()))
WITH CHECK (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()) OR is_centraliste(auth.uid()));

CREATE POLICY "Operations can view incidents"
ON public.incidents_centrale FOR SELECT
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()) OR is_centraliste(auth.uid()));

-- Inspections Securite
CREATE POLICY "CEO and Director can manage inspections"
ON public.inspections_securite FOR ALL
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()))
WITH CHECK (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()));

CREATE POLICY "Operations can view inspections"
ON public.inspections_securite FOR SELECT
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()) OR is_centraliste(auth.uid()));

-- Consommation Energie
CREATE POLICY "CEO can manage energy consumption"
ON public.consommation_energie FOR ALL
USING (is_ceo(auth.uid()))
WITH CHECK (is_ceo(auth.uid()));

CREATE POLICY "Directors can view energy consumption"
ON public.consommation_energie FOR SELECT
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()));

-- Create storage bucket for cleaning photos
INSERT INTO storage.buckets (id, name, public) VALUES ('plant-photos', 'plant-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for plant photos
CREATE POLICY "Authenticated users can upload plant photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'plant-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Operations can view plant photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'plant-photos' AND auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_equipements_updated_at
BEFORE UPDATE ON public.equipements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nettoyage_updated_at
BEFORE UPDATE ON public.nettoyage_quotidien
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at
BEFORE UPDATE ON public.maintenance_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
BEFORE UPDATE ON public.incidents_centrale
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default equipment for a concrete plant
INSERT INTO public.equipements (code_equipement, nom, type, criticite) VALUES
('MAL-001', 'Malaxeur Principal', 'malaxeur', 'critique'),
('SIL-CIM-001', 'Silo Ciment 1', 'silo', 'critique'),
('SIL-CIM-002', 'Silo Ciment 2', 'silo', 'important'),
('BAL-CIM-001', 'Balance Ciment', 'balance', 'critique'),
('BAL-AGR-001', 'Balance Agrégats', 'balance', 'critique'),
('DOS-EAU-001', 'Doseur Eau', 'balance', 'critique'),
('DOS-ADJ-001', 'Doseur Adjuvant', 'balance', 'important'),
('CONV-001', 'Convoyeur Agrégats', 'convoyeur', 'important'),
('CONV-002', 'Convoyeur Sable', 'convoyeur', 'important'),
('COMP-001', 'Compresseur Principal', 'compresseur', 'important'),
('GEN-001', 'Groupe Électrogène', 'generateur', 'critique'),
('POMP-001', 'Pompe Eau', 'pompe', 'normal'),
('GOUL-001', 'Goulotte Principale', 'goulotte', 'normal');