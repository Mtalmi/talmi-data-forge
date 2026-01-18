-- =============================================
-- POINTAGE (Clock In/Out) System
-- =============================================

-- Table for employees/workers
CREATE TABLE public.employes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ouvrier',
  telephone TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employes
CREATE POLICY "Operations roles can view employes"
ON public.employes FOR SELECT
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid()));

CREATE POLICY "CEO and Director can manage employes"
ON public.employes FOR ALL
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()))
WITH CHECK (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()));

-- Table for clock in/out records
CREATE TABLE public.pointages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  date_pointage DATE NOT NULL DEFAULT CURRENT_DATE,
  heure_entree TIMESTAMP WITH TIME ZONE,
  heure_sortie TIMESTAMP WITH TIME ZONE,
  source TEXT NOT NULL DEFAULT 'mobile', -- 'mobile' or 'bureau'
  valide BOOLEAN NOT NULL DEFAULT false,
  valide_par UUID REFERENCES auth.users(id),
  valide_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employe_id, date_pointage)
);

-- Enable RLS
ALTER TABLE public.pointages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pointages
CREATE POLICY "Authenticated can view pointages"
ON public.pointages FOR SELECT
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid()));

CREATE POLICY "Authenticated can insert pointages"
ON public.pointages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Operations can update pointages"
ON public.pointages FOR UPDATE
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()))
WITH CHECK (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()));

-- =============================================
-- RAPPORTS JOURNALIERS (Daily Reports)
-- =============================================

-- Table for daily reports from workers
CREATE TABLE public.rapports_journaliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  date_rapport DATE NOT NULL DEFAULT CURRENT_DATE,
  taches_completees TEXT NOT NULL,
  taches_en_cours TEXT,
  problemes_rencontres TEXT,
  materiaux_utilises JSONB,
  observations TEXT,
  soumis_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valide BOOLEAN NOT NULL DEFAULT false,
  valide_par UUID REFERENCES auth.users(id),
  valide_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employe_id, date_rapport)
);

-- Enable RLS
ALTER TABLE public.rapports_journaliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rapports_journaliers
CREATE POLICY "Authenticated can view rapports"
ON public.rapports_journaliers FOR SELECT
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()) OR is_agent_administratif(auth.uid()));

CREATE POLICY "Authenticated can insert rapports"
ON public.rapports_journaliers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Operations can update rapports"
ON public.rapports_journaliers FOR UPDATE
USING (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()))
WITH CHECK (is_ceo(auth.uid()) OR is_directeur_operations(auth.uid()) OR is_superviseur(auth.uid()));

-- Trigger to update timestamps
CREATE TRIGGER update_employes_updated_at
BEFORE UPDATE ON public.employes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pointages_updated_at
BEFORE UPDATE ON public.pointages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rapports_journaliers_updated_at
BEFORE UPDATE ON public.rapports_journaliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();