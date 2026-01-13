-- Migration: Create planned_milestones table
-- Feature: Milestone Planning Tool for Empty Timeline States
-- Purpose: Allow users to project future events, set deadlines, and schedule relationship reviews

-- Create milestone type enum
CREATE TYPE milestone_type AS ENUM (
  'engagement',
  'policy_deadline',
  'relationship_review',
  'document_due',
  'follow_up',
  'renewal',
  'custom'
);

-- Create milestone status enum
CREATE TYPE milestone_status AS ENUM (
  'planned',
  'in_progress',
  'completed',
  'postponed',
  'cancelled'
);

-- Create reminder frequency enum
CREATE TYPE reminder_frequency AS ENUM (
  'once',
  'daily',
  'weekly',
  'custom'
);

-- Create reminder channel enum (using array for multi-channel support)
CREATE TYPE reminder_channel AS ENUM (
  'in_app',
  'email',
  'push'
);

-- Create planned_milestones table
CREATE TABLE planned_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  dossier_type TEXT NOT NULL CHECK (dossier_type IN ('Country', 'Organization', 'Person', 'Engagement', 'Forum', 'WorkingGroup', 'Topic')),

  -- Core milestone info
  milestone_type milestone_type NOT NULL DEFAULT 'custom',
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Timing
  target_date DATE NOT NULL,
  target_time TIME,
  end_date DATE,
  timezone TEXT DEFAULT 'UTC',

  -- Classification
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status milestone_status NOT NULL DEFAULT 'planned',

  -- Related entities
  related_entity_id UUID,
  related_entity_type TEXT,

  -- Visual customization
  color TEXT,
  icon TEXT,

  -- Reminders (stored as JSONB for flexibility)
  reminders JSONB DEFAULT '[]'::jsonb,

  -- Notes and context
  notes_en TEXT,
  notes_ar TEXT,
  expected_outcome_en TEXT,
  expected_outcome_ar TEXT,

  -- Conversion tracking
  converted_to_event BOOLEAN DEFAULT FALSE,
  converted_event_id UUID,
  converted_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_planned_milestones_dossier_id ON planned_milestones(dossier_id);
CREATE INDEX idx_planned_milestones_dossier_type ON planned_milestones(dossier_type);
CREATE INDEX idx_planned_milestones_status ON planned_milestones(status);
CREATE INDEX idx_planned_milestones_target_date ON planned_milestones(target_date);
CREATE INDEX idx_planned_milestones_milestone_type ON planned_milestones(milestone_type);
CREATE INDEX idx_planned_milestones_created_by ON planned_milestones(created_by);

-- Composite index for common filtering patterns
CREATE INDEX idx_planned_milestones_dossier_status ON planned_milestones(dossier_id, status);
CREATE INDEX idx_planned_milestones_dossier_date ON planned_milestones(dossier_id, target_date);

-- Full-text search indexes
CREATE INDEX idx_planned_milestones_title_en ON planned_milestones USING gin(to_tsvector('english', title_en));
CREATE INDEX idx_planned_milestones_title_ar ON planned_milestones USING gin(to_tsvector('arabic', title_ar));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_planned_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_planned_milestones_updated_at
  BEFORE UPDATE ON planned_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_planned_milestones_updated_at();

-- Enable RLS
ALTER TABLE planned_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view milestones for dossiers they have access to
CREATE POLICY "Users can view milestones for accessible dossiers"
  ON planned_milestones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = planned_milestones.dossier_id
      AND (
        d.sensitivity_level <= 1 -- Public or internal
        OR EXISTS (
          SELECT 1 FROM dossier_access da
          WHERE da.dossier_id = d.id
          AND da.user_id = auth.uid()
        )
        OR d.created_by = auth.uid()
      )
    )
  );

-- Users can create milestones for dossiers they have write access to
CREATE POLICY "Users can create milestones for writable dossiers"
  ON planned_milestones
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = planned_milestones.dossier_id
      AND (
        d.sensitivity_level <= 1
        OR EXISTS (
          SELECT 1 FROM dossier_access da
          WHERE da.dossier_id = d.id
          AND da.user_id = auth.uid()
          AND da.access_level IN ('write', 'admin')
        )
        OR d.created_by = auth.uid()
      )
    )
  );

-- Users can update their own milestones or milestones they have admin access to
CREATE POLICY "Users can update accessible milestones"
  ON planned_milestones
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM dossier_access da
      WHERE da.dossier_id = planned_milestones.dossier_id
      AND da.user_id = auth.uid()
      AND da.access_level = 'admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM dossier_access da
      WHERE da.dossier_id = planned_milestones.dossier_id
      AND da.user_id = auth.uid()
      AND da.access_level = 'admin'
    )
  );

-- Users can delete their own milestones
CREATE POLICY "Users can delete own milestones"
  ON planned_milestones
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM dossier_access da
      WHERE da.dossier_id = planned_milestones.dossier_id
      AND da.user_id = auth.uid()
      AND da.access_level = 'admin'
    )
  );

-- Create a view for upcoming milestones with reminder info
CREATE OR REPLACE VIEW upcoming_milestones AS
SELECT
  pm.*,
  d.name_en AS dossier_name_en,
  d.name_ar AS dossier_name_ar,
  d.type AS dossier_entity_type,
  u.email AS creator_email,
  CASE
    WHEN pm.target_date < CURRENT_DATE AND pm.status NOT IN ('completed', 'cancelled') THEN 'overdue'
    WHEN pm.target_date = CURRENT_DATE THEN 'due_today'
    WHEN pm.target_date = CURRENT_DATE + INTERVAL '1 day' THEN 'due_tomorrow'
    WHEN pm.target_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_this_week'
    WHEN pm.target_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'due_this_month'
    ELSE 'future'
  END AS due_status,
  (pm.target_date - CURRENT_DATE) AS days_until_due
FROM planned_milestones pm
JOIN dossiers d ON d.id = pm.dossier_id
JOIN auth.users u ON u.id = pm.created_by
WHERE pm.status NOT IN ('completed', 'cancelled')
ORDER BY pm.target_date ASC;

-- Grant access to the view
GRANT SELECT ON upcoming_milestones TO authenticated;

-- Function to get milestone statistics for a dossier
CREATE OR REPLACE FUNCTION get_milestone_stats(p_dossier_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'by_status', json_build_object(
      'planned', COUNT(*) FILTER (WHERE status = 'planned'),
      'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
      'completed', COUNT(*) FILTER (WHERE status = 'completed'),
      'postponed', COUNT(*) FILTER (WHERE status = 'postponed'),
      'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
    ),
    'by_type', json_build_object(
      'engagement', COUNT(*) FILTER (WHERE milestone_type = 'engagement'),
      'policy_deadline', COUNT(*) FILTER (WHERE milestone_type = 'policy_deadline'),
      'relationship_review', COUNT(*) FILTER (WHERE milestone_type = 'relationship_review'),
      'document_due', COUNT(*) FILTER (WHERE milestone_type = 'document_due'),
      'follow_up', COUNT(*) FILTER (WHERE milestone_type = 'follow_up'),
      'renewal', COUNT(*) FILTER (WHERE milestone_type = 'renewal'),
      'custom', COUNT(*) FILTER (WHERE milestone_type = 'custom')
    ),
    'upcoming_this_week', COUNT(*) FILTER (
      WHERE target_date <= CURRENT_DATE + INTERVAL '7 days'
      AND target_date >= CURRENT_DATE
      AND status NOT IN ('completed', 'cancelled')
    ),
    'upcoming_this_month', COUNT(*) FILTER (
      WHERE target_date <= CURRENT_DATE + INTERVAL '30 days'
      AND target_date >= CURRENT_DATE
      AND status NOT IN ('completed', 'cancelled')
    ),
    'overdue', COUNT(*) FILTER (
      WHERE target_date < CURRENT_DATE
      AND status NOT IN ('completed', 'cancelled')
    )
  ) INTO result
  FROM planned_milestones
  WHERE dossier_id = p_dossier_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_milestone_stats(UUID) TO authenticated;

-- Add comment explaining the table
COMMENT ON TABLE planned_milestones IS 'Stores planned milestones for timeline planning. Allows users to project future events, set policy deadlines, and schedule relationship reviews for entities with no existing timeline events.';
