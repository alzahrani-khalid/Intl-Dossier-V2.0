-- Migration: Create risks table
-- Purpose: Store risks identified during engagements
-- Feature: After-Action Structured Documentation
-- Date: 2025-01-14

-- Create ENUM types for risks
CREATE TYPE public.risk_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.risk_likelihood AS ENUM ('rare', 'unlikely', 'possible', 'likely', 'certain');

CREATE TABLE IF NOT EXISTS public.risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    after_action_id UUID NOT NULL REFERENCES public.after_action_records(id) ON DELETE CASCADE,
    description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 2000),
    severity public.risk_severity NOT NULL,
    likelihood public.risk_likelihood NOT NULL,
    mitigation_strategy TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

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
CREATE INDEX idx_risks_after_action ON public.risks (after_action_id);
CREATE INDEX idx_risks_severity ON public.risks (severity);
CREATE INDEX idx_risks_likelihood ON public.risks (likelihood);
CREATE INDEX idx_risks_owner ON public.risks (owner_id) WHERE owner_id IS NOT NULL;

-- Create function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(
    p_severity public.risk_severity,
    p_likelihood public.risk_likelihood
) RETURNS INTEGER AS $$
DECLARE
    severity_value INTEGER;
    likelihood_value INTEGER;
BEGIN
    -- Map severity to numeric value
    severity_value := CASE p_severity
        WHEN 'low' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'high' THEN 3
        WHEN 'critical' THEN 4
    END;

    -- Map likelihood to numeric value
    likelihood_value := CASE p_likelihood
        WHEN 'rare' THEN 1
        WHEN 'unlikely' THEN 2
        WHEN 'possible' THEN 3
        WHEN 'likely' THEN 4
        WHEN 'certain' THEN 5
    END;

    RETURN severity_value * likelihood_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comments
COMMENT ON TABLE public.risks IS 'Risks identified during the engagement';
COMMENT ON COLUMN public.risks.severity IS 'Risk severity: low (1) | medium (2) | high (3) | critical (4)';
COMMENT ON COLUMN public.risks.likelihood IS 'Risk likelihood: rare (1) | unlikely (2) | possible (3) | likely (4) | certain (5)';
COMMENT ON FUNCTION calculate_risk_score IS 'Calculate risk score = severity_value * likelihood_value (range: 1-20)';
