-- Drop the overly permissive insert policy on mouvements_stock
DROP POLICY IF EXISTS "Admin and CEO can insert movements" ON public.mouvements_stock;

-- Create separate policies for different movement types:
-- 1. Admin/CEO can insert ANY movement type (reception, adjustment, etc.)
CREATE POLICY "Admin and CEO can insert any movements"
ON public.mouvements_stock
FOR INSERT
TO authenticated
WITH CHECK (
  (is_ceo(auth.uid()) OR is_agent_administratif(auth.uid()))
);

-- 2. Centraliste can ONLY insert 'consommation' type movements (production consumption)
-- This is done automatically by the trigger, but if they try manual insert, restrict to consommation only
CREATE POLICY "Centraliste can insert consumption movements only"
ON public.mouvements_stock
FOR INSERT
TO authenticated
WITH CHECK (
  is_centraliste(auth.uid()) AND type_mouvement = 'consommation'
);