-- Drop existing conflicting policy first
DROP POLICY IF EXISTS "CEO and Responsable Technique can manage calibrations" ON etalonnages;

-- Now create the proper policies
CREATE POLICY "CEO and Responsable Technique can manage calibrations"
ON etalonnages
FOR ALL
TO authenticated
USING (
  has_role_v2(auth.uid(), 'ceo') OR 
  has_role_v2(auth.uid(), 'responsable_technique')
)
WITH CHECK (
  has_role_v2(auth.uid(), 'ceo') OR 
  has_role_v2(auth.uid(), 'responsable_technique')
);

-- All operations roles can VIEW calibrations (read-only)
DROP POLICY IF EXISTS "Operations roles can view calibrations" ON etalonnages;
CREATE POLICY "Operations roles can view calibrations"
ON etalonnages
FOR SELECT
TO authenticated
USING (
  has_role_v2(auth.uid(), 'ceo') OR 
  has_role_v2(auth.uid(), 'directeur_operations') OR
  has_role_v2(auth.uid(), 'responsable_technique') OR
  has_role_v2(auth.uid(), 'superviseur') OR
  has_role_v2(auth.uid(), 'centraliste')
);

-- Create a configuration table for maintenance schedules per equipment type
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type TEXT NOT NULL UNIQUE,
  maintenance_interval_days INTEGER NOT NULL DEFAULT 90,
  calibration_interval_days INTEGER, -- NULL means no calibration needed
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on maintenance_schedules
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- Everyone can read schedules, only CEO can modify
DROP POLICY IF EXISTS "Anyone can view maintenance schedules" ON maintenance_schedules;
CREATE POLICY "Anyone can view maintenance schedules"
ON maintenance_schedules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only CEO can manage maintenance schedules" ON maintenance_schedules;
CREATE POLICY "Only CEO can manage maintenance schedules"
ON maintenance_schedules FOR ALL TO authenticated
USING (has_role_v2(auth.uid(), 'ceo'))
WITH CHECK (has_role_v2(auth.uid(), 'ceo'));

-- Seed maintenance schedules with industry-standard intervals
INSERT INTO maintenance_schedules (equipment_type, maintenance_interval_days, calibration_interval_days, description)
VALUES
  ('malaxeur', 30, NULL, 'Malaxeur: maintenance mensuelle, pas d''étalonnage'),
  ('balance', 30, 180, 'Balance: maintenance mensuelle, étalonnage semestriel'),
  ('doseur', 30, 180, 'Doseur: maintenance mensuelle, étalonnage semestriel'),
  ('capteur', 90, 365, 'Capteur: maintenance trimestrielle, étalonnage annuel'),
  ('convoyeur', 60, NULL, 'Convoyeur: maintenance bimestrielle, pas d''étalonnage'),
  ('silo', 90, NULL, 'Silo: maintenance trimestrielle, pas d''étalonnage'),
  ('compresseur', 30, NULL, 'Compresseur: maintenance mensuelle, pas d''étalonnage'),
  ('pompe', 60, NULL, 'Pompe: maintenance bimestrielle, pas d''étalonnage'),
  ('generateur', 30, NULL, 'Groupe électrogène: maintenance mensuelle, pas d''étalonnage'),
  ('goulotte', 90, NULL, 'Goulotte: maintenance trimestrielle, pas d''étalonnage')
ON CONFLICT (equipment_type) DO UPDATE SET
  maintenance_interval_days = EXCLUDED.maintenance_interval_days,
  calibration_interval_days = EXCLUDED.calibration_interval_days,
  description = EXCLUDED.description,
  updated_at = now();

-- Create function to auto-calculate next maintenance/calibration dates
CREATE OR REPLACE FUNCTION calculate_next_maintenance_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  schedule RECORD;
  current_date_val DATE := CURRENT_DATE;
BEGIN
  -- Get schedule for this equipment type
  SELECT * INTO schedule 
  FROM maintenance_schedules 
  WHERE equipment_type = NEW.type
  LIMIT 1;
  
  -- If we have a schedule, calculate next dates
  IF schedule IS NOT NULL THEN
    -- Calculate next maintenance date if not already set or if last maintenance just happened
    IF NEW.derniere_maintenance_at IS NOT NULL AND 
       (NEW.prochaine_maintenance_at IS NULL OR 
        (OLD IS NOT NULL AND NEW.derniere_maintenance_at::date > COALESCE(OLD.derniere_maintenance_at::date, '1900-01-01'::date))) THEN
      NEW.prochaine_maintenance_at := NEW.derniere_maintenance_at::date + schedule.maintenance_interval_days;
    ELSIF NEW.prochaine_maintenance_at IS NULL THEN
      -- Set initial next maintenance from creation date
      NEW.prochaine_maintenance_at := current_date_val + schedule.maintenance_interval_days;
    END IF;
    
    -- Calculate next calibration date if applicable
    IF schedule.calibration_interval_days IS NOT NULL THEN
      IF NEW.dernier_etalonnage_at IS NOT NULL AND
         (NEW.prochain_etalonnage_at IS NULL OR
          (OLD IS NOT NULL AND NEW.dernier_etalonnage_at::date > COALESCE(OLD.dernier_etalonnage_at::date, '1900-01-01'::date))) THEN
        NEW.prochain_etalonnage_at := NEW.dernier_etalonnage_at::date + schedule.calibration_interval_days;
      ELSIF NEW.prochain_etalonnage_at IS NULL THEN
        -- Set initial next calibration from creation date
        NEW.prochain_etalonnage_at := current_date_val + schedule.calibration_interval_days;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-calculating dates on equipment updates
DROP TRIGGER IF EXISTS trigger_calculate_maintenance_dates ON equipements;
CREATE TRIGGER trigger_calculate_maintenance_dates
BEFORE INSERT OR UPDATE ON equipements
FOR EACH ROW
EXECUTE FUNCTION calculate_next_maintenance_dates();

-- Initialize all existing equipment with their next maintenance/calibration dates
UPDATE equipements e
SET 
  prochaine_maintenance_at = COALESCE(
    e.prochaine_maintenance_at,
    CURRENT_DATE + COALESCE(ms.maintenance_interval_days, 90)
  ),
  prochain_etalonnage_at = CASE 
    WHEN ms.calibration_interval_days IS NOT NULL 
    THEN COALESCE(e.prochain_etalonnage_at, CURRENT_DATE + ms.calibration_interval_days)
    ELSE NULL 
  END
FROM maintenance_schedules ms
WHERE ms.equipment_type = e.type;