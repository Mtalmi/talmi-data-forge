ALTER TABLE public.prestataires_transport
  ADD COLUMN IF NOT EXISTS specialite text,
  ADD COLUMN IF NOT EXISTS tarif_journalier numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS statut text DEFAULT 'disponible',
  ADD COLUMN IF NOT EXISTS mission_actuelle text,
  ADD COLUMN IF NOT EXISTS jours_travailles integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cout_mtd numeric DEFAULT 0;