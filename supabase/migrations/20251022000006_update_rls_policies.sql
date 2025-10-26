-- Migration: Update RLS Policies for Unified Dossier Model
-- Feature: 026-unified-dossier-architecture
-- Date: 2025-01-22
-- Description: Clearance-based access control for all tables

-- Enable RLS on all tables
ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossier_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- DOSSIERS RLS POLICIES
DROP POLICY IF EXISTS "Users can view dossiers within clearance" ON dossiers;
CREATE POLICY "Users can view dossiers within clearance"
ON dossiers FOR SELECT
USING (
  sensitivity_level <= (
    SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create dossiers within clearance" ON dossiers;
CREATE POLICY "Users can create dossiers within clearance"
ON dossiers FOR INSERT
WITH CHECK (
  sensitivity_level <= (
    SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update dossiers within clearance" ON dossiers;
CREATE POLICY "Users can update dossiers within clearance"
ON dossiers FOR UPDATE
USING (
  sensitivity_level <= (
    SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  sensitivity_level <= (
    SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid()
  )
);

-- DOSSIER_RELATIONSHIPS RLS POLICIES
DROP POLICY IF EXISTS "Users can view relationships within clearance" ON dossier_relationships;
CREATE POLICY "Users can view relationships within clearance"
ON dossier_relationships FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = source_dossier_id
      AND sensitivity_level <= (SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid())
  )
  AND EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = target_dossier_id
      AND sensitivity_level <= (SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can create relationships within clearance" ON dossier_relationships;
CREATE POLICY "Users can create relationships within clearance"
ON dossier_relationships FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = source_dossier_id
      AND sensitivity_level <= (SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid())
  )
  AND EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = target_dossier_id
      AND sensitivity_level <= (SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid())
  )
);

-- CALENDAR_EVENTS RLS POLICIES
DROP POLICY IF EXISTS "Users can view calendar events within clearance" ON calendar_events;
CREATE POLICY "Users can view calendar events within clearance"
ON calendar_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = dossier_id
      AND sensitivity_level <= (SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can create calendar events within clearance" ON calendar_events;
CREATE POLICY "Users can create calendar events within clearance"
ON calendar_events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = dossier_id
      AND sensitivity_level <= (SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid())
  )
);
