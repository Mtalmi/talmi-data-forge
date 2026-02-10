-- Allow public read access to flotte for GPS map display
CREATE POLICY "Public can read flotte for GPS map"
  ON public.flotte
  FOR SELECT
  USING (true);