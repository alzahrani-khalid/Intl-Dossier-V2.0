-- =====================================================================================
-- Migration: Stakeholder Interaction Timeline
-- Description: Aggregates all interactions with a stakeholder (emails, meetings,
--              document exchanges, comments) into a unified chronological timeline.
--              Includes search, filtering, and annotation capability for key moments.
-- Author: Claude Code
-- Date: 2026-01-16
-- Feature: stakeholder-interaction-timeline
-- =====================================================================================

-- ===========================================
-- ENUM TYPES
-- ===========================================

-- Interaction type enum for stakeholder interactions
DO $$ BEGIN
    CREATE TYPE stakeholder_interaction_type AS ENUM (
        'email',            -- Email correspondence
        'meeting',          -- In-person or virtual meetings
        'phone_call',       -- Phone calls
        'document_exchange',-- Document sharing/receiving
        'comment',          -- Comments on shared documents or systems
        'message',          -- Instant messages
        'visit',            -- Official visits
        'conference',       -- Conference participation
        'workshop',         -- Workshop or training
        'negotiation',      -- Formal negotiations
        'other'             -- Other interactions
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Interaction direction
DO $$ BEGIN
    CREATE TYPE interaction_direction AS ENUM (
        'inbound',          -- From stakeholder to us
        'outbound',         -- From us to stakeholder
        'bidirectional'     -- Both ways (meetings, conferences)
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Interaction sentiment
DO $$ BEGIN
    CREATE TYPE interaction_sentiment AS ENUM (
        'positive',
        'neutral',
        'negative',
        'mixed'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Timeline annotation type (for marking key moments)
DO $$ BEGIN
    CREATE TYPE timeline_annotation_type AS ENUM (
        'note',             -- Simple note
        'marker',           -- Important marker
        'highlight',        -- Highlighted moment
        'milestone',        -- Major milestone
        'turning_point',    -- Turning point in relationship
        'breakthrough',     -- Breakthrough moment
        'concern'           -- Point of concern
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Annotation visibility
DO $$ BEGIN
    CREATE TYPE annotation_visibility AS ENUM (
        'private',          -- Only creator can see
        'team',             -- Team members can see
        'public'            -- All users can see
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================
-- STAKEHOLDER INTERACTIONS TABLE
-- ===========================================
-- Central table for all stakeholder interactions

CREATE TABLE IF NOT EXISTS public.stakeholder_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Stakeholder reference (polymorphic)
    stakeholder_type TEXT NOT NULL CHECK (stakeholder_type IN ('dossier', 'contact', 'person')),
    stakeholder_id UUID NOT NULL,

    -- Secondary stakeholder (for bilateral interactions)
    secondary_stakeholder_type TEXT,
    secondary_stakeholder_id UUID,

    -- Organization scope
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Interaction details
    interaction_type stakeholder_interaction_type NOT NULL DEFAULT 'other',
    direction interaction_direction NOT NULL DEFAULT 'bidirectional',
    sentiment interaction_sentiment DEFAULT 'neutral',

    -- Bilingual content
    title_en TEXT NOT NULL,
    title_ar TEXT,
    summary_en TEXT,
    summary_ar TEXT,
    content_en TEXT,           -- Full content/notes
    content_ar TEXT,

    -- Temporal data
    interaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    duration_minutes INTEGER,   -- Duration for meetings/calls

    -- Location (for meetings/visits)
    location_en TEXT,
    location_ar TEXT,
    is_virtual BOOLEAN DEFAULT false,
    virtual_link TEXT,

    -- Participants
    participants JSONB DEFAULT '[]',  -- Array of participant objects with roles
    internal_participants JSONB DEFAULT '[]',  -- Our team members
    external_participants JSONB DEFAULT '[]',  -- External parties

    -- Source tracking (for aggregation)
    source_type TEXT,           -- 'calendar_entry', 'email', 'dossier_interaction', etc.
    source_id UUID,             -- ID in source table
    source_metadata JSONB,      -- Additional source-specific data

    -- Attachments and documents
    attachments JSONB DEFAULT '[]',  -- Array of attachment objects
    related_documents UUID[],   -- References to documents table

    -- Tags and categorization
    tags TEXT[],
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',

    -- Follow-up tracking
    requires_followup BOOLEAN DEFAULT false,
    followup_date DATE,
    followup_notes TEXT,

    -- Outcome and impact
    outcome_en TEXT,
    outcome_ar TEXT,
    impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 5),

    -- Search optimization
    search_vector_en tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title_en, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(summary_en, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(content_en, '')), 'C')
    ) STORED,
    search_vector_ar tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('arabic', coalesce(title_ar, '')), 'A') ||
        setweight(to_tsvector('arabic', coalesce(summary_ar, '')), 'B') ||
        setweight(to_tsvector('arabic', coalesce(content_ar, '')), 'C')
    ) STORED,

    -- Audit fields
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at TIMESTAMPTZ       -- Soft delete
);

-- Indexes for stakeholder_interactions
CREATE INDEX IF NOT EXISTS idx_stakeholder_interactions_stakeholder
    ON stakeholder_interactions(stakeholder_type, stakeholder_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholder_interactions_date
    ON stakeholder_interactions(interaction_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholder_interactions_type
    ON stakeholder_interactions(interaction_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholder_interactions_org
    ON stakeholder_interactions(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholder_interactions_source
    ON stakeholder_interactions(source_type, source_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholder_interactions_search_en
    ON stakeholder_interactions USING gin(search_vector_en) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholder_interactions_search_ar
    ON stakeholder_interactions USING gin(search_vector_ar) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholder_interactions_tags
    ON stakeholder_interactions USING gin(tags) WHERE deleted_at IS NULL;

-- Composite index for timeline queries
CREATE INDEX IF NOT EXISTS idx_stakeholder_interactions_timeline
    ON stakeholder_interactions(stakeholder_id, interaction_date DESC, interaction_type)
    WHERE deleted_at IS NULL;

-- ===========================================
-- TIMELINE ANNOTATIONS TABLE
-- ===========================================
-- Annotations for marking key moments in the interaction timeline

CREATE TABLE IF NOT EXISTS public.timeline_annotations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Reference to the timeline event (polymorphic)
    event_type TEXT NOT NULL,   -- 'stakeholder_interaction', 'calendar_entry', etc.
    event_id UUID NOT NULL,

    -- Or reference to specific interaction
    interaction_id UUID REFERENCES stakeholder_interactions(id) ON DELETE CASCADE,

    -- Stakeholder context
    stakeholder_type TEXT,
    stakeholder_id UUID,

    -- Organization scope
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Annotation details
    annotation_type timeline_annotation_type NOT NULL DEFAULT 'note',
    visibility annotation_visibility NOT NULL DEFAULT 'private',

    -- Bilingual content
    content_en TEXT NOT NULL,
    content_ar TEXT,

    -- Visual properties
    color TEXT DEFAULT 'blue' CHECK (color IN ('blue', 'green', 'yellow', 'red', 'purple', 'orange')),
    icon TEXT,                  -- Lucide icon name

    -- Position (for visual placement if needed)
    position_x DECIMAL(10, 4),
    position_y DECIMAL(10, 4),

    -- Importance
    is_key_moment BOOLEAN DEFAULT false,
    is_turning_point BOOLEAN DEFAULT false,
    importance_score INTEGER CHECK (importance_score >= 1 AND importance_score <= 5) DEFAULT 3,

    -- Tags
    tags TEXT[],

    -- Audit fields
    created_by UUID NOT NULL REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at TIMESTAMPTZ       -- Soft delete
);

-- Indexes for timeline_annotations
CREATE INDEX IF NOT EXISTS idx_timeline_annotations_event
    ON timeline_annotations(event_type, event_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_timeline_annotations_interaction
    ON timeline_annotations(interaction_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_timeline_annotations_stakeholder
    ON timeline_annotations(stakeholder_type, stakeholder_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_timeline_annotations_creator
    ON timeline_annotations(created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_timeline_annotations_key_moments
    ON timeline_annotations(stakeholder_id, is_key_moment)
    WHERE deleted_at IS NULL AND is_key_moment = true;

-- ===========================================
-- UNIFIED STAKEHOLDER TIMELINE VIEW
-- ===========================================
-- Aggregates all interactions from multiple sources

CREATE OR REPLACE VIEW public.stakeholder_timeline_unified AS
-- Direct stakeholder interactions
SELECT
    si.id,
    'stakeholder_interaction' as source_type,
    si.id as source_id,
    si.stakeholder_type,
    si.stakeholder_id,
    si.interaction_type::text as event_type,
    si.title_en,
    si.title_ar,
    si.summary_en,
    si.summary_ar,
    si.content_en as description_en,
    si.content_ar as description_ar,
    si.interaction_date as event_date,
    si.duration_minutes,
    si.location_en,
    si.location_ar,
    si.is_virtual,
    si.virtual_link,
    si.participants,
    si.attachments,
    si.direction::text as direction,
    si.sentiment::text as sentiment,
    si.priority,
    si.tags,
    si.impact_score,
    si.outcome_en,
    si.outcome_ar,
    si.created_by,
    si.created_at,
    si.updated_at,
    si.organization_id,
    jsonb_build_object(
        'source_type', si.source_type,
        'source_id', si.source_id,
        'requires_followup', si.requires_followup,
        'followup_date', si.followup_date
    ) as metadata
FROM stakeholder_interactions si
WHERE si.deleted_at IS NULL

UNION ALL

-- Calendar entries (meetings, events)
SELECT
    ce.id,
    'calendar_entry' as source_type,
    ce.id as source_id,
    'dossier' as stakeholder_type,
    ce.dossier_id as stakeholder_id,
    ce.entry_type as event_type,
    ce.title_en,
    ce.title_ar,
    ce.description_en as summary_en,
    ce.description_ar as summary_ar,
    ce.description_en,
    ce.description_ar,
    ce.event_date::timestamptz as event_date,
    ce.duration_minutes,
    ce.location as location_en,
    ce.location as location_ar,
    ce.is_virtual,
    ce.meeting_link as virtual_link,
    '[]'::jsonb as participants,
    '[]'::jsonb as attachments,
    'bidirectional' as direction,
    'neutral' as sentiment,
    'medium' as priority,
    ARRAY[]::text[] as tags,
    NULL::integer as impact_score,
    NULL as outcome_en,
    NULL as outcome_ar,
    ce.created_by,
    ce.created_at,
    ce.updated_at,
    ce.organization_id,
    jsonb_build_object(
        'status', ce.status,
        'all_day', ce.all_day,
        'event_time', ce.event_time
    ) as metadata
FROM calendar_entries ce
WHERE ce.dossier_id IS NOT NULL

UNION ALL

-- Dossier interactions (legacy table)
SELECT
    di.id,
    'dossier_interaction' as source_type,
    di.id as source_id,
    'dossier' as stakeholder_type,
    di.dossier_id as stakeholder_id,
    di.interaction_type as event_type,
    di.interaction_type || ' Interaction' as title_en,
    'تفاعل ' || di.interaction_type as title_ar,
    di.details as summary_en,
    di.details as summary_ar,
    di.details as description_en,
    di.details as description_ar,
    di.interaction_date::timestamptz as event_date,
    NULL::integer as duration_minutes,
    NULL as location_en,
    NULL as location_ar,
    false as is_virtual,
    NULL as virtual_link,
    '[]'::jsonb as participants,
    '[]'::jsonb as attachments,
    'bidirectional' as direction,
    'neutral' as sentiment,
    'medium' as priority,
    ARRAY[]::text[] as tags,
    NULL::integer as impact_score,
    NULL as outcome_en,
    NULL as outcome_ar,
    di.created_by,
    di.created_at,
    di.updated_at,
    NULL::uuid as organization_id,
    '{}'::jsonb as metadata
FROM dossier_interactions di

UNION ALL

-- Documents (document exchanges)
SELECT
    d.id,
    'document' as source_type,
    d.id as source_id,
    'dossier' as stakeholder_type,
    d.dossier_id as stakeholder_id,
    'document_exchange' as event_type,
    d.name_en as title_en,
    d.name_ar as title_ar,
    d.description_en as summary_en,
    d.description_ar as summary_ar,
    d.description_en,
    d.description_ar,
    d.uploaded_at::timestamptz as event_date,
    NULL::integer as duration_minutes,
    NULL as location_en,
    NULL as location_ar,
    false as is_virtual,
    NULL as virtual_link,
    '[]'::jsonb as participants,
    jsonb_build_array(jsonb_build_object(
        'id', d.id,
        'filename', d.name_en,
        'size', d.file_size,
        'mime_type', d.file_type,
        'path', d.storage_path
    )) as attachments,
    'inbound' as direction,
    'neutral' as sentiment,
    'medium' as priority,
    d.tags,
    NULL::integer as impact_score,
    NULL as outcome_en,
    NULL as outcome_ar,
    d.uploaded_by as created_by,
    d.created_at,
    d.updated_at,
    d.organization_id,
    jsonb_build_object(
        'file_type', d.file_type,
        'file_size', d.file_size
    ) as metadata
FROM documents d
WHERE d.dossier_id IS NOT NULL;

-- ===========================================
-- RLS POLICIES
-- ===========================================

-- Enable RLS
ALTER TABLE stakeholder_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_annotations ENABLE ROW LEVEL SECURITY;

-- Stakeholder interactions policies
CREATE POLICY "Users can view stakeholder interactions in their organization"
    ON stakeholder_interactions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organization_memberships
            WHERE user_id = auth.uid()
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Users can create stakeholder interactions"
    ON stakeholder_interactions FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_organization_memberships
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update stakeholder interactions they created"
    ON stakeholder_interactions FOR UPDATE
    USING (
        created_by = auth.uid()
        AND deleted_at IS NULL
    );

CREATE POLICY "Users can delete stakeholder interactions they created"
    ON stakeholder_interactions FOR DELETE
    USING (created_by = auth.uid());

-- Timeline annotations policies
CREATE POLICY "Users can view annotations based on visibility"
    ON timeline_annotations FOR SELECT
    USING (
        deleted_at IS NULL AND (
            -- Private: only creator
            (visibility = 'private' AND created_by = auth.uid())
            -- Team: same organization
            OR (visibility = 'team' AND organization_id IN (
                SELECT organization_id FROM user_organization_memberships
                WHERE user_id = auth.uid()
            ))
            -- Public: everyone in organization
            OR (visibility = 'public' AND organization_id IN (
                SELECT organization_id FROM user_organization_memberships
                WHERE user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can create annotations"
    ON timeline_annotations FOR INSERT
    WITH CHECK (
        created_by = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM user_organization_memberships
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own annotations"
    ON timeline_annotations FOR UPDATE
    USING (created_by = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can delete their own annotations"
    ON timeline_annotations FOR DELETE
    USING (created_by = auth.uid());

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to get stakeholder timeline with annotations
CREATE OR REPLACE FUNCTION get_stakeholder_timeline(
    p_stakeholder_type TEXT,
    p_stakeholder_id UUID,
    p_event_types TEXT[] DEFAULT NULL,
    p_date_from TIMESTAMPTZ DEFAULT NULL,
    p_date_to TIMESTAMPTZ DEFAULT NULL,
    p_search_query TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_cursor TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    source_type TEXT,
    source_id UUID,
    event_type TEXT,
    title_en TEXT,
    title_ar TEXT,
    summary_en TEXT,
    summary_ar TEXT,
    event_date TIMESTAMPTZ,
    duration_minutes INTEGER,
    location_en TEXT,
    location_ar TEXT,
    is_virtual BOOLEAN,
    participants JSONB,
    attachments JSONB,
    direction TEXT,
    sentiment TEXT,
    priority TEXT,
    tags TEXT[],
    impact_score INTEGER,
    outcome_en TEXT,
    outcome_ar TEXT,
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMPTZ,
    annotations JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH timeline_events AS (
        SELECT
            t.id,
            t.source_type,
            t.source_id,
            t.event_type,
            t.title_en,
            t.title_ar,
            t.summary_en,
            t.summary_ar,
            t.event_date,
            t.duration_minutes,
            t.location_en,
            t.location_ar,
            t.is_virtual,
            t.participants,
            t.attachments,
            t.direction,
            t.sentiment,
            t.priority,
            t.tags,
            t.impact_score,
            t.outcome_en,
            t.outcome_ar,
            t.metadata,
            t.created_by,
            t.created_at
        FROM stakeholder_timeline_unified t
        WHERE t.stakeholder_type = p_stakeholder_type
          AND t.stakeholder_id = p_stakeholder_id
          AND (p_event_types IS NULL OR t.event_type = ANY(p_event_types))
          AND (p_date_from IS NULL OR t.event_date >= p_date_from)
          AND (p_date_to IS NULL OR t.event_date <= p_date_to)
          AND (p_cursor IS NULL OR t.event_date < p_cursor)
          AND (p_search_query IS NULL OR
               t.title_en ILIKE '%' || p_search_query || '%' OR
               t.title_ar ILIKE '%' || p_search_query || '%' OR
               t.summary_en ILIKE '%' || p_search_query || '%' OR
               t.summary_ar ILIKE '%' || p_search_query || '%')
        ORDER BY t.event_date DESC
        LIMIT p_limit
    )
    SELECT
        te.*,
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', ta.id,
                'type', ta.annotation_type,
                'content_en', ta.content_en,
                'content_ar', ta.content_ar,
                'color', ta.color,
                'visibility', ta.visibility,
                'is_key_moment', ta.is_key_moment,
                'is_turning_point', ta.is_turning_point,
                'created_by', ta.created_by,
                'created_at', ta.created_at
            ) ORDER BY ta.created_at)
            FROM timeline_annotations ta
            WHERE ta.event_type = te.source_type
              AND ta.event_id = te.source_id
              AND ta.deleted_at IS NULL
              AND (
                  ta.visibility = 'public'
                  OR (ta.visibility = 'team' AND ta.organization_id IN (
                      SELECT organization_id FROM user_organization_memberships
                      WHERE user_id = auth.uid()
                  ))
                  OR (ta.visibility = 'private' AND ta.created_by = auth.uid())
              )
            ),
            '[]'::jsonb
        ) as annotations
    FROM timeline_events te;
END;
$$;

-- Function to get interaction statistics for a stakeholder
CREATE OR REPLACE FUNCTION get_stakeholder_interaction_stats(
    p_stakeholder_type TEXT,
    p_stakeholder_id UUID
)
RETURNS TABLE (
    total_interactions BIGINT,
    interactions_by_type JSONB,
    interactions_by_month JSONB,
    avg_sentiment NUMERIC,
    key_moments_count BIGINT,
    last_interaction_date TIMESTAMPTZ,
    most_common_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::bigint as total_interactions,
        jsonb_object_agg(
            COALESCE(t.event_type, 'unknown'),
            type_count
        ) as interactions_by_type,
        (
            SELECT jsonb_object_agg(
                month_year,
                month_count
            )
            FROM (
                SELECT
                    to_char(event_date, 'YYYY-MM') as month_year,
                    COUNT(*) as month_count
                FROM stakeholder_timeline_unified
                WHERE stakeholder_type = p_stakeholder_type
                  AND stakeholder_id = p_stakeholder_id
                GROUP BY to_char(event_date, 'YYYY-MM')
                ORDER BY month_year DESC
                LIMIT 12
            ) monthly_stats
        ) as interactions_by_month,
        AVG(
            CASE sentiment
                WHEN 'positive' THEN 1
                WHEN 'neutral' THEN 0
                WHEN 'negative' THEN -1
                WHEN 'mixed' THEN 0
                ELSE 0
            END
        )::numeric as avg_sentiment,
        (
            SELECT COUNT(*)::bigint
            FROM timeline_annotations ta
            WHERE ta.stakeholder_type = p_stakeholder_type
              AND ta.stakeholder_id = p_stakeholder_id
              AND ta.is_key_moment = true
              AND ta.deleted_at IS NULL
        ) as key_moments_count,
        MAX(t.event_date)::timestamptz as last_interaction_date,
        (
            SELECT event_type
            FROM stakeholder_timeline_unified
            WHERE stakeholder_type = p_stakeholder_type
              AND stakeholder_id = p_stakeholder_id
            GROUP BY event_type
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as most_common_type
    FROM stakeholder_timeline_unified t
    LEFT JOIN LATERAL (
        SELECT t.event_type, COUNT(*) as type_count
        FROM stakeholder_timeline_unified sub
        WHERE sub.stakeholder_type = p_stakeholder_type
          AND sub.stakeholder_id = p_stakeholder_id
        GROUP BY sub.event_type
    ) type_counts ON true
    WHERE t.stakeholder_type = p_stakeholder_type
      AND t.stakeholder_id = p_stakeholder_id
    GROUP BY t.event_type, type_counts.type_count;
END;
$$;

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Update timestamp trigger for stakeholder_interactions
CREATE TRIGGER update_stakeholder_interactions_updated_at
    BEFORE UPDATE ON stakeholder_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for timeline_annotations
CREATE TRIGGER update_timeline_annotations_updated_at
    BEFORE UPDATE ON timeline_annotations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- GRANTS
-- ===========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON stakeholder_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON timeline_annotations TO authenticated;
GRANT SELECT ON stakeholder_timeline_unified TO authenticated;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE stakeholder_interactions IS 'Central table for all stakeholder interactions including emails, meetings, calls, and document exchanges';
COMMENT ON TABLE timeline_annotations IS 'Annotations for marking key moments and turning points in stakeholder relationships';
COMMENT ON VIEW stakeholder_timeline_unified IS 'Unified view aggregating all stakeholder interactions from multiple sources';
COMMENT ON FUNCTION get_stakeholder_timeline IS 'Retrieves paginated stakeholder timeline with annotations';
COMMENT ON FUNCTION get_stakeholder_interaction_stats IS 'Returns interaction statistics for a stakeholder';
