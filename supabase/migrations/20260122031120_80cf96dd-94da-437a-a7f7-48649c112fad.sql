-- Enable required extensions for cron and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the daily journal report to run at 01:00 AM Morocco time (UTC+0/+1)
-- Using 01:00 UTC to approximate Morocco time
SELECT cron.schedule(
  'send-daily-journal-report',
  '0 1 * * *',  -- At 01:00 AM every day
  $$
  SELECT net.http_post(
    url := 'https://pmnwvehuopoddjpohqxw.supabase.co/functions/v1/send-daily-journal',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtbnd2ZWh1b3BvZGRqcG9ocXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODg2MjMsImV4cCI6MjA4NDI2NDYyM30.fE-23wSgiTJ9Xkgfk6bPQwUo9JiD_L0UvY9bg8Jrsd0"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Add comment for documentation
COMMENT ON EXTENSION pg_cron IS 'Enables scheduled jobs including daily journal report at 01:00 AM';