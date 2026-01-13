-- Migration: Create MoU Deliverables and Milestones tables
-- Purpose: Granular deliverable tracking for MoUs with milestones, owners, status tracking, and document linkage
-- Feature: commitment-deliverables
-- Date: 2026-01-10

-- Create ENUM types for deliverables
CREATE TYPE public.deliverable_status AS ENUM ('pending', 'in_progress', 'completed', 'delayed', 'cancelled');
CREATE TYPE public.deliverable_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');

-- Create deliverables table
CREATE TABLE IF NOT EXISTS public.mou_deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mou_id UUID NOT NULL REFERENCES public.mous(id) ON DELETE CASCADE,

    -- Core fields (bilingual)
    title_en TEXT NOT NULL CHECK (char_length(title_en) >= 3 AND char_length(title_en) <= 200),
    title_ar TEXT NOT NULL CHECK (char_length(title_ar) >= 3 AND char_length(title_ar) <= 200),
    description_en TEXT CHECK (description_en IS NULL OR (char_length(description_en) >= 10 AND char_length(description_en) <= 2000)),
    description_ar TEXT CHECK (description_ar IS NULL OR (char_length(description_ar) >= 10 AND char_length(description_ar) <= 2000)),

    -- Tracking fields
    status public.deliverable_status NOT NULL DEFAULT 'pending',
    priority public.deliverable_priority NOT NULL DEFAULT 'medium',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

    -- Dates
    due_date DATE NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Responsible party (user or external contact)
    responsible_party_type TEXT NOT NULL CHECK (responsible_party_type IN ('internal', 'external')),
    responsible_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    responsible_contact_name TEXT,
    responsible_contact_email TEXT,

    -- Health scoring
    health_score INTEGER CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100)),
    last_health_calculation TIMESTAMPTZ,

    -- Notes
    notes TEXT,
    completion_notes TEXT,

    -- Sort order
    sort_order INTEGER NOT NULL DEFAULT 0,

    -- Audit fields
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT check_responsible_party_exclusivity CHECK (
        (responsible_party_type = 'internal' AND responsible_user_id IS NOT NULL AND responsible_contact_name IS NULL) OR
        (responsible_party_type = 'external' AND responsible_user_id IS NULL AND responsible_contact_name IS NOT NULL)
    ),
    CONSTRAINT check_completed_at_when_completed CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed')
    ),
    CONSTRAINT check_progress_matches_status CHECK (
        (status = 'completed' AND progress = 100) OR
        (status != 'completed')
    )
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS public.deliverable_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deliverable_id UUID NOT NULL REFERENCES public.mou_deliverables(id) ON DELETE CASCADE,

    -- Core fields (bilingual)
    title_en TEXT NOT NULL CHECK (char_length(title_en) >= 3 AND char_length(title_en) <= 200),
    title_ar TEXT NOT NULL CHECK (char_length(title_ar) >= 3 AND char_length(title_ar) <= 200),
    description_en TEXT,
    description_ar TEXT,

    -- Tracking
    status public.milestone_status NOT NULL DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMPTZ,

    -- Weight for progress calculation (sum of all weights should be 100)
    weight INTEGER NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),

    -- Sort order
    sort_order INTEGER NOT NULL DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,

    CONSTRAINT check_milestone_completed_at CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed')
    )
);

-- Create deliverable status history for audit trail
CREATE TABLE IF NOT EXISTS public.deliverable_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deliverable_id UUID NOT NULL REFERENCES public.mou_deliverables(id) ON DELETE CASCADE,
    old_status public.deliverable_status,
    new_status public.deliverable_status NOT NULL,
    old_progress INTEGER,
    new_progress INTEGER,
    changed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT
);

-- Create deliverable documents junction table
CREATE TABLE IF NOT EXISTS public.deliverable_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deliverable_id UUID NOT NULL REFERENCES public.mou_deliverables(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    document_name TEXT NOT NULL CHECK (char_length(document_name) <= 255),
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 52428800), -- 50MB limit
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    description TEXT,

    -- Unique constraint on deliverable + document_name
    UNIQUE(deliverable_id, document_name)
);

-- Create indexes for performance
CREATE INDEX idx_mou_deliverables_mou ON public.mou_deliverables(mou_id);
CREATE INDEX idx_mou_deliverables_status ON public.mou_deliverables(status);
CREATE INDEX idx_mou_deliverables_priority ON public.mou_deliverables(priority);
CREATE INDEX idx_mou_deliverables_due_date ON public.mou_deliverables(due_date);
CREATE INDEX idx_mou_deliverables_responsible_user ON public.mou_deliverables(responsible_user_id) WHERE responsible_party_type = 'internal';
CREATE INDEX idx_mou_deliverables_health ON public.mou_deliverables(health_score, mou_id);
CREATE INDEX idx_mou_deliverables_sort ON public.mou_deliverables(mou_id, sort_order);

CREATE INDEX idx_deliverable_milestones_deliverable ON public.deliverable_milestones(deliverable_id);
CREATE INDEX idx_deliverable_milestones_status ON public.deliverable_milestones(status);
CREATE INDEX idx_deliverable_milestones_sort ON public.deliverable_milestones(deliverable_id, sort_order);

CREATE INDEX idx_deliverable_status_history_deliverable ON public.deliverable_status_history(deliverable_id);
CREATE INDEX idx_deliverable_status_history_changed_at ON public.deliverable_status_history(changed_at);

CREATE INDEX idx_deliverable_documents_deliverable ON public.deliverable_documents(deliverable_id);

-- Full-text search indexes
CREATE INDEX idx_mou_deliverables_search_en ON public.mou_deliverables USING gin(
    to_tsvector('english', title_en || ' ' || COALESCE(description_en, ''))
);
CREATE INDEX idx_mou_deliverables_search_ar ON public.mou_deliverables USING gin(
    to_tsvector('arabic', title_ar || ' ' || COALESCE(description_ar, ''))
);

-- Add trigger to auto-update updated_at
CREATE TRIGGER trigger_update_mou_deliverables_updated_at
    BEFORE UPDATE ON public.mou_deliverables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_deliverable_milestones_updated_at
    BEFORE UPDATE ON public.deliverable_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-calculate deliverable progress from milestones
CREATE OR REPLACE FUNCTION public.calculate_deliverable_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_weight INTEGER;
    completed_weight INTEGER;
    new_progress INTEGER;
BEGIN
    -- Get total weight of all milestones
    SELECT COALESCE(SUM(weight), 0) INTO total_weight
    FROM public.deliverable_milestones
    WHERE deliverable_id = COALESCE(NEW.deliverable_id, OLD.deliverable_id);

    -- Get completed weight
    SELECT COALESCE(SUM(weight), 0) INTO completed_weight
    FROM public.deliverable_milestones
    WHERE deliverable_id = COALESCE(NEW.deliverable_id, OLD.deliverable_id)
    AND status = 'completed';

    -- Calculate progress
    IF total_weight > 0 THEN
        new_progress := (completed_weight * 100) / total_weight;
    ELSE
        new_progress := 0;
    END IF;

    -- Update the deliverable
    UPDATE public.mou_deliverables
    SET progress = new_progress,
        updated_at = now()
    WHERE id = COALESCE(NEW.deliverable_id, OLD.deliverable_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_deliverable_progress
    AFTER INSERT OR UPDATE OF status, weight OR DELETE ON public.deliverable_milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_deliverable_progress();

-- Function to auto-update deliverable status based on progress and due date
CREATE OR REPLACE FUNCTION public.update_deliverable_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-set to delayed if past due date and not completed
    IF NEW.due_date < CURRENT_DATE AND NEW.status IN ('pending', 'in_progress') THEN
        NEW.status := 'delayed';
    END IF;

    -- Auto-set to completed if progress is 100
    IF NEW.progress = 100 AND NEW.status NOT IN ('completed', 'cancelled') THEN
        NEW.status := 'completed';
        NEW.completed_at := COALESCE(NEW.completed_at, now());
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deliverable_status
    BEFORE INSERT OR UPDATE ON public.mou_deliverables
    FOR EACH ROW
    EXECUTE FUNCTION public.update_deliverable_status();

-- Function to record status changes in history
CREATE OR REPLACE FUNCTION public.record_deliverable_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.progress IS DISTINCT FROM NEW.progress)) THEN
        INSERT INTO public.deliverable_status_history (
            deliverable_id,
            old_status,
            new_status,
            old_progress,
            new_progress,
            changed_by
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            OLD.progress,
            NEW.progress,
            COALESCE(NEW.updated_by, auth.uid())
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_deliverable_status_change
    AFTER UPDATE ON public.mou_deliverables
    FOR EACH ROW
    EXECUTE FUNCTION public.record_deliverable_status_change();

-- Function to calculate deliverable health score
-- Health Score = (Progress % * 0.4) + (Time Remaining Factor * 0.3) + (Milestone Completion Rate * 0.3)
CREATE OR REPLACE FUNCTION public.calculate_deliverable_health_score(p_deliverable_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_progress INTEGER;
    v_due_date DATE;
    v_created_at TIMESTAMPTZ;
    v_total_days INTEGER;
    v_days_remaining INTEGER;
    v_time_factor NUMERIC;
    v_milestone_total INTEGER;
    v_milestone_completed INTEGER;
    v_milestone_factor NUMERIC;
    v_health_score INTEGER;
BEGIN
    -- Get deliverable data
    SELECT progress, due_date, created_at
    INTO v_progress, v_due_date, v_created_at
    FROM public.mou_deliverables
    WHERE id = p_deliverable_id;

    IF v_due_date IS NULL THEN
        RETURN NULL;
    END IF;

    -- Calculate time factor
    v_total_days := (v_due_date - v_created_at::date);
    v_days_remaining := (v_due_date - CURRENT_DATE);

    IF v_total_days <= 0 THEN
        v_time_factor := 0;
    ELSIF v_days_remaining <= 0 THEN
        v_time_factor := 0; -- Past due
    ELSE
        v_time_factor := LEAST(100, (v_days_remaining::NUMERIC / v_total_days::NUMERIC) * 100);
    END IF;

    -- Calculate milestone factor
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
    INTO v_milestone_total, v_milestone_completed
    FROM public.deliverable_milestones
    WHERE deliverable_id = p_deliverable_id;

    IF v_milestone_total = 0 THEN
        v_milestone_factor := v_progress; -- Use progress if no milestones
    ELSE
        v_milestone_factor := (v_milestone_completed::NUMERIC / v_milestone_total::NUMERIC) * 100;
    END IF;

    -- Calculate health score
    v_health_score := ROUND(
        (v_progress * 0.4) +
        (v_time_factor * 0.3) +
        (v_milestone_factor * 0.3)
    );

    -- Update the deliverable
    UPDATE public.mou_deliverables
    SET health_score = v_health_score,
        last_health_calculation = now()
    WHERE id = p_deliverable_id;

    RETURN v_health_score;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate MoU overall deliverables health
CREATE OR REPLACE FUNCTION public.calculate_mou_deliverables_health(p_mou_id UUID)
RETURNS TABLE (
    total_deliverables INTEGER,
    completed_count INTEGER,
    delayed_count INTEGER,
    on_track_count INTEGER,
    avg_progress NUMERIC,
    avg_health_score NUMERIC,
    overall_health_score INTEGER
) AS $$
DECLARE
    v_total INTEGER;
    v_completed INTEGER;
    v_delayed INTEGER;
    v_on_track INTEGER;
    v_avg_progress NUMERIC;
    v_avg_health NUMERIC;
BEGIN
    -- Count deliverables by status
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'delayed'),
        COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress') AND due_date >= CURRENT_DATE)
    INTO v_total, v_completed, v_delayed, v_on_track
    FROM public.mou_deliverables
    WHERE mou_id = p_mou_id AND status != 'cancelled';

    -- Calculate averages
    SELECT
        COALESCE(AVG(progress), 0),
        COALESCE(AVG(health_score), 0)
    INTO v_avg_progress, v_avg_health
    FROM public.mou_deliverables
    WHERE mou_id = p_mou_id AND status != 'cancelled';

    RETURN QUERY
    SELECT
        v_total,
        v_completed,
        v_delayed,
        v_on_track,
        ROUND(v_avg_progress, 2),
        ROUND(v_avg_health, 2),
        CASE
            WHEN v_total = 0 THEN NULL
            ELSE ROUND(
                (v_completed::NUMERIC / v_total * 100 * 0.4) +
                (v_avg_health * 0.4) +
                ((v_total - v_delayed)::NUMERIC / v_total * 100 * 0.2)
            )::INTEGER
        END;
END;
$$ LANGUAGE plpgsql;

-- Function for bulk status update
CREATE OR REPLACE FUNCTION public.bulk_update_deliverable_status(
    p_deliverable_ids UUID[],
    p_new_status public.deliverable_status,
    p_notes TEXT DEFAULT NULL,
    p_updated_by UUID DEFAULT NULL
)
RETURNS TABLE (
    updated_count INTEGER,
    failed_ids UUID[]
) AS $$
DECLARE
    v_updated INTEGER := 0;
    v_failed UUID[] := ARRAY[]::UUID[];
    v_id UUID;
BEGIN
    FOREACH v_id IN ARRAY p_deliverable_ids
    LOOP
        BEGIN
            UPDATE public.mou_deliverables
            SET status = p_new_status,
                notes = COALESCE(p_notes, notes),
                updated_by = COALESCE(p_updated_by, auth.uid()),
                updated_at = now(),
                completed_at = CASE WHEN p_new_status = 'completed' THEN now() ELSE completed_at END
            WHERE id = v_id;

            IF FOUND THEN
                v_updated := v_updated + 1;
            ELSE
                v_failed := array_append(v_failed, v_id);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_failed := array_append(v_failed, v_id);
        END;
    END LOOP;

    RETURN QUERY SELECT v_updated, v_failed;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON public.mou_deliverables TO authenticated;
GRANT ALL ON public.deliverable_milestones TO authenticated;
GRANT ALL ON public.deliverable_status_history TO authenticated;
GRANT ALL ON public.deliverable_documents TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.mou_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverable_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverable_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverable_documents ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE public.mou_deliverables IS 'Deliverables linked to MoUs with status tracking and health scoring';
COMMENT ON TABLE public.deliverable_milestones IS 'Milestones for deliverables with weighted progress calculation';
COMMENT ON TABLE public.deliverable_status_history IS 'Audit trail for deliverable status changes';
COMMENT ON TABLE public.deliverable_documents IS 'Documents attached to deliverables';
COMMENT ON COLUMN public.mou_deliverables.health_score IS 'Calculated health score (0-100) based on progress, time, and milestones';
COMMENT ON COLUMN public.deliverable_milestones.weight IS 'Weight for progress calculation (0-100), sum of all weights should be 100';
