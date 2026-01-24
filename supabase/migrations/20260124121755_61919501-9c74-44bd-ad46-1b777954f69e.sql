-- Create storage bucket for fleet maintenance photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fleet-photos', 'fleet-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to fleet-photos bucket
CREATE POLICY "Authenticated users can upload fleet photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fleet-photos');

-- Allow public read access to fleet photos
CREATE POLICY "Public can view fleet photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'fleet-photos');

-- Allow authenticated users to update their fleet photos
CREATE POLICY "Authenticated users can update fleet photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'fleet-photos');

-- Allow authenticated users to delete fleet photos
CREATE POLICY "Authenticated users can delete fleet photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'fleet-photos');