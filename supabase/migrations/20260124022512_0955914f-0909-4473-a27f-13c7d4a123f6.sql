-- Add audit trigger for expenses_controlled (complete financial tracking)
DROP TRIGGER IF EXISTS audit_expenses_controlled ON public.expenses_controlled;
CREATE TRIGGER audit_expenses_controlled
AFTER INSERT OR UPDATE OR DELETE ON public.expenses_controlled
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();