-- Create storage bucket for tutorial recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tutorial-recordings',
  'tutorial-recordings',
  true,
  104857600, -- 100MB limit
  ARRAY['video/webm', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tutorial-recordings bucket
CREATE POLICY "Anyone can view tutorial recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'tutorial-recordings');

-- Only authenticated users can upload tutorials
CREATE POLICY "Authenticated users can upload tutorial recordings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tutorial-recordings'
  AND auth.role() = 'authenticated'
);

-- Only the uploader can delete their recordings
CREATE POLICY "Users can delete their own tutorial recordings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tutorial-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);