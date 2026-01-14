-- Migration: Create access_requests table
-- Description: Table for storing access request submissions from users who encounter permission denied errors
-- Date: 2026-01-14

-- Create enum for access request status
DO $$ BEGIN
    CREATE TYPE access_request_status AS ENUM (
        'pending',
        'approved',
        'denied',
        'expired',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create enum for urgency levels
DO $$ BEGIN
    CREATE TYPE access_request_urgency AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create enum for resource types (if not exists from previous migrations)
DO $$ BEGIN
    CREATE TYPE access_resource_type AS ENUM (
        'dossier',
        'country',
        'organization',
        'mou',
        'event',
        'forum',
        'brief',
        'document',
        'report',
        'engagement',
        'commitment',
        'position',
        'person',
        'calendar',
        'user',
        'system'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create enum for permission types
DO $$ BEGIN
    CREATE TYPE permission_action_type AS ENUM (
        'read',
        'write',
        'delete',
        'approve',
        'publish',
        'assign',
        'manage',
        'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create access_requests table
CREATE TABLE IF NOT EXISTS access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Request details
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    granter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Resource information
    resource_type access_resource_type NOT NULL,
    resource_id UUID,
    resource_name TEXT,

    -- Permission requested
    requested_permission permission_action_type NOT NULL,

    -- Request metadata
    reason TEXT NOT NULL,
    urgency access_request_urgency NOT NULL DEFAULT 'medium',
    requested_duration_days INTEGER, -- NULL means permanent access requested

    -- Status
    status access_request_status NOT NULL DEFAULT 'pending',

    -- Response (filled when granter responds)
    response_message TEXT,
    responded_by UUID REFERENCES users(id),
    responded_at TIMESTAMP WITH TIME ZONE,

    -- If approved, when does the granted access expire
    access_expires_at TIMESTAMP WITH TIME ZONE,

    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Notification tracking
    requester_notified BOOLEAN DEFAULT false,
    granter_notified BOOLEAN DEFAULT false
);

-- Create partial unique index to prevent duplicate pending requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_access_request
    ON access_requests (requester_id, granter_id, resource_type, COALESCE(resource_id, '00000000-0000-0000-0000-000000000000'::UUID), requested_permission)
    WHERE status = 'pending';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_access_requests_requester
    ON access_requests(requester_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_access_requests_granter
    ON access_requests(granter_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_access_requests_status
    ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_resource
    ON access_requests(resource_type, resource_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_access_requests_created
    ON access_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_urgency
    ON access_requests(urgency) WHERE status = 'pending';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_access_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS access_requests_updated_at ON access_requests;
CREATE TRIGGER access_requests_updated_at
    BEFORE UPDATE ON access_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_access_request_updated_at();

-- Function to auto-expire old pending requests
CREATE OR REPLACE FUNCTION expire_old_access_requests()
RETURNS void AS $$
BEGIN
    UPDATE access_requests
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'pending'
      AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to get pending requests for a granter
CREATE OR REPLACE FUNCTION get_pending_access_requests(p_granter_id UUID)
RETURNS TABLE (
    id UUID,
    requester_id UUID,
    requester_name TEXT,
    requester_email TEXT,
    resource_type access_resource_type,
    resource_id UUID,
    resource_name TEXT,
    requested_permission permission_action_type,
    reason TEXT,
    urgency access_request_urgency,
    requested_duration_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ar.id,
        ar.requester_id,
        u.full_name AS requester_name,
        u.email AS requester_email,
        ar.resource_type,
        ar.resource_id,
        ar.resource_name,
        ar.requested_permission,
        ar.reason,
        ar.urgency,
        ar.requested_duration_days,
        ar.created_at
    FROM access_requests ar
    JOIN users u ON ar.requester_id = u.id
    WHERE ar.granter_id = p_granter_id
      AND ar.status = 'pending'
    ORDER BY
        CASE ar.urgency
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        ar.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to respond to an access request
CREATE OR REPLACE FUNCTION respond_to_access_request(
    p_request_id UUID,
    p_responder_id UUID,
    p_approved BOOLEAN,
    p_message TEXT DEFAULT NULL,
    p_duration_days INTEGER DEFAULT NULL
)
RETURNS access_requests AS $$
DECLARE
    v_request access_requests;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate expiration if approved with duration
    IF p_approved AND p_duration_days IS NOT NULL THEN
        v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;
    END IF;

    -- Update the request
    UPDATE access_requests
    SET status = CASE WHEN p_approved THEN 'approved'::access_request_status ELSE 'denied'::access_request_status END,
        response_message = p_message,
        responded_by = p_responder_id,
        responded_at = NOW(),
        access_expires_at = v_expires_at,
        requester_notified = false -- Mark for notification
    WHERE id = p_request_id
      AND status = 'pending'
    RETURNING * INTO v_request;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Access request not found or already processed';
    END IF;

    -- If approved, create the permission delegation
    IF p_approved THEN
        INSERT INTO permission_delegations (
            user_id,
            delegated_by,
            entity_type,
            entity_id,
            permissions,
            expires_at,
            is_active
        ) VALUES (
            v_request.requester_id,
            p_responder_id,
            v_request.resource_type::text::entity_type, -- Cast to entity_type
            v_request.resource_id,
            jsonb_build_object(v_request.requested_permission::text, true),
            v_expires_at,
            true
        );
    END IF;

    RETURN v_request;
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests (as requester)
CREATE POLICY access_requests_requester_select ON access_requests
    FOR SELECT
    USING (requester_id = auth.uid());

-- Users can view requests where they are the granter
CREATE POLICY access_requests_granter_select ON access_requests
    FOR SELECT
    USING (granter_id = auth.uid());

-- Users can create requests
CREATE POLICY access_requests_insert ON access_requests
    FOR INSERT
    WITH CHECK (requester_id = auth.uid());

-- Granters can update requests (respond)
CREATE POLICY access_requests_granter_update ON access_requests
    FOR UPDATE
    USING (granter_id = auth.uid() AND status = 'pending');

-- Requesters can cancel their pending requests
CREATE POLICY access_requests_requester_cancel ON access_requests
    FOR UPDATE
    USING (requester_id = auth.uid() AND status = 'pending');

-- Add table comments
COMMENT ON TABLE access_requests IS 'Stores access request submissions from users encountering permission denied errors';
COMMENT ON COLUMN access_requests.requester_id IS 'User requesting access';
COMMENT ON COLUMN access_requests.granter_id IS 'User who can grant the access';
COMMENT ON COLUMN access_requests.resource_type IS 'Type of resource being requested';
COMMENT ON COLUMN access_requests.resource_id IS 'Specific resource ID if applicable';
COMMENT ON COLUMN access_requests.requested_permission IS 'Permission being requested';
COMMENT ON COLUMN access_requests.reason IS 'Justification for the request';
COMMENT ON COLUMN access_requests.urgency IS 'Urgency level of the request';
COMMENT ON COLUMN access_requests.requested_duration_days IS 'Requested duration in days, NULL for permanent';
COMMENT ON COLUMN access_requests.access_expires_at IS 'When granted access expires';
