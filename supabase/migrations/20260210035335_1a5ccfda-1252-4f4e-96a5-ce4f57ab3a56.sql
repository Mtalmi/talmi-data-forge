
-- Fix 5 security-definer views -> security_invoker
ALTER VIEW public.contract_compliance_summary SET (security_invoker = on);
ALTER VIEW public.loan_summary SET (security_invoker = on);
ALTER VIEW public.monthly_deposit_summary SET (security_invoker = on);
ALTER VIEW public.tax_compliance_summary SET (security_invoker = on);
ALTER VIEW public.upcoming_tax_obligations SET (security_invoker = on);

-- Fix overly permissive system_errors INSERT policy
DROP POLICY IF EXISTS "Authenticated users can log errors" ON public.system_errors;
CREATE POLICY "Authenticated users can log errors"
  ON public.system_errors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
