-- Migration: Create follow_up_actions table
-- Purpose: Store next steps/actions (may have TBD owner/date initially)
-- Feature: After-Action Structured Documentation
-- Date: 2025-01-14

CREATE TABLE IF NOT EXISTS public.follow_up_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    after_action_id UUID NOT NULL REFERENCES public.after_action_records(id) ON DELETE CASCADE,
    description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 2000),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- May be TBD
    due_date DATE, -- May be TBD

    -- AI extraction metadata
    ai_extracted BOOLEAN NOT NULL DEFAULT false,
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT check_confidence_score_required CHECK (
        (ai_extracted = true AND confidence_score IS NOT NULL) OR
        (ai_extracted = false)
    )
);

-- Create indexes
CREATE INDEX idx_follow_up_actions_after_action ON public.follow_up_actions (after_action_id);
CREATE INDEX idx_follow_up_actions_owner ON public.follow_up_actions (owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_follow_up_actions_due_date ON public.follow_up_actions (due_date) WHERE due_date IS NOT NULL;

-- Add comments
COMMENT ON TABLE public.follow_up_actions IS 'Next steps or actions needed (may have TBD owner/date initially)';
COMMENT ON COLUMN public.follow_up_actions.owner_id IS 'Owner (may be NULL/TBD initially)';
COMMENT ON COLUMN public.follow_up_actions.due_date IS 'Due date (may be NULL/TBD initially)';
COMMENT ON COLUMN public.follow_up_actions.description IS 'Follow-up actions differ from commitments: they may not have assigned owners/dates yet';
