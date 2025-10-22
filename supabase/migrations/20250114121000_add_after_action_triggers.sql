-- Migration: Additional triggers for after-action tables
-- Purpose: Auto-maintain computed fields and enforce business rules
-- Feature: After-Action Structured Documentation
-- Date: 2025-01-14

-- Note: Most triggers are already created in individual table migrations:
-- - lowercase_email_external_contacts (external_contacts)
-- - update_updated_at_* (multiple tables)
-- - increment_version_after_action (after_action_records)
-- - check_attachment_count_limit (attachments)
-- - update_overdue_commitments (commitments)
-- - prevent_version_snapshot_modification (version_snapshots)

-- This migration adds additional business logic triggers

-- ========================================
-- Auto-populate dossier_id in commitments
-- ========================================

CREATE OR REPLACE FUNCTION auto_populate_commitment_dossier()
RETURNS TRIGGER AS $$
BEGIN
    -- Denormalize dossier_id from parent after_action_record
    SELECT dossier_id INTO NEW.dossier_id
    FROM public.after_action_records
    WHERE id = NEW.after_action_id;

    IF NEW.dossier_id IS NULL THEN
        RAISE EXCEPTION 'Cannot find dossier_id for after_action_id: %', NEW.after_action_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_populate_commitment_dossier
    BEFORE INSERT ON public.commitments
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_commitment_dossier();

-- ========================================
-- Validate state transitions for after_action_records
-- ========================================

CREATE OR REPLACE FUNCTION validate_after_action_state_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- draft → published (OK)
    IF OLD.status = 'draft' AND NEW.status = 'published' THEN
        -- Ensure published_by and published_at are set
        IF NEW.published_by IS NULL OR NEW.published_at IS NULL THEN
            RAISE EXCEPTION 'published_by and published_at must be set when publishing';
        END IF;
        RETURN NEW;
    END IF;

    -- published → edit_pending (OK)
    IF OLD.status = 'published' AND NEW.status = 'edit_pending' THEN
        -- Ensure edit_requested_by and edit_requested_at are set
        IF NEW.edit_requested_by IS NULL OR NEW.edit_requested_at IS NULL THEN
            RAISE EXCEPTION 'edit_requested_by and edit_requested_at must be set when requesting edit';
        END IF;
        RETURN NEW;
    END IF;

    -- edit_pending → published (OK - approved)
    IF OLD.status = 'edit_pending' AND NEW.status = 'published' THEN
        -- Ensure edit_approved_by and edit_approved_at are set
        IF NEW.edit_approved_by IS NULL OR NEW.edit_approved_at IS NULL THEN
            RAISE EXCEPTION 'edit_approved_by and edit_approved_at must be set when approving edit';
        END IF;
        RETURN NEW;
    END IF;

    -- edit_pending → published (rejected - clear edit fields)
    IF OLD.status = 'edit_pending' AND NEW.status = 'published' AND NEW.edit_rejection_reason IS NOT NULL THEN
        -- Clear edit request fields after rejection
        NEW.edit_requested_by = NULL;
        NEW.edit_requested_at = NULL;
        NEW.edit_request_reason = NULL;
        RETURN NEW;
    END IF;

    -- Same status (OK - update within same status)
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Invalid transition
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_after_action_state_transition
    BEFORE UPDATE OF status ON public.after_action_records
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION validate_after_action_state_transition();

-- ========================================
-- Prevent editing published after-actions without approval
-- ========================================

CREATE OR REPLACE FUNCTION prevent_unauthorized_after_action_edit()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow edits if status is draft
    IF NEW.status = 'draft' THEN
        RETURN NEW;
    END IF;

    -- Allow edits if status is edit_pending (within approval window)
    IF NEW.status = 'edit_pending' THEN
        RETURN NEW;
    END IF;

    -- Prevent edits if status is published (should request edit first)
    IF NEW.status = 'published' AND OLD.status = 'published' THEN
        -- Allow only status-related fields and audit fields to change
        IF (
            NEW.title IS DISTINCT FROM OLD.title OR
            NEW.description IS DISTINCT FROM OLD.description OR
            NEW.attendance_list IS DISTINCT FROM OLD.attendance_list OR
            NEW.confidentiality_level IS DISTINCT FROM OLD.confidentiality_level
        ) THEN
            RAISE EXCEPTION 'Cannot edit published after-action without approval. Request edit first.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_unauthorized_after_action_edit
    BEFORE UPDATE ON public.after_action_records
    FOR EACH ROW
    WHEN (OLD.status = 'published')
    EXECUTE FUNCTION prevent_unauthorized_after_action_edit();

-- ========================================
-- Notify on commitment assignment (placeholder for integration)
-- ========================================

CREATE OR REPLACE FUNCTION notify_commitment_assigned()
RETURNS TRIGGER AS $$
BEGIN
    -- This trigger queues notification when commitment is assigned
    -- Actual notification sending is handled by Edge Function

    -- Insert into notifications table (assuming it exists from other features)
    INSERT INTO public.notifications (
        user_id,
        notification_type,
        title,
        message,
        related_entity_type,
        related_entity_id,
        created_at
    )
    SELECT
        NEW.owner_internal_id,
        'commitment_assigned',
        'New Commitment Assigned',
        'You have been assigned a commitment: ' || LEFT(NEW.description, 100),
        'commitment',
        NEW.id,
        now()
    WHERE NEW.owner_type = 'internal' AND NEW.owner_internal_id IS NOT NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_commitment_assigned
    AFTER INSERT ON public.commitments
    FOR EACH ROW
    WHEN (NEW.owner_type = 'internal' AND NEW.owner_internal_id IS NOT NULL)
    EXECUTE FUNCTION notify_commitment_assigned();

-- ========================================
-- Update parent after_action updated_at when child entities change
-- ========================================

CREATE OR REPLACE FUNCTION update_parent_after_action_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.after_action_records
    SET updated_at = now(),
        updated_by = auth.uid()
    WHERE id = COALESCE(NEW.after_action_id, OLD.after_action_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to all child tables
CREATE TRIGGER trigger_update_parent_after_action_on_decision_change
    AFTER INSERT OR UPDATE OR DELETE ON public.decisions
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_after_action_timestamp();

CREATE TRIGGER trigger_update_parent_after_action_on_commitment_change
    AFTER INSERT OR UPDATE OR DELETE ON public.commitments
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_after_action_timestamp();

CREATE TRIGGER trigger_update_parent_after_action_on_risk_change
    AFTER INSERT OR UPDATE OR DELETE ON public.risks
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_after_action_timestamp();

CREATE TRIGGER trigger_update_parent_after_action_on_follow_up_change
    AFTER INSERT OR UPDATE OR DELETE ON public.follow_up_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_after_action_timestamp();

CREATE TRIGGER trigger_update_parent_after_action_on_attachment_change
    AFTER INSERT OR UPDATE OR DELETE ON public.attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_after_action_timestamp();

COMMENT ON FUNCTION validate_after_action_state_transition IS 'Enforces state machine: draft → published → edit_pending → published';
COMMENT ON FUNCTION auto_populate_commitment_dossier IS 'Denormalizes dossier_id from parent after_action_record for efficient querying';
COMMENT ON FUNCTION update_parent_after_action_timestamp IS 'Updates parent after_action updated_at when child entities change (for sync)';
