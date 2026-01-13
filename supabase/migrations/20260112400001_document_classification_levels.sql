-- Migration: Document Classification Levels with Field-Level Access Control
-- Feature: Add document classification levels (Public, Internal, Confidential, Secret)
-- with field-level access control, need-to-know principles, and automatic redaction

-- Create enum for document classification levels
DO $$ BEGIN
    CREATE TYPE document_classification AS ENUM (
        'public',       -- Level 0: Publicly accessible, no restrictions
        'internal',     -- Level 1: Internal use only, basic clearance required
        'confidential', -- Level 2: Confidential, analyst clearance or higher
        'secret'        -- Level 3: Secret, admin/manager clearance only
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create classification mapping function for integer comparison
CREATE OR REPLACE FUNCTION get_classification_level(classification document_classification)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE classification
        WHEN 'public' THEN 0
        WHEN 'internal' THEN 1
        WHEN 'confidential' THEN 2
        WHEN 'secret' THEN 3
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add classification columns to documents table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS classification document_classification DEFAULT 'internal' NOT NULL,
ADD COLUMN IF NOT EXISTS classification_reason TEXT, -- Justification for classification level
ADD COLUMN IF NOT EXISTS classified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS classified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS declassification_date TIMESTAMPTZ, -- When document can be declassified
ADD COLUMN IF NOT EXISTS handling_instructions TEXT, -- Special handling requirements
ADD COLUMN IF NOT EXISTS need_to_know_groups UUID[] DEFAULT '{}', -- Specific user groups with access
ADD COLUMN IF NOT EXISTS redacted_content JSONB DEFAULT '{}', -- Stores field-level redaction rules
ADD COLUMN IF NOT EXISTS access_audit_enabled BOOLEAN DEFAULT TRUE; -- Enable detailed access logging

-- Add index for classification-based queries
CREATE INDEX IF NOT EXISTS idx_documents_classification ON public.documents(classification);
CREATE INDEX IF NOT EXISTS idx_documents_classification_date ON public.documents(declassification_date) WHERE declassification_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_classified_by ON public.documents(classified_by);
CREATE INDEX IF NOT EXISTS idx_documents_need_to_know ON public.documents USING GIN(need_to_know_groups);

-- Create document_access_groups table for need-to-know management
CREATE TABLE IF NOT EXISTS public.document_access_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    members UUID[] DEFAULT '{}', -- Array of user IDs
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_access_groups_members ON public.document_access_groups USING GIN(members);
CREATE INDEX IF NOT EXISTS idx_access_groups_active ON public.document_access_groups(is_active) WHERE is_active = TRUE;

-- Create document_field_redactions table for field-level access control
CREATE TABLE IF NOT EXISTS public.document_field_redactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    field_path TEXT NOT NULL, -- JSON path or field name to redact
    redaction_level document_classification NOT NULL, -- Minimum clearance to see unredacted
    redaction_text TEXT DEFAULT '[REDACTED]', -- Replacement text for unauthorized users
    redaction_reason TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(document_id, field_path)
);

CREATE INDEX IF NOT EXISTS idx_field_redactions_document ON public.document_field_redactions(document_id);
CREATE INDEX IF NOT EXISTS idx_field_redactions_level ON public.document_field_redactions(redaction_level);

-- Create document_access_log for comprehensive audit trail
CREATE TABLE IF NOT EXISTS public.document_access_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'preview', 'metadata', 'denied')),
    user_clearance INTEGER NOT NULL,
    document_classification document_classification NOT NULL,
    access_granted BOOLEAN NOT NULL,
    denial_reason TEXT, -- Populated if access_granted = FALSE
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    session_id TEXT,
    redacted_fields TEXT[] DEFAULT '{}' -- Fields that were redacted for this access
);

CREATE INDEX IF NOT EXISTS idx_access_log_document ON public.document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_access_log_user ON public.document_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_log_time ON public.document_access_log(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_log_denied ON public.document_access_log(document_id, access_granted) WHERE access_granted = FALSE;
CREATE INDEX IF NOT EXISTS idx_access_log_classification ON public.document_access_log(document_classification);

-- Create document_classification_changes table for tracking classification history
CREATE TABLE IF NOT EXISTS public.document_classification_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    old_classification document_classification,
    new_classification document_classification NOT NULL,
    change_reason TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    approved_by UUID REFERENCES auth.users(id), -- For upgrades, requires approval
    approval_date TIMESTAMPTZ,
    is_approved BOOLEAN DEFAULT FALSE -- TRUE for downgrades, requires approval for upgrades
);

CREATE INDEX IF NOT EXISTS idx_class_changes_document ON public.document_classification_changes(document_id);
CREATE INDEX IF NOT EXISTS idx_class_changes_time ON public.document_classification_changes(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_class_changes_pending ON public.document_classification_changes(is_approved) WHERE is_approved = FALSE;

-- Enable RLS on new tables
ALTER TABLE public.document_access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_field_redactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_classification_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_access_groups
CREATE POLICY "Users can view active access groups"
    ON public.document_access_groups FOR SELECT
    USING (
        is_active = TRUE
        AND (
            -- User is a member of the group
            auth.uid() = ANY(members)
            OR
            -- User created the group
            created_by = auth.uid()
            OR
            -- User is admin/manager
            is_admin_or_manager(auth.uid())
        )
    );

CREATE POLICY "Admin/managers can manage access groups"
    ON public.document_access_groups FOR ALL
    USING (is_admin_or_manager(auth.uid()))
    WITH CHECK (is_admin_or_manager(auth.uid()));

-- RLS Policies for document_field_redactions
CREATE POLICY "Users with sufficient clearance can view redaction rules"
    ON public.document_field_redactions FOR SELECT
    USING (
        get_user_clearance_level(auth.uid()) >= get_classification_level(redaction_level)
        OR is_admin_or_manager(auth.uid())
    );

CREATE POLICY "Admin/managers can manage field redactions"
    ON public.document_field_redactions FOR ALL
    USING (is_admin_or_manager(auth.uid()))
    WITH CHECK (is_admin_or_manager(auth.uid()));

-- RLS Policies for document_access_log
CREATE POLICY "Users can view their own access logs"
    ON public.document_access_log FOR SELECT
    USING (
        user_id = auth.uid()
        OR is_admin_or_manager(auth.uid())
    );

CREATE POLICY "System can insert access logs"
    ON public.document_access_log FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for document_classification_changes
CREATE POLICY "Users can view classification changes for documents they can access"
    ON public.document_classification_changes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.id = document_classification_changes.document_id
            AND get_user_clearance_level(auth.uid()) >= get_classification_level(d.classification)
        )
        OR is_admin_or_manager(auth.uid())
    );

CREATE POLICY "Authorized users can request classification changes"
    ON public.document_classification_changes FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin/managers can approve classification changes"
    ON public.document_classification_changes FOR UPDATE
    USING (is_admin_or_manager(auth.uid()))
    WITH CHECK (is_admin_or_manager(auth.uid()));

-- Function to check if user can access a document based on classification
CREATE OR REPLACE FUNCTION can_access_document(
    p_document_id UUID,
    p_user_id UUID DEFAULT auth.uid(),
    p_access_type TEXT DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_classification document_classification;
    v_user_clearance INTEGER;
    v_document_level INTEGER;
    v_need_to_know UUID[];
    v_can_access BOOLEAN;
    v_denial_reason TEXT;
BEGIN
    -- Get document classification and need-to-know groups
    SELECT classification, need_to_know_groups
    INTO v_classification, v_need_to_know
    FROM public.documents
    WHERE id = p_document_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Get user clearance level
    v_user_clearance := get_user_clearance_level(p_user_id);
    v_document_level := get_classification_level(v_classification);

    -- Check clearance level
    IF v_user_clearance >= v_document_level THEN
        v_can_access := TRUE;
    ELSIF v_classification = 'public' THEN
        v_can_access := TRUE;
    ELSE
        v_can_access := FALSE;
        v_denial_reason := 'Insufficient clearance level';
    END IF;

    -- Check need-to-know if document has specific groups and user doesn't have clearance
    IF NOT v_can_access AND array_length(v_need_to_know, 1) > 0 THEN
        -- Check if user is in any of the need-to-know groups
        IF EXISTS (
            SELECT 1 FROM public.document_access_groups dag
            WHERE dag.id = ANY(v_need_to_know)
            AND dag.is_active = TRUE
            AND p_user_id = ANY(dag.members)
        ) THEN
            v_can_access := TRUE;
            v_denial_reason := NULL;
        ELSE
            v_denial_reason := 'Not in need-to-know group';
        END IF;
    END IF;

    -- Log the access attempt
    INSERT INTO public.document_access_log (
        document_id,
        user_id,
        access_type,
        user_clearance,
        document_classification,
        access_granted,
        denial_reason
    ) VALUES (
        p_document_id,
        p_user_id,
        p_access_type,
        v_user_clearance,
        v_classification,
        v_can_access,
        v_denial_reason
    );

    RETURN v_can_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get document with field-level redaction applied
CREATE OR REPLACE FUNCTION get_document_with_redaction(
    p_document_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
    v_user_clearance INTEGER;
    v_document RECORD;
    v_result JSONB;
    v_redacted_fields TEXT[] := '{}';
    v_redaction RECORD;
BEGIN
    -- Check if user can access document
    IF NOT can_access_document(p_document_id, p_user_id, 'view') THEN
        RETURN jsonb_build_object(
            'error', 'Access denied',
            'code', 'INSUFFICIENT_CLEARANCE'
        );
    END IF;

    v_user_clearance := get_user_clearance_level(p_user_id);

    -- Get document base data
    SELECT
        d.id, d.entity_type, d.entity_id, d.file_name, d.file_path,
        d.mime_type, d.size_bytes, d.uploaded_at, d.uploaded_by,
        d.classification, d.handling_instructions, d.declassification_date,
        d.classification_reason
    INTO v_document
    FROM public.documents d
    WHERE d.id = p_document_id;

    -- Build base result
    v_result := jsonb_build_object(
        'id', v_document.id,
        'entity_type', v_document.entity_type,
        'entity_id', v_document.entity_id,
        'file_name', v_document.file_name,
        'mime_type', v_document.mime_type,
        'size_bytes', v_document.size_bytes,
        'uploaded_at', v_document.uploaded_at,
        'classification', v_document.classification,
        'handling_instructions', v_document.handling_instructions
    );

    -- Apply field-level redactions
    FOR v_redaction IN
        SELECT field_path, redaction_text, redaction_level
        FROM public.document_field_redactions
        WHERE document_id = p_document_id
    LOOP
        IF v_user_clearance < get_classification_level(v_redaction.redaction_level) THEN
            -- Apply redaction
            v_result := jsonb_set(
                v_result,
                string_to_array(v_redaction.field_path, '.'),
                to_jsonb(v_redaction.redaction_text)
            );
            v_redacted_fields := array_append(v_redacted_fields, v_redaction.field_path);
        END IF;
    END LOOP;

    -- Add file_path only if user has sufficient clearance
    IF v_user_clearance >= get_classification_level(v_document.classification) THEN
        v_result := jsonb_set(v_result, '{file_path}', to_jsonb(v_document.file_path));
    ELSE
        v_result := jsonb_set(v_result, '{file_path}', '"[RESTRICTED]"'::jsonb);
        v_redacted_fields := array_append(v_redacted_fields, 'file_path');
    END IF;

    -- Add classification reason only for users with confidential+ clearance
    IF v_user_clearance >= 2 THEN
        v_result := jsonb_set(v_result, '{classification_reason}', to_jsonb(v_document.classification_reason));
    END IF;

    -- Add declassification date if applicable
    IF v_document.declassification_date IS NOT NULL THEN
        v_result := jsonb_set(v_result, '{declassification_date}', to_jsonb(v_document.declassification_date));
    END IF;

    -- Add metadata about redactions
    v_result := jsonb_set(v_result, '{_redacted_fields}', to_jsonb(v_redacted_fields));
    v_result := jsonb_set(v_result, '{_user_clearance}', to_jsonb(v_user_clearance));

    -- Update access log with redacted fields
    UPDATE public.document_access_log
    SET redacted_fields = v_redacted_fields
    WHERE document_id = p_document_id
    AND user_id = p_user_id
    AND accessed_at = (
        SELECT MAX(accessed_at)
        FROM public.document_access_log
        WHERE document_id = p_document_id AND user_id = p_user_id
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to change document classification (with approval workflow)
CREATE OR REPLACE FUNCTION change_document_classification(
    p_document_id UUID,
    p_new_classification document_classification,
    p_reason TEXT,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    v_current_classification document_classification;
    v_user_clearance INTEGER;
    v_change_id UUID;
    v_is_upgrade BOOLEAN;
    v_auto_approve BOOLEAN;
BEGIN
    -- Get current classification
    SELECT classification INTO v_current_classification
    FROM public.documents
    WHERE id = p_document_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document not found';
    END IF;

    -- Get user clearance
    v_user_clearance := get_user_clearance_level(p_user_id);

    -- Determine if this is an upgrade (requires approval) or downgrade (auto-approved)
    v_is_upgrade := get_classification_level(p_new_classification) > get_classification_level(v_current_classification);

    -- Auto-approve for downgrades or if user is admin/manager
    v_auto_approve := NOT v_is_upgrade OR is_admin_or_manager(p_user_id);

    -- Users can only change classification for documents they have clearance for
    IF v_user_clearance < get_classification_level(v_current_classification) THEN
        RAISE EXCEPTION 'Insufficient clearance to modify this document classification';
    END IF;

    -- Users cannot upgrade beyond their own clearance level
    IF get_classification_level(p_new_classification) > v_user_clearance THEN
        RAISE EXCEPTION 'Cannot set classification higher than your clearance level';
    END IF;

    -- Create the change record
    INSERT INTO public.document_classification_changes (
        document_id,
        old_classification,
        new_classification,
        change_reason,
        changed_by,
        is_approved,
        approved_by,
        approval_date
    ) VALUES (
        p_document_id,
        v_current_classification,
        p_new_classification,
        p_reason,
        p_user_id,
        v_auto_approve,
        CASE WHEN v_auto_approve THEN p_user_id ELSE NULL END,
        CASE WHEN v_auto_approve THEN NOW() ELSE NULL END
    )
    RETURNING id INTO v_change_id;

    -- Apply the change immediately if auto-approved
    IF v_auto_approve THEN
        UPDATE public.documents
        SET
            classification = p_new_classification,
            classified_by = p_user_id,
            classified_at = NOW()
        WHERE id = p_document_id;
    END IF;

    RETURN v_change_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve pending classification change
CREATE OR REPLACE FUNCTION approve_classification_change(
    p_change_id UUID,
    p_approver_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    v_change RECORD;
BEGIN
    -- Only admin/manager can approve
    IF NOT is_admin_or_manager(p_approver_id) THEN
        RAISE EXCEPTION 'Only administrators can approve classification changes';
    END IF;

    -- Get the change
    SELECT * INTO v_change
    FROM public.document_classification_changes
    WHERE id = p_change_id AND is_approved = FALSE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Classification change not found or already approved';
    END IF;

    -- Approve the change
    UPDATE public.document_classification_changes
    SET
        is_approved = TRUE,
        approved_by = p_approver_id,
        approval_date = NOW()
    WHERE id = p_change_id;

    -- Apply the change to the document
    UPDATE public.documents
    SET
        classification = v_change.new_classification,
        classified_by = v_change.changed_by,
        classified_at = NOW()
    WHERE id = v_change.document_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get documents list with classification filtering
CREATE OR REPLACE FUNCTION get_accessible_documents(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_user_id UUID DEFAULT auth.uid(),
    p_include_classification_info BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    id UUID,
    entity_type TEXT,
    entity_id UUID,
    file_name TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    uploaded_at TIMESTAMPTZ,
    uploaded_by UUID,
    classification document_classification,
    classification_label TEXT,
    can_download BOOLEAN,
    handling_instructions TEXT,
    declassification_date TIMESTAMPTZ
) AS $$
DECLARE
    v_user_clearance INTEGER;
BEGIN
    v_user_clearance := get_user_clearance_level(p_user_id);

    RETURN QUERY
    SELECT
        d.id,
        d.entity_type,
        d.entity_id,
        d.file_name,
        d.mime_type,
        d.size_bytes,
        d.uploaded_at,
        d.uploaded_by,
        d.classification,
        CASE d.classification
            WHEN 'public' THEN 'Public'
            WHEN 'internal' THEN 'Internal'
            WHEN 'confidential' THEN 'Confidential'
            WHEN 'secret' THEN 'Secret'
        END AS classification_label,
        (v_user_clearance >= get_classification_level(d.classification)) AS can_download,
        CASE
            WHEN v_user_clearance >= get_classification_level(d.classification)
            THEN d.handling_instructions
            ELSE NULL
        END AS handling_instructions,
        d.declassification_date
    FROM public.documents d
    WHERE d.entity_type = p_entity_type
    AND d.entity_id = p_entity_id
    AND (
        -- User has clearance
        v_user_clearance >= get_classification_level(d.classification)
        OR
        -- Document is public
        d.classification = 'public'
        OR
        -- User is in need-to-know group
        EXISTS (
            SELECT 1 FROM public.document_access_groups dag
            WHERE dag.id = ANY(d.need_to_know_groups)
            AND dag.is_active = TRUE
            AND p_user_id = ANY(dag.members)
        )
    )
    ORDER BY d.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update documents RLS policy to include classification check
DROP POLICY IF EXISTS "Users can view documents within clearance" ON public.documents;
CREATE POLICY "Users can view documents within clearance"
    ON public.documents FOR SELECT
    USING (
        -- User has sufficient clearance
        get_user_clearance_level(auth.uid()) >= get_classification_level(classification)
        OR
        -- Document is public
        classification = 'public'
        OR
        -- User is in need-to-know group
        EXISTS (
            SELECT 1 FROM public.document_access_groups dag
            WHERE dag.id = ANY(need_to_know_groups)
            AND dag.is_active = TRUE
            AND auth.uid() = ANY(dag.members)
        )
        OR
        -- User uploaded the document
        uploaded_by = auth.uid()
    );

-- Trigger to set classification metadata on insert
CREATE OR REPLACE FUNCTION set_document_classification_metadata()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.classified_by IS NULL THEN
        NEW.classified_by := auth.uid();
    END IF;
    IF NEW.classified_at IS NULL THEN
        NEW.classified_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_document_classification_metadata ON public.documents;
CREATE TRIGGER trg_set_document_classification_metadata
    BEFORE INSERT ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION set_document_classification_metadata();

-- Trigger to log classification changes
CREATE OR REPLACE FUNCTION log_document_classification_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.classification IS DISTINCT FROM NEW.classification THEN
        INSERT INTO public.document_classification_changes (
            document_id,
            old_classification,
            new_classification,
            change_reason,
            changed_by,
            is_approved,
            approved_by,
            approval_date
        ) VALUES (
            NEW.id,
            OLD.classification,
            NEW.classification,
            'Direct update via trigger',
            auth.uid(),
            TRUE,
            auth.uid(),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_document_classification_change ON public.documents;
CREATE TRIGGER trg_log_document_classification_change
    AFTER UPDATE OF classification ON public.documents
    FOR EACH ROW
    WHEN (OLD.classification IS DISTINCT FROM NEW.classification)
    EXECUTE FUNCTION log_document_classification_change();

-- Grant permissions
GRANT ALL ON public.document_access_groups TO authenticated;
GRANT ALL ON public.document_field_redactions TO authenticated;
GRANT ALL ON public.document_access_log TO authenticated;
GRANT ALL ON public.document_classification_changes TO authenticated;
GRANT EXECUTE ON FUNCTION get_classification_level TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_document TO authenticated;
GRANT EXECUTE ON FUNCTION get_document_with_redaction TO authenticated;
GRANT EXECUTE ON FUNCTION change_document_classification TO authenticated;
GRANT EXECUTE ON FUNCTION approve_classification_change TO authenticated;
GRANT EXECUTE ON FUNCTION get_accessible_documents TO authenticated;

-- Comments for documentation
COMMENT ON TYPE document_classification IS 'Classification levels for document security: public, internal, confidential, secret';
COMMENT ON TABLE public.document_access_groups IS 'Groups for need-to-know access control';
COMMENT ON TABLE public.document_field_redactions IS 'Field-level redaction rules for documents';
COMMENT ON TABLE public.document_access_log IS 'Audit trail for document access attempts';
COMMENT ON TABLE public.document_classification_changes IS 'History of classification level changes with approval workflow';
COMMENT ON FUNCTION can_access_document IS 'Checks if user can access document based on classification and need-to-know';
COMMENT ON FUNCTION get_document_with_redaction IS 'Returns document with field-level redaction applied based on user clearance';
COMMENT ON FUNCTION change_document_classification IS 'Request classification change with optional approval workflow';
COMMENT ON FUNCTION approve_classification_change IS 'Approve pending classification upgrade request';
COMMENT ON FUNCTION get_accessible_documents IS 'Get list of documents user can access with classification info';
