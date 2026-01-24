-- Create documents bucket for stock receptions and general uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to documents bucket
CREATE POLICY "documents_insert_authenticated" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to view documents
CREATE POLICY "documents_select_authenticated" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'documents');

-- Allow public access to documents for URL generation
CREATE POLICY "documents_public_access" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'documents');