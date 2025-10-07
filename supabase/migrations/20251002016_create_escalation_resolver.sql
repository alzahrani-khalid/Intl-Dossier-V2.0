-- Migration: T016 - Create escalation recipient resolver
-- Description: Helper function to determine escalation recipient for a staff member
-- Dependencies: T004 (staff_profiles)

-- Function to get escalation recipient for a staff member
CREATE OR REPLACE FUNCTION get_escalation_recipient(staff_id UUID)
RETURNS UUID AS $$
DECLARE
  recipient_id UUID;
BEGIN
  -- Escalation chain priority:
  -- 1. Explicit escalation_chain_id (if set)
  -- 2. Unit supervisor (role='supervisor' in same unit)
  -- 3. Any admin (fallback)

  SELECT COALESCE(
    sp.escalation_chain_id, -- Explicit override
    (SELECT user_id FROM staff_profiles WHERE unit_id = sp.unit_id AND role = 'supervisor' LIMIT 1), -- Unit supervisor
    (SELECT user_id FROM staff_profiles WHERE role = 'admin' LIMIT 1) -- Fallback to any admin
  ) INTO recipient_id
  FROM staff_profiles sp
  WHERE sp.user_id = staff_id;

  -- Return recipient (can be NULL if no escalation path exists)
  RETURN recipient_id;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON FUNCTION get_escalation_recipient IS 'Resolves escalation recipient: explicit chain → unit supervisor → admin (fallback)';
