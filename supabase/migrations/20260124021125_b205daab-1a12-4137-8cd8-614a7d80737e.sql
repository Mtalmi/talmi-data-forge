-- Add audit trigger to factures (customer invoices)
DROP TRIGGER IF EXISTS audit_factures ON public.factures;
CREATE TRIGGER audit_factures
AFTER INSERT OR UPDATE OR DELETE ON public.factures
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Add audit trigger to factures_fournisseur (supplier invoices)
DROP TRIGGER IF EXISTS audit_factures_fournisseur ON public.factures_fournisseur;
CREATE TRIGGER audit_factures_fournisseur
AFTER INSERT OR UPDATE OR DELETE ON public.factures_fournisseur
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Add audit trigger to paiements_fournisseur (supplier payments)
DROP TRIGGER IF EXISTS audit_paiements_fournisseur ON public.paiements_fournisseur;
CREATE TRIGGER audit_paiements_fournisseur
AFTER INSERT OR UPDATE OR DELETE ON public.paiements_fournisseur
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();