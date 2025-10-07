-- Migration: Create positions table
-- Feature: 011-positions-talking-points
-- Task: T003

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_type_id uuid NOT NULL REFERENCES position_types(id) ON DELETE RESTRICT,

  -- Bilingual fields
  title_en text NOT NULL,
  title_ar text NOT NULL,
  content_en text,
  content_ar text,
  rationale_en text,
  rationale_ar text,
  alignment_notes_en text,
  alignment_notes_ar text,

  -- Categorization and status
  thematic_category text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'published')),

  -- Approval workflow
  current_stage int NOT NULL DEFAULT 0 CHECK (current_stage >= 0 AND current_stage <= 10),
  approval_chain_config jsonb NOT NULL DEFAULT '{"stages": []}'::jsonb,

  -- Consistency tracking
  consistency_score int CHECK (consistency_score >= 0 AND consistency_score <= 100),

  -- Emergency correction fields
  emergency_correction boolean DEFAULT false,
  corrected_at timestamptz,
  corrected_by uuid REFERENCES auth.users(id),
  correction_reason text,
  corrected_version_id uuid,

  -- Audit fields
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Optimistic locking
  version int NOT NULL DEFAULT 1,

  -- Constraints
  CONSTRAINT check_title_en_not_empty CHECK (char_length(trim(title_en)) > 0),
  CONSTRAINT check_title_ar_not_empty CHECK (char_length(trim(title_ar)) > 0),
  CONSTRAINT check_correction_fields CHECK (
    (emergency_correction = false AND corrected_at IS NULL AND corrected_by IS NULL AND correction_reason IS NULL)
    OR
    (emergency_correction = true AND corrected_at IS NOT NULL AND corrected_by IS NOT NULL AND correction_reason IS NOT NULL)
  )
);

-- Add comments
COMMENT ON TABLE positions IS 'Core entity representing official organizational positions or talking points';
COMMENT ON COLUMN positions.title_en IS 'Position title in English';
COMMENT ON COLUMN positions.title_ar IS 'Position title in Arabic';
COMMENT ON COLUMN positions.content_en IS 'Main position text in English';
COMMENT ON COLUMN positions.content_ar IS 'Main position text in Arabic';
COMMENT ON COLUMN positions.status IS 'Position status: draft, under_review, approved, published';
COMMENT ON COLUMN positions.current_stage IS 'Current approval stage (0 = not submitted, 1-10 = approval stage)';
COMMENT ON COLUMN positions.approval_chain_config IS 'JSONB storing approval chain structure for this position';
COMMENT ON COLUMN positions.consistency_score IS '0-100 score indicating alignment with existing positions';
COMMENT ON COLUMN positions.version IS 'Optimistic locking field for concurrent edit protection';
COMMENT ON COLUMN positions.emergency_correction IS 'Flag indicating emergency correction was applied';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
