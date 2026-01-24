-- Create table for security digest email recipients
CREATE TABLE public.security_digest_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.security_digest_recipients ENABLE ROW LEVEL SECURITY;

-- Only CEO/Superviseur can manage recipients
CREATE POLICY "CEO and Superviseur can view recipients"
ON public.security_digest_recipients
FOR SELECT
USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()));

CREATE POLICY "CEO and Superviseur can insert recipients"
ON public.security_digest_recipients
FOR INSERT
WITH CHECK (is_ceo(auth.uid()) OR is_superviseur(auth.uid()));

CREATE POLICY "CEO and Superviseur can update recipients"
ON public.security_digest_recipients
FOR UPDATE
USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()));

CREATE POLICY "CEO and Superviseur can delete recipients"
ON public.security_digest_recipients
FOR DELETE
USING (is_ceo(auth.uid()) OR is_superviseur(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_security_digest_recipients_updated_at
BEFORE UPDATE ON public.security_digest_recipients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default CEO recipient
INSERT INTO public.security_digest_recipients (email, name, is_active)
VALUES ('max.talmi@gmail.com', 'CEO', true)
ON CONFLICT (email) DO NOTHING;