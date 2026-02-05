-- ============================================================================
-- Migration: Performance Indexes
-- Date: 2026-02-06
-- Feature: use-case-repository
-- Description: Additional performance indexes for high-traffic queries
-- ============================================================================

-- Note: Most indexes were already created inline in each migration.
-- This migration adds composite indexes and indexes for common query patterns.

-- ============================================================================
-- PART 1: Composite indexes for common query patterns
-- ============================================================================

-- Correspondence queries by direction and status
CREATE INDEX IF NOT EXISTS idx_intake_direction_status
  ON intake_tickets(direction, status)
  WHERE direction IS NOT NULL;

-- Correspondence queries by action category and deadline
CREATE INDEX IF NOT EXISTS idx_intake_action_deadline
  ON intake_tickets(action_category, external_deadline)
  WHERE action_category IS NOT NULL AND external_deadline IS NOT NULL;

-- MoU queries by lifecycle stage and parties
CREATE INDEX IF NOT EXISTS idx_mous_lifecycle_dates
  ON mous(lifecycle_stage, effective_date, expiry_date)
  WHERE lifecycle_stage NOT IN ('expired', 'terminated');

-- Forum session side events by date and status
CREATE INDEX IF NOT EXISTS idx_side_events_session_date_status
  ON side_events(session_id, scheduled_date, status)
  WHERE deleted_at IS NULL;

-- Agenda items by session and status for dashboard
CREATE INDEX IF NOT EXISTS idx_agenda_session_status
  ON forum_agenda_items(session_id, status)
  WHERE deleted_at IS NULL;

-- Committee members by status for active roster
CREATE INDEX IF NOT EXISTS idx_committee_members_active_role
  ON committee_members(committee_id, role, status)
  WHERE is_current = true AND status = 'active';

-- Award submissions by status and score for ranking
CREATE INDEX IF NOT EXISTS idx_submissions_track_status_score
  ON award_submissions(track_id, status, total_score DESC NULLS LAST)
  WHERE status NOT IN ('draft', 'withdrawn', 'disqualified');

-- Organization contacts by type and active status
CREATE INDEX IF NOT EXISTS idx_org_contacts_type_active
  ON organization_contacts(organization_id, contact_type, is_primary)
  WHERE is_active = true AND deleted_at IS NULL;

-- ============================================================================
-- PART 2: Partial indexes for specific scenarios
-- ============================================================================

-- Only pending nominations (most common query)
CREATE INDEX IF NOT EXISTS idx_nominations_pending_by_committee
  ON committee_nominations(committee_id, nomination_date DESC)
  WHERE status = 'pending';

-- Only current leaders per organization
CREATE INDEX IF NOT EXISTS idx_leadership_current_by_org
  ON organization_leadership(organization_id, position_level)
  WHERE is_current = true AND deleted_at IS NULL;

-- Only active staff with delegations
CREATE INDEX IF NOT EXISTS idx_staff_with_delegation
  ON staff_contacts(delegates_to_id, delegation_end)
  WHERE delegates_to_id IS NOT NULL AND delegation_end >= CURRENT_DATE;

-- Only open award tracks (accepting submissions)
CREATE INDEX IF NOT EXISTS idx_tracks_accepting_submissions
  ON award_tracks(award_id, submission_deadline)
  WHERE is_active = true AND submission_deadline >= CURRENT_DATE;

-- Only incomplete logistics items
CREATE INDEX IF NOT EXISTS idx_logistics_incomplete
  ON event_logistics(event_id, deadline)
  WHERE status NOT IN ('confirmed', 'completed', 'cancelled');

-- ============================================================================
-- PART 3: Expression indexes for common lookups
-- ============================================================================

-- Case-insensitive email lookup for contacts
CREATE INDEX IF NOT EXISTS idx_org_contacts_email_lower
  ON organization_contacts(LOWER(email))
  WHERE email IS NOT NULL;

-- Case-insensitive email lookup for staff
CREATE INDEX IF NOT EXISTS idx_staff_contacts_email_lower
  ON staff_contacts(LOWER(email));

-- Year-based filtering for government decisions
CREATE INDEX IF NOT EXISTS idx_govt_decisions_year
  ON government_decisions(EXTRACT(YEAR FROM decision_date), decision_type)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- PART 4: BRIN indexes for time-series data
-- ============================================================================

-- Term usage log is append-only and time-ordered
CREATE INDEX IF NOT EXISTS idx_term_usage_brin
  ON term_usage_log USING brin(used_at);

-- Submission reviews are created in chronological order
CREATE INDEX IF NOT EXISTS idx_submission_reviews_brin
  ON submission_reviews USING brin(created_at);

-- ============================================================================
-- PART 5: Hash indexes for equality lookups
-- ============================================================================

-- Note: Hash indexes are useful for pure equality queries
-- PostgreSQL 10+ makes them crash-safe and usable

-- Terminology domain lookup (frequently filtered by exact domain)
CREATE INDEX IF NOT EXISTS idx_terminology_domain_hash
  ON terminology USING hash(domain)
  WHERE is_active = true;

-- Committee type lookup
CREATE INDEX IF NOT EXISTS idx_committees_type_hash
  ON committees USING hash(committee_type)
  WHERE deleted_at IS NULL;

-- Award type lookup
CREATE INDEX IF NOT EXISTS idx_awards_type_hash
  ON awards USING hash(award_type)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- PART 6: Covering indexes for common projections
-- ============================================================================

-- Organization contacts card view (avoid table lookup)
CREATE INDEX IF NOT EXISTS idx_org_contacts_card_view
  ON organization_contacts(organization_id, contact_type, is_primary)
  INCLUDE (name_en, name_ar, title_en, email, phone)
  WHERE is_active = true AND deleted_at IS NULL;

-- Staff directory list (avoid table lookup)
CREATE INDEX IF NOT EXISTS idx_staff_directory_view
  ON staff_contacts(department_id, position_level)
  INCLUDE (name_en, name_ar, title_en, email, phone, extension)
  WHERE is_active = true;

-- Terminology quick lookup
CREATE INDEX IF NOT EXISTS idx_terminology_quick_lookup
  ON terminology(domain, is_approved)
  INCLUDE (term_en, term_ar, abbreviation_en, abbreviation_ar)
  WHERE is_active = true;

-- ============================================================================
-- PART 7: Analyze tables for query planner
-- ============================================================================

-- Analyze all new tables to update statistics
ANALYZE correspondence_participants;
ANALYZE mou_parties;
ANALYZE government_decisions;
ANALYZE decision_affected_entities;
ANALYZE organization_leadership;
ANALYZE organization_contacts;
ANALYZE contact_topics;
ANALYZE forum_agenda_items;
ANALYZE agenda_item_assignments;
ANALYZE side_events;
ANALYZE event_logistics;
ANALYZE side_event_attendees;
ANALYZE committees;
ANALYZE committee_nominations;
ANALYZE committee_members;
ANALYZE awards;
ANALYZE award_tracks;
ANALYZE award_submissions;
ANALYZE submission_reviews;
ANALYZE departments;
ANALYZE staff_contacts;
ANALYZE staff_topic_assignments;
ANALYZE terminology;
ANALYZE term_translations;
ANALYZE term_usage_log;

-- ============================================================================
-- Migration Complete
-- ============================================================================
