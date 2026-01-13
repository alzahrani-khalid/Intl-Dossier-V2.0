-- =====================================================================================
-- Migration: Voice Memos and Handwritten Annotations
-- Description: Allow users to add voice memos and handwritten annotations to documents
--              on mobile devices. Automatically transcribe voice notes and sync with
--              desktop for later processing.
-- Author: Claude Code
-- Date: 2026-01-12
-- Feature: voice-memos-annotations
-- =====================================================================================

-- ===========================================
-- ENUM TYPES
-- ===========================================

-- Voice memo status
CREATE TYPE voice_memo_status AS ENUM (
    'recording',         -- Currently being recorded
    'processing',        -- Uploaded, awaiting transcription
    'transcribing',      -- Transcription in progress
    'completed',         -- Transcription complete
    'failed'             -- Transcription failed
);

-- Annotation type
CREATE TYPE annotation_type AS ENUM (
    'handwritten',       -- Freehand drawing/writing
    'highlight',         -- Text highlight
    'text_note',         -- Text annotation
    'shape',             -- Geometric shapes
    'stamp',             -- Predefined stamps (approved, rejected, etc.)
    'signature'          -- Digital signature
);

-- Annotation tool type (for handwritten)
CREATE TYPE annotation_tool AS ENUM (
    'pen',               -- Standard pen
    'highlighter',       -- Highlighter tool
    'eraser',            -- Eraser
    'marker',            -- Thick marker
    'pencil'             -- Pencil (lighter strokes)
);

-- ===========================================
-- VOICE MEMOS TABLE
-- ===========================================
-- Stores voice recordings attached to documents

CREATE TABLE IF NOT EXISTS public.voice_memos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Organization scope
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Document association (polymorphic)
    document_id UUID,                    -- Reference to documents table
    entity_type TEXT NOT NULL,           -- 'document', 'dossier', 'brief', 'position', etc.
    entity_id UUID NOT NULL,             -- ID of the associated entity

    -- Recording metadata
    title TEXT,                          -- Optional title for the memo
    description TEXT,                    -- Optional description
    duration_seconds INTEGER NOT NULL,   -- Recording duration in seconds
    file_size_bytes BIGINT NOT NULL,     -- File size in bytes
    mime_type TEXT NOT NULL DEFAULT 'audio/m4a', -- Audio format (m4a for iOS, webm for web)
    sample_rate INTEGER DEFAULT 44100,   -- Audio sample rate
    channels INTEGER DEFAULT 1,          -- Mono or stereo

    -- Storage
    storage_path TEXT NOT NULL,          -- Path in Supabase Storage
    storage_bucket TEXT NOT NULL DEFAULT 'voice-memos',
    local_uri TEXT,                      -- Local file URI (for offline access)
    is_cached_offline BOOLEAN DEFAULT false,

    -- Transcription
    status voice_memo_status NOT NULL DEFAULT 'processing',
    transcription TEXT,                  -- Full transcription text
    transcription_confidence DECIMAL(3, 2), -- Confidence score (0-1)
    transcription_language TEXT DEFAULT 'en', -- Detected/specified language
    transcription_segments JSONB,        -- Timestamped segments for playback sync
    transcription_metadata JSONB,        -- Additional transcription data
    transcription_started_at TIMESTAMPTZ,
    transcription_completed_at TIMESTAMPTZ,
    transcription_error TEXT,            -- Error message if failed

    -- Recording context
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    recorded_by UUID NOT NULL REFERENCES auth.users(id),
    recorded_on_device TEXT,             -- Device identifier (mobile/desktop)
    recorded_location JSONB,             -- Geographic location if available

    -- Tags and metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    synced_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,              -- Soft delete

    -- Constraints
    CONSTRAINT valid_duration CHECK (duration_seconds > 0 AND duration_seconds <= 3600), -- Max 1 hour
    CONSTRAINT valid_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 104857600) -- Max 100MB
);

-- Indexes for voice memos
CREATE INDEX idx_voice_memos_entity ON voice_memos(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_voice_memos_document ON voice_memos(document_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_voice_memos_org ON voice_memos(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_voice_memos_recorded_by ON voice_memos(recorded_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_voice_memos_status ON voice_memos(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_voice_memos_transcription ON voice_memos USING gin(to_tsvector('english', transcription))
    WHERE transcription IS NOT NULL AND deleted_at IS NULL;

-- ===========================================
-- DOCUMENT ANNOTATIONS TABLE
-- ===========================================
-- Stores annotations (handwritten and other types) on documents

CREATE TABLE IF NOT EXISTS public.document_annotations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Organization scope
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Document association
    document_id UUID NOT NULL,           -- Reference to documents table
    page_number INTEGER,                 -- Page number (for multi-page documents)

    -- Annotation type and tool
    annotation_type annotation_type NOT NULL,
    tool annotation_tool,                -- For handwritten annotations

    -- Visual properties
    color TEXT DEFAULT '#000000',        -- Stroke/fill color (hex)
    stroke_width DECIMAL(4, 2) DEFAULT 2.0,
    opacity DECIMAL(3, 2) DEFAULT 1.0 CHECK (opacity >= 0 AND opacity <= 1),

    -- Position and bounds
    x DECIMAL(10, 4),                    -- X coordinate (percentage of page width)
    y DECIMAL(10, 4),                    -- Y coordinate (percentage of page height)
    width DECIMAL(10, 4),                -- Width (percentage)
    height DECIMAL(10, 4),               -- Height (percentage)
    rotation DECIMAL(5, 2) DEFAULT 0,    -- Rotation in degrees

    -- Content based on type
    -- For handwritten: SVG path data or stroke points
    path_data TEXT,                      -- SVG path string for vector annotations
    stroke_points JSONB,                 -- Array of {x, y, pressure, timestamp} points

    -- For text annotations
    text_content TEXT,                   -- Text content for text_note type
    font_size INTEGER DEFAULT 14,
    font_family TEXT DEFAULT 'sans-serif',

    -- For highlights
    highlighted_text TEXT,               -- The text that was highlighted
    text_range JSONB,                    -- Start/end positions in document

    -- For stamps
    stamp_type TEXT,                     -- 'approved', 'rejected', 'confidential', etc.
    stamp_image_url TEXT,                -- Custom stamp image

    -- For signatures
    signature_data TEXT,                 -- Base64 encoded signature image
    signer_name TEXT,
    signed_at TIMESTAMPTZ,

    -- Layer and ordering
    layer_index INTEGER DEFAULT 0,       -- Z-index for overlapping annotations
    group_id UUID,                       -- Group multiple annotations together

    -- Creator info
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_on_device TEXT,              -- Device identifier

    -- Sync and collaboration
    is_synced BOOLEAN DEFAULT false,
    local_id TEXT,                       -- Local identifier for offline-first

    -- Tags and metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    synced_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,              -- Soft delete

    -- Constraints
    CONSTRAINT valid_position CHECK (
        (x IS NULL AND y IS NULL) OR
        (x >= 0 AND x <= 100 AND y >= 0 AND y <= 100)
    ),
    CONSTRAINT valid_dimensions CHECK (
        (width IS NULL AND height IS NULL) OR
        (width >= 0 AND width <= 100 AND height >= 0 AND height <= 100)
    )
);

-- Indexes for annotations
CREATE INDEX idx_annotations_document ON document_annotations(document_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_annotations_org ON document_annotations(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_annotations_page ON document_annotations(document_id, page_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_annotations_type ON document_annotations(annotation_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_annotations_created_by ON document_annotations(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_annotations_group ON document_annotations(group_id) WHERE group_id IS NOT NULL AND deleted_at IS NULL;

-- ===========================================
-- ANNOTATION GROUPS TABLE
-- ===========================================
-- Groups related annotations together

CREATE TABLE IF NOT EXISTS public.annotation_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Organization scope
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID NOT NULL,

    -- Group metadata
    name TEXT,
    description TEXT,
    color TEXT,                          -- Group highlight color

    -- Creator info
    created_by UUID NOT NULL REFERENCES auth.users(id),

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_annotation_groups_document ON annotation_groups(document_id) WHERE deleted_at IS NULL;

-- ===========================================
-- VOICE MEMO ATTACHMENTS TABLE
-- ===========================================
-- Links voice memos to multiple entities (many-to-many)

CREATE TABLE IF NOT EXISTS public.voice_memo_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voice_memo_id UUID NOT NULL REFERENCES voice_memos(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    attached_by UUID NOT NULL REFERENCES auth.users(id),
    attached_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT unique_voice_memo_attachment UNIQUE (voice_memo_id, entity_type, entity_id)
);

CREATE INDEX idx_voice_memo_attachments_memo ON voice_memo_attachments(voice_memo_id);
CREATE INDEX idx_voice_memo_attachments_entity ON voice_memo_attachments(entity_type, entity_id);

-- ===========================================
-- TRANSCRIPTION QUEUE TABLE
-- ===========================================
-- Queue for pending transcriptions (processed by Edge Function)

CREATE TABLE IF NOT EXISTS public.transcription_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voice_memo_id UUID NOT NULL REFERENCES voice_memos(id) ON DELETE CASCADE,

    -- Queue status
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    priority INTEGER DEFAULT 0,            -- Higher = process first
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,

    -- Processing metadata
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT unique_pending_transcription UNIQUE (voice_memo_id)
);

CREATE INDEX idx_transcription_queue_status ON transcription_queue(status, priority DESC);

-- ===========================================
-- STORAGE BUCKET SETUP
-- ===========================================

-- Create storage bucket for voice memos (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'voice-memos',
    'voice-memos',
    false,
    104857600, -- 100MB
    ARRAY['audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/webm', 'audio/wav', 'audio/ogg']
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 104857600,
    allowed_mime_types = ARRAY['audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/webm', 'audio/wav', 'audio/ogg'];

-- Create storage bucket for annotations (signatures, stamps)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'annotations',
    'annotations',
    false,
    10485760, -- 10MB
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'application/json']
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'application/json'];

-- ===========================================
-- RLS POLICIES
-- ===========================================

-- Enable RLS
ALTER TABLE voice_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotation_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_memo_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_queue ENABLE ROW LEVEL SECURITY;

-- Voice memos policies
CREATE POLICY "Users can view voice memos in their organization"
    ON voice_memos FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organization_memberships
            WHERE user_id = auth.uid()
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Users can create voice memos"
    ON voice_memos FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_organization_memberships
            WHERE user_id = auth.uid()
        )
        AND recorded_by = auth.uid()
    );

CREATE POLICY "Users can update their own voice memos"
    ON voice_memos FOR UPDATE
    USING (recorded_by = auth.uid() AND deleted_at IS NULL)
    WITH CHECK (recorded_by = auth.uid());

CREATE POLICY "Users can soft delete their own voice memos"
    ON voice_memos FOR DELETE
    USING (recorded_by = auth.uid());

-- Document annotations policies
CREATE POLICY "Users can view annotations in their organization"
    ON document_annotations FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organization_memberships
            WHERE user_id = auth.uid()
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Users can create annotations"
    ON document_annotations FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_organization_memberships
            WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update their own annotations"
    ON document_annotations FOR UPDATE
    USING (created_by = auth.uid() AND deleted_at IS NULL)
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can soft delete their own annotations"
    ON document_annotations FOR DELETE
    USING (created_by = auth.uid());

-- Annotation groups policies
CREATE POLICY "Users can view annotation groups in their organization"
    ON annotation_groups FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organization_memberships
            WHERE user_id = auth.uid()
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Users can create annotation groups"
    ON annotation_groups FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_organization_memberships
            WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update their own annotation groups"
    ON annotation_groups FOR UPDATE
    USING (created_by = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can delete their own annotation groups"
    ON annotation_groups FOR DELETE
    USING (created_by = auth.uid());

-- Voice memo attachments policies
CREATE POLICY "Users can view voice memo attachments in their organization"
    ON voice_memo_attachments FOR SELECT
    USING (
        voice_memo_id IN (
            SELECT id FROM voice_memos WHERE organization_id IN (
                SELECT organization_id FROM user_organization_memberships
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create voice memo attachments"
    ON voice_memo_attachments FOR INSERT
    WITH CHECK (attached_by = auth.uid());

CREATE POLICY "Users can delete their own voice memo attachments"
    ON voice_memo_attachments FOR DELETE
    USING (attached_by = auth.uid());

-- Transcription queue policies (service role only for processing)
CREATE POLICY "Service role can manage transcription queue"
    ON transcription_queue FOR ALL
    USING (true)
    WITH CHECK (true);

-- ===========================================
-- STORAGE POLICIES
-- ===========================================

-- Voice memos storage policies
CREATE POLICY "Users can upload voice memos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'voice-memos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their org voice memos"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'voice-memos');

CREATE POLICY "Users can delete their own voice memos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'voice-memos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Annotations storage policies
CREATE POLICY "Users can upload annotations"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'annotations' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their org annotations"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'annotations');

CREATE POLICY "Users can delete their own annotations"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'annotations' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to get voice memos for an entity
CREATE OR REPLACE FUNCTION get_entity_voice_memos(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_include_transcription BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    duration_seconds INTEGER,
    status voice_memo_status,
    transcription TEXT,
    transcription_confidence DECIMAL,
    recorded_at TIMESTAMPTZ,
    recorded_by UUID,
    recorded_by_name TEXT,
    tags TEXT[],
    storage_path TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        vm.id,
        vm.title,
        vm.description,
        vm.duration_seconds,
        vm.status,
        CASE WHEN p_include_transcription THEN vm.transcription ELSE NULL END,
        vm.transcription_confidence,
        vm.recorded_at,
        vm.recorded_by,
        COALESCE(p.full_name, u.email) as recorded_by_name,
        vm.tags,
        vm.storage_path
    FROM voice_memos vm
    LEFT JOIN auth.users u ON vm.recorded_by = u.id
    LEFT JOIN profiles p ON vm.recorded_by = p.id
    WHERE vm.entity_type = p_entity_type
      AND vm.entity_id = p_entity_id
      AND vm.deleted_at IS NULL
      AND vm.organization_id IN (
          SELECT organization_id FROM user_organization_memberships
          WHERE user_id = auth.uid()
      )
    ORDER BY vm.recorded_at DESC;
END;
$$;

-- Function to get document annotations
CREATE OR REPLACE FUNCTION get_document_annotations(
    p_document_id UUID,
    p_page_number INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    annotation_type annotation_type,
    tool annotation_tool,
    color TEXT,
    stroke_width DECIMAL,
    opacity DECIMAL,
    x DECIMAL,
    y DECIMAL,
    width DECIMAL,
    height DECIMAL,
    rotation DECIMAL,
    path_data TEXT,
    stroke_points JSONB,
    text_content TEXT,
    highlighted_text TEXT,
    stamp_type TEXT,
    signature_data TEXT,
    layer_index INTEGER,
    group_id UUID,
    page_number INTEGER,
    created_by UUID,
    created_by_name TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        da.id,
        da.annotation_type,
        da.tool,
        da.color,
        da.stroke_width,
        da.opacity,
        da.x,
        da.y,
        da.width,
        da.height,
        da.rotation,
        da.path_data,
        da.stroke_points,
        da.text_content,
        da.highlighted_text,
        da.stamp_type,
        da.signature_data,
        da.layer_index,
        da.group_id,
        da.page_number,
        da.created_by,
        COALESCE(p.full_name, u.email) as created_by_name,
        da.created_at
    FROM document_annotations da
    LEFT JOIN auth.users u ON da.created_by = u.id
    LEFT JOIN profiles p ON da.created_by = p.id
    WHERE da.document_id = p_document_id
      AND (p_page_number IS NULL OR da.page_number = p_page_number)
      AND da.deleted_at IS NULL
      AND da.organization_id IN (
          SELECT organization_id FROM user_organization_memberships
          WHERE user_id = auth.uid()
      )
    ORDER BY da.page_number, da.layer_index;
END;
$$;

-- Function to queue voice memo for transcription
CREATE OR REPLACE FUNCTION queue_voice_memo_transcription(
    p_voice_memo_id UUID,
    p_priority INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_queue_id UUID;
BEGIN
    -- Update voice memo status
    UPDATE voice_memos
    SET status = 'processing', updated_at = now()
    WHERE id = p_voice_memo_id;

    -- Insert into transcription queue
    INSERT INTO transcription_queue (voice_memo_id, priority)
    VALUES (p_voice_memo_id, p_priority)
    ON CONFLICT (voice_memo_id) DO UPDATE
    SET status = 'pending', priority = p_priority, updated_at = now()
    RETURNING id INTO v_queue_id;

    RETURN v_queue_id;
END;
$$;

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Update timestamp trigger for voice_memos
CREATE TRIGGER update_voice_memos_updated_at
    BEFORE UPDATE ON voice_memos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for document_annotations
CREATE TRIGGER update_document_annotations_updated_at
    BEFORE UPDATE ON document_annotations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for annotation_groups
CREATE TRIGGER update_annotation_groups_updated_at
    BEFORE UPDATE ON annotation_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for transcription_queue
CREATE TRIGGER update_transcription_queue_updated_at
    BEFORE UPDATE ON transcription_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-queue transcription when voice memo is created
CREATE OR REPLACE FUNCTION auto_queue_transcription()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only queue if status is 'processing' (not 'recording')
    IF NEW.status = 'processing' THEN
        INSERT INTO transcription_queue (voice_memo_id, priority)
        VALUES (NEW.id, 0)
        ON CONFLICT (voice_memo_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER voice_memo_auto_queue_transcription
    AFTER INSERT ON voice_memos
    FOR EACH ROW
    EXECUTE FUNCTION auto_queue_transcription();

-- ===========================================
-- GRANTS
-- ===========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON voice_memos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_annotations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON annotation_groups TO authenticated;
GRANT SELECT, INSERT, DELETE ON voice_memo_attachments TO authenticated;
GRANT SELECT ON transcription_queue TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
