-- Fix security definer view by using SECURITY INVOKER
DROP VIEW IF EXISTS public.department_spending_summary;

CREATE VIEW public.department_spending_summary 
WITH (security_invoker = true)
AS
SELECT 
  COALESCE(e.department, e.categorie::text) as department,
  TO_CHAR(e.requested_at, 'YYYY-MM') as month_year,
  COUNT(*) as expense_count,
  SUM(CASE WHEN e.statut IN ('approuve', 'paye') THEN e.montant_ttc ELSE 0 END) as total_approved,
  SUM(CASE WHEN e.statut = 'en_attente' THEN e.montant_ttc ELSE 0 END) as total_pending,
  SUM(CASE WHEN e.statut = 'paye' THEN e.montant_ttc ELSE 0 END) as total_paid,
  SUM(e.montant_ttc) as total_all
FROM public.expenses_controlled e
WHERE e.requested_at IS NOT NULL
GROUP BY COALESCE(e.department, e.categorie::text), TO_CHAR(e.requested_at, 'YYYY-MM');