-- =============================================
-- Legislation Tracking System
-- Feature: Track legislation, regulatory proposals, and policy issues
-- through their lifecycle with status tracking, sponsor information,
-- amendment history, and deadline alerts.
-- =============================================

-- =============================================
-- PART 1: ENUMS
-- =============================================

-- Legislation type enum
CREATE TYPE legislation_type AS ENUM (
  'law',
  'regulation',
  'directive',
  'policy',
  'resolution',
  'treaty',
  'amendment',
  'proposal',
  'executive_order',
  'decree',
  'other'
);

-- Legislation status enum (lifecycle stages)
CREATE TYPE legislation_status AS ENUM (
  'draft',
  'proposed',
  'under_review',
  'in_committee',
  'pending_vote',
  'passed',
  'enacted',
  'implemented',
  'superseded',
  'repealed',
  'expired',
  'withdrawn'
);

-- Comment period status
CREATE TYPE comment_period_status AS ENUM (
  'not_started',
  'open',
  'closed',
  'extended'
);

-- Sponsor type enum
CREATE TYPE sponsor_type AS ENUM (
  'primary',
  'co_sponsor',
  'supporter',
  'opponent'
);

-- Amendment status enum
CREATE TYPE amendment_status AS ENUM (
  'proposed',
  'under_review',
  'approved',
  'rejected',
  'incorporated',
  'withdrawn'
);

-- Deadline type enum
CREATE TYPE legislation_deadline_type AS ENUM (
  'comment_period_start',
  'comment_period_end',
  'review_deadline',
  'vote_date',
  'effective_date',
  'implementation_deadline',
  'reporting_deadline',
  'compliance_deadline',
  'expiration_date',
  'other'
);

-- Alert status enum
CREATE TYPE deadline_alert_status AS ENUM (
  'pending',
  'sent',
  'acknowledged',
  'snoozed',
  'dismissed'
);

-- =============================================
-- PART 2: CORE LEGISLATION TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS legislations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information (Bilingual)
  title_en TEXT NOT NULL,
  title_ar TEXT,
  short_title_en TEXT,
  short_title_ar TEXT,
  summary_en TEXT,
  summary_ar TEXT,
  description_en TEXT,
  description_ar TEXT,

  -- Classification
  type legislation_type NOT NULL DEFAULT 'law',
  status legislation_status NOT NULL DEFAULT 'draft',

  -- Reference Information
  reference_number TEXT, -- e.g., "H.R. 1234", "EU Directive 2025/123"
  jurisdiction TEXT, -- e.g., "Saudi Arabia", "European Union", "United States"
  issuing_body TEXT, -- e.g., "Ministry of Commerce", "European Parliament"
  issuing_body_ar TEXT,

  -- Priority & Impact
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  impact_level TEXT DEFAULT 'medium' CHECK (impact_level IN ('minimal', 'low', 'medium', 'high', 'transformational')),
  impact_summary_en TEXT,
  impact_summary_ar TEXT,

  -- Key Dates
  introduced_date DATE,
  last_action_date DATE,
  effective_date DATE,
  expiration_date DATE,

  -- Comment Period
  comment_period_status comment_period_status DEFAULT 'not_started',
  comment_period_start DATE,
  comment_period_end DATE,
  comment_instructions_en TEXT,
  comment_instructions_ar TEXT,
  comment_submission_url TEXT,

  -- Source & Links
  source_url TEXT,
  official_text_url TEXT,

  -- Tags and Categories
  tags TEXT[] DEFAULT '{}',
  sectors TEXT[] DEFAULT '{}', -- Affected sectors/industries
  keywords TEXT[] DEFAULT '{}',

  -- Related Entities
  dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,
  parent_legislation_id UUID REFERENCES legislations(id) ON DELETE SET NULL,

  -- Version Control
  version INTEGER DEFAULT 1,
  latest_version_notes TEXT,

  -- Full-text Search (updated via trigger)
  search_vector tsvector,

  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft Delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for legislation
CREATE INDEX idx_legislations_type ON legislations(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_legislations_status ON legislations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_legislations_priority ON legislations(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_legislations_jurisdiction ON legislations(jurisdiction) WHERE deleted_at IS NULL;
CREATE INDEX idx_legislations_dossier_id ON legislations(dossier_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_legislations_parent_id ON legislations(parent_legislation_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_legislations_comment_period ON legislations(comment_period_status, comment_period_end) WHERE deleted_at IS NULL;
CREATE INDEX idx_legislations_effective_date ON legislations(effective_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_legislations_search ON legislations USING GIN(search_vector);
CREATE INDEX idx_legislations_tags ON legislations USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_legislations_sectors ON legislations USING GIN(sectors) WHERE deleted_at IS NULL;
CREATE INDEX idx_legislations_created_at ON legislations(created_at DESC) WHERE deleted_at IS NULL;

-- =============================================
-- PART 3: LEGISLATION SPONSORS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS legislation_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislation_id UUID NOT NULL REFERENCES legislations(id) ON DELETE CASCADE,

  -- Sponsor Information (can be linked to a person dossier or freeform)
  person_dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,
  organization_dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,

  -- Freeform sponsor info (when not linked to dossier)
  name_en TEXT,
  name_ar TEXT,
  title_en TEXT, -- e.g., "Senator", "Minister"
  title_ar TEXT,
  affiliation_en TEXT, -- e.g., "Ministry of Commerce"
  affiliation_ar TEXT,

  -- Sponsor Role
  sponsor_type sponsor_type NOT NULL DEFAULT 'primary',
  joined_date DATE,
  notes TEXT,

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique sponsor per legislation
  CONSTRAINT unique_sponsor_per_legislation UNIQUE (legislation_id, person_dossier_id, organization_dossier_id, name_en)
);

-- Indexes for sponsors
CREATE INDEX idx_legislation_sponsors_legislation ON legislation_sponsors(legislation_id);
CREATE INDEX idx_legislation_sponsors_person ON legislation_sponsors(person_dossier_id) WHERE person_dossier_id IS NOT NULL;
CREATE INDEX idx_legislation_sponsors_org ON legislation_sponsors(organization_dossier_id) WHERE organization_dossier_id IS NOT NULL;
CREATE INDEX idx_legislation_sponsors_type ON legislation_sponsors(sponsor_type);

-- =============================================
-- PART 4: LEGISLATION AMENDMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS legislation_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislation_id UUID NOT NULL REFERENCES legislations(id) ON DELETE CASCADE,

  -- Amendment Information (Bilingual)
  amendment_number TEXT, -- e.g., "Amendment 1", "Art. 5 Revision"
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,

  -- Status
  status amendment_status NOT NULL DEFAULT 'proposed',

  -- Dates
  proposed_date DATE,
  review_date DATE,
  decision_date DATE,

  -- Content Changes
  affected_sections TEXT[], -- Which sections/articles are affected
  original_text TEXT,
  proposed_text TEXT,
  final_text TEXT,

  -- Decision Info
  decision_notes_en TEXT,
  decision_notes_ar TEXT,
  decision_by TEXT,

  -- Sponsor
  proposed_by_dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,
  proposed_by_name TEXT,

  -- Version when this amendment was created
  legislation_version INTEGER,

  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for amendments
CREATE INDEX idx_legislation_amendments_legislation ON legislation_amendments(legislation_id);
CREATE INDEX idx_legislation_amendments_status ON legislation_amendments(status);
CREATE INDEX idx_legislation_amendments_proposed_date ON legislation_amendments(proposed_date DESC);

-- =============================================
-- PART 5: LEGISLATION STATUS HISTORY TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS legislation_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislation_id UUID NOT NULL REFERENCES legislations(id) ON DELETE CASCADE,

  -- Status Change
  from_status legislation_status,
  to_status legislation_status NOT NULL,

  -- Details
  change_reason TEXT,
  change_notes_en TEXT,
  change_notes_ar TEXT,

  -- Related Data (snapshot at time of change)
  legislation_snapshot JSONB,

  -- Audit Fields
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for status history
CREATE INDEX idx_legislation_status_history_legislation ON legislation_status_history(legislation_id);
CREATE INDEX idx_legislation_status_history_changed_at ON legislation_status_history(changed_at DESC);
CREATE INDEX idx_legislation_status_history_to_status ON legislation_status_history(to_status);

-- =============================================
-- PART 6: LEGISLATION DEADLINES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS legislation_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislation_id UUID NOT NULL REFERENCES legislations(id) ON DELETE CASCADE,

  -- Deadline Information (Bilingual)
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,

  -- Type and Date
  deadline_type legislation_deadline_type NOT NULL,
  deadline_date DATE NOT NULL,
  deadline_time TIME, -- Optional specific time
  timezone TEXT DEFAULT 'UTC',

  -- Status
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Alert Configuration
  alert_days_before INTEGER[] DEFAULT '{7, 3, 1}', -- Days before to send alerts
  alert_enabled BOOLEAN DEFAULT TRUE,

  -- Priority
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Linked Action Items
  linked_commitment_id UUID, -- Can link to commitment system

  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for deadlines
CREATE INDEX idx_legislation_deadlines_legislation ON legislation_deadlines(legislation_id);
CREATE INDEX idx_legislation_deadlines_date ON legislation_deadlines(deadline_date) WHERE NOT is_completed;
CREATE INDEX idx_legislation_deadlines_type ON legislation_deadlines(deadline_type);
CREATE INDEX idx_legislation_deadlines_priority ON legislation_deadlines(priority) WHERE NOT is_completed;

-- =============================================
-- PART 7: DEADLINE ALERTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS legislation_deadline_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deadline_id UUID NOT NULL REFERENCES legislation_deadlines(id) ON DELETE CASCADE,
  legislation_id UUID NOT NULL REFERENCES legislations(id) ON DELETE CASCADE,

  -- Alert Information
  alert_date DATE NOT NULL,
  days_before INTEGER NOT NULL,

  -- Recipients
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status
  status deadline_alert_status DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Notification Type
  notification_type TEXT DEFAULT 'in_app' CHECK (notification_type IN ('email', 'in_app', 'both')),

  -- Delivery Info
  delivery_error TEXT,

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for alerts
CREATE INDEX idx_legislation_deadline_alerts_deadline ON legislation_deadline_alerts(deadline_id);
CREATE INDEX idx_legislation_deadline_alerts_legislation ON legislation_deadline_alerts(legislation_id);
CREATE INDEX idx_legislation_deadline_alerts_recipient ON legislation_deadline_alerts(recipient_user_id);
CREATE INDEX idx_legislation_deadline_alerts_status ON legislation_deadline_alerts(status) WHERE status = 'pending';
CREATE INDEX idx_legislation_deadline_alerts_date ON legislation_deadline_alerts(alert_date) WHERE status = 'pending';

-- =============================================
-- PART 8: LEGISLATION WATCHERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS legislation_watchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislation_id UUID NOT NULL REFERENCES legislations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Watch Preferences
  notify_on_status_change BOOLEAN DEFAULT TRUE,
  notify_on_amendment BOOLEAN DEFAULT TRUE,
  notify_on_deadline BOOLEAN DEFAULT TRUE,
  notify_on_comment_period BOOLEAN DEFAULT TRUE,

  -- Notification Preferences
  notification_type TEXT DEFAULT 'in_app' CHECK (notification_type IN ('email', 'in_app', 'both')),

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_watcher_per_legislation UNIQUE (legislation_id, user_id)
);

-- Indexes for watchers
CREATE INDEX idx_legislation_watchers_legislation ON legislation_watchers(legislation_id);
CREATE INDEX idx_legislation_watchers_user ON legislation_watchers(user_id);

-- =============================================
-- PART 9: RELATED LEGISLATIONS TABLE (Many-to-Many)
-- =============================================

CREATE TABLE IF NOT EXISTS related_legislations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislation_id UUID NOT NULL REFERENCES legislations(id) ON DELETE CASCADE,
  related_legislation_id UUID NOT NULL REFERENCES legislations(id) ON DELETE CASCADE,

  -- Relationship Type
  relationship_type TEXT NOT NULL DEFAULT 'related' CHECK (
    relationship_type IN ('related', 'supersedes', 'superseded_by', 'implements', 'implemented_by', 'amends', 'amended_by', 'replaces', 'replaced_by', 'references', 'referenced_by')
  ),

  -- Notes
  notes TEXT,

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_related_legislation UNIQUE (legislation_id, related_legislation_id, relationship_type),
  CONSTRAINT no_self_reference CHECK (legislation_id != related_legislation_id)
);

-- Indexes for related legislations
CREATE INDEX idx_related_legislations_legislation ON related_legislations(legislation_id);
CREATE INDEX idx_related_legislations_related ON related_legislations(related_legislation_id);
CREATE INDEX idx_related_legislations_type ON related_legislations(relationship_type);

-- =============================================
-- PART 10: TRIGGERS
-- =============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_legislation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_legislation_updated_at
  BEFORE UPDATE ON legislations
  FOR EACH ROW
  EXECUTE FUNCTION update_legislation_updated_at();

CREATE TRIGGER trigger_update_legislation_sponsors_updated_at
  BEFORE UPDATE ON legislation_sponsors
  FOR EACH ROW
  EXECUTE FUNCTION update_legislation_updated_at();

CREATE TRIGGER trigger_update_legislation_amendments_updated_at
  BEFORE UPDATE ON legislation_amendments
  FOR EACH ROW
  EXECUTE FUNCTION update_legislation_updated_at();

CREATE TRIGGER trigger_update_legislation_deadlines_updated_at
  BEFORE UPDATE ON legislation_deadlines
  FOR EACH ROW
  EXECUTE FUNCTION update_legislation_updated_at();

CREATE TRIGGER trigger_update_legislation_deadline_alerts_updated_at
  BEFORE UPDATE ON legislation_deadline_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_legislation_updated_at();

-- Trigger to increment version on update
CREATE OR REPLACE FUNCTION increment_legislation_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.title_en IS DISTINCT FROM NEW.title_en OR
     OLD.summary_en IS DISTINCT FROM NEW.summary_en OR
     OLD.description_en IS DISTINCT FROM NEW.description_en OR
     OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_legislation_version
  BEFORE UPDATE ON legislations
  FOR EACH ROW
  EXECUTE FUNCTION increment_legislation_version();

-- Trigger to record status history
CREATE OR REPLACE FUNCTION record_legislation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO legislation_status_history (
      legislation_id,
      from_status,
      to_status,
      changed_by,
      legislation_snapshot
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.updated_by,
      jsonb_build_object(
        'title_en', NEW.title_en,
        'reference_number', NEW.reference_number,
        'version', NEW.version
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_legislation_status_change
  AFTER UPDATE ON legislations
  FOR EACH ROW
  EXECUTE FUNCTION record_legislation_status_change();

-- Trigger to update search_vector (replaces GENERATED column due to immutability requirement)
CREATE OR REPLACE FUNCTION update_legislation_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title_en, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_title_en, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.reference_number, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary_en, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description_en, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_legislation_search_vector
  BEFORE INSERT OR UPDATE ON legislations
  FOR EACH ROW
  EXECUTE FUNCTION update_legislation_search_vector();

-- =============================================
-- PART 11: RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE legislations ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislation_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislation_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislation_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislation_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislation_deadline_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislation_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE related_legislations ENABLE ROW LEVEL SECURITY;

-- Legislations policies
CREATE POLICY "Users can view non-deleted legislations"
  ON legislations FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create legislations"
  ON legislations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update legislations they created"
  ON legislations FOR UPDATE
  USING (auth.uid() = created_by OR auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role IN ('admin', 'manager')
  ));

CREATE POLICY "Admins can delete legislations"
  ON legislations FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  ));

-- Sponsors policies
CREATE POLICY "Users can view legislation sponsors"
  ON legislation_sponsors FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can manage sponsors"
  ON legislation_sponsors FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Amendments policies
CREATE POLICY "Users can view amendments"
  ON legislation_amendments FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can manage amendments"
  ON legislation_amendments FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Status history policies
CREATE POLICY "Users can view status history"
  ON legislation_status_history FOR SELECT
  USING (TRUE);

-- Deadlines policies
CREATE POLICY "Users can view deadlines"
  ON legislation_deadlines FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can manage deadlines"
  ON legislation_deadlines FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Alerts policies
CREATE POLICY "Users can view their own alerts"
  ON legislation_deadline_alerts FOR SELECT
  USING (recipient_user_id = auth.uid());

CREATE POLICY "System can manage alerts"
  ON legislation_deadline_alerts FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Watchers policies
CREATE POLICY "Users can view their own watches"
  ON legislation_watchers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own watches"
  ON legislation_watchers FOR ALL
  USING (user_id = auth.uid());

-- Related legislations policies
CREATE POLICY "Users can view related legislations"
  ON related_legislations FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can manage relations"
  ON related_legislations FOR ALL
  USING (auth.uid() IS NOT NULL);

-- =============================================
-- PART 12: UTILITY FUNCTIONS
-- =============================================

-- Function to get upcoming deadlines for a user
CREATE OR REPLACE FUNCTION get_user_legislation_deadlines(
  p_user_id UUID,
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
  deadline_id UUID,
  legislation_id UUID,
  legislation_title TEXT,
  deadline_title TEXT,
  deadline_type legislation_deadline_type,
  deadline_date DATE,
  priority TEXT,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ld.id,
    l.id,
    l.title_en,
    ld.title_en,
    ld.deadline_type,
    ld.deadline_date,
    ld.priority,
    (ld.deadline_date - CURRENT_DATE)::INTEGER
  FROM legislation_deadlines ld
  JOIN legislations l ON l.id = ld.legislation_id
  JOIN legislation_watchers lw ON lw.legislation_id = l.id
  WHERE lw.user_id = p_user_id
    AND lw.notify_on_deadline = TRUE
    AND ld.is_completed = FALSE
    AND ld.deadline_date >= CURRENT_DATE
    AND ld.deadline_date <= CURRENT_DATE + p_days_ahead
    AND l.deleted_at IS NULL
  ORDER BY ld.deadline_date ASC, ld.priority DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get legislations with open comment periods
CREATE OR REPLACE FUNCTION get_open_comment_periods()
RETURNS TABLE (
  legislation_id UUID,
  title_en TEXT,
  title_ar TEXT,
  reference_number TEXT,
  comment_period_start DATE,
  comment_period_end DATE,
  days_remaining INTEGER,
  jurisdiction TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title_en,
    l.title_ar,
    l.reference_number,
    l.comment_period_start,
    l.comment_period_end,
    (l.comment_period_end - CURRENT_DATE)::INTEGER,
    l.jurisdiction
  FROM legislations l
  WHERE l.comment_period_status = 'open'
    AND l.comment_period_end >= CURRENT_DATE
    AND l.deleted_at IS NULL
  ORDER BY l.comment_period_end ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search legislations
CREATE OR REPLACE FUNCTION search_legislations(
  p_search_query TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  legislation_id UUID,
  title_en TEXT,
  title_ar TEXT,
  reference_number TEXT,
  type legislation_type,
  status legislation_status,
  jurisdiction TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title_en,
    l.title_ar,
    l.reference_number,
    l.type,
    l.status,
    l.jurisdiction,
    ts_rank(l.search_vector, websearch_to_tsquery('english', p_search_query))
  FROM legislations l
  WHERE l.search_vector @@ websearch_to_tsquery('english', p_search_query)
    AND l.deleted_at IS NULL
  ORDER BY ts_rank(l.search_vector, websearch_to_tsquery('english', p_search_query)) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PART 13: GRANT PERMISSIONS
-- =============================================

GRANT SELECT ON legislations TO authenticated;
GRANT INSERT, UPDATE ON legislations TO authenticated;
GRANT SELECT ON legislation_sponsors TO authenticated;
GRANT INSERT, UPDATE, DELETE ON legislation_sponsors TO authenticated;
GRANT SELECT ON legislation_amendments TO authenticated;
GRANT INSERT, UPDATE ON legislation_amendments TO authenticated;
GRANT SELECT ON legislation_status_history TO authenticated;
GRANT SELECT ON legislation_deadlines TO authenticated;
GRANT INSERT, UPDATE, DELETE ON legislation_deadlines TO authenticated;
GRANT SELECT, UPDATE ON legislation_deadline_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON legislation_watchers TO authenticated;
GRANT SELECT ON related_legislations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON related_legislations TO authenticated;

GRANT EXECUTE ON FUNCTION get_user_legislation_deadlines TO authenticated;
GRANT EXECUTE ON FUNCTION get_open_comment_periods TO authenticated;
GRANT EXECUTE ON FUNCTION search_legislations TO authenticated;
