-- Add audit trigger to user_roles_v2 (role changes - security breach detection)
DROP TRIGGER IF EXISTS audit_user_roles_v2 ON public.user_roles_v2;
CREATE TRIGGER audit_user_roles_v2
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles_v2
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Add audit trigger to profiles if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_profiles ON public.profiles';
    EXECUTE 'CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger()';
  END IF;
END $$;