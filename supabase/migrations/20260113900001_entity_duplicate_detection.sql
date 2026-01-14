-- Migration: Entity Duplicate Detection System
-- Feature: entity-duplicate-detection
-- Date: 2026-01-13
-- Description: Detect and manage duplicate persons and organizations using fuzzy matching
--              Provides merge functionality that preserves relationships and history

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Entity duplicate status (reuse existing duplicate_status if available)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_duplicate_status') THEN
        CREATE TYPE entity_duplicate_status AS ENUM (
            'pending',           -- Awaiting review
            'confirmed',         -- Confirmed as duplicate, ready to merge
            'not_duplicate',     -- Reviewed, determined not duplicate
            'merged',            -- Successfully merged
            'auto_dismissed'     -- Auto-dismissed by system (e.g., low confidence)
        );
    END IF;
END$$;

-- Entity type for duplicate detection scope
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'duplicate_entity_type') THEN
        CREATE TYPE duplicate_entity_type AS ENUM ('person', 'organization');
    END IF;
END$$;

-- Detection source
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'duplicate_detection_source') THEN
        CREATE TYPE duplicate_detection_source AS ENUM (
            'auto_scan',         -- Periodic background scan
            'on_create',         -- Detected during entity creation
            'manual_search',     -- User-initiated search
            'bulk_import'        -- Detected during bulk import
        );
    END IF;
END$$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Entity Duplicate Candidates
CREATE TABLE IF NOT EXISTS entity_duplicate_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The two entities being compared
    source_entity_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
    entity_type duplicate_entity_type NOT NULL,

    -- Similarity Scores (0.00 to 1.00)
    overall_score NUMERIC(5,4) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
    name_similarity NUMERIC(5,4) CHECK (name_similarity >= 0 AND name_similarity <= 1),
    name_ar_similarity NUMERIC(5,4) CHECK (name_ar_similarity >= 0 AND name_ar_similarity <= 1),
    email_similarity NUMERIC(5,4) CHECK (email_similarity >= 0 AND email_similarity <= 1),
    phone_similarity NUMERIC(5,4) CHECK (phone_similarity >= 0 AND phone_similarity <= 1),
    organization_match BOOLEAN DEFAULT FALSE,  -- For persons: same organization
    attribute_similarity NUMERIC(5,4) CHECK (attribute_similarity >= 0 AND attribute_similarity <= 1),

    -- Detailed matching info stored as JSONB
    match_details JSONB DEFAULT '{}',

    -- Status and decision
    status entity_duplicate_status NOT NULL DEFAULT 'pending',
    decision_reason TEXT,
    confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),

    -- Detection metadata
    detection_source duplicate_detection_source NOT NULL DEFAULT 'auto_scan',
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detected_by UUID REFERENCES auth.users(id),

    -- Resolution metadata
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_entity_pair UNIQUE (source_entity_id, target_entity_id),
    CONSTRAINT different_entities CHECK (source_entity_id != target_entity_id)
);

-- Entity Merge History
CREATE TABLE IF NOT EXISTS entity_merge_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The merge operation
    primary_entity_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
    merged_entity_id UUID NOT NULL,  -- No FK since entity will be deleted
    entity_type duplicate_entity_type NOT NULL,
    duplicate_candidate_id UUID REFERENCES entity_duplicate_candidates(id),

    -- Snapshot of merged entity before deletion
    merged_entity_snapshot JSONB NOT NULL,

    -- Transferred data summary
    transferred_relationships JSONB DEFAULT '[]',
    transferred_roles JSONB DEFAULT '[]',
    transferred_affiliations JSONB DEFAULT '[]',
    transferred_engagements JSONB DEFAULT '[]',
    transferred_documents JSONB DEFAULT '[]',

    -- Conflict resolution decisions
    field_resolutions JSONB DEFAULT '{}',  -- Which fields were kept from which entity

    -- Audit
    merged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    merged_by UUID NOT NULL REFERENCES auth.users(id),
    merge_reason TEXT,

    -- For potential undo operations
    can_undo BOOLEAN DEFAULT TRUE,
    undo_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Duplicate Detection Settings (per entity type)
CREATE TABLE IF NOT EXISTS duplicate_detection_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type duplicate_entity_type NOT NULL UNIQUE,

    -- Thresholds
    auto_detect_threshold NUMERIC(5,4) DEFAULT 0.80,  -- High confidence auto-flag
    suggest_threshold NUMERIC(5,4) DEFAULT 0.60,       -- Show as suggestion

    -- Weights for scoring (must sum to 1.0)
    name_weight NUMERIC(3,2) DEFAULT 0.35,
    name_ar_weight NUMERIC(3,2) DEFAULT 0.15,
    email_weight NUMERIC(3,2) DEFAULT 0.20,
    phone_weight NUMERIC(3,2) DEFAULT 0.10,
    organization_weight NUMERIC(3,2) DEFAULT 0.10,  -- For persons
    attribute_weight NUMERIC(3,2) DEFAULT 0.10,

    -- Scan settings
    scan_recent_days INTEGER DEFAULT 90,  -- Only scan entities created in last N days
    max_candidates_per_entity INTEGER DEFAULT 10,

    -- Enabled
    is_enabled BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO duplicate_detection_settings (entity_type, name_weight, name_ar_weight, email_weight, phone_weight, organization_weight, attribute_weight)
VALUES
    ('person', 0.30, 0.15, 0.25, 0.10, 0.10, 0.10),
    ('organization', 0.35, 0.20, 0.15, 0.10, 0.00, 0.20)
ON CONFLICT (entity_type) DO NOTHING;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Entity duplicate candidates indexes
CREATE INDEX IF NOT EXISTS idx_entity_dup_source ON entity_duplicate_candidates(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_dup_target ON entity_duplicate_candidates(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_dup_status ON entity_duplicate_candidates(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_entity_dup_score ON entity_duplicate_candidates(overall_score DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_entity_dup_type ON entity_duplicate_candidates(entity_type, status);
CREATE INDEX IF NOT EXISTS idx_entity_dup_detected ON entity_duplicate_candidates(detected_at DESC);

-- Merge history indexes
CREATE INDEX IF NOT EXISTS idx_merge_primary ON entity_merge_history(primary_entity_id);
CREATE INDEX IF NOT EXISTS idx_merge_merged ON entity_merge_history(merged_entity_id);
CREATE INDEX IF NOT EXISTS idx_merge_date ON entity_merge_history(merged_at DESC);

-- ============================================================================
-- SIMILARITY FUNCTIONS
-- ============================================================================

-- Calculate name similarity using trigrams
CREATE OR REPLACE FUNCTION calculate_name_similarity(
    name1 TEXT,
    name2 TEXT
) RETURNS NUMERIC AS $$
BEGIN
    IF name1 IS NULL OR name2 IS NULL OR
       LENGTH(TRIM(COALESCE(name1, ''))) = 0 OR LENGTH(TRIM(COALESCE(name2, ''))) = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND(similarity(LOWER(TRIM(name1)), LOWER(TRIM(name2)))::NUMERIC, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate email similarity (exact or domain match)
CREATE OR REPLACE FUNCTION calculate_email_similarity(
    email1 TEXT,
    email2 TEXT
) RETURNS NUMERIC AS $$
DECLARE
    e1 TEXT;
    e2 TEXT;
    domain1 TEXT;
    domain2 TEXT;
BEGIN
    IF email1 IS NULL OR email2 IS NULL THEN
        RETURN 0;
    END IF;

    e1 := LOWER(TRIM(email1));
    e2 := LOWER(TRIM(email2));

    -- Exact match
    IF e1 = e2 THEN
        RETURN 1.0;
    END IF;

    -- Domain match
    domain1 := SPLIT_PART(e1, '@', 2);
    domain2 := SPLIT_PART(e2, '@', 2);

    IF domain1 = domain2 AND domain1 != '' THEN
        -- Same domain, check local part similarity
        RETURN 0.5 + (similarity(SPLIT_PART(e1, '@', 1), SPLIT_PART(e2, '@', 1))::NUMERIC * 0.5);
    END IF;

    RETURN ROUND(similarity(e1, e2)::NUMERIC, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate phone similarity (normalize and compare)
CREATE OR REPLACE FUNCTION calculate_phone_similarity(
    phone1 TEXT,
    phone2 TEXT
) RETURNS NUMERIC AS $$
DECLARE
    p1 TEXT;
    p2 TEXT;
BEGIN
    IF phone1 IS NULL OR phone2 IS NULL THEN
        RETURN 0;
    END IF;

    -- Normalize: remove all non-digits
    p1 := REGEXP_REPLACE(phone1, '[^0-9]', '', 'g');
    p2 := REGEXP_REPLACE(phone2, '[^0-9]', '', 'g');

    IF LENGTH(p1) < 6 OR LENGTH(p2) < 6 THEN
        RETURN 0;
    END IF;

    -- Exact match
    IF p1 = p2 THEN
        RETURN 1.0;
    END IF;

    -- Check if one contains the other (handle country codes)
    IF p1 LIKE '%' || p2 OR p2 LIKE '%' || p1 THEN
        RETURN 0.9;
    END IF;

    -- Last N digits match (common for local numbers)
    IF RIGHT(p1, 8) = RIGHT(p2, 8) AND LENGTH(p1) >= 8 AND LENGTH(p2) >= 8 THEN
        RETURN 0.85;
    END IF;

    RETURN ROUND(similarity(p1, p2)::NUMERIC, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate overall person similarity score
CREATE OR REPLACE FUNCTION calculate_person_similarity(
    person1_id UUID,
    person2_id UUID
) RETURNS TABLE (
    overall_score NUMERIC,
    name_similarity NUMERIC,
    name_ar_similarity NUMERIC,
    email_similarity NUMERIC,
    phone_similarity NUMERIC,
    organization_match BOOLEAN,
    attribute_similarity NUMERIC,
    match_details JSONB
) AS $$
DECLARE
    p1 RECORD;
    p2 RECORD;
    settings RECORD;
    name_sim NUMERIC := 0;
    name_ar_sim NUMERIC := 0;
    email_sim NUMERIC := 0;
    phone_sim NUMERIC := 0;
    org_match BOOLEAN := FALSE;
    attr_sim NUMERIC := 0;
    total_score NUMERIC := 0;
    details JSONB := '{}';
    matching_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get settings
    SELECT * INTO settings FROM duplicate_detection_settings WHERE entity_type = 'person';

    -- Get person 1 data
    SELECT
        d.name_en, d.name_ar, d.tags,
        p.email, p.phone, p.organization_id, p.expertise_areas, p.languages
    INTO p1
    FROM dossiers d
    JOIN persons p ON p.id = d.id
    WHERE d.id = person1_id;

    -- Get person 2 data
    SELECT
        d.name_en, d.name_ar, d.tags,
        p.email, p.phone, p.organization_id, p.expertise_areas, p.languages
    INTO p2
    FROM dossiers d
    JOIN persons p ON p.id = d.id
    WHERE d.id = person2_id;

    IF p1 IS NULL OR p2 IS NULL THEN
        RETURN;
    END IF;

    -- Calculate individual similarities
    name_sim := calculate_name_similarity(p1.name_en, p2.name_en);
    IF name_sim > 0.7 THEN matching_fields := array_append(matching_fields, 'name_en'); END IF;

    name_ar_sim := calculate_name_similarity(p1.name_ar, p2.name_ar);
    IF name_ar_sim > 0.7 THEN matching_fields := array_append(matching_fields, 'name_ar'); END IF;

    email_sim := calculate_email_similarity(p1.email, p2.email);
    IF email_sim > 0.7 THEN matching_fields := array_append(matching_fields, 'email'); END IF;

    phone_sim := calculate_phone_similarity(p1.phone, p2.phone);
    IF phone_sim > 0.7 THEN matching_fields := array_append(matching_fields, 'phone'); END IF;

    -- Organization match
    org_match := (p1.organization_id IS NOT NULL AND p1.organization_id = p2.organization_id);
    IF org_match THEN matching_fields := array_append(matching_fields, 'organization'); END IF;

    -- Attribute similarity (expertise, languages, tags)
    DECLARE
        expertise_overlap INTEGER := 0;
        lang_overlap INTEGER := 0;
        tag_overlap INTEGER := 0;
        total_attrs INTEGER := 0;
    BEGIN
        IF p1.expertise_areas IS NOT NULL AND p2.expertise_areas IS NOT NULL THEN
            SELECT COUNT(*) INTO expertise_overlap
            FROM unnest(p1.expertise_areas) e1
            WHERE e1 = ANY(p2.expertise_areas);
            total_attrs := total_attrs + GREATEST(array_length(p1.expertise_areas, 1), array_length(p2.expertise_areas, 1));
        END IF;

        IF p1.languages IS NOT NULL AND p2.languages IS NOT NULL THEN
            SELECT COUNT(*) INTO lang_overlap
            FROM unnest(p1.languages) l1
            WHERE l1 = ANY(p2.languages);
            total_attrs := total_attrs + GREATEST(array_length(p1.languages, 1), array_length(p2.languages, 1));
        END IF;

        IF p1.tags IS NOT NULL AND p2.tags IS NOT NULL THEN
            SELECT COUNT(*) INTO tag_overlap
            FROM unnest(p1.tags) t1
            WHERE t1 = ANY(p2.tags);
            total_attrs := total_attrs + GREATEST(array_length(p1.tags, 1), array_length(p2.tags, 1));
        END IF;

        IF total_attrs > 0 THEN
            attr_sim := ROUND((expertise_overlap + lang_overlap + tag_overlap)::NUMERIC / total_attrs, 4);
        END IF;
    END;

    -- Calculate weighted total score
    total_score := ROUND(
        (name_sim * COALESCE(settings.name_weight, 0.30)) +
        (name_ar_sim * COALESCE(settings.name_ar_weight, 0.15)) +
        (email_sim * COALESCE(settings.email_weight, 0.25)) +
        (phone_sim * COALESCE(settings.phone_weight, 0.10)) +
        (CASE WHEN org_match THEN 1.0 ELSE 0.0 END * COALESCE(settings.organization_weight, 0.10)) +
        (attr_sim * COALESCE(settings.attribute_weight, 0.10))
    , 4);

    -- Build details
    details := jsonb_build_object(
        'matching_fields', matching_fields,
        'weights', jsonb_build_object(
            'name', settings.name_weight,
            'name_ar', settings.name_ar_weight,
            'email', settings.email_weight,
            'phone', settings.phone_weight,
            'organization', settings.organization_weight,
            'attributes', settings.attribute_weight
        ),
        'person1', jsonb_build_object(
            'name_en', p1.name_en,
            'email', p1.email,
            'phone', p1.phone
        ),
        'person2', jsonb_build_object(
            'name_en', p2.name_en,
            'email', p2.email,
            'phone', p2.phone
        )
    );

    RETURN QUERY SELECT total_score, name_sim, name_ar_sim, email_sim, phone_sim, org_match, attr_sim, details;
END;
$$ LANGUAGE plpgsql;

-- Calculate overall organization similarity score
CREATE OR REPLACE FUNCTION calculate_organization_similarity(
    org1_id UUID,
    org2_id UUID
) RETURNS TABLE (
    overall_score NUMERIC,
    name_similarity NUMERIC,
    name_ar_similarity NUMERIC,
    email_similarity NUMERIC,
    phone_similarity NUMERIC,
    organization_match BOOLEAN,
    attribute_similarity NUMERIC,
    match_details JSONB
) AS $$
DECLARE
    o1 RECORD;
    o2 RECORD;
    settings RECORD;
    name_sim NUMERIC := 0;
    name_ar_sim NUMERIC := 0;
    email_sim NUMERIC := 0;
    phone_sim NUMERIC := 0;
    attr_sim NUMERIC := 0;
    total_score NUMERIC := 0;
    details JSONB := '{}';
    matching_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get settings
    SELECT * INTO settings FROM duplicate_detection_settings WHERE entity_type = 'organization';

    -- Get organization 1 data
    SELECT
        d.name_en, d.name_ar, d.tags,
        o.email, o.phone, o.org_type, o.org_code, o.website,
        o.headquarters_country_id, o.address_en, o.address_ar
    INTO o1
    FROM dossiers d
    JOIN organizations o ON o.id = d.id
    WHERE d.id = org1_id;

    -- Get organization 2 data
    SELECT
        d.name_en, d.name_ar, d.tags,
        o.email, o.phone, o.org_type, o.org_code, o.website,
        o.headquarters_country_id, o.address_en, o.address_ar
    INTO o2
    FROM dossiers d
    JOIN organizations o ON o.id = d.id
    WHERE d.id = org2_id;

    IF o1 IS NULL OR o2 IS NULL THEN
        RETURN;
    END IF;

    -- Calculate individual similarities
    name_sim := calculate_name_similarity(o1.name_en, o2.name_en);
    IF name_sim > 0.7 THEN matching_fields := array_append(matching_fields, 'name_en'); END IF;

    name_ar_sim := calculate_name_similarity(o1.name_ar, o2.name_ar);
    IF name_ar_sim > 0.7 THEN matching_fields := array_append(matching_fields, 'name_ar'); END IF;

    email_sim := calculate_email_similarity(o1.email, o2.email);
    IF email_sim > 0.7 THEN matching_fields := array_append(matching_fields, 'email'); END IF;

    phone_sim := calculate_phone_similarity(o1.phone, o2.phone);
    IF phone_sim > 0.7 THEN matching_fields := array_append(matching_fields, 'phone'); END IF;

    -- Attribute similarity for organizations
    DECLARE
        type_match BOOLEAN := (o1.org_type = o2.org_type);
        code_match BOOLEAN := (o1.org_code IS NOT NULL AND o1.org_code = o2.org_code);
        website_sim NUMERIC := 0;
        country_match BOOLEAN := (o1.headquarters_country_id IS NOT NULL AND o1.headquarters_country_id = o2.headquarters_country_id);
        address_sim NUMERIC := 0;
        attr_count INTEGER := 0;
        attr_total NUMERIC := 0;
    BEGIN
        IF type_match THEN
            matching_fields := array_append(matching_fields, 'org_type');
            attr_total := attr_total + 1;
        END IF;
        attr_count := attr_count + 1;

        IF code_match THEN
            matching_fields := array_append(matching_fields, 'org_code');
            attr_total := attr_total + 1;  -- Code match is strong signal
        END IF;
        IF o1.org_code IS NOT NULL OR o2.org_code IS NOT NULL THEN
            attr_count := attr_count + 1;
        END IF;

        IF o1.website IS NOT NULL AND o2.website IS NOT NULL THEN
            website_sim := calculate_name_similarity(
                REGEXP_REPLACE(o1.website, 'https?://(www\.)?', '', 'i'),
                REGEXP_REPLACE(o2.website, 'https?://(www\.)?', '', 'i')
            );
            IF website_sim > 0.8 THEN
                matching_fields := array_append(matching_fields, 'website');
                attr_total := attr_total + 1;
            END IF;
            attr_count := attr_count + 1;
        END IF;

        IF country_match THEN
            matching_fields := array_append(matching_fields, 'country');
            attr_total := attr_total + 0.5;
        END IF;
        IF o1.headquarters_country_id IS NOT NULL OR o2.headquarters_country_id IS NOT NULL THEN
            attr_count := attr_count + 1;
        END IF;

        IF o1.address_en IS NOT NULL AND o2.address_en IS NOT NULL THEN
            address_sim := calculate_name_similarity(o1.address_en, o2.address_en);
            IF address_sim > 0.7 THEN
                matching_fields := array_append(matching_fields, 'address');
                attr_total := attr_total + address_sim;
            END IF;
            attr_count := attr_count + 1;
        END IF;

        IF attr_count > 0 THEN
            attr_sim := ROUND(attr_total / attr_count, 4);
        END IF;
    END;

    -- Calculate weighted total score
    total_score := ROUND(
        (name_sim * COALESCE(settings.name_weight, 0.35)) +
        (name_ar_sim * COALESCE(settings.name_ar_weight, 0.20)) +
        (email_sim * COALESCE(settings.email_weight, 0.15)) +
        (phone_sim * COALESCE(settings.phone_weight, 0.10)) +
        (attr_sim * COALESCE(settings.attribute_weight, 0.20))
    , 4);

    -- Build details
    details := jsonb_build_object(
        'matching_fields', matching_fields,
        'weights', jsonb_build_object(
            'name', settings.name_weight,
            'name_ar', settings.name_ar_weight,
            'email', settings.email_weight,
            'phone', settings.phone_weight,
            'attributes', settings.attribute_weight
        ),
        'org1', jsonb_build_object(
            'name_en', o1.name_en,
            'org_code', o1.org_code,
            'email', o1.email
        ),
        'org2', jsonb_build_object(
            'name_en', o2.name_en,
            'org_code', o2.org_code,
            'email', o2.email
        )
    );

    RETURN QUERY SELECT total_score, name_sim, name_ar_sim, email_sim, phone_sim, FALSE, attr_sim, details;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DUPLICATE DETECTION FUNCTIONS
-- ============================================================================

-- Find potential duplicate persons for a given person
CREATE OR REPLACE FUNCTION find_duplicate_persons(
    p_person_id UUID,
    p_threshold NUMERIC DEFAULT 0.60,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    candidate_id UUID,
    candidate_name_en TEXT,
    candidate_name_ar TEXT,
    overall_score NUMERIC,
    name_similarity NUMERIC,
    email_similarity NUMERIC,
    phone_similarity NUMERIC,
    organization_match BOOLEAN,
    match_details JSONB,
    confidence_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH candidates AS (
        SELECT
            d.id,
            d.name_en,
            d.name_ar,
            (calculate_person_similarity(p_person_id, d.id)).*
        FROM dossiers d
        WHERE d.type = 'person'
          AND d.id != p_person_id
          AND d.status != 'archived'
    )
    SELECT
        c.id,
        c.name_en,
        c.name_ar,
        c.overall_score,
        c.name_similarity,
        c.email_similarity,
        c.phone_similarity,
        c.organization_match,
        c.match_details,
        CASE
            WHEN c.overall_score >= 0.85 THEN 'high'
            WHEN c.overall_score >= 0.70 THEN 'medium'
            ELSE 'low'
        END::TEXT as confidence_level
    FROM candidates c
    WHERE c.overall_score >= p_threshold
    ORDER BY c.overall_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Find potential duplicate organizations for a given organization
CREATE OR REPLACE FUNCTION find_duplicate_organizations(
    p_org_id UUID,
    p_threshold NUMERIC DEFAULT 0.60,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    candidate_id UUID,
    candidate_name_en TEXT,
    candidate_name_ar TEXT,
    overall_score NUMERIC,
    name_similarity NUMERIC,
    email_similarity NUMERIC,
    phone_similarity NUMERIC,
    organization_match BOOLEAN,
    match_details JSONB,
    confidence_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH candidates AS (
        SELECT
            d.id,
            d.name_en,
            d.name_ar,
            (calculate_organization_similarity(p_org_id, d.id)).*
        FROM dossiers d
        WHERE d.type = 'organization'
          AND d.id != p_org_id
          AND d.status != 'archived'
    )
    SELECT
        c.id,
        c.name_en,
        c.name_ar,
        c.overall_score,
        c.name_similarity,
        c.email_similarity,
        c.phone_similarity,
        c.organization_match,
        c.match_details,
        CASE
            WHEN c.overall_score >= 0.85 THEN 'high'
            WHEN c.overall_score >= 0.70 THEN 'medium'
            ELSE 'low'
        END::TEXT as confidence_level
    FROM candidates c
    WHERE c.overall_score >= p_threshold
    ORDER BY c.overall_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Scan all recent entities for duplicates (background job)
CREATE OR REPLACE FUNCTION scan_for_duplicates(
    p_entity_type duplicate_entity_type,
    p_days_back INTEGER DEFAULT 90,
    p_batch_size INTEGER DEFAULT 100
) RETURNS INTEGER AS $$
DECLARE
    v_settings RECORD;
    v_entity RECORD;
    v_candidate RECORD;
    v_count INTEGER := 0;
BEGIN
    -- Get settings
    SELECT * INTO v_settings
    FROM duplicate_detection_settings
    WHERE entity_type = p_entity_type AND is_enabled = TRUE;

    IF v_settings IS NULL THEN
        RETURN 0;
    END IF;

    -- Scan recent entities
    FOR v_entity IN
        SELECT d.id
        FROM dossiers d
        WHERE d.type = p_entity_type::TEXT
          AND d.status != 'archived'
          AND d.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
        ORDER BY d.created_at DESC
        LIMIT p_batch_size
    LOOP
        -- Find duplicates based on entity type
        IF p_entity_type = 'person' THEN
            FOR v_candidate IN
                SELECT * FROM find_duplicate_persons(v_entity.id, v_settings.suggest_threshold, v_settings.max_candidates_per_entity)
            LOOP
                -- Insert if not already exists
                INSERT INTO entity_duplicate_candidates (
                    source_entity_id, target_entity_id, entity_type,
                    overall_score, name_similarity, email_similarity, phone_similarity,
                    organization_match, match_details,
                    confidence_level, detection_source
                )
                VALUES (
                    v_entity.id, v_candidate.candidate_id, 'person',
                    v_candidate.overall_score, v_candidate.name_similarity,
                    v_candidate.email_similarity, v_candidate.phone_similarity,
                    v_candidate.organization_match, v_candidate.match_details,
                    v_candidate.confidence_level, 'auto_scan'
                )
                ON CONFLICT (source_entity_id, target_entity_id) DO UPDATE
                SET
                    overall_score = EXCLUDED.overall_score,
                    match_details = EXCLUDED.match_details,
                    updated_at = NOW()
                WHERE entity_duplicate_candidates.status = 'pending';

                v_count := v_count + 1;
            END LOOP;
        ELSIF p_entity_type = 'organization' THEN
            FOR v_candidate IN
                SELECT * FROM find_duplicate_organizations(v_entity.id, v_settings.suggest_threshold, v_settings.max_candidates_per_entity)
            LOOP
                INSERT INTO entity_duplicate_candidates (
                    source_entity_id, target_entity_id, entity_type,
                    overall_score, name_similarity, email_similarity, phone_similarity,
                    match_details, confidence_level, detection_source
                )
                VALUES (
                    v_entity.id, v_candidate.candidate_id, 'organization',
                    v_candidate.overall_score, v_candidate.name_similarity,
                    v_candidate.email_similarity, v_candidate.phone_similarity,
                    v_candidate.match_details, v_candidate.confidence_level, 'auto_scan'
                )
                ON CONFLICT (source_entity_id, target_entity_id) DO UPDATE
                SET
                    overall_score = EXCLUDED.overall_score,
                    match_details = EXCLUDED.match_details,
                    updated_at = NOW()
                WHERE entity_duplicate_candidates.status = 'pending';

                v_count := v_count + 1;
            END LOOP;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MERGE FUNCTIONS
-- ============================================================================

-- Merge duplicate persons
CREATE OR REPLACE FUNCTION merge_duplicate_persons(
    p_primary_id UUID,
    p_duplicate_id UUID,
    p_user_id UUID,
    p_field_resolutions JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_primary RECORD;
    v_duplicate RECORD;
    v_duplicate_snapshot JSONB;
    v_transferred_relationships JSONB := '[]';
    v_transferred_roles JSONB := '[]';
    v_transferred_affiliations JSONB := '[]';
    v_transferred_engagements JSONB := '[]';
    v_merge_id UUID;
    v_candidate_id UUID;
BEGIN
    -- Verify both are persons
    SELECT d.*, p.* INTO v_primary
    FROM dossiers d JOIN persons p ON p.id = d.id
    WHERE d.id = p_primary_id AND d.type = 'person';

    SELECT d.*, p.* INTO v_duplicate
    FROM dossiers d JOIN persons p ON p.id = d.id
    WHERE d.id = p_duplicate_id AND d.type = 'person';

    IF v_primary IS NULL OR v_duplicate IS NULL THEN
        RAISE EXCEPTION 'Both entities must be valid persons';
    END IF;

    -- Create snapshot of duplicate before merge
    SELECT jsonb_build_object(
        'dossier', row_to_json(d),
        'person', row_to_json(p),
        'roles', (SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]') FROM person_roles r WHERE r.person_id = p_duplicate_id),
        'affiliations', (SELECT COALESCE(jsonb_agg(row_to_json(a)), '[]') FROM person_affiliations a WHERE a.person_id = p_duplicate_id),
        'relationships', (SELECT COALESCE(jsonb_agg(row_to_json(rel)), '[]') FROM person_relationships rel WHERE rel.from_person_id = p_duplicate_id OR rel.to_person_id = p_duplicate_id),
        'engagements', (SELECT COALESCE(jsonb_agg(row_to_json(e)), '[]') FROM person_engagements e WHERE e.person_id = p_duplicate_id)
    ) INTO v_duplicate_snapshot
    FROM dossiers d JOIN persons p ON p.id = d.id
    WHERE d.id = p_duplicate_id;

    -- Transfer relationships (update references to point to primary)
    WITH updated_from AS (
        UPDATE person_relationships
        SET from_person_id = p_primary_id
        WHERE from_person_id = p_duplicate_id
          AND NOT EXISTS (
              SELECT 1 FROM person_relationships pr
              WHERE pr.from_person_id = p_primary_id
                AND pr.to_person_id = person_relationships.to_person_id
                AND pr.relationship_type = person_relationships.relationship_type
          )
        RETURNING id, to_person_id, relationship_type
    ),
    updated_to AS (
        UPDATE person_relationships
        SET to_person_id = p_primary_id
        WHERE to_person_id = p_duplicate_id
          AND from_person_id != p_primary_id
          AND NOT EXISTS (
              SELECT 1 FROM person_relationships pr
              WHERE pr.to_person_id = p_primary_id
                AND pr.from_person_id = person_relationships.from_person_id
                AND pr.relationship_type = person_relationships.relationship_type
          )
        RETURNING id, from_person_id, relationship_type
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'type', 'from')), '[]') ||
           COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'type', 'to')) FROM updated_to), '[]')
    INTO v_transferred_relationships
    FROM updated_from;

    -- Transfer roles (avoiding duplicates)
    WITH transferred AS (
        UPDATE person_roles
        SET person_id = p_primary_id
        WHERE person_id = p_duplicate_id
          AND NOT EXISTS (
              SELECT 1 FROM person_roles pr
              WHERE pr.person_id = p_primary_id
                AND pr.organization_id = person_roles.organization_id
                AND pr.role_title_en = person_roles.role_title_en
                AND COALESCE(pr.start_date, '1900-01-01') = COALESCE(person_roles.start_date, '1900-01-01')
          )
        RETURNING id, role_title_en
    )
    SELECT COALESCE(jsonb_agg(row_to_json(transferred)), '[]') INTO v_transferred_roles FROM transferred;

    -- Transfer affiliations
    WITH transferred AS (
        UPDATE person_affiliations
        SET person_id = p_primary_id
        WHERE person_id = p_duplicate_id
          AND NOT EXISTS (
              SELECT 1 FROM person_affiliations pa
              WHERE pa.person_id = p_primary_id
                AND pa.organization_id = person_affiliations.organization_id
                AND pa.affiliation_type = person_affiliations.affiliation_type
          )
        RETURNING id, affiliation_type
    )
    SELECT COALESCE(jsonb_agg(row_to_json(transferred)), '[]') INTO v_transferred_affiliations FROM transferred;

    -- Transfer engagements
    WITH transferred AS (
        UPDATE person_engagements
        SET person_id = p_primary_id
        WHERE person_id = p_duplicate_id
          AND NOT EXISTS (
              SELECT 1 FROM person_engagements pe
              WHERE pe.person_id = p_primary_id
                AND pe.engagement_id = person_engagements.engagement_id
          )
        RETURNING id, engagement_id, role
    )
    SELECT COALESCE(jsonb_agg(row_to_json(transferred)), '[]') INTO v_transferred_engagements FROM transferred;

    -- Get duplicate candidate ID if exists
    SELECT id INTO v_candidate_id
    FROM entity_duplicate_candidates
    WHERE (source_entity_id = p_primary_id AND target_entity_id = p_duplicate_id)
       OR (source_entity_id = p_duplicate_id AND target_entity_id = p_primary_id);

    -- Update duplicate candidate status if exists
    IF v_candidate_id IS NOT NULL THEN
        UPDATE entity_duplicate_candidates
        SET status = 'merged', resolved_at = NOW(), resolved_by = p_user_id
        WHERE id = v_candidate_id;
    END IF;

    -- Create merge history record
    INSERT INTO entity_merge_history (
        primary_entity_id, merged_entity_id, entity_type,
        duplicate_candidate_id, merged_entity_snapshot,
        transferred_relationships, transferred_roles,
        transferred_affiliations, transferred_engagements,
        field_resolutions, merged_by
    )
    VALUES (
        p_primary_id, p_duplicate_id, 'person',
        v_candidate_id, v_duplicate_snapshot,
        v_transferred_relationships, v_transferred_roles,
        v_transferred_affiliations, v_transferred_engagements,
        p_field_resolutions, p_user_id
    )
    RETURNING id INTO v_merge_id;

    -- Delete remaining relationships that couldn't be transferred
    DELETE FROM person_relationships WHERE from_person_id = p_duplicate_id OR to_person_id = p_duplicate_id;
    DELETE FROM person_roles WHERE person_id = p_duplicate_id;
    DELETE FROM person_affiliations WHERE person_id = p_duplicate_id;
    DELETE FROM person_engagements WHERE person_id = p_duplicate_id;

    -- Archive the duplicate entity (soft delete)
    UPDATE dossiers
    SET status = 'archived', updated_by = p_user_id, updated_at = NOW()
    WHERE id = p_duplicate_id;

    RETURN v_merge_id;
END;
$$ LANGUAGE plpgsql;

-- Merge duplicate organizations
CREATE OR REPLACE FUNCTION merge_duplicate_organizations(
    p_primary_id UUID,
    p_duplicate_id UUID,
    p_user_id UUID,
    p_field_resolutions JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_primary RECORD;
    v_duplicate RECORD;
    v_duplicate_snapshot JSONB;
    v_merge_id UUID;
    v_candidate_id UUID;
    v_transferred_persons JSONB := '[]';
    v_transferred_working_groups JSONB := '[]';
BEGIN
    -- Verify both are organizations
    SELECT d.*, o.* INTO v_primary
    FROM dossiers d JOIN organizations o ON o.id = d.id
    WHERE d.id = p_primary_id AND d.type = 'organization';

    SELECT d.*, o.* INTO v_duplicate
    FROM dossiers d JOIN organizations o ON o.id = d.id
    WHERE d.id = p_duplicate_id AND d.type = 'organization';

    IF v_primary IS NULL OR v_duplicate IS NULL THEN
        RAISE EXCEPTION 'Both entities must be valid organizations';
    END IF;

    -- Create snapshot of duplicate before merge
    SELECT jsonb_build_object(
        'dossier', row_to_json(d),
        'organization', row_to_json(o),
        'persons', (SELECT COALESCE(jsonb_agg(row_to_json(p)), '[]') FROM persons p WHERE p.organization_id = p_duplicate_id),
        'child_orgs', (SELECT COALESCE(jsonb_agg(row_to_json(co)), '[]') FROM organizations co WHERE co.parent_org_id = p_duplicate_id),
        'working_groups', (SELECT COALESCE(jsonb_agg(row_to_json(wg)), '[]') FROM working_groups wg WHERE wg.lead_org_id = p_duplicate_id)
    ) INTO v_duplicate_snapshot
    FROM dossiers d JOIN organizations o ON o.id = d.id
    WHERE d.id = p_duplicate_id;

    -- Update persons to point to primary organization
    WITH transferred AS (
        UPDATE persons
        SET organization_id = p_primary_id
        WHERE organization_id = p_duplicate_id
        RETURNING id
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id)), '[]') INTO v_transferred_persons FROM transferred;

    -- Update person_roles organization references
    UPDATE person_roles
    SET organization_id = p_primary_id
    WHERE organization_id = p_duplicate_id;

    -- Update person_affiliations organization references
    UPDATE person_affiliations
    SET organization_id = p_primary_id
    WHERE organization_id = p_duplicate_id;

    -- Update child organizations to point to primary
    UPDATE organizations
    SET parent_org_id = p_primary_id
    WHERE parent_org_id = p_duplicate_id;

    -- Update working groups lead org
    WITH transferred AS (
        UPDATE working_groups
        SET lead_org_id = p_primary_id
        WHERE lead_org_id = p_duplicate_id
        RETURNING id
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id)), '[]') INTO v_transferred_working_groups FROM transferred;

    -- Get duplicate candidate ID if exists
    SELECT id INTO v_candidate_id
    FROM entity_duplicate_candidates
    WHERE (source_entity_id = p_primary_id AND target_entity_id = p_duplicate_id)
       OR (source_entity_id = p_duplicate_id AND target_entity_id = p_primary_id);

    -- Update duplicate candidate status
    IF v_candidate_id IS NOT NULL THEN
        UPDATE entity_duplicate_candidates
        SET status = 'merged', resolved_at = NOW(), resolved_by = p_user_id
        WHERE id = v_candidate_id;
    END IF;

    -- Create merge history record
    INSERT INTO entity_merge_history (
        primary_entity_id, merged_entity_id, entity_type,
        duplicate_candidate_id, merged_entity_snapshot,
        transferred_relationships, field_resolutions, merged_by
    )
    VALUES (
        p_primary_id, p_duplicate_id, 'organization',
        v_candidate_id, v_duplicate_snapshot,
        jsonb_build_object('persons', v_transferred_persons, 'working_groups', v_transferred_working_groups),
        p_field_resolutions, p_user_id
    )
    RETURNING id INTO v_merge_id;

    -- Archive the duplicate organization
    UPDATE dossiers
    SET status = 'archived', updated_by = p_user_id, updated_at = NOW()
    WHERE id = p_duplicate_id;

    RETURN v_merge_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get pending duplicate candidates for review
CREATE OR REPLACE FUNCTION get_pending_duplicates(
    p_entity_type duplicate_entity_type DEFAULT NULL,
    p_confidence_level TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    source_entity_id UUID,
    source_name_en TEXT,
    source_name_ar TEXT,
    target_entity_id UUID,
    target_name_en TEXT,
    target_name_ar TEXT,
    entity_type duplicate_entity_type,
    overall_score NUMERIC,
    confidence_level TEXT,
    match_details JSONB,
    detected_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.source_entity_id,
        ds.name_en as source_name_en,
        ds.name_ar as source_name_ar,
        dc.target_entity_id,
        dt.name_en as target_name_en,
        dt.name_ar as target_name_ar,
        dc.entity_type,
        dc.overall_score,
        dc.confidence_level,
        dc.match_details,
        dc.detected_at
    FROM entity_duplicate_candidates dc
    JOIN dossiers ds ON ds.id = dc.source_entity_id
    JOIN dossiers dt ON dt.id = dc.target_entity_id
    WHERE dc.status = 'pending'
      AND (p_entity_type IS NULL OR dc.entity_type = p_entity_type)
      AND (p_confidence_level IS NULL OR dc.confidence_level = p_confidence_level)
    ORDER BY dc.overall_score DESC, dc.detected_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Get merge history for an entity
CREATE OR REPLACE FUNCTION get_entity_merge_history(
    p_entity_id UUID
) RETURNS TABLE (
    id UUID,
    merged_entity_id UUID,
    merged_entity_name TEXT,
    entity_type duplicate_entity_type,
    merged_at TIMESTAMPTZ,
    merged_by UUID,
    merged_by_name TEXT,
    can_undo BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mh.id,
        mh.merged_entity_id,
        (mh.merged_entity_snapshot->'dossier'->>'name_en')::TEXT as merged_entity_name,
        mh.entity_type,
        mh.merged_at,
        mh.merged_by,
        (SELECT au.raw_user_meta_data->>'full_name' FROM auth.users au WHERE au.id = mh.merged_by)::TEXT as merged_by_name,
        mh.can_undo AND mh.undo_expires_at > NOW() as can_undo
    FROM entity_merge_history mh
    WHERE mh.primary_entity_id = p_entity_id
    ORDER BY mh.merged_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Dismiss a duplicate candidate
CREATE OR REPLACE FUNCTION dismiss_duplicate_candidate(
    p_candidate_id UUID,
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE entity_duplicate_candidates
    SET
        status = 'not_duplicate',
        decision_reason = COALESCE(p_reason, 'Manually dismissed'),
        resolved_at = NOW(),
        resolved_by = p_user_id
    WHERE id = p_candidate_id AND status = 'pending';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE entity_duplicate_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_merge_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_detection_settings ENABLE ROW LEVEL SECURITY;

-- Entity duplicate candidates policies
CREATE POLICY "Users can view duplicate candidates" ON entity_duplicate_candidates
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update duplicate candidates" ON entity_duplicate_candidates
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert duplicate candidates" ON entity_duplicate_candidates
    FOR INSERT WITH CHECK (TRUE);

-- Merge history policies
CREATE POLICY "Users can view merge history" ON entity_merge_history
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert merge history" ON entity_merge_history
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Settings policies (admin only)
CREATE POLICY "Admins can manage settings" ON duplicate_detection_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Users can view settings" ON duplicate_detection_settings
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_duplicate_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_entity_duplicate_candidates_timestamp
    BEFORE UPDATE ON entity_duplicate_candidates
    FOR EACH ROW EXECUTE FUNCTION update_duplicate_timestamp();

CREATE TRIGGER update_duplicate_settings_timestamp
    BEFORE UPDATE ON duplicate_detection_settings
    FOR EACH ROW EXECUTE FUNCTION update_duplicate_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE entity_duplicate_candidates IS 'Potential duplicate entity pairs detected by fuzzy matching';
COMMENT ON TABLE entity_merge_history IS 'Audit trail of merged entities with full snapshots for undo';
COMMENT ON TABLE duplicate_detection_settings IS 'Configuration for duplicate detection thresholds and weights';

COMMENT ON FUNCTION calculate_person_similarity IS 'Calculate similarity score between two persons using multiple attributes';
COMMENT ON FUNCTION calculate_organization_similarity IS 'Calculate similarity score between two organizations';
COMMENT ON FUNCTION find_duplicate_persons IS 'Find potential duplicate persons for a given person ID';
COMMENT ON FUNCTION find_duplicate_organizations IS 'Find potential duplicate organizations for a given organization ID';
COMMENT ON FUNCTION merge_duplicate_persons IS 'Merge two person entities, preserving all relationships';
COMMENT ON FUNCTION merge_duplicate_organizations IS 'Merge two organization entities, updating all references';
COMMENT ON FUNCTION scan_for_duplicates IS 'Background job to scan recent entities for duplicates';
