-- =============================================
-- AUDIT TRAIL: Log all expense actions to audit_superviseur
-- =============================================

-- Create trigger function to log expense actions
CREATE OR REPLACE FUNCTION public.log_expense_actions()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_changes JSONB;
BEGIN
  -- Determine action type based on status changes
  IF TG_OP = 'INSERT' THEN
    v_action := 'expense_created';
    v_changes := jsonb_build_object(
      'reference', NEW.reference,
      'montant_ttc', NEW.montant_ttc,
      'approval_level', NEW.approval_level,
      'categorie', NEW.categorie,
      'statut', NEW.statut
    );
    
    -- Log limit exceeded events
    IF NEW.statut = 'bloque_plafond' THEN
      INSERT INTO public.audit_superviseur (
        user_id, user_name, action, table_name, record_id,
        new_data, changes
      ) VALUES (
        COALESCE(NEW.requested_by, '00000000-0000-0000-0000-000000000000'),
        NEW.requested_by_name,
        'expense_limit_exceeded',
        'expenses_controlled',
        NEW.id,
        to_jsonb(NEW),
        jsonb_build_object(
          'event', 'LIMIT_EXCEEDED',
          'reference', NEW.reference,
          'montant_ttc', NEW.montant_ttc,
          'message', 'Plafond mensuel 15,000 MAD dépassé'
        )
      );
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Track approval
    IF NEW.statut = 'approuve' AND OLD.statut != 'approuve' THEN
      v_action := 'expense_approved';
      v_changes := jsonb_build_object(
        'reference', NEW.reference,
        'montant_ttc', NEW.montant_ttc,
        'approval_level', NEW.approval_level,
        'approved_by_name', COALESCE(
          NEW.level3_approved_by_name,
          NEW.level2_approved_by_name,
          NEW.level1_approved_by_name,
          'Unknown'
        )
      );
      
    -- Track rejection
    ELSIF NEW.statut = 'rejete' AND OLD.statut != 'rejete' THEN
      v_action := 'expense_rejected';
      v_changes := jsonb_build_object(
        'reference', NEW.reference,
        'montant_ttc', NEW.montant_ttc,
        'rejected_by_name', NEW.rejected_by_name,
        'rejection_reason', NEW.rejection_reason
      );
      
    -- Track payment
    ELSIF NEW.statut = 'paye' AND OLD.statut != 'paye' THEN
      v_action := 'expense_paid';
      v_changes := jsonb_build_object(
        'reference', NEW.reference,
        'montant_ttc', NEW.montant_ttc,
        'payment_method', NEW.payment_method,
        'payment_reference', NEW.payment_reference
      );
      
    -- Track cap override
    ELSIF NEW.cap_override_by IS NOT NULL AND OLD.cap_override_by IS NULL THEN
      v_action := 'expense_cap_override';
      v_changes := jsonb_build_object(
        'reference', NEW.reference,
        'montant_ttc', NEW.montant_ttc,
        'override_by', NEW.cap_override_by,
        'override_reason', NEW.cap_override_reason
      );
      
    -- Track blocked by cap
    ELSIF NEW.statut = 'bloque_plafond' AND OLD.statut != 'bloque_plafond' THEN
      v_action := 'expense_blocked_by_cap';
      v_changes := jsonb_build_object(
        'reference', NEW.reference,
        'montant_ttc', NEW.montant_ttc,
        'message', 'Dépense bloquée - Plafond mensuel atteint'
      );
      
    ELSE
      -- General update
      v_action := 'expense_updated';
      v_changes := jsonb_build_object(
        'reference', NEW.reference,
        'old_statut', OLD.statut,
        'new_statut', NEW.statut
      );
    END IF;
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_superviseur (
    user_id, user_name, action, table_name, record_id,
    old_data, new_data, changes
  ) VALUES (
    COALESCE(auth.uid(), NEW.requested_by, '00000000-0000-0000-0000-000000000000'),
    COALESCE(
      (SELECT full_name FROM public.profiles WHERE user_id = auth.uid()),
      NEW.requested_by_name,
      'System'
    ),
    v_action,
    'expenses_controlled',
    NEW.id,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW),
    v_changes
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS log_expense_actions_trigger ON public.expenses_controlled;

-- Create AFTER trigger for audit logging
CREATE TRIGGER log_expense_actions_trigger
  AFTER INSERT OR UPDATE ON public.expenses_controlled
  FOR EACH ROW
  EXECUTE FUNCTION public.log_expense_actions();

-- Add comment for documentation
COMMENT ON FUNCTION public.log_expense_actions() IS 
  'Audit Trail: Logs all expense actions (create, approve, reject, pay, block, override) to audit_superviseur for forensic tracking.';

-- Update the BEFORE INSERT trigger to set proper month_year using Casablanca time
CREATE OR REPLACE FUNCTION public.enforce_monthly_cap_atomic()
RETURNS TRIGGER AS $$
DECLARE
  v_month_year TEXT;
  v_current_spent NUMERIC;
  v_cap NUMERIC := 15000;
  v_new_total NUMERIC;
  v_approver_role TEXT;
BEGIN
  -- Set month_year using Casablanca timezone for ALL expenses
  NEW.month_year := to_char(now() AT TIME ZONE 'Africa/Casablanca', 'YYYY-MM');
  
  -- Only enforce cap for Level 1 expenses being submitted (not drafts)
  IF NEW.approval_level = 'level_1' AND NEW.statut = 'en_attente' THEN
    v_month_year := NEW.month_year;
    
    -- ATOMIC: Use advisory lock to prevent race conditions
    PERFORM pg_advisory_xact_lock(hashtext('monthly_cap_' || v_month_year));
    
    -- Ensure monthly cap record exists (atomic upsert)
    INSERT INTO public.monthly_expense_caps (month_year, level1_cap, level1_spent)
    VALUES (v_month_year, 15000, 0)
    ON CONFLICT (month_year) DO NOTHING;
    
    -- Get current month's spending with row lock
    SELECT level1_spent INTO v_current_spent
    FROM public.monthly_expense_caps
    WHERE month_year = v_month_year
    FOR UPDATE;
    
    -- Calculate what the new total would be
    v_new_total := COALESCE(v_current_spent, 0) + NEW.montant_ttc;
    
    -- Check if this expense would exceed the 15,000 MAD cap
    IF v_new_total > v_cap THEN
      -- Get the approver's role if there's an override
      IF NEW.cap_override_by IS NOT NULL THEN
        SELECT role INTO v_approver_role
        FROM public.profiles
        WHERE user_id = NEW.cap_override_by;
        
        -- Only CEO or SUPERVISEUR can override
        IF v_approver_role IN ('CEO', 'SUPERVISEUR') THEN
          NEW.was_blocked_by_cap := TRUE;
          RETURN NEW;
        END IF;
      END IF;
      
      -- REJECT: Block the transaction with clear error code
      RAISE EXCEPTION 'LIMIT_EXCEEDED:Plafond mensuel de 15,000 MAD atteint. Cette dépense nécessite désormais la validation de Karim.|current:%|new:%|cap:%',
        COALESCE(v_current_spent, 0),
        NEW.montant_ttc,
        v_cap
      USING ERRCODE = 'P0001';
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;