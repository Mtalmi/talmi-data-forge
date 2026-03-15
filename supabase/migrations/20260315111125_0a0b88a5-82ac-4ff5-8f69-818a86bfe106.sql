
-- ========================================
-- PHASE 2: DATABASE SCHEMA COMPLETION
-- ========================================

-- === ADD MISSING COLUMNS TO EXISTING TABLES ===

-- CLIENTS: add segment, score_sante, ca_ytd, volume_mensuel_moy, actif
ALTER TABLE clients ADD COLUMN IF NOT EXISTS segment text DEFAULT 'standard';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS score_sante integer DEFAULT 50;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ca_ytd numeric DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS volume_mensuel_moy numeric DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS actif boolean DEFAULT true;

-- DEVIS: add date_livraison_souhaitee
ALTER TABLE devis ADD COLUMN IF NOT EXISTS date_livraison_souhaitee date;

-- PRODUCTION_BATCHES: add lifecycle columns
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS formule text;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS volume_m3 numeric;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS client_id text;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS client_nom text;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS status text DEFAULT 'planifie';
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS conformite_status text DEFAULT 'en_attente';
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS operateur text;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS malaxeur text DEFAULT 'Malaxeur Principal';
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS temperature_celsius numeric;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS ratio_ec numeric;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS slump_cm numeric;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS cout_matiere numeric;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- FACTURES: add date_echeance, date_paiement, relance_count, etc.
ALTER TABLE factures ADD COLUMN IF NOT EXISTS client_nom text;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS date_echeance date;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS date_paiement date;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS relance_count integer DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS derniere_relance_at timestamptz;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS montant_ht numeric;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS notes text;

-- STOCKS: add consommation, autonomie, fournisseur, prix
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS consommation_moy_jour numeric DEFAULT 0;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS autonomie_jours numeric DEFAULT 0;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS fournisseur_principal text;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS prix_unitaire numeric;

-- FLOTTE: add sante_score, consommation, revenu
ALTER TABLE flotte ADD COLUMN IF NOT EXISTS sante_score integer DEFAULT 80;
ALTER TABLE flotte ADD COLUMN IF NOT EXISTS consommation_theo_l_100km numeric DEFAULT 38;
ALTER TABLE flotte ADD COLUMN IF NOT EXISTS consommation_reelle_l_100km numeric DEFAULT 39;
ALTER TABLE flotte ADD COLUMN IF NOT EXISTS revenu_jour numeric DEFAULT 0;
ALTER TABLE flotte ADD COLUMN IF NOT EXISTS carburant_pct numeric DEFAULT 100;

-- BONS_LIVRAISON_REELS: add montant, chantier_adresse, contact_chantier
ALTER TABLE bons_livraison_reels ADD COLUMN IF NOT EXISTS montant numeric;
ALTER TABLE bons_livraison_reels ADD COLUMN IF NOT EXISTS chantier_adresse text;
ALTER TABLE bons_livraison_reels ADD COLUMN IF NOT EXISTS contact_chantier text;

-- === CREATE NEW TABLES ===

-- LIVRAISONS
CREATE TABLE IF NOT EXISTS livraisons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bon_livraison_id text,
  vehicule_id text,
  chauffeur_nom text,
  client_id text,
  client_nom text,
  chantier text,
  formule text,
  volume_m3 numeric,
  melange_at timestamptz,
  depart_at timestamptz,
  arrivee_at timestamptz,
  distance_km numeric,
  duree_minutes numeric,
  carburant_l numeric,
  temps_attente_min numeric DEFAULT 0,
  retour_vide_pct numeric DEFAULT 0,
  statut text DEFAULT 'planifie',
  temperature_dest_celsius numeric,
  fraicheur_restante_min numeric,
  satisfaction_score numeric,
  conformite_beton boolean DEFAULT true,
  confirmation_chantier jsonb DEFAULT '{"pompe": false, "acces": false, "responsable": false}',
  cout_carburant numeric,
  cout_chauffeur numeric,
  profit_net numeric,
  created_at timestamptz DEFAULT now()
);

-- RECETTES
CREATE TABLE IF NOT EXISTS recettes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  formule text UNIQUE NOT NULL,
  nom_complet text,
  classe_eu text,
  psi_us text,
  resistance_cible_mpa numeric,
  ciment_kg_m3 numeric,
  sable_kg_m3 numeric,
  gravette_kg_m3 numeric,
  eau_l_m3 numeric,
  adjuvant_l_m3 numeric,
  ratio_ec numeric,
  slump_cible_cm numeric,
  slump_tolerance_cm numeric DEFAULT 2,
  prix_revient_m3 numeric,
  prix_vente_min_m3 numeric,
  marge_cible_pct numeric,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ALERTES
CREATE TABLE IF NOT EXISTS alertes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  severite text NOT NULL DEFAULT 'info',
  titre text NOT NULL,
  message text NOT NULL,
  page_source text,
  entity_type text,
  entity_id uuid,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz DEFAULT now()
);

-- AI_ANALYSES
CREATE TABLE IF NOT EXISTS ai_analyses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name text NOT NULL,
  page text NOT NULL,
  analysis_text text NOT NULL,
  confidence numeric,
  data_snapshot jsonb,
  created_at timestamptz DEFAULT now()
);

-- ACTIVITY_LOG
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL DEFAULT 'action',
  message text NOT NULL,
  source_page text,
  severite text DEFAULT 'info',
  user_name text DEFAULT 'Max Talmi',
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- DAILY_SCORES
CREATE TABLE IF NOT EXISTS daily_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  score_date date UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  score_total integer NOT NULL,
  production_score integer,
  conformite_score integer,
  ponctualite_score integer,
  stock_score integer,
  recouvrement_score integer,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- CERTIFICATIONS
CREATE TABLE IF NOT EXISTS certifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL,
  description text,
  marche text NOT NULL DEFAULT 'maroc',
  statut text DEFAULT 'conforme',
  date_expiration date,
  tests_requis integer DEFAULT 0,
  tests_completes integer DEFAULT 0,
  prochaine_action text,
  created_at timestamptz DEFAULT now()
);

-- PARAMETRES
CREATE TABLE IF NOT EXISTS parametres (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cle text UNIQUE NOT NULL,
  valeur text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- === ROW LEVEL SECURITY ===

ALTER TABLE livraisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON livraisons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON recettes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON alertes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON ai_analyses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON daily_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON certifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON parametres FOR ALL USING (true) WITH CHECK (true);

-- === INDEXES ===

CREATE INDEX IF NOT EXISTS idx_production_batches_date ON production_batches(created_at);
CREATE INDEX IF NOT EXISTS idx_production_batches_status ON production_batches(status);
CREATE INDEX IF NOT EXISTS idx_stocks_materiau ON stocks(materiau);
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_date ON mouvements_stock(created_at);
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_materiau ON mouvements_stock(materiau);
CREATE INDEX IF NOT EXISTS idx_livraisons_date ON livraisons(created_at);
CREATE INDEX IF NOT EXISTS idx_livraisons_statut ON livraisons(statut);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_echeance ON factures(date_echeance);
CREATE INDEX IF NOT EXISTS idx_bons_livraison_workflow ON bons_livraison_reels(workflow_status);
CREATE INDEX IF NOT EXISTS idx_bons_livraison_client ON bons_livraison_reels(client_id);
CREATE INDEX IF NOT EXISTS idx_alertes_resolved ON alertes(resolved);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_devis_statut ON devis(statut);
CREATE INDEX IF NOT EXISTS idx_devis_client ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_tests_laboratoire_date ON tests_laboratoire(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_scores_date ON daily_scores(score_date);
