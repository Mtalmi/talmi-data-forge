-- ==============================================
-- TBOS Database Schema - Talmi Beton Operating System
-- ==============================================

-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('ceo', 'operator', 'accounting', 'commercial');

-- 2. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Create profiles table for user info
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create CLIENTS table
CREATE TABLE public.clients (
    client_id TEXT PRIMARY KEY,
    nom_client TEXT NOT NULL,
    delai_paiement_jours INTEGER DEFAULT 30 CHECK (delai_paiement_jours IN (0, 30, 60, 90)),
    contact_personne TEXT,
    telephone TEXT,
    email TEXT,
    adresse TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create FORMULES_THEORIQUES table with validations
CREATE TABLE public.formules_theoriques (
    formule_id TEXT PRIMARY KEY,
    designation TEXT NOT NULL,
    ciment_kg_m3 NUMERIC NOT NULL CHECK (ciment_kg_m3 > 250 AND ciment_kg_m3 < 600),
    eau_l_m3 NUMERIC NOT NULL CHECK (eau_l_m3 > 120 AND eau_l_m3 < 220),
    adjuvant_l_m3 NUMERIC NOT NULL DEFAULT 0 CHECK (adjuvant_l_m3 >= 0),
    sable_kg_m3 NUMERIC DEFAULT 0,
    gravier_kg_m3 NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    -- E/C Ratio validation: eau_l_m3 / ciment_kg_m3 < 0.65
    CONSTRAINT valid_ratio_ec CHECK ((eau_l_m3 / NULLIF(ciment_kg_m3, 0)) < 0.65)
);

-- 6. Create PRIX_ACHAT_ACTUELS table
CREATE TABLE public.prix_achat_actuels (
    matiere_premiere TEXT PRIMARY KEY,
    prix_unitaire_dh NUMERIC NOT NULL CHECK (prix_unitaire_dh > 0),
    unite_mesure TEXT NOT NULL CHECK (unite_mesure IN ('Tonne', 'Litre', 'm³', 'Kg')),
    prix_precedent NUMERIC,
    date_mise_a_jour TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create BONS_LIVRAISON_REELS table
CREATE TABLE public.bons_livraison_reels (
    bl_id TEXT PRIMARY KEY,
    date_livraison DATE NOT NULL DEFAULT CURRENT_DATE,
    client_id TEXT REFERENCES public.clients(client_id) NOT NULL,
    formule_id TEXT REFERENCES public.formules_theoriques(formule_id) NOT NULL,
    volume_m3 NUMERIC NOT NULL CHECK (volume_m3 > 0 AND volume_m3 < 12),
    ciment_reel_kg NUMERIC NOT NULL,
    adjuvant_reel_l NUMERIC DEFAULT 0,
    eau_reel_l NUMERIC,
    km_parcourus NUMERIC CHECK (km_parcourus > 0),
    temps_mission_heures NUMERIC CHECK (temps_mission_heures > 0.5 AND temps_mission_heures < 8),
    statut_paiement TEXT NOT NULL DEFAULT 'En Attente' CHECK (statut_paiement IN ('Payé', 'En Attente', 'Retard')),
    cur_reel NUMERIC,
    ecart_marge NUMERIC,
    alerte_ecart BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- ==============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Check if user is CEO
CREATE OR REPLACE FUNCTION public.is_ceo(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'ceo')
$$;

-- Check if user is Operator
CREATE OR REPLACE FUNCTION public.is_operator(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'operator')
$$;

-- Check if user is Accounting
CREATE OR REPLACE FUNCTION public.is_accounting(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'accounting')
$$;

-- Check if user is Commercial
CREATE OR REPLACE FUNCTION public.is_commercial(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'commercial')
$$;

-- Check if bon livraison can be modified (within 1 hour)
CREATE OR REPLACE FUNCTION public.can_modify_bon_within_time(_created_at TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT _created_at > (now() - INTERVAL '1 hour')
$$;

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formules_updated_at
    BEFORE UPDATE ON public.formules_theoriques
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bons_updated_at
    BEFORE UPDATE ON public.bons_livraison_reels
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- ENABLE RLS
-- ==============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formules_theoriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prix_achat_actuels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bons_livraison_reels ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- RLS POLICIES
-- ==============================================

-- USER_ROLES: Only CEO can manage
CREATE POLICY "CEO can manage user_roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.is_ceo(auth.uid()))
    WITH CHECK (public.is_ceo(auth.uid()));

CREATE POLICY "Users can view own role"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- PROFILES: Users can view/update own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_ceo(auth.uid()));

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- CLIENTS: All authenticated can read, CEO and Commercial can write
CREATE POLICY "All authenticated can read clients"
    ON public.clients FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "CEO and Commercial can insert clients"
    ON public.clients FOR INSERT
    TO authenticated
    WITH CHECK (public.is_ceo(auth.uid()) OR public.is_commercial(auth.uid()));

CREATE POLICY "CEO and Commercial can update clients"
    ON public.clients FOR UPDATE
    TO authenticated
    USING (public.is_ceo(auth.uid()) OR public.is_commercial(auth.uid()))
    WITH CHECK (public.is_ceo(auth.uid()) OR public.is_commercial(auth.uid()));

CREATE POLICY "CEO can delete clients"
    ON public.clients FOR DELETE
    TO authenticated
    USING (public.is_ceo(auth.uid()));

-- FORMULES_THEORIQUES: All can read, only CEO can write
CREATE POLICY "All authenticated can read formules"
    ON public.formules_theoriques FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "CEO can insert formules"
    ON public.formules_theoriques FOR INSERT
    TO authenticated
    WITH CHECK (public.is_ceo(auth.uid()));

CREATE POLICY "CEO can update formules"
    ON public.formules_theoriques FOR UPDATE
    TO authenticated
    USING (public.is_ceo(auth.uid()))
    WITH CHECK (public.is_ceo(auth.uid()));

CREATE POLICY "CEO can delete formules"
    ON public.formules_theoriques FOR DELETE
    TO authenticated
    USING (public.is_ceo(auth.uid()));

-- PRIX_ACHAT_ACTUELS: All can read, only CEO can write
CREATE POLICY "All authenticated can read prix"
    ON public.prix_achat_actuels FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "CEO can insert prix"
    ON public.prix_achat_actuels FOR INSERT
    TO authenticated
    WITH CHECK (public.is_ceo(auth.uid()));

CREATE POLICY "CEO can update prix"
    ON public.prix_achat_actuels FOR UPDATE
    TO authenticated
    USING (public.is_ceo(auth.uid()))
    WITH CHECK (public.is_ceo(auth.uid()));

CREATE POLICY "CEO can delete prix"
    ON public.prix_achat_actuels FOR DELETE
    TO authenticated
    USING (public.is_ceo(auth.uid()));

-- BONS_LIVRAISON_REELS: Complex access rules
CREATE POLICY "All authenticated can read bons"
    ON public.bons_livraison_reels FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "CEO and Operator can insert bons"
    ON public.bons_livraison_reels FOR INSERT
    TO authenticated
    WITH CHECK (public.is_ceo(auth.uid()) OR public.is_operator(auth.uid()));

CREATE POLICY "CEO can update all bons"
    ON public.bons_livraison_reels FOR UPDATE
    TO authenticated
    USING (public.is_ceo(auth.uid()))
    WITH CHECK (public.is_ceo(auth.uid()));

CREATE POLICY "Operator can update own bons within 1 hour"
    ON public.bons_livraison_reels FOR UPDATE
    TO authenticated
    USING (
        public.is_operator(auth.uid()) 
        AND created_by = auth.uid() 
        AND public.can_modify_bon_within_time(created_at)
    )
    WITH CHECK (
        public.is_operator(auth.uid()) 
        AND created_by = auth.uid() 
        AND public.can_modify_bon_within_time(created_at)
    );

CREATE POLICY "Accounting can update payment status"
    ON public.bons_livraison_reels FOR UPDATE
    TO authenticated
    USING (public.is_accounting(auth.uid()))
    WITH CHECK (public.is_accounting(auth.uid()));

CREATE POLICY "CEO can delete bons"
    ON public.bons_livraison_reels FOR DELETE
    TO authenticated
    USING (public.is_ceo(auth.uid()));

-- ==============================================
-- INDEXES for performance
-- ==============================================
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_bons_client_id ON public.bons_livraison_reels(client_id);
CREATE INDEX idx_bons_formule_id ON public.bons_livraison_reels(formule_id);
CREATE INDEX idx_bons_date ON public.bons_livraison_reels(date_livraison);
CREATE INDEX idx_bons_created_by ON public.bons_livraison_reels(created_by);
CREATE INDEX idx_bons_statut ON public.bons_livraison_reels(statut_paiement);