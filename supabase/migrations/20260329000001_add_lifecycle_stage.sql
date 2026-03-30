-- Migration: Add lifecycle_stage to engagement_dossiers + lifecycle_transitions audit table
-- Requirements: LIFE-01, LIFE-02, LIFE-03

-- 1. Add lifecycle_stage column to engagement_dossiers
ALTER TABLE engagement_dossiers
ADD COLUMN lifecycle_stage TEXT NOT NULL DEFAULT 'intake'
CHECK (lifecycle_stage IN ('intake','preparation','briefing','execution','follow_up','closed'));

-- 2. Create index on lifecycle_stage for filtering queries
CREATE INDEX idx_engagement_dossiers_lifecycle_stage
ON engagement_dossiers(lifecycle_stage);

-- 3. Create lifecycle_transitions audit table
CREATE TABLE lifecycle_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagement_dossiers(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL CHECK (to_stage IN ('intake','preparation','briefing','execution','follow_up','closed')),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  note TEXT,
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_in_stage_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create indexes on lifecycle_transitions
CREATE INDEX idx_lifecycle_transitions_engagement_id
ON lifecycle_transitions(engagement_id);

CREATE INDEX idx_lifecycle_transitions_to_stage
ON lifecycle_transitions(to_stage);

CREATE INDEX idx_lifecycle_transitions_user_id
ON lifecycle_transitions(user_id);

-- 5. Create trigger function to compute duration_in_stage_seconds
CREATE OR REPLACE FUNCTION compute_lifecycle_duration()
RETURNS TRIGGER AS $$
DECLARE
  prev_transition RECORD;
BEGIN
  -- Find the most recent transition for this engagement
  SELECT transitioned_at INTO prev_transition
  FROM lifecycle_transitions
  WHERE engagement_id = NEW.engagement_id
  ORDER BY transitioned_at DESC
  LIMIT 1;

  -- If a previous transition exists, compute duration
  IF FOUND THEN
    NEW.duration_in_stage_seconds := EXTRACT(EPOCH FROM (NEW.transitioned_at - prev_transition.transitioned_at))::INTEGER;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Attach trigger
CREATE TRIGGER trg_compute_lifecycle_duration
BEFORE INSERT ON lifecycle_transitions
FOR EACH ROW
EXECUTE FUNCTION compute_lifecycle_duration();

-- 7. Enable RLS on lifecycle_transitions
ALTER TABLE lifecycle_transitions ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies following engagement_participants pattern
-- SELECT: authenticated users can read transitions for engagements in their org
CREATE POLICY lifecycle_transitions_select ON lifecycle_transitions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM engagement_dossiers ed
    JOIN dossiers d ON d.id = ed.dossier_id
    WHERE ed.id = lifecycle_transitions.engagement_id
    AND d.org_id = (SELECT org_id FROM profiles WHERE user_id = auth.uid())
  )
);

-- INSERT: authenticated users can create transitions
CREATE POLICY lifecycle_transitions_insert ON lifecycle_transitions
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM engagement_dossiers ed
    JOIN dossiers d ON d.id = ed.dossier_id
    WHERE ed.id = lifecycle_transitions.engagement_id
    AND d.org_id = (SELECT org_id FROM profiles WHERE user_id = auth.uid())
  )
);

-- UPDATE: only the transition creator or admin
CREATE POLICY lifecycle_transitions_update ON lifecycle_transitions
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- DELETE: only admin
CREATE POLICY lifecycle_transitions_delete ON lifecycle_transitions
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);
