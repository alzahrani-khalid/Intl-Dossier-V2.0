-- Create position_consistency table
CREATE TABLE IF NOT EXISTS position_consistency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thematic_area_id UUID NOT NULL REFERENCES thematic_areas(id) ON DELETE CASCADE,
  consistency_score INTEGER NOT NULL CHECK (consistency_score >= 0 AND consistency_score <= 100),
  positions_analyzed UUID[] NOT NULL,
  conflicts JSONB NOT NULL DEFAULT '[]'::jsonb,
  reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    reconciliation_status IN ('pending', 'in-progress', 'resolved')
  ),
  reconciled_by UUID REFERENCES users(id),
  reconciliation_notes TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure at least 2 positions analyzed
  CONSTRAINT minimum_positions CHECK (
    array_length(positions_analyzed, 1) >= 2
  ),
  -- Ensure reconciliation consistency
  CONSTRAINT reconciliation_consistency CHECK (
    (reconciliation_status = 'resolved' AND reconciled_by IS NOT NULL) OR
    (reconciliation_status != 'resolved')
  )
);

-- Indexes for performance
CREATE INDEX idx_position_consistency_thematic ON position_consistency(thematic_area_id);
CREATE INDEX idx_position_consistency_score ON position_consistency(consistency_score);
CREATE INDEX idx_position_consistency_status ON position_consistency(reconciliation_status) 
  WHERE reconciliation_status != 'resolved';
CREATE INDEX idx_position_consistency_positions ON position_consistency USING gin(positions_analyzed);
CREATE INDEX idx_position_consistency_conflicts ON position_consistency USING gin(conflicts);
CREATE INDEX idx_position_consistency_calculated ON position_consistency(calculated_at DESC);

-- Enable RLS
ALTER TABLE position_consistency ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY position_consistency_select ON position_consistency
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'analyst', 'manager', 'viewer')
    )
  );

CREATE POLICY position_consistency_insert ON position_consistency
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'analyst')
    )
  );

CREATE POLICY position_consistency_update ON position_consistency
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'analyst', 'manager')
    )
  );

-- Function to analyze position consistency
CREATE OR REPLACE FUNCTION analyze_position_consistency(
  p_thematic_area_id UUID
) RETURNS UUID AS $$
DECLARE
  v_positions UUID[];
  v_conflicts JSONB := '[]'::jsonb;
  v_consistency_score INTEGER;
  v_result_id UUID;
  v_position1 RECORD;
  v_position2 RECORD;
  v_conflict JSONB;
BEGIN
  -- Get all active positions for the thematic area
  SELECT array_agg(id) INTO v_positions
  FROM positions
  WHERE thematic_area_id = p_thematic_area_id
  AND status = 'approved'
  AND (expiry_date IS NULL OR expiry_date > NOW());
  
  IF array_length(v_positions, 1) < 2 THEN
    RAISE EXCEPTION 'Insufficient positions for analysis';
  END IF;
  
  -- Analyze pairs of positions for conflicts
  FOR i IN 1..array_length(v_positions, 1) - 1 LOOP
    FOR j IN (i + 1)..array_length(v_positions, 1) LOOP
      SELECT * INTO v_position1 FROM positions WHERE id = v_positions[i];
      SELECT * INTO v_position2 FROM positions WHERE id = v_positions[j];
      
      -- Simplified conflict detection (would use NLP in production)
      IF v_position1.version != v_position2.version THEN
        v_conflict = jsonb_build_object(
          'position1_id', v_positions[i],
          'position2_id', v_positions[j],
          'conflict_type', 'outdated',
          'description', 'Version mismatch between positions',
          'severity', 'low',
          'detected_at', NOW()
        );
        v_conflicts = v_conflicts || v_conflict;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Calculate consistency score
  v_consistency_score = CASE 
    WHEN jsonb_array_length(v_conflicts) = 0 THEN 100
    ELSE GREATEST(0, 100 - (jsonb_array_length(v_conflicts) * 10))
  END;
  
  -- Insert analysis result
  INSERT INTO position_consistency (
    thematic_area_id,
    consistency_score,
    positions_analyzed,
    conflicts,
    reconciliation_status,
    calculated_at
  ) VALUES (
    p_thematic_area_id,
    v_consistency_score,
    v_positions,
    v_conflicts,
    CASE 
      WHEN jsonb_array_length(v_conflicts) = 0 THEN 'resolved'
      ELSE 'pending'
    END,
    NOW()
  ) RETURNING id INTO v_result_id;
  
  RETURN v_result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reconcile conflicts
CREATE OR REPLACE FUNCTION reconcile_position_conflict(
  p_consistency_id UUID,
  p_conflict_index INTEGER,
  p_resolution TEXT,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_consistency position_consistency%ROWTYPE;
  v_conflicts JSONB;
  v_conflict JSONB;
BEGIN
  SELECT * INTO v_consistency
  FROM position_consistency
  WHERE id = p_consistency_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  v_conflicts = v_consistency.conflicts;
  
  IF p_conflict_index >= 0 AND p_conflict_index < jsonb_array_length(v_conflicts) THEN
    v_conflict = v_conflicts->p_conflict_index;
    v_conflict = v_conflict || jsonb_build_object(
      'resolved_at', NOW(),
      'resolved_by', p_user_id,
      'resolution', p_resolution
    );
    
    v_conflicts = jsonb_set(
      v_conflicts,
      ARRAY[p_conflict_index::text],
      v_conflict
    );
    
    -- Check if all conflicts are resolved
    DECLARE
      v_all_resolved BOOLEAN := TRUE;
      v_item JSONB;
    BEGIN
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_conflicts)
      LOOP
        IF v_item->>'resolved_at' IS NULL THEN
          v_all_resolved = FALSE;
          EXIT;
        END IF;
      END LOOP;
      
      UPDATE position_consistency
      SET 
        conflicts = v_conflicts,
        reconciliation_status = CASE 
          WHEN v_all_resolved THEN 'resolved'
          ELSE 'in-progress'
        END,
        reconciled_by = CASE
          WHEN v_all_resolved THEN p_user_id
          ELSE reconciled_by
        END,
        updated_at = NOW()
      WHERE id = p_consistency_id;
    END;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_position_consistency_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_position_consistency_timestamp_trigger
  BEFORE UPDATE ON position_consistency
  FOR EACH ROW
  EXECUTE FUNCTION update_position_consistency_timestamp();