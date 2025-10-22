-- Migration: Create decisions table
-- Purpose: Store decisions made during engagements
-- Feature: After-Action Structured Documentation
-- Date: 2025-01-14

CREATE TABLE IF NOT EXISTS public.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    after_action_id UUID NOT NULL REFERENCES public.after_action_records(id) ON DELETE CASCADE,
    description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 2000),
    rationale TEXT,
    decision_maker TEXT NOT NULL,
    decided_at TIMESTAMPTZ NOT NULL,
    supporting_context TEXT,

    -- AI extraction metadata
    ai_extracted BOOLEAN NOT NULL DEFAULT false,
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT check_confidence_score_required CHECK (
        (ai_extracted = true AND confidence_score IS NOT NULL) OR
        (ai_extracted = false)
    ),
    CONSTRAINT check_decided_at_not_future CHECK (decided_at <= now())
);

-- Create indexes
CREATE INDEX idx_decisions_after_action ON public.decisions (after_action_id);
CREATE INDEX idx_decisions_ai_extracted ON public.decisions (ai_extracted) WHERE ai_extracted = true;
CREATE INDEX idx_decisions_decided_at ON public.decisions (decided_at);

-- Add comments
COMMENT ON TABLE public.decisions IS 'Individual decisions made during the engagement';
COMMENT ON COLUMN public.decisions.confidence_score IS 'AI extraction confidence (0.00-1.00), required when ai_extracted=true';
COMMENT ON COLUMN public.decisions.decided_at IS 'When the decision was made (must be <= current timestamp)';
