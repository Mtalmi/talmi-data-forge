-- Create communication logs table
CREATE TABLE public.communication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp', 'sms', 'call', 'other')),
  category TEXT NOT NULL CHECK (category IN ('devis_reminder', 'facture_reminder', 'devis_send', 'bc_confirmation', 'bl_notification', 'payment_confirmation', 'general')),
  reference_id TEXT,
  reference_table TEXT,
  recipient TEXT,
  subject TEXT,
  message_preview TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'pending')),
  sent_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view communication logs"
  ON public.communication_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create communication logs"
  ON public.communication_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_communication_logs_client_id ON public.communication_logs(client_id);
CREATE INDEX idx_communication_logs_created_at ON public.communication_logs(created_at DESC);
CREATE INDEX idx_communication_logs_type ON public.communication_logs(type);

-- Add comment
COMMENT ON TABLE public.communication_logs IS 'Tracks all client communications including emails, WhatsApp messages, and reminders';