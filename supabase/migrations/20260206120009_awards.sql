-- ============================================================================
-- Migration: Awards & Competitions
-- Date: 2026-02-06
-- Feature: use-case-repository
-- Description: Award programs and competition tracking with submission workflow
-- Covers: UC-021, UC-022, UC-023, UC-038
-- ============================================================================

-- ============================================================================
-- PART 1: Create awards table
-- ============================================================================

CREATE TABLE IF NOT EXISTS awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent association
  forum_id UUID REFERENCES forums(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Award details (bilingual)
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Award type and frequency
  award_type TEXT DEFAULT 'excellence' CHECK (award_type IN (
    'excellence',       -- Excellence award
    'achievement',      -- Achievement award
    'innovation',       -- Innovation award
    'best_practice',    -- Best practice award
    'contribution',     -- Contribution award
    'lifetime',         -- Lifetime achievement
    'recognition',      -- Recognition award
    'competition',      -- Competition prize
    'scholarship',      -- Scholarship
    'grant',            -- Grant/funding
    'other'             -- Other type
  )),
  frequency TEXT DEFAULT 'annual' CHECK (frequency IN (
    'annual',           -- Every year
    'biennial',         -- Every two years
    'triennial',        -- Every three years
    'quadrennial',      -- Every four years
    'one_time',         -- One-time award
    'ongoing'           -- Rolling/ongoing
  )),

  -- Award cycle
  current_cycle_year INTEGER,
  cycle_start_date DATE,
  cycle_end_date DATE,

  -- Eligibility
  eligibility_criteria_en TEXT,
  eligibility_criteria_ar TEXT,
  target_group TEXT[] DEFAULT '{}', -- e.g., ['member_states', 'organizations', 'individuals']

  -- Prize details
  prize_description_en TEXT,
  prize_description_ar TEXT,
  monetary_value DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',

  -- Jury/Selection
  jury_committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,
  selection_process_en TEXT,
  selection_process_ar TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  accepting_submissions BOOLEAN DEFAULT false,

  -- Documents
  guidelines_url TEXT,
  logo_url TEXT,
  documents JSONB DEFAULT '[]',

  -- Metadata
  website_url TEXT,
  contact_email TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  _version INTEGER DEFAULT 1
);

-- ============================================================================
-- PART 2: Create award_tracks table
-- ============================================================================

CREATE TABLE IF NOT EXISTS award_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,

  -- Track details (bilingual)
  track_name_en TEXT NOT NULL,
  track_name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Track category
  category TEXT NOT NULL CHECK (category IN (
    'individual',       -- Individual applicants
    'organization',     -- Organizational applicants
    'project',          -- Project-based
    'research',         -- Research/academic
    'team',             -- Team submissions
    'startup',          -- Startups
    'government',       -- Government entities
    'ngo',              -- NGOs
    'private_sector'    -- Private sector
  )),

  -- Eligibility for this track
  eligibility_en TEXT,
  eligibility_ar TEXT,
  criteria_en TEXT,
  criteria_ar TEXT,

  -- Scoring rubric
  scoring_criteria JSONB DEFAULT '[]', -- Array of {criterion, weight, max_points}

  -- Submission limits
  max_submissions INTEGER,
  submissions_per_entity INTEGER DEFAULT 1,

  -- Deadlines
  submission_open_date DATE,
  submission_deadline DATE,
  late_deadline DATE, -- If late submissions allowed
  review_deadline DATE,
  announcement_date DATE,

  -- Prize for this track
  prize_description_en TEXT,
  prize_description_ar TEXT,
  prize_count INTEGER DEFAULT 1, -- Number of prizes in this track
  monetary_value DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',

  -- Status
  is_active BOOLEAN DEFAULT true,
  current_submissions_count INTEGER DEFAULT 0,

  -- Sequence for display order
  display_order INTEGER DEFAULT 0,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 3: Create award_submissions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS award_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES award_tracks(id) ON DELETE CASCADE,

  -- Submission reference
  submission_number TEXT UNIQUE NOT NULL, -- e.g., AWD-2026-001

  -- Applicant information
  applicant_type TEXT NOT NULL CHECK (applicant_type IN (
    'individual', 'organization', 'team', 'project'
  )),
  applicant_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  applicant_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  applicant_name_en TEXT NOT NULL,
  applicant_name_ar TEXT NOT NULL,
  applicant_country_id UUID REFERENCES countries(id) ON DELETE SET NULL,

  -- Submission content (bilingual)
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  summary_en TEXT,
  summary_ar TEXT,
  description_en TEXT,
  description_ar TEXT,

  -- Supporting information
  team_members JSONB DEFAULT '[]', -- For team submissions
  supporting_documents JSONB DEFAULT '[]', -- Array of {title, url, type}
  links JSONB DEFAULT '[]', -- External links

  -- Contact information
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,

  -- Status workflow
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',            -- Not yet submitted
    'submitted',        -- Submitted and pending review
    'under_review',     -- Being reviewed
    'shortlisted',      -- Shortlisted for final round
    'finalist',         -- Selected as finalist
    'winner',           -- Won the award
    'runner_up',        -- Runner up
    'honorable_mention', -- Honorable mention
    'rejected',         -- Rejected
    'withdrawn',        -- Withdrawn by applicant
    'disqualified'      -- Disqualified
  )),
  status_notes TEXT,

  -- Review information
  total_score DECIMAL(5,2),
  review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  -- Timeline
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shortlisted_at TIMESTAMPTZ,
  winner_announced_at TIMESTAMPTZ,

  -- Prize awarded (if winner)
  prize_awarded TEXT,
  prize_awarded_date DATE,
  prize_awarded_at_event TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 4: Create submission_reviews table
-- ============================================================================

CREATE TABLE IF NOT EXISTS submission_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES award_submissions(id) ON DELETE CASCADE,

  -- Reviewer
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_role TEXT DEFAULT 'juror' CHECK (reviewer_role IN (
    'juror', 'expert', 'preliminary', 'final'
  )),

  -- Scoring
  scores JSONB DEFAULT '{}', -- {criterion_name: score, ...}
  total_score DECIMAL(5,2),
  weighted_score DECIMAL(5,2),

  -- Feedback
  strengths_en TEXT,
  strengths_ar TEXT,
  weaknesses_en TEXT,
  weaknesses_ar TEXT,
  recommendation TEXT CHECK (recommendation IN (
    'strongly_recommend', 'recommend', 'neutral', 'not_recommend', 'strongly_not_recommend'
  )),
  comments TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'recused'
  )),
  completed_at TIMESTAMPTZ,

  -- Conflict of interest
  conflict_declared BOOLEAN DEFAULT false,
  conflict_details TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Unique reviewer per submission
  CONSTRAINT unique_reviewer_submission UNIQUE (submission_id, reviewer_id)
);

-- ============================================================================
-- PART 5: Create indexes for performance
-- ============================================================================

-- Awards indexes
CREATE INDEX idx_awards_forum ON awards(forum_id) WHERE forum_id IS NOT NULL;
CREATE INDEX idx_awards_organization ON awards(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_awards_type ON awards(award_type);
CREATE INDEX idx_awards_active ON awards(is_active) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_awards_accepting ON awards(id) WHERE accepting_submissions = true;

-- Award tracks indexes
CREATE INDEX idx_award_tracks_award ON award_tracks(award_id);
CREATE INDEX idx_award_tracks_category ON award_tracks(award_id, category);
CREATE INDEX idx_award_tracks_deadline ON award_tracks(submission_deadline)
  WHERE is_active = true;
CREATE INDEX idx_award_tracks_open ON award_tracks(award_id)
  WHERE is_active = true AND submission_deadline >= CURRENT_DATE;

-- Submissions indexes
CREATE INDEX idx_award_submissions_track ON award_submissions(track_id);
CREATE INDEX idx_award_submissions_org ON award_submissions(applicant_organization_id)
  WHERE applicant_organization_id IS NOT NULL;
CREATE INDEX idx_award_submissions_person ON award_submissions(applicant_person_id)
  WHERE applicant_person_id IS NOT NULL;
CREATE INDEX idx_award_submissions_country ON award_submissions(applicant_country_id)
  WHERE applicant_country_id IS NOT NULL;
CREATE INDEX idx_award_submissions_status ON award_submissions(status);
CREATE INDEX idx_award_submissions_number ON award_submissions(submission_number);
CREATE INDEX idx_award_submissions_winners ON award_submissions(track_id)
  WHERE status IN ('winner', 'runner_up', 'finalist');

-- Reviews indexes
CREATE INDEX idx_submission_reviews_submission ON submission_reviews(submission_id);
CREATE INDEX idx_submission_reviews_reviewer ON submission_reviews(reviewer_id);
CREATE INDEX idx_submission_reviews_status ON submission_reviews(status);

-- ============================================================================
-- PART 6: Triggers
-- ============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_awards_updated_at
  BEFORE UPDATE ON awards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_award_tracks_updated_at
  BEFORE UPDATE ON award_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_award_submissions_updated_at
  BEFORE UPDATE ON award_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submission_reviews_updated_at
  BEFORE UPDATE ON submission_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Generate submission number
CREATE OR REPLACE FUNCTION generate_submission_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
BEGIN
  IF NEW.submission_number IS NULL THEN
    v_year := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(submission_number FROM 'AWD-\d{4}-(\d+)') AS INTEGER)
    ), 0) + 1 INTO v_sequence
    FROM award_submissions
    WHERE submission_number LIKE 'AWD-' || v_year || '-%';

    NEW.submission_number := 'AWD-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_submission_number
  BEFORE INSERT ON award_submissions
  FOR EACH ROW
  EXECUTE FUNCTION generate_submission_number();

-- Update track submission count
CREATE OR REPLACE FUNCTION update_track_submission_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE award_tracks
    SET current_submissions_count = (
      SELECT COUNT(*) FROM award_submissions
      WHERE track_id = NEW.track_id
      AND status NOT IN ('draft', 'withdrawn', 'disqualified')
    )
    WHERE id = NEW.track_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE award_tracks
    SET current_submissions_count = (
      SELECT COUNT(*) FROM award_submissions
      WHERE track_id = OLD.track_id
      AND status NOT IN ('draft', 'withdrawn', 'disqualified')
    )
    WHERE id = OLD.track_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_track_submission_count
  AFTER INSERT OR UPDATE OR DELETE ON award_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_track_submission_count();

-- ============================================================================
-- PART 7: RLS Policies
-- ============================================================================

ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_reviews ENABLE ROW LEVEL SECURITY;

-- Awards policies
CREATE POLICY "Users can view awards"
  ON awards FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create awards"
  ON awards FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Creator can update awards"
  ON awards FOR UPDATE
  USING (created_by = auth.uid());

-- Tracks policies
CREATE POLICY "Users can view tracks"
  ON award_tracks FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can manage tracks"
  ON award_tracks FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Submissions policies
CREATE POLICY "Authenticated users can view submissions"
  ON award_submissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create submissions"
  ON award_submissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Creator can update their submissions"
  ON award_submissions FOR UPDATE
  USING (created_by = auth.uid());

-- Reviews policies
CREATE POLICY "Reviewers can view their reviews"
  ON submission_reviews FOR SELECT
  USING (reviewer_id = auth.uid());

CREATE POLICY "Reviewers can manage their reviews"
  ON submission_reviews FOR ALL
  USING (reviewer_id = auth.uid());

-- ============================================================================
-- PART 8: Helper Functions
-- ============================================================================

-- Function: Get award with tracks
CREATE OR REPLACE FUNCTION get_award_details(p_award_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'award', (
      SELECT row_to_json(a)
      FROM awards a
      WHERE a.id = p_award_id AND a.deleted_at IS NULL
    ),
    'tracks', (
      SELECT json_agg(row_to_json(t) ORDER BY t.display_order, t.track_name_en)
      FROM award_tracks t
      WHERE t.award_id = p_award_id AND t.is_active = true
    ),
    'total_submissions', (
      SELECT COUNT(*) FROM award_submissions s
      JOIN award_tracks t ON s.track_id = t.id
      WHERE t.award_id = p_award_id
      AND s.status NOT IN ('draft', 'withdrawn', 'disqualified')
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get track submissions
CREATE OR REPLACE FUNCTION get_track_submissions(
  p_track_id UUID,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  submission_number TEXT,
  title_en TEXT,
  title_ar TEXT,
  applicant_name_en TEXT,
  applicant_country_id UUID,
  status TEXT,
  total_score DECIMAL,
  submitted_at TIMESTAMPTZ,
  reviews_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.submission_number,
    s.title_en,
    s.title_ar,
    s.applicant_name_en,
    s.applicant_country_id,
    s.status,
    s.total_score,
    s.submitted_at,
    (SELECT COUNT(*) FROM submission_reviews r WHERE r.submission_id = s.id AND r.status = 'completed') as reviews_count
  FROM award_submissions s
  WHERE s.track_id = p_track_id
    AND (p_status IS NULL OR s.status = p_status)
  ORDER BY
    CASE s.status
      WHEN 'winner' THEN 1
      WHEN 'runner_up' THEN 2
      WHEN 'finalist' THEN 3
      WHEN 'shortlisted' THEN 4
      ELSE 5
    END,
    s.total_score DESC NULLS LAST,
    s.submitted_at
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get submissions by country
CREATE OR REPLACE FUNCTION get_country_award_submissions(
  p_country_id UUID,
  p_award_id UUID DEFAULT NULL
)
RETURNS TABLE (
  submission_id UUID,
  award_name_en TEXT,
  track_name_en TEXT,
  title_en TEXT,
  status TEXT,
  submitted_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as submission_id,
    a.name_en as award_name_en,
    t.track_name_en,
    s.title_en,
    s.status,
    s.submitted_at
  FROM award_submissions s
  JOIN award_tracks t ON s.track_id = t.id
  JOIN awards a ON t.award_id = a.id
  WHERE s.applicant_country_id = p_country_id
    AND (p_award_id IS NULL OR a.id = p_award_id)
    AND a.deleted_at IS NULL
  ORDER BY s.submitted_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 9: Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON awards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON award_tracks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON award_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON submission_reviews TO authenticated;
GRANT EXECUTE ON FUNCTION get_award_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_track_submissions(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_country_award_submissions(UUID, UUID) TO authenticated;

-- ============================================================================
-- PART 10: Comments
-- ============================================================================

COMMENT ON TABLE awards IS 'Award programs and competitions run by forums or organizations';
COMMENT ON TABLE award_tracks IS 'Individual tracks/categories within an award program';
COMMENT ON TABLE award_submissions IS 'Submissions to award tracks from individuals/organizations';
COMMENT ON TABLE submission_reviews IS 'Review scores and feedback from jury members';
COMMENT ON COLUMN awards.award_type IS 'Type: excellence, achievement, innovation, best_practice, contribution, etc.';
COMMENT ON COLUMN award_tracks.category IS 'Category: individual, organization, project, research, team, etc.';
COMMENT ON COLUMN award_submissions.status IS 'Status: draft, submitted, under_review, shortlisted, finalist, winner, etc.';
COMMENT ON FUNCTION get_award_details IS 'Get award with all tracks and total submission count';
COMMENT ON FUNCTION get_track_submissions IS 'Get submissions for a track with optional status filter';
COMMENT ON FUNCTION get_country_award_submissions IS 'Get all submissions from a specific country';

-- ============================================================================
-- Migration Complete
-- ============================================================================
