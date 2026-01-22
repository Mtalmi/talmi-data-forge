-- CEO Emergency Override Codes table
CREATE TABLE public.ceo_emergency_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL,
  bl_id text NOT NULL,
  client_id text NOT NULL,
  requested_by uuid NOT NULL,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending', -- pending, approved, used, expired
  approved_by uuid,
  approved_at timestamp with time zone,
  used_at timestamp with time zone,
  expires_at timestamp with time zone,
  reason text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ceo_emergency_codes ENABLE ROW LEVEL SECURITY;

-- CEO can manage all codes
CREATE POLICY "CEO can manage all emergency codes"
ON public.ceo_emergency_codes
FOR ALL
USING (is_ceo(auth.uid()))
WITH CHECK (is_ceo(auth.uid()));

-- Agent Admin can create requests and view their own
CREATE POLICY "Agent Admin can create code requests"
ON public.ceo_emergency_codes
FOR INSERT
WITH CHECK (is_agent_administratif(auth.uid()) AND requested_by = auth.uid());

CREATE POLICY "Agent Admin can view own requests"
ON public.ceo_emergency_codes
FOR SELECT
USING (is_agent_administratif(auth.uid()) AND requested_by = auth.uid());

-- Agent Admin can update (to mark as used) their own pending/approved codes
CREATE POLICY "Agent Admin can use approved codes"
ON public.ceo_emergency_codes
FOR UPDATE
USING (is_agent_administratif(auth.uid()) AND requested_by = auth.uid() AND status IN ('approved', 'pending'))
WITH CHECK (is_agent_administratif(auth.uid()) AND requested_by = auth.uid());

-- Index for quick lookups
CREATE INDEX idx_ceo_codes_bl_id ON public.ceo_emergency_codes(bl_id);
CREATE INDEX idx_ceo_codes_status ON public.ceo_emergency_codes(status);
CREATE INDEX idx_ceo_codes_requested_by ON public.ceo_emergency_codes(requested_by);