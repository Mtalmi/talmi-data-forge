-- =============================================
-- HARD-LOCK MONTHLY SAFETY VALVE (The Enforcer)
-- Atomic BEFORE INSERT trigger with timezone standardization
-- =============================================

-- Create or replace the atomic monthly cap enforcement function
CREATE OR REPLACE FUNCTION public.enforce_monthly_cap_atomic()
RETURNS TRIGGER AS $$
DECLARE
  v_month_year TEXT;
  v_current_spent NUMERIC;
  v_cap NUMERIC := 15000;
  v_new_total NUMERIC;
  v_approver_role TEXT;
BEGIN
  -- Only enforce for Level 1 expenses being submitted (not drafts)
  IF NEW.approval_level = 'level_1' AND NEW.statut = 'en_attente' THEN
    
    -- TIMEZONE STANDARDIZATION: Use Africa/Casablanca time for month calculation
    v_month_year := to_char(now() AT TIME ZONE 'Africa/Casablanca', 'YYYY-MM');
    
    -- Set the month_year on the expense record
    NEW.month_year := v_month_year;
    
    -- ATOMIC: Use FOR UPDATE to lock the row and prevent race conditions
    -- This ensures only one transaction can read/write the cap at a time
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
          -- Allow the override, but log it
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

-- Drop existing insert trigger if exists
DROP TRIGGER IF EXISTS enforce_monthly_cap_before_insert ON public.expenses_controlled;

-- Create BEFORE INSERT trigger (The Enforcer)
CREATE TRIGGER enforce_monthly_cap_before_insert
  BEFORE INSERT ON public.expenses_controlled
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_monthly_cap_atomic();

-- =============================================
-- Update the approval trigger to also track spending
-- =============================================
CREATE OR REPLACE FUNCTION public.track_monthly_spending()
RETURNS TRIGGER AS $$
DECLARE
  v_month_year TEXT;
BEGIN
  -- Only track when Level 1 expense is approved
  IF NEW.statut = 'approuve' AND NEW.approval_level = 'level_1' 
     AND (OLD.statut IS DISTINCT FROM 'approuve') THEN
    
    -- Use Casablanca timezone for month
    v_month_year := COALESCE(NEW.month_year, to_char(now() AT TIME ZONE 'Africa/Casablanca', 'YYYY-MM'));
    
    -- Atomic update of monthly spending
    PERFORM pg_advisory_xact_lock(hashtext('monthly_cap_' || v_month_year));
    
    -- Upsert monthly cap record
    INSERT INTO public.monthly_expense_caps (month_year, level1_cap, level1_spent)
    VALUES (v_month_year, 15000, NEW.montant_ttc)
    ON CONFLICT (month_year) 
    DO UPDATE SET 
      level1_spent = monthly_expense_caps.level1_spent + NEW.montant_ttc,
      updated_at = now();
    
    -- Check if cap is now exceeded
    UPDATE public.monthly_expense_caps
    SET cap_exceeded = (level1_spent >= 15000),
        cap_exceeded_at = CASE WHEN level1_spent >= 15000 THEN now() ELSE cap_exceeded_at END
    WHERE month_year = v_month_year
    AND level1_spent >= 15000
    AND cap_exceeded = FALSE;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing spending tracker trigger if exists
DROP TRIGGER IF EXISTS track_monthly_spending_trigger ON public.expenses_controlled;

-- Create AFTER UPDATE trigger to track approved spending
CREATE TRIGGER track_monthly_spending_trigger
  AFTER UPDATE ON public.expenses_controlled
  FOR EACH ROW
  EXECUTE FUNCTION public.track_monthly_spending();

-- Add comment for documentation
COMMENT ON FUNCTION public.enforce_monthly_cap_atomic() IS 
  'HARD-LOCK Monthly Safety Valve: Atomic enforcement of 15,000 MAD cap for Level 1 expenses. 
   Uses advisory locks to prevent race conditions. Timezone: Africa/Casablanca.
   Error code: LIMIT_EXCEEDED for UI handling.';