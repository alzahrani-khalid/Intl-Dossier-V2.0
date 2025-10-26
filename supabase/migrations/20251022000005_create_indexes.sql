-- Migration: Create Performance Indexes
-- Feature: 026-unified-dossier-architecture
-- Date: 2025-01-22
-- Description: Indexes for optimal query performance

-- DOSSIERS INDEXES
CREATE INDEX IF NOT EXISTS idx_dossiers_type_status ON dossiers(type, status);
CREATE INDEX IF NOT EXISTS idx_dossiers_search_vector ON dossiers USING GiST(search_vector);
CREATE INDEX IF NOT EXISTS idx_dossiers_sensitivity ON dossiers(sensitivity_level);
CREATE INDEX IF NOT EXISTS idx_dossiers_type_status_sensitivity ON dossiers(type, status, sensitivity_level);
CREATE INDEX IF NOT EXISTS idx_dossiers_created_at ON dossiers(created_at);
CREATE INDEX IF NOT EXISTS idx_dossiers_updated_at ON dossiers(updated_at);

-- COUNTRIES INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS idx_countries_iso2 ON countries(iso_code_2);
CREATE UNIQUE INDEX IF NOT EXISTS idx_countries_iso3 ON countries(iso_code_3);
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region);

-- ORGANIZATIONS INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_code ON organizations(org_code) WHERE org_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(org_type);
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON organizations(parent_org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_country ON organizations(headquarters_country_id);

-- ENGAGEMENTS INDEXES
CREATE INDEX IF NOT EXISTS idx_engagements_type ON engagements(engagement_type);
CREATE INDEX IF NOT EXISTS idx_engagements_category ON engagements(engagement_category);

-- THEMES INDEXES
CREATE INDEX IF NOT EXISTS idx_themes_category ON themes(theme_category);
CREATE INDEX IF NOT EXISTS idx_themes_parent ON themes(parent_theme_id);

-- WORKING GROUPS INDEXES
CREATE INDEX IF NOT EXISTS idx_wg_lead_org ON working_groups(lead_org_id);
CREATE INDEX IF NOT EXISTS idx_wg_status ON working_groups(wg_status);

-- PERSONS INDEXES
CREATE INDEX IF NOT EXISTS idx_persons_org ON persons(organization_id);
CREATE INDEX IF NOT EXISTS idx_persons_country ON persons(nationality_country_id);

-- DOSSIER_RELATIONSHIPS INDEXES
CREATE INDEX IF NOT EXISTS idx_relationships_source ON dossier_relationships(source_dossier_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_relationships_target ON dossier_relationships(target_dossier_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_relationships_type ON dossier_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_temporal ON dossier_relationships(effective_from, effective_to) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_relationships_source_type ON dossier_relationships(source_dossier_id, relationship_type) WHERE status = 'active';

-- CALENDAR_EVENTS INDEXES
CREATE INDEX IF NOT EXISTS idx_calendar_dossier ON calendar_events(dossier_id);
CREATE INDEX IF NOT EXISTS idx_calendar_datetime ON calendar_events(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_calendar_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_dossier_datetime ON calendar_events(dossier_id, start_datetime);

-- EVENT_PARTICIPANTS INDEXES
CREATE INDEX IF NOT EXISTS idx_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_type_id ON event_participants(participant_type, participant_id);
