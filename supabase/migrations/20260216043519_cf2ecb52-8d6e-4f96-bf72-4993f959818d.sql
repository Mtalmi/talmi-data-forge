
-- Add escalation tracking columns to alertes_systeme
ALTER TABLE public.alertes_systeme 
  ADD COLUMN IF NOT EXISTS escalation_level integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz,
  ADD COLUMN IF NOT EXISTS escalation_history jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS original_destinataire_role text;

-- Create escalation config table for configurable thresholds
CREATE TABLE IF NOT EXISTS public.escalation_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niveau text NOT NULL,
  escalation_delay_minutes integer NOT NULL DEFAULT 15,
  max_escalation_level integer NOT NULL DEFAULT 3,
  escalation_targets jsonb NOT NULL DEFAULT '["ceo"]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.escalation_config ENABLE ROW LEVEL SECURITY;

-- Only CEO can manage escalation config
CREATE POLICY "CEO can manage escalation config"
ON public.escalation_config
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'ceo'
  )
);

-- Authenticated users can read config
CREATE POLICY "Authenticated users can read escalation config"
ON public.escalation_config
FOR SELECT
TO authenticated
USING (true);

-- Insert default escalation rules
INSERT INTO public.escalation_config (niveau, escalation_delay_minutes, max_escalation_level, escalation_targets) VALUES
  ('critical', 15, 3, '["superviseur", "ceo"]'),
  ('warning', 30, 2, '["superviseur"]');

-- Index for fast lookup of unread alerts needing escalation
CREATE INDEX IF NOT EXISTS idx_alertes_escalation 
ON public.alertes_systeme (niveau, lu, escalation_level, created_at) 
WHERE lu = false;
