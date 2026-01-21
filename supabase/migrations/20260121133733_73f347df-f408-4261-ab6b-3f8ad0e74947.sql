-- Allow new BL confirmation step in workflow_status
ALTER TABLE public.bons_livraison_reels
  DROP CONSTRAINT IF EXISTS bons_livraison_reels_workflow_status_check;

ALTER TABLE public.bons_livraison_reels
  ADD CONSTRAINT bons_livraison_reels_workflow_status_check
  CHECK (
    workflow_status = ANY (
      ARRAY[
        'en_attente_validation'::text,
        'planification'::text,
        'production'::text,
        'validation_technique'::text,
        'en_livraison'::text,
        'livre'::text,
        'facture'::text,
        'annule'::text
      ]
    )
  );
