-- Migration: Create access_reviews table
-- Feature: 019-user-management-access
-- Task: T009
-- Date: 2025-10-11

CREATE TABLE access_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL,  -- 'all', 'department', 'role', 'user'
  scope_value TEXT,     -- department name, role name, or user ID
  status review_status DEFAULT 'pending',
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  findings JSONB DEFAULT '[]'::jsonb,  -- Array of findings: [{user_id, issue_type, description, severity}]
  findings_summary JSONB DEFAULT '{}'::jsonb,  -- Summary counts: {inactive_users: 0, excessive_permissions: 0, expiring_guests: 0}
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Constraints
  CONSTRAINT chk_review_scope_value CHECK (
    (scope IN ('department', 'role', 'user') AND scope_value IS NOT NULL) OR
    (scope = 'all' AND scope_value IS NULL)
  )
);

-- Create table for individual user access certifications
CREATE TABLE access_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES access_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certified_by UUID REFERENCES auth.users(id),
  certification_status TEXT DEFAULT 'pending',  -- 'pending', 'certified', 'change_requested'
  change_requests JSONB,  -- Requested changes: {revoke_permissions: [], add_permissions: [], change_role: ''}
  certified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Unique constraint: one certification per user per review
  CONSTRAINT uq_certification_user_review UNIQUE (review_id, user_id)
);

-- Create indexes for access_reviews
CREATE INDEX idx_reviews_status ON access_reviews(status);
CREATE INDEX idx_reviews_reviewer ON access_reviews(reviewer_id);
CREATE INDEX idx_reviews_scope ON access_reviews(scope, scope_value);
CREATE INDEX idx_reviews_created_at ON access_reviews(created_at);

-- Create indexes for access_certifications
CREATE INDEX idx_certifications_review ON access_certifications(review_id);
CREATE INDEX idx_certifications_user ON access_certifications(user_id);
CREATE INDEX idx_certifications_status ON access_certifications(certification_status);

-- Function to update updated_at for access_reviews
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reviews_updated_at
  BEFORE UPDATE ON access_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- Function to update updated_at for access_certifications
CREATE OR REPLACE FUNCTION update_certifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_certifications_updated_at
  BEFORE UPDATE ON access_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_certifications_updated_at();

-- Add comments for access_reviews
COMMENT ON TABLE access_reviews IS 'Periodic access reviews for compliance and privilege creep detection';
COMMENT ON COLUMN access_reviews.title IS 'Review title (e.g., "Q4 2025 Access Review")';
COMMENT ON COLUMN access_reviews.description IS 'Review description and objectives';
COMMENT ON COLUMN access_reviews.scope IS 'Review scope (all, department, role, user)';
COMMENT ON COLUMN access_reviews.scope_value IS 'Specific value for scoped reviews';
COMMENT ON COLUMN access_reviews.status IS 'Review status (pending, in_progress, completed, cancelled)';
COMMENT ON COLUMN access_reviews.reviewer_id IS 'Security administrator conducting the review';
COMMENT ON COLUMN access_reviews.findings IS 'Array of review findings with issue details';
COMMENT ON COLUMN access_reviews.findings_summary IS 'Summary counts of different finding types';

-- Add comments for access_certifications
COMMENT ON TABLE access_certifications IS 'Individual user access certifications within a review';
COMMENT ON COLUMN access_certifications.review_id IS 'Parent access review';
COMMENT ON COLUMN access_certifications.user_id IS 'User being certified';
COMMENT ON COLUMN access_certifications.certified_by IS 'Manager who certified this user access';
COMMENT ON COLUMN access_certifications.certification_status IS 'Certification status (pending, certified, change_requested)';
COMMENT ON COLUMN access_certifications.change_requests IS 'Requested changes to user access';
