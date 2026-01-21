
-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Add column for RC document URL
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS rc_document_url TEXT;

COMMENT ON COLUMN public.clients.rc_document_url IS 'URL du scan/photo du Registre de Commerce';

-- Storage policies for client documents
CREATE POLICY "Authenticated users can upload client documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-documents');

CREATE POLICY "Authenticated users can view client documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client-documents');

CREATE POLICY "Authenticated users can update client documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client-documents');

CREATE POLICY "Authenticated users can delete client documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-documents');
