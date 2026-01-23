-- =====================================================
-- ANTI-FRAUD: Self-Approval Block Trigger
-- Prevents users from approving Devis they created themselves
-- Enforced at database level for maximum security
-- =====================================================

CREATE OR REPLACE FUNCTION public.prevent_devis_self_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is an approval action (status changing to validated/accepte)
  IF NEW.statut IN ('valide', 'accepte') AND OLD.statut = 'en_attente' THEN
    -- Block self-approval: the validator cannot be the creator
    IF NEW.validated_by = OLD.created_by AND OLD.created_by IS NOT NULL THEN
      RAISE EXCEPTION 'ANTI-FRAUD: Auto-validation interdite. Un devis ne peut pas être validé par son créateur.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_prevent_devis_self_approval ON devis;
CREATE TRIGGER trigger_prevent_devis_self_approval
  BEFORE UPDATE ON devis
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_devis_self_approval();

-- Add a comment for documentation
COMMENT ON FUNCTION public.prevent_devis_self_approval() IS 'Anti-fraud trigger: Blocks users from approving Devis they created themselves';