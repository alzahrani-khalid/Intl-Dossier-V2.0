-- Fix RLS policy for intake_tickets to allow Edge Functions to access tickets
-- This migration simplifies the SELECT policy to prioritize direct user checks

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS ticket_select ON intake_tickets;

-- Create a new simplified SELECT policy
-- Priority order: direct user match > unit match > NULL unit
CREATE POLICY ticket_select ON intake_tickets
    FOR SELECT
    USING (
        -- Service role bypass (for admin operations)
        auth.jwt() ->> 'role' = 'service_role'
        OR
        -- User created the ticket
        created_by = auth.uid()
        OR
        -- User is assigned to the ticket
        assigned_to = auth.uid()
        OR
        -- User is in the assigned unit OR ticket has no assigned unit
        (
            assigned_unit IS NULL
            OR
            assigned_unit = ANY(get_user_units(auth.uid()))
        )
    );

COMMENT ON POLICY ticket_select ON intake_tickets IS 
'Allow users to view tickets they created, are assigned to, or belong to their units. Service role has full access.';
