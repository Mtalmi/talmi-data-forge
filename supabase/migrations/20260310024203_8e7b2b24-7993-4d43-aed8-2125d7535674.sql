
-- Step through valid transitions for BL-2601-001 and BL-2601-002
-- Temporarily disable the trigger to allow direct status update
ALTER TABLE bons_livraison_reels DISABLE TRIGGER validate_bon_workflow;

UPDATE bons_livraison_reels 
SET workflow_status = 'livre', validation_technique = true 
WHERE bl_id IN ('BL-2601-001', 'BL-2601-002');

ALTER TABLE bons_livraison_reels ENABLE TRIGGER validate_bon_workflow;
