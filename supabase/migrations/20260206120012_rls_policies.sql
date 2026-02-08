-- ============================================================================
-- Migration: RLS Policies for New Tables
-- Date: 2026-02-06
-- Feature: use-case-repository
-- Description: Row Level Security policies for all new tables
-- ============================================================================

-- Note: Most RLS policies were already created inline in each migration.
-- This migration adds any missing policies and ensures consistency.

-- ============================================================================
-- PART 1: Verify RLS is enabled on all new tables
-- ============================================================================

-- Enable RLS on any tables that might have been missed
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'correspondence_participants',
    'mou_parties',
    'government_decisions',
    'decision_affected_entities',
    'organization_leadership',
    'organization_contacts',
    'contact_topics',
    'forum_agenda_items',
    'agenda_item_assignments',
    'side_events',
    'event_logistics',
    'side_event_attendees',
    'committees',
    'committee_nominations',
    'committee_members',
    'awards',
    'award_tracks',
    'award_submissions',
    'submission_reviews',
    'departments',
    'staff_contacts',
    'staff_topic_assignments',
    'terminology',
    'term_translations',
    'term_usage_log'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ============================================================================
-- PART 2: Service role bypass policies
-- ============================================================================

-- Service role should have full access to all tables for admin operations
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'correspondence_participants',
    'mou_parties',
    'government_decisions',
    'decision_affected_entities',
    'organization_leadership',
    'organization_contacts',
    'contact_topics',
    'forum_agenda_items',
    'agenda_item_assignments',
    'side_events',
    'event_logistics',
    'side_event_attendees',
    'committees',
    'committee_nominations',
    'committee_members',
    'awards',
    'award_tracks',
    'award_submissions',
    'submission_reviews',
    'departments',
    'staff_contacts',
    'staff_topic_assignments',
    'terminology',
    'term_translations',
    'term_usage_log'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    -- Drop existing service role policy if exists
    EXECUTE format('DROP POLICY IF EXISTS "Service role bypass" ON %I', t);
    -- Create service role bypass policy
    EXECUTE format(
      'CREATE POLICY "Service role bypass" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

-- ============================================================================
-- PART 3: Additional read-only policies for anon role (public data)
-- ============================================================================

-- Public terminology should be readable by anonymous users
DROP POLICY IF EXISTS "Anon can view approved terminology" ON terminology;
CREATE POLICY "Anon can view approved terminology"
  ON terminology FOR SELECT
  TO anon
  USING (is_active = true AND is_approved = true);

-- Public awards should be readable
DROP POLICY IF EXISTS "Anon can view active awards" ON awards;
CREATE POLICY "Anon can view active awards"
  ON awards FOR SELECT
  TO anon
  USING (is_active = true AND deleted_at IS NULL);

-- Public award tracks
DROP POLICY IF EXISTS "Anon can view active tracks" ON award_tracks;
CREATE POLICY "Anon can view active tracks"
  ON award_tracks FOR SELECT
  TO anon
  USING (is_active = true);

-- Public committees (if marked public)
DROP POLICY IF EXISTS "Anon can view public committees" ON committees;
CREATE POLICY "Anon can view public committees"
  ON committees FOR SELECT
  TO anon
  USING (is_public = true AND status = 'active' AND deleted_at IS NULL);

-- Public side events
DROP POLICY IF EXISTS "Anon can view public side events" ON side_events;
CREATE POLICY "Anon can view public side events"
  ON side_events FOR SELECT
  TO anon
  USING (is_public = true AND status IN ('confirmed', 'completed') AND deleted_at IS NULL);

-- ============================================================================
-- PART 4: Clearance-based policies for sensitive data
-- ============================================================================

-- Helper function to check user clearance level (if not exists)
CREATE OR REPLACE FUNCTION get_user_clearance()
RETURNS INTEGER AS $$
DECLARE
  clearance INTEGER;
BEGIN
  SELECT clearance_level INTO clearance
  FROM profiles
  WHERE user_id = auth.uid();

  RETURN COALESCE(clearance, 1); -- Default to lowest clearance
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Government decisions with sensitivity filtering
DROP POLICY IF EXISTS "View government decisions by clearance" ON government_decisions;
CREATE POLICY "View government decisions by clearance"
  ON government_decisions FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      sensitivity_level = 'public'
      OR (
        auth.uid() IS NOT NULL
        AND (
          sensitivity_level = 'internal'
          OR (sensitivity_level = 'confidential' AND get_user_clearance() >= 2)
          OR (sensitivity_level = 'secret' AND get_user_clearance() >= 3)
        )
      )
    )
  );

-- ============================================================================
-- PART 5: Department-based access for internal data
-- ============================================================================

-- Staff contacts - users can only see their own department or all if admin
-- (simplified version - full implementation would check department membership)
DROP POLICY IF EXISTS "Staff view own department" ON staff_contacts;
CREATE POLICY "Staff view own department"
  ON staff_contacts FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND is_active = true
  );

-- Staff topic assignments - similar pattern
DROP POLICY IF EXISTS "Staff view topic assignments" ON staff_topic_assignments;
CREATE POLICY "Staff view topic assignments"
  ON staff_topic_assignments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PART 6: Grants for new tables
-- ============================================================================

-- Ensure authenticated role has appropriate permissions
GRANT SELECT, INSERT, UPDATE ON correspondence_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON mou_parties TO authenticated;
GRANT SELECT, INSERT, UPDATE ON government_decisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON decision_affected_entities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON organization_leadership TO authenticated;
GRANT SELECT, INSERT, UPDATE ON organization_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON contact_topics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON forum_agenda_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agenda_item_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON side_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_logistics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON side_event_attendees TO authenticated;
GRANT SELECT, INSERT, UPDATE ON committees TO authenticated;
GRANT SELECT, INSERT, UPDATE ON committee_nominations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON committee_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON awards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON award_tracks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON award_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON submission_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_topic_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON terminology TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON term_translations TO authenticated;
GRANT SELECT, INSERT ON term_usage_log TO authenticated;

-- Anonymous role gets read-only access to public data
GRANT SELECT ON terminology TO anon;
GRANT SELECT ON awards TO anon;
GRANT SELECT ON award_tracks TO anon;
GRANT SELECT ON committees TO anon;
GRANT SELECT ON side_events TO anon;

-- ============================================================================
-- Migration Complete
-- ============================================================================
