
-- Camera Devices Registry
CREATE TABLE public.camera_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  zone TEXT NOT NULL CHECK (zone IN ('security', 'production', 'fleet', 'inventory')),
  brand TEXT,
  model TEXT,
  ip_address TEXT,
  rtsp_url TEXT,
  hls_url TEXT,
  capabilities TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_heartbeat TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Camera AI Events
CREATE TABLE public.camera_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  camera_id UUID REFERENCES public.camera_devices(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  snapshot_url TEXT,
  video_clip_url TEXT,
  plate_number TEXT,
  matched_vehicle_id TEXT,
  matched_bl_id TEXT,
  zone TEXT,
  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  auto_action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_camera_events_type ON public.camera_events(event_type);
CREATE INDEX idx_camera_events_severity ON public.camera_events(severity);
CREATE INDEX idx_camera_events_created ON public.camera_events(created_at DESC);
CREATE INDEX idx_camera_events_plate ON public.camera_events(plate_number) WHERE plate_number IS NOT NULL;
CREATE INDEX idx_camera_devices_zone ON public.camera_devices(zone);

ALTER TABLE public.camera_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camera_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cameras"
  ON public.camera_devices FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "CEO and Superviseur can manage cameras"
  ON public.camera_devices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('ceo', 'superviseur', 'responsable_technique')
    )
  );

CREATE POLICY "Authenticated users can view camera events"
  ON public.camera_events FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "CEO and Superviseur can manage camera events"
  ON public.camera_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('ceo', 'superviseur', 'responsable_technique')
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.camera_events;

CREATE TRIGGER update_camera_devices_updated_at
  BEFORE UPDATE ON public.camera_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
