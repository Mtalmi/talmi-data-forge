
-- Trigger function: forward critical/warning alerts to n8n via edge function
CREATE OR REPLACE FUNCTION public.notify_n8n_on_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _supabase_url TEXT;
  _service_key TEXT;
  _payload JSONB;
BEGIN
  -- Only forward critical and warning alerts
  IF NEW.niveau NOT IN ('critical', 'warning') THEN
    RETURN NEW;
  END IF;

  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_key := current_setting('app.settings.service_role_key', true);

  -- Build payload matching the edge function's expected format
  _payload := jsonb_build_object(
    'record', jsonb_build_object(
      'id', NEW.id,
      'titre', NEW.titre,
      'message', NEW.message,
      'niveau', NEW.niveau,
      'type_alerte', NEW.type_alerte,
      'destinataire_role', NEW.destinataire_role,
      'reference_id', NEW.reference_id,
      'reference_table', NEW.reference_table,
      'created_at', NEW.created_at
    )
  );

  -- Async HTTP POST via pg_net
  PERFORM net.http_post(
    url := _supabase_url || '/functions/v1/notify-whatsapp-n8n',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key
    ),
    body := _payload
  );

  RETURN NEW;
END;
$$;

-- Attach trigger to alertes_systeme
DROP TRIGGER IF EXISTS trg_notify_n8n_on_alert ON public.alertes_systeme;
CREATE TRIGGER trg_notify_n8n_on_alert
  AFTER INSERT ON public.alertes_systeme
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_n8n_on_alert();
