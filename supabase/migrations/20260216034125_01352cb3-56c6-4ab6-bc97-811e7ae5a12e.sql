-- Enable pg_net for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to forward new alerts to n8n via the notify-whatsapp-n8n edge function
CREATE OR REPLACE FUNCTION public.notify_alert_to_n8n()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _supabase_url text := current_setting('app.settings.supabase_url', true);
  _anon_key text := current_setting('app.settings.supabase_anon_key', true);
BEGIN
  -- Only fire for critical and warning alerts to avoid noise
  IF NEW.niveau IN ('critical', 'warning') THEN
    PERFORM extensions.net.http_post(
      url := 'https://pmnwvehuopoddjpohqxw.supabase.co/functions/v1/notify-whatsapp-n8n',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtbnd2ZWh1b3BvZGRqcG9ocXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODg2MjMsImV4cCI6MjA4NDI2NDYyM30.fE-23wSgiTJ9Xkgfk6bPQwUo9JiD_L0UvY9bg8Jrsd0'
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW)::jsonb
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on insert
DROP TRIGGER IF EXISTS trg_notify_alert_n8n ON public.alertes_systeme;
CREATE TRIGGER trg_notify_alert_n8n
  AFTER INSERT ON public.alertes_systeme
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_alert_to_n8n();
