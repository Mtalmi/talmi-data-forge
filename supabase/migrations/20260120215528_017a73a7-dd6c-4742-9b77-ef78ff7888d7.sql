-- Drop the existing volume constraints that limit to 12 m³
ALTER TABLE bons_livraison_reels DROP CONSTRAINT IF EXISTS bons_livraison_reels_volume_m3_check;
ALTER TABLE bons_livraison_reels DROP CONSTRAINT IF EXISTS check_volume_range;

-- Add new constraint allowing up to 100 m³ (for large orders that will be split across trucks)
ALTER TABLE bons_livraison_reels ADD CONSTRAINT bons_livraison_reels_volume_m3_check 
  CHECK (volume_m3 > 0 AND volume_m3 <= 100);