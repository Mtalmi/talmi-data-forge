-- Fix the overly permissive RLS policies for alertes_systeme
DROP POLICY IF EXISTS "System can create alerts" ON public.alertes_systeme;
DROP POLICY IF EXISTS "Users can mark their alerts as read" ON public.alertes_systeme;

-- Only authenticated users with proper roles can create alerts
CREATE POLICY "Authenticated can create alerts"
    ON public.alertes_systeme FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_ceo(auth.uid()) OR 
        public.is_superviseur(auth.uid()) OR 
        public.is_responsable_technique(auth.uid()) OR
        public.is_directeur_operations(auth.uid()) OR
        public.is_agent_administratif(auth.uid()) OR
        public.is_centraliste(auth.uid())
    );

-- Users can only mark alerts as read that are destined for them
CREATE POLICY "Users can mark own alerts as read"
    ON public.alertes_systeme FOR UPDATE
    TO authenticated
    USING (public.is_ceo(auth.uid()) OR lu_par = auth.uid())
    WITH CHECK (lu_par = auth.uid());