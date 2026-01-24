-- GPS Position History Table (stores all GPS pings from trackers)
CREATE TABLE public.gps_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_camion TEXT NOT NULL REFERENCES public.flotte(id_camion) ON DELETE CASCADE,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  speed_kmh NUMERIC(6, 2) DEFAULT 0,
  heading NUMERIC(5, 2) DEFAULT 0,
  fuel_level_pct NUMERIC(5, 2),
  altitude_m NUMERIC(8, 2),
  accuracy_m NUMERIC(8, 2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX idx_gps_positions_camion_time ON public.gps_positions(id_camion, recorded_at DESC);
CREATE INDEX idx_gps_positions_time ON public.gps_positions(recorded_at DESC);

-- Geofences Table (safe zones) - client_id is TEXT to match clients table
CREATE TABLE public.geofences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('plant', 'client_site', 'custom')),
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  radius_meters NUMERIC(10, 2) NOT NULL DEFAULT 500,
  color TEXT DEFAULT '#f59e0b',
  is_active BOOLEAN NOT NULL DEFAULT true,
  client_id TEXT REFERENCES public.clients(client_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Geofence Events (alerts when trucks enter/exit zones or stop unexpectedly)
CREATE TABLE public.geofence_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_camion TEXT NOT NULL REFERENCES public.flotte(id_camion) ON DELETE CASCADE,
  geofence_id UUID REFERENCES public.geofences(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('enter', 'exit', 'unplanned_stop', 'speeding')),
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  duration_minutes NUMERIC(10, 2),
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for geofence events
CREATE INDEX idx_geofence_events_camion ON public.geofence_events(id_camion, created_at DESC);
CREATE INDEX idx_geofence_events_unack ON public.geofence_events(acknowledged, created_at DESC) WHERE acknowledged = false;

-- Add last known position fields to flotte table
ALTER TABLE public.flotte
ADD COLUMN IF NOT EXISTS last_latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS last_longitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS last_speed_kmh NUMERIC(6, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_heading NUMERIC(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_fuel_level_pct NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS last_gps_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_moving BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stopped_since TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.gps_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for GPS Positions
CREATE POLICY "Authenticated users can view GPS positions"
ON public.gps_positions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can insert GPS positions"
ON public.gps_positions FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for Geofences
CREATE POLICY "Authenticated users can view geofences"
ON public.geofences FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage geofences"
ON public.geofences FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for Geofence Events
CREATE POLICY "Authenticated users can view geofence events"
ON public.geofence_events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage geofence events"
ON public.geofence_events FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to update fleet position on new GPS data
CREATE OR REPLACE FUNCTION public.update_fleet_position()
RETURNS TRIGGER AS $$
DECLARE
  is_truck_moving BOOLEAN;
BEGIN
  -- Determine if truck is moving (speed > 5 km/h)
  is_truck_moving := COALESCE(NEW.speed_kmh, 0) > 5;

  -- Update fleet table with latest position
  UPDATE public.flotte
  SET 
    last_latitude = NEW.latitude,
    last_longitude = NEW.longitude,
    last_speed_kmh = NEW.speed_kmh,
    last_heading = NEW.heading,
    last_fuel_level_pct = NEW.fuel_level_pct,
    last_gps_update = NEW.recorded_at,
    is_moving = is_truck_moving,
    stopped_since = CASE 
      WHEN is_truck_moving THEN NULL
      WHEN stopped_since IS NULL THEN NEW.recorded_at
      ELSE stopped_since
    END,
    updated_at = now()
  WHERE id_camion = NEW.id_camion;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update fleet position
DROP TRIGGER IF EXISTS trigger_update_fleet_position ON public.gps_positions;
CREATE TRIGGER trigger_update_fleet_position
AFTER INSERT ON public.gps_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_fleet_position();

-- Function to check for unplanned stops
CREATE OR REPLACE FUNCTION public.check_unplanned_stops()
RETURNS TRIGGER AS $$
DECLARE
  truck_record RECORD;
  stop_duration NUMERIC;
  is_in_geofence BOOLEAN;
  matching_geofence RECORD;
BEGIN
  -- Only check if truck is not moving
  IF COALESCE(NEW.speed_kmh, 0) > 5 THEN
    RETURN NEW;
  END IF;

  -- Get truck info
  SELECT * INTO truck_record
  FROM public.flotte
  WHERE id_camion = NEW.id_camion;

  -- Check if stopped for more than 15 minutes
  IF truck_record.stopped_since IS NOT NULL THEN
    stop_duration := EXTRACT(EPOCH FROM (NEW.recorded_at - truck_record.stopped_since)) / 60;
    
    IF stop_duration >= 15 THEN
      -- Check if position is within any active geofence using Haversine formula
      SELECT * INTO matching_geofence
      FROM public.geofences g
      WHERE g.is_active = true
        AND (
          6371000 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(NEW.latitude)) * cos(radians(g.latitude)) *
              cos(radians(g.longitude) - radians(NEW.longitude)) +
              sin(radians(NEW.latitude)) * sin(radians(g.latitude))
            ))
          )
        ) <= g.radius_meters
      LIMIT 1;

      is_in_geofence := matching_geofence IS NOT NULL;

      -- If not in any geofence and stop is >=15 mins, create alert
      IF NOT is_in_geofence THEN
        -- Check if we already have an unacknowledged alert for this stop
        IF NOT EXISTS (
          SELECT 1 FROM public.geofence_events
          WHERE id_camion = NEW.id_camion
            AND event_type = 'unplanned_stop'
            AND acknowledged = false
            AND created_at >= truck_record.stopped_since
        ) THEN
          INSERT INTO public.geofence_events (
            id_camion, event_type, latitude, longitude, duration_minutes
          ) VALUES (
            NEW.id_camion, 'unplanned_stop', NEW.latitude, NEW.longitude, stop_duration
          );
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for unplanned stop detection
DROP TRIGGER IF EXISTS trigger_check_unplanned_stops ON public.gps_positions;
CREATE TRIGGER trigger_check_unplanned_stops
AFTER INSERT ON public.gps_positions
FOR EACH ROW
EXECUTE FUNCTION public.check_unplanned_stops();

-- Insert default geofence for the plant (Talmi Beton HQ - Casablanca area)
INSERT INTO public.geofences (name, type, latitude, longitude, radius_meters, color)
VALUES ('Centrale Talmi Béton', 'plant', 33.5731, -7.5898, 500, '#f59e0b');

-- Enable realtime for GPS tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.gps_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.geofence_events;