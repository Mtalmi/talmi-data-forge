
-- Rate-limit trigger for demo_requests: max 3 per email per hour
CREATE OR REPLACE FUNCTION public.check_demo_request_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.demo_requests
  WHERE email = NEW.email
    AND created_at > now() - interval '1 hour';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 3 demo requests per hour per email address';
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_demo_request_rate_limit ON public.demo_requests;
CREATE TRIGGER trg_demo_request_rate_limit
  BEFORE INSERT ON public.demo_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_demo_request_rate_limit();
