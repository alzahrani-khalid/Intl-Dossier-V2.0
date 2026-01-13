-- Migration: Document Version Comparison System
-- Feature: Side-by-side or inline diff view for comparing document versions
-- Supports version history, text content comparison, and revert functionality

-- Create document_versions table for storing version history
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
    checksum TEXT, -- SHA-256 hash for integrity verification
    change_summary TEXT, -- Brief description of changes in this version
    change_type TEXT CHECK (change_type IN ('initial', 'update', 'major_revision', 'minor_edit', 'revert')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Extracted text content for diff comparison (if applicable)
    text_content TEXT,
    text_content_extracted_at TIMESTAMPTZ,
    -- Metadata that may differ between versions
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(document_id, version_number)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_version_number ON public.document_versions(document_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON public.document_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_by ON public.document_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_document_versions_change_type ON public.document_versions(change_type);

-- Full-text search on text content for finding changes
CREATE INDEX IF NOT EXISTS idx_document_versions_text_search
    ON public.document_versions USING gin(to_tsvector('english', COALESCE(text_content, '')));

-- Create document_version_comparisons table for caching comparison results
CREATE TABLE IF NOT EXISTS public.document_version_comparisons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version_a INTEGER NOT NULL CHECK (version_a > 0),
    version_b INTEGER NOT NULL CHECK (version_b > 0),
    comparison_type TEXT NOT NULL CHECK (comparison_type IN ('side_by_side', 'inline', 'unified')),
    diff_result JSONB NOT NULL, -- Stores the computed diff
    diff_stats JSONB DEFAULT '{}'::jsonb, -- Stats like added/removed lines, changed sections
    computed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    computed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    -- Cache expiration
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    UNIQUE(document_id, version_a, version_b, comparison_type),
    CHECK (version_a != version_b)
);

CREATE INDEX IF NOT EXISTS idx_version_comparisons_document ON public.document_version_comparisons(document_id);
CREATE INDEX IF NOT EXISTS idx_version_comparisons_versions ON public.document_version_comparisons(document_id, version_a, version_b);
CREATE INDEX IF NOT EXISTS idx_version_comparisons_expires ON public.document_version_comparisons(expires_at);

-- Create document_version_revert_history for tracking reverts
CREATE TABLE IF NOT EXISTS public.document_version_revert_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    from_version INTEGER NOT NULL,
    to_version INTEGER NOT NULL,
    reverted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    reverted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reason TEXT,
    new_version_id UUID REFERENCES public.document_versions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_revert_history_document ON public.document_version_revert_history(document_id);
CREATE INDEX IF NOT EXISTS idx_revert_history_reverted_at ON public.document_version_revert_history(reverted_at DESC);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_version_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_version_revert_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_versions
CREATE POLICY "Users can view document versions they have access to"
    ON public.document_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.id = document_versions.document_id
            -- Inherits access from parent document (simplified - adjust based on your RLS model)
        )
    );

CREATE POLICY "Authenticated users can create document versions"
    ON public.document_versions FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Document version creators can update their versions"
    ON public.document_versions FOR UPDATE
    USING (auth.uid() = created_by);

-- RLS Policies for document_version_comparisons
CREATE POLICY "Users can view version comparisons"
    ON public.document_version_comparisons FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create version comparisons"
    ON public.document_version_comparisons FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for document_version_revert_history
CREATE POLICY "Users can view revert history"
    ON public.document_version_revert_history FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create revert records"
    ON public.document_version_revert_history FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = reverted_by);

-- Function to create initial version when document is created
CREATE OR REPLACE FUNCTION public.create_initial_document_version()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.document_versions (
        document_id,
        version_number,
        file_path,
        file_name,
        mime_type,
        size_bytes,
        change_type,
        created_by,
        metadata
    ) VALUES (
        NEW.id,
        1,
        NEW.file_path,
        NEW.file_name,
        NEW.mime_type,
        NEW.size_bytes,
        'initial',
        COALESCE(NEW.uploaded_by, auth.uid()),
        jsonb_build_object(
            'entity_type', NEW.entity_type,
            'entity_id', NEW.entity_id
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create initial version
CREATE TRIGGER trg_create_initial_document_version
    AFTER INSERT ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.create_initial_document_version();

-- Function to create new version when document is updated
CREATE OR REPLACE FUNCTION public.create_document_version_on_update()
RETURNS TRIGGER AS $$
DECLARE
    new_version_number INTEGER;
BEGIN
    -- Only create new version if file_path changed (actual new file upload)
    IF OLD.file_path IS DISTINCT FROM NEW.file_path THEN
        -- Get next version number
        SELECT COALESCE(MAX(version_number), 0) + 1
        INTO new_version_number
        FROM public.document_versions
        WHERE document_id = NEW.id;

        INSERT INTO public.document_versions (
            document_id,
            version_number,
            file_path,
            file_name,
            mime_type,
            size_bytes,
            change_type,
            created_by,
            metadata
        ) VALUES (
            NEW.id,
            new_version_number,
            NEW.file_path,
            NEW.file_name,
            NEW.mime_type,
            NEW.size_bytes,
            'update',
            COALESCE(auth.uid(), OLD.uploaded_by),
            jsonb_build_object(
                'entity_type', NEW.entity_type,
                'entity_id', NEW.entity_id,
                'previous_file_path', OLD.file_path
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for version creation on update
CREATE TRIGGER trg_create_document_version_on_update
    AFTER UPDATE ON public.documents
    FOR EACH ROW
    WHEN (OLD.file_path IS DISTINCT FROM NEW.file_path)
    EXECUTE FUNCTION public.create_document_version_on_update();

-- Function to get document version history
CREATE OR REPLACE FUNCTION public.get_document_version_history(
    p_document_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    version_number INTEGER,
    file_path TEXT,
    file_name TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    checksum TEXT,
    change_summary TEXT,
    change_type TEXT,
    created_by UUID,
    created_by_name TEXT,
    created_at TIMESTAMPTZ,
    has_text_content BOOLEAN,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dv.id,
        dv.document_id,
        dv.version_number,
        dv.file_path,
        dv.file_name,
        dv.mime_type,
        dv.size_bytes,
        dv.checksum,
        dv.change_summary,
        dv.change_type,
        dv.created_by,
        COALESCE(u.full_name, u.email, 'Unknown') AS created_by_name,
        dv.created_at,
        (dv.text_content IS NOT NULL) AS has_text_content,
        dv.metadata
    FROM public.document_versions dv
    LEFT JOIN public.users u ON u.id = dv.created_by
    WHERE dv.document_id = p_document_id
    ORDER BY dv.version_number DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to compare two versions (text-based)
CREATE OR REPLACE FUNCTION public.compare_document_versions(
    p_document_id UUID,
    p_version_a INTEGER,
    p_version_b INTEGER
)
RETURNS TABLE (
    version_a_info JSONB,
    version_b_info JSONB,
    can_compare_text BOOLEAN,
    text_a TEXT,
    text_b TEXT
) AS $$
DECLARE
    v_a RECORD;
    v_b RECORD;
BEGIN
    -- Get version A info
    SELECT
        dv.id, dv.version_number, dv.file_name, dv.mime_type,
        dv.size_bytes, dv.change_type, dv.created_at, dv.text_content,
        COALESCE(u.full_name, u.email, 'Unknown') AS created_by_name
    INTO v_a
    FROM public.document_versions dv
    LEFT JOIN public.users u ON u.id = dv.created_by
    WHERE dv.document_id = p_document_id AND dv.version_number = p_version_a;

    -- Get version B info
    SELECT
        dv.id, dv.version_number, dv.file_name, dv.mime_type,
        dv.size_bytes, dv.change_type, dv.created_at, dv.text_content,
        COALESCE(u.full_name, u.email, 'Unknown') AS created_by_name
    INTO v_b
    FROM public.document_versions dv
    LEFT JOIN public.users u ON u.id = dv.created_by
    WHERE dv.document_id = p_document_id AND dv.version_number = p_version_b;

    IF v_a IS NULL OR v_b IS NULL THEN
        RAISE EXCEPTION 'One or both versions not found';
    END IF;

    RETURN QUERY
    SELECT
        jsonb_build_object(
            'id', v_a.id,
            'version_number', v_a.version_number,
            'file_name', v_a.file_name,
            'mime_type', v_a.mime_type,
            'size_bytes', v_a.size_bytes,
            'change_type', v_a.change_type,
            'created_at', v_a.created_at,
            'created_by_name', v_a.created_by_name
        ) AS version_a_info,
        jsonb_build_object(
            'id', v_b.id,
            'version_number', v_b.version_number,
            'file_name', v_b.file_name,
            'mime_type', v_b.mime_type,
            'size_bytes', v_b.size_bytes,
            'change_type', v_b.change_type,
            'created_at', v_b.created_at,
            'created_by_name', v_b.created_by_name
        ) AS version_b_info,
        (v_a.text_content IS NOT NULL AND v_b.text_content IS NOT NULL) AS can_compare_text,
        v_a.text_content AS text_a,
        v_b.text_content AS text_b;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revert to a previous version
CREATE OR REPLACE FUNCTION public.revert_document_to_version(
    p_document_id UUID,
    p_target_version INTEGER,
    p_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    current_version_number INTEGER;
    target_version RECORD;
    new_version_id UUID;
    new_version_number INTEGER;
BEGIN
    -- Get current version number
    SELECT COALESCE(MAX(version_number), 0) INTO current_version_number
    FROM public.document_versions
    WHERE document_id = p_document_id;

    -- Get target version details
    SELECT * INTO target_version
    FROM public.document_versions
    WHERE document_id = p_document_id AND version_number = p_target_version;

    IF target_version IS NULL THEN
        RAISE EXCEPTION 'Target version % not found', p_target_version;
    END IF;

    -- Create new version as a revert
    new_version_number := current_version_number + 1;

    INSERT INTO public.document_versions (
        document_id,
        version_number,
        file_path,
        file_name,
        mime_type,
        size_bytes,
        checksum,
        change_summary,
        change_type,
        created_by,
        text_content,
        metadata
    ) VALUES (
        p_document_id,
        new_version_number,
        target_version.file_path,
        target_version.file_name,
        target_version.mime_type,
        target_version.size_bytes,
        target_version.checksum,
        format('Reverted to version %s', p_target_version),
        'revert',
        auth.uid(),
        target_version.text_content,
        jsonb_set(
            COALESCE(target_version.metadata, '{}'::jsonb),
            '{reverted_from_version}',
            to_jsonb(p_target_version)
        )
    )
    RETURNING id INTO new_version_id;

    -- Update the main document to point to the reverted version's file
    UPDATE public.documents
    SET
        file_path = target_version.file_path,
        file_name = target_version.file_name,
        mime_type = target_version.mime_type,
        size_bytes = target_version.size_bytes,
        updated_at = NOW()
    WHERE id = p_document_id;

    -- Record the revert in history
    INSERT INTO public.document_version_revert_history (
        document_id,
        from_version,
        to_version,
        reverted_by,
        reason,
        new_version_id
    ) VALUES (
        p_document_id,
        current_version_number,
        p_target_version,
        auth.uid(),
        p_reason,
        new_version_id
    );

    RETURN new_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.document_versions TO authenticated;
GRANT ALL ON public.document_version_comparisons TO authenticated;
GRANT ALL ON public.document_version_revert_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_document_version_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.compare_document_versions TO authenticated;
GRANT EXECUTE ON FUNCTION public.revert_document_to_version TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.document_versions IS 'Stores version history for documents with change tracking';
COMMENT ON TABLE public.document_version_comparisons IS 'Caches diff results between document versions';
COMMENT ON TABLE public.document_version_revert_history IS 'Tracks when documents are reverted to previous versions';
COMMENT ON FUNCTION public.get_document_version_history IS 'Returns paginated version history for a document';
COMMENT ON FUNCTION public.compare_document_versions IS 'Compares two document versions and returns their details';
COMMENT ON FUNCTION public.revert_document_to_version IS 'Reverts a document to a specified version, creating a new version';
