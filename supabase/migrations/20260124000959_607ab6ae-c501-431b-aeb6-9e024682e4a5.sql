-- Add frequency preference to security digest recipients
ALTER TABLE public.security_digest_recipients 
ADD COLUMN frequency TEXT NOT NULL DEFAULT 'weekly' 
CHECK (frequency IN ('daily', 'weekly', 'both'));