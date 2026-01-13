-- Migration: Position Consistency Checker AI Service
-- Feature: position-consistency-checker
-- Description: AI service to analyze new position statements against existing repository
--              to detect contradictions, gaps, or redundancies

-- Create conflict type enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'position_conflict_type') THEN
    CREATE TYPE position_conflict_type AS ENUM (
      'contradiction',
      'redundancy',
      'gap',
      'outdated',
      'ambiguity',
      'semantic_conflict'
    );
  END IF;
END$$;

-- Create conflict severity enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conflict_severity') THEN
    CREATE TYPE conflict_severity AS ENUM (
      'low',
      'medium',
      'high',
      'critical'
    );
  END IF;
END$$;

-- Create review status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consistency_review_status') THEN
    CREATE TYPE consistency_review_status AS ENUM (
      'pending_review',
      'under_review',
      'approved',
      'rejected',
      'revision_required'
    );
  END IF;
END$$;

-- Create position_consistency_checks table to store analysis results
CREATE TABLE IF NOT EXISTS position_consistency_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,

  -- Analysis metadata
  analyzed_at timestamptz NOT NULL DEFAULT now(),
  analyzed_by uuid REFERENCES auth.users(id),
  analysis_type text NOT NULL DEFAULT 'pre_approval' CHECK (analysis_type IN ('pre_approval', 'scheduled', 'manual', 'on_edit')),

  -- Overall results
  overall_score integer NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  ai_service_available boolean NOT NULL DEFAULT true,

  -- Detected conflicts (JSONB array)
  conflicts jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- AI-generated recommendations (JSONB)
  recommendations jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Similar positions found
  similar_positions jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Gaps identified
  gaps_identified jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Human review fields
  review_status consistency_review_status NOT NULL DEFAULT 'pending_review',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,

  -- Flags for human attention
  requires_human_review boolean NOT NULL DEFAULT false,
  auto_approved boolean NOT NULL DEFAULT false,

  -- AI interaction tracking
  ai_interaction_id uuid,
  processing_time_ms integer,

  -- Audit fields
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_review CHECK (
    (review_status != 'approved' AND review_status != 'rejected') OR
    (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  ),
  CONSTRAINT valid_auto_approval CHECK (
    NOT auto_approved OR (auto_approved AND overall_score >= 80 AND NOT requires_human_review)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_position_consistency_position ON position_consistency_checks(position_id);
CREATE INDEX IF NOT EXISTS idx_position_consistency_analyzed_at ON position_consistency_checks(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_position_consistency_score ON position_consistency_checks(overall_score);
CREATE INDEX IF NOT EXISTS idx_position_consistency_risk ON position_consistency_checks(risk_level)
  WHERE risk_level IN ('high', 'critical');
CREATE INDEX IF NOT EXISTS idx_position_consistency_review_status ON position_consistency_checks(review_status)
  WHERE review_status = 'pending_review';
CREATE INDEX IF NOT EXISTS idx_position_consistency_conflicts ON position_consistency_checks USING gin(conflicts);
CREATE INDEX IF NOT EXISTS idx_position_consistency_requires_review ON position_consistency_checks(requires_human_review)
  WHERE requires_human_review = true;

-- Add comments
COMMENT ON TABLE position_consistency_checks IS 'AI-powered consistency analysis results for position statements';
COMMENT ON COLUMN position_consistency_checks.overall_score IS '0-100 consistency score (higher = more consistent)';
COMMENT ON COLUMN position_consistency_checks.conflicts IS 'JSONB array of detected conflicts with existing positions';
COMMENT ON COLUMN position_consistency_checks.recommendations IS 'AI-generated recommendations for resolving issues';
COMMENT ON COLUMN position_consistency_checks.similar_positions IS 'Positions with high semantic similarity (potential duplicates)';
COMMENT ON COLUMN position_consistency_checks.gaps_identified IS 'Topic gaps that this position could fill';
COMMENT ON COLUMN position_consistency_checks.requires_human_review IS 'Flag for mandatory human review before approval';
COMMENT ON COLUMN position_consistency_checks.auto_approved IS 'True if position met auto-approval threshold';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_position_consistency_checks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_position_consistency_checks_timestamp_trigger
  BEFORE UPDATE ON position_consistency_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_position_consistency_checks_timestamp();

-- Enable RLS
ALTER TABLE position_consistency_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY position_consistency_checks_select ON position_consistency_checks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY position_consistency_checks_insert ON position_consistency_checks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY position_consistency_checks_update ON position_consistency_checks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
    )
  );

-- Function to find semantically similar positions using vector embeddings
CREATE OR REPLACE FUNCTION find_similar_positions(
  p_position_id uuid,
  p_similarity_threshold float DEFAULT 0.80,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  position_id uuid,
  title_en text,
  title_ar text,
  similarity_score float,
  status text,
  thematic_category text
) AS $$
BEGIN
  RETURN QUERY
  WITH target_embedding AS (
    SELECT content_en_embedding, content_ar_embedding
    FROM position_embeddings
    WHERE position_id = p_position_id
  )
  SELECT
    p.id AS position_id,
    p.title_en,
    p.title_ar,
    GREATEST(
      COALESCE(1 - (pe.content_en_embedding <=> te.content_en_embedding), 0),
      COALESCE(1 - (pe.content_ar_embedding <=> te.content_ar_embedding), 0)
    )::float AS similarity_score,
    p.status,
    p.thematic_category
  FROM positions p
  INNER JOIN position_embeddings pe ON pe.position_id = p.id
  CROSS JOIN target_embedding te
  WHERE p.id != p_position_id
    AND p.status IN ('approved', 'published')
    AND (
      (1 - (pe.content_en_embedding <=> te.content_en_embedding)) >= p_similarity_threshold
      OR (1 - (pe.content_ar_embedding <=> te.content_ar_embedding)) >= p_similarity_threshold
    )
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get latest consistency check for a position
CREATE OR REPLACE FUNCTION get_latest_consistency_check(p_position_id uuid)
RETURNS position_consistency_checks AS $$
DECLARE
  v_result position_consistency_checks;
BEGIN
  SELECT * INTO v_result
  FROM position_consistency_checks
  WHERE position_id = p_position_id
  ORDER BY analyzed_at DESC
  LIMIT 1;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if position can be auto-approved
CREATE OR REPLACE FUNCTION can_auto_approve_position(p_position_id uuid)
RETURNS boolean AS $$
DECLARE
  v_check position_consistency_checks;
BEGIN
  SELECT * INTO v_check
  FROM position_consistency_checks
  WHERE position_id = p_position_id
  ORDER BY analyzed_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Auto-approve criteria:
  -- 1. Overall score >= 80
  -- 2. No conflicts with high or critical severity
  -- 3. Not flagged for human review
  RETURN v_check.overall_score >= 80
    AND v_check.risk_level IN ('low', 'medium')
    AND NOT v_check.requires_human_review
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_check.conflicts) AS conflict
      WHERE conflict->>'severity' IN ('high', 'critical')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION find_similar_positions(uuid, float, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_consistency_check(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_auto_approve_position(uuid) TO authenticated;

-- Add consistency_check_required field to positions table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'consistency_check_required'
  ) THEN
    ALTER TABLE positions ADD COLUMN consistency_check_required boolean DEFAULT true;
  END IF;
END$$;

-- Add last_consistency_check_id field to positions table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'last_consistency_check_id'
  ) THEN
    ALTER TABLE positions ADD COLUMN last_consistency_check_id uuid REFERENCES position_consistency_checks(id);
  END IF;
END$$;

COMMENT ON COLUMN positions.consistency_check_required IS 'Flag indicating if consistency check is required before approval';
COMMENT ON COLUMN positions.last_consistency_check_id IS 'Reference to the most recent consistency check';
