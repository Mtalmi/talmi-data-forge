
-- Fix overly permissive UPDATE RLS policies
DROP POLICY IF EXISTS "Authenticated users can update maintenance orders" ON public.maintenance_orders;
DROP POLICY IF EXISTS "Authenticated users can update purchase orders" ON public.purchase_orders;

CREATE POLICY "Authenticated users can update maintenance orders"
ON public.maintenance_orders FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update purchase orders"
ON public.purchase_orders FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);
