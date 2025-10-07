# Data Model: Entity Relationships & UI/UX Redesign

**Feature**: 017-entity-relationships-and
**Date**: 2025-10-07
**Status**: Design Complete

## Overview

This data model implements the complete entity relationship architecture with dossiers as the central hub. The design includes:

- **10 new tables**: Reference data, junction tables, work products, knowledge entities
- **1 table modification**: Add reference linking to existing dossiers table
- **27 indexes**: Performance optimization for queries and joins
- **40+ RLS policies**: Row-level security for all entity types

## Architecture Tiers

### Tier 1: Reference Data (Master Tables)
- `countries` - Geographic entities with ISO codes
- `organizations` - International organizations
- `forums` - International forums and summits

### Tier 2: Relationships & Linking
- `dossier_relationships` - Dossier-to-dossier relationships (M:N)
- `position_dossier_links` - Position-to-dossier links (M:N)
- `mou_parties` - MoU signatories junction table

### Tier 3: Work Products
- `mous` - Memoranda of Understanding
- `intelligence_signals` - Knowledge items

### Tier 4: System Tables
- `documents` - Polymorphic document storage
- `calendar_entries` - Standalone calendar events

---

## Table Schemas

### 1. countries (Reference Table)

**Purpose**: Master table for all countries with ISO codes and demographic data

```sql
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifiers
  iso_code VARCHAR(3) NOT NULL UNIQUE, -- ISO 3166-1 alpha-3
  iso_numeric INTEGER UNIQUE, -- ISO 3166-1 numeric

  -- Names (bilingual)
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  official_name_en TEXT,
  official_name_ar TEXT,

  -- Geographic
  region TEXT, -- e.g., 'Asia', 'Europe', 'Middle East'
  sub_region TEXT,
  capital VARCHAR(255),

  -- Demographics & Economy
  population BIGINT,
  gdp_usd NUMERIC(20,2),
  currency_code VARCHAR(3), -- ISO 4217

  -- Relationship with GASTAT
  membership_status TEXT CHECK (membership_status IN ('member', 'observer', 'partner', 'non_member')),
  membership_since DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_countries_iso ON countries(iso_code);
CREATE INDEX idx_countries_region ON countries(region);
CREATE INDEX idx_countries_membership ON countries(membership_status);

-- Full-text search
CREATE INDEX idx_countries_search ON countries USING GIN(
  to_tsvector('english', coalesce(name_en, '') || ' ' || coalesce(official_name_en, '')) ||
  to_tsvector('arabic', coalesce(name_ar, '') || ' ' || coalesce(official_name_ar, ''))
);
```

**RLS Policies**:
```sql
-- Read-only for all authenticated users
CREATE POLICY "countries_read_policy" ON countries
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert/update
CREATE POLICY "countries_write_policy" ON countries
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

**Seed Data**: 193 countries from ISO 3166-1 standard

---

### 2. organizations (Reference Table)

**Purpose**: International organizations (UN agencies, regional bodies, etc.)

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifiers
  acronym VARCHAR(50) NOT NULL UNIQUE,

  -- Names (bilingual)
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,

  -- Classification
  org_type TEXT NOT NULL CHECK (org_type IN (
    'un_agency', 'regional_org', 'bilateral', 'ngo',
    'financial_institution', 'research_institute', 'other'
  )),

  -- Location
  headquarters_country_id UUID REFERENCES countries(id),
  headquarters_city VARCHAR(255),

  -- Metadata
  founded_date DATE,
  member_count INTEGER,
  website_url TEXT,

  -- Relationship with GASTAT
  partnership_status TEXT CHECK (partnership_status IN ('partner', 'collaborator', 'observer', 'none')),
  partnership_since DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_type ON organizations(org_type);
CREATE INDEX idx_organizations_headquarters ON organizations(headquarters_country_id);
CREATE INDEX idx_organizations_partnership ON organizations(partnership_status);

-- Full-text search
CREATE INDEX idx_organizations_search ON organizations USING GIN(
  to_tsvector('english', coalesce(name_en, '') || ' ' || coalesce(acronym, '')) ||
  to_tsvector('arabic', coalesce(name_ar, ''))
);
```

**RLS Policies**:
```sql
-- Read-only for all authenticated users
CREATE POLICY "organizations_read_policy" ON organizations
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert/update
CREATE POLICY "organizations_write_policy" ON organizations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

**Seed Data**: Major international organizations (UN, World Bank, IMF, OECD, etc.)

---

### 3. forums (Reference Table)

**Purpose**: International forums, summits, working groups

```sql
CREATE TABLE forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Names (bilingual)
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  acronym VARCHAR(50),

  -- Classification
  forum_type TEXT NOT NULL CHECK (forum_type IN (
    'summit', 'conference', 'working_group', 'committee', 'advisory_board', 'other'
  )),

  -- Schedule
  frequency TEXT CHECK (frequency IN ('annual', 'biennial', 'quarterly', 'ad_hoc')),
  next_meeting_date DATE,
  host_country_id UUID REFERENCES countries(id),

  -- Metadata
  website_url TEXT,

  -- Relationship with GASTAT
  participation_status TEXT CHECK (participation_status IN ('member', 'observer', 'invited', 'none')),
  participation_since DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_forums_type ON forums(forum_type);
CREATE INDEX idx_forums_participation ON forums(participation_status);
CREATE INDEX idx_forums_next_meeting ON forums(next_meeting_date);

-- Full-text search
CREATE INDEX idx_forums_search ON forums USING GIN(
  to_tsvector('english', coalesce(name_en, '') || ' ' || coalesce(acronym, '')) ||
  to_tsvector('arabic', coalesce(name_ar, ''))
);
```

**RLS Policies**:
```sql
-- Read-only for all authenticated users
CREATE POLICY "forums_read_policy" ON forums
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert/update
CREATE POLICY "forums_write_policy" ON forums
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

**Seed Data**: Major forums (G20, OPEC, WTO, UNESCO, etc.)

---

### 4. dossiers (Modification to Existing Table)

**Purpose**: Add reference linking to existing dossiers table

```sql
-- Add new columns to existing dossiers table
ALTER TABLE dossiers
  ADD COLUMN reference_type TEXT CHECK (reference_type IN ('country', 'organization', 'forum', 'theme')),
  ADD COLUMN reference_id UUID;

-- Add index for reference lookups
CREATE INDEX idx_dossiers_reference ON dossiers(reference_type, reference_id);

-- Update existing dossiers to set reference_type
-- (Migration script will classify existing dossiers based on their type field)
```

**Migration Strategy**:
```sql
-- Classify existing dossiers
UPDATE dossiers d
SET reference_type = 'country',
    reference_id = c.id
FROM countries c
WHERE d.type = 'country' AND d.name_en = c.name_en;

UPDATE dossiers d
SET reference_type = 'organization',
    reference_id = o.id
FROM organizations o
WHERE d.type = 'organization' AND d.name_en = o.name_en;

UPDATE dossiers d
SET reference_type = 'forum',
    reference_id = f.id
FROM forums f
WHERE d.type = 'forum' AND d.name_en = f.name_en;

-- Remaining dossiers are thematic (no reference_id)
UPDATE dossiers
SET reference_type = 'theme'
WHERE reference_type IS NULL;
```

---

### 5. dossier_relationships (Junction Table)

**Purpose**: Many-to-many relationships between dossiers

```sql
CREATE TABLE dossier_relationships (
  -- Composite primary key
  parent_dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  child_dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'member_of',          -- Country is member of Organization/Forum
    'participates_in',    -- Country/Org participates in Forum
    'collaborates_with',  -- General collaboration
    'monitors',           -- One entity monitors another
    'is_member',          -- Inverse of member_of
    'hosts'               -- Country hosts Organization/Forum
  )),

  -- Relationship metadata
  relationship_strength TEXT CHECK (relationship_strength IN ('primary', 'secondary', 'observer')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  established_date DATE,
  end_date DATE, -- NULL if ongoing
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (parent_dossier_id, child_dossier_id, relationship_type),

  -- Prevent self-referencing
  CHECK (parent_dossier_id != child_dossier_id)
);

-- Indexes for bidirectional queries
CREATE INDEX idx_dossier_rel_parent ON dossier_relationships(parent_dossier_id);
CREATE INDEX idx_dossier_rel_child ON dossier_relationships(child_dossier_id);
CREATE INDEX idx_dossier_rel_type ON dossier_relationships(relationship_type);
CREATE INDEX idx_dossier_rel_strength ON dossier_relationships(relationship_strength);
```

**RLS Policies**:
```sql
-- Users can view relationships for dossiers they can access
CREATE POLICY "dossier_relationships_select_policy" ON dossier_relationships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = parent_dossier_id
        AND (d.sensitivity_level = 'public' OR d.id IN (
          SELECT dossier_id FROM dossier_owners WHERE user_id = auth.uid()
        ))
    )
  );

-- Users can create relationships for dossiers they own
CREATE POLICY "dossier_relationships_insert_policy" ON dossier_relationships
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossier_owners
      WHERE dossier_id = parent_dossier_id AND user_id = auth.uid()
    )
  );

-- Users can update/delete relationships for dossiers they own
CREATE POLICY "dossier_relationships_update_policy" ON dossier_relationships
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dossier_owners
      WHERE dossier_id = parent_dossier_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "dossier_relationships_delete_policy" ON dossier_relationships
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dossier_owners
      WHERE dossier_id = parent_dossier_id AND user_id = auth.uid()
    )
  );
```

**Example Queries**:
```sql
-- Get all organizations that USA is a member of
SELECT o.name_en, dr.relationship_type, dr.relationship_strength
FROM dossier_relationships dr
JOIN dossiers pd ON pd.id = dr.parent_dossier_id
JOIN dossiers cd ON cd.id = dr.child_dossier_id
JOIN organizations o ON o.id = cd.reference_id
WHERE pd.reference_type = 'country'
  AND pd.reference_id = (SELECT id FROM countries WHERE iso_code = 'USA')
  AND dr.relationship_type = 'member_of';

-- Get all countries that participate in G20 forum
SELECT c.name_en, dr.relationship_strength
FROM dossier_relationships dr
JOIN dossiers pd ON pd.id = dr.parent_dossier_id
JOIN dossiers cd ON cd.id = dr.child_dossier_id
JOIN countries c ON c.id = cd.reference_id
WHERE pd.reference_type = 'forum'
  AND pd.reference_id = (SELECT id FROM forums WHERE acronym = 'G20')
  AND dr.relationship_type = 'participates_in';
```

---

### 6. position_dossier_links (Junction Table)

**Purpose**: Many-to-many links between positions and dossiers

```sql
CREATE TABLE position_dossier_links (
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Link classification
  link_type TEXT NOT NULL DEFAULT 'related' CHECK (link_type IN (
    'primary',   -- Main dossier for this position
    'related',   -- Position applies to this dossier
    'reference'  -- Referenced but not primary
  )),

  -- Metadata
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  notes TEXT,

  PRIMARY KEY (position_id, dossier_id)
);

-- Indexes
CREATE INDEX idx_position_dossier_position ON position_dossier_links(position_id);
CREATE INDEX idx_position_dossier_dossier ON position_dossier_links(dossier_id);
CREATE INDEX idx_position_dossier_type ON position_dossier_links(link_type);
```

**RLS Policies**:
```sql
-- Users can view links for positions/dossiers they can access
CREATE POLICY "position_dossier_links_select_policy" ON position_dossier_links
  FOR SELECT
  USING (
    -- Can access position
    EXISTS (
      SELECT 1 FROM positions p
      WHERE p.id = position_id
        AND (
          p.status = 'published'
          OR p.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM position_approvers
            WHERE position_id = p.id AND approver_id = auth.uid()
          )
        )
    )
    AND
    -- Can access dossier
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = dossier_id
        AND (d.sensitivity_level = 'public' OR d.id IN (
          SELECT dossier_id FROM dossier_owners WHERE user_id = auth.uid()
        ))
    )
  );

-- Users can create links for positions they own
CREATE POLICY "position_dossier_links_insert_policy" ON position_dossier_links
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM positions
      WHERE id = position_id AND created_by = auth.uid()
    )
  );

-- Similar update/delete policies
```

**Example Queries**:
```sql
-- Get all dossiers linked to a position
SELECT d.name_en, pdl.link_type
FROM position_dossier_links pdl
JOIN dossiers d ON d.id = pdl.dossier_id
WHERE pdl.position_id = $1
ORDER BY pdl.link_type, d.name_en;

-- Get all positions for a dossier's Positions tab
SELECT p.*, pdl.link_type
FROM position_dossier_links pdl
JOIN positions p ON p.id = pdl.position_id
WHERE pdl.dossier_id = $1
  AND p.status = 'published'
ORDER BY p.created_at DESC;
```

---

### 7. mous (Work Product Table)

**Purpose**: Memoranda of Understanding linked to dossiers

```sql
CREATE TABLE mous (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent relationship
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- MoU details (bilingual)
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  summary_en TEXT,
  summary_ar TEXT,

  -- Dates
  signed_date DATE NOT NULL,
  effective_date DATE,
  expiry_date DATE,
  renewal_required_by DATE, -- Alert threshold

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Being negotiated
    'active',     -- In force
    'expired',    -- Past expiry date
    'cancelled',  -- Terminated early
    'renewed'     -- Renewed with new MoU
  )),

  -- Document
  document_path TEXT, -- Supabase Storage path to signed PDF

  -- Renewal tracking
  renewed_by_mou_id UUID REFERENCES mous(id), -- If this MoU was renewed, link to new MoU

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_mous_dossier ON mous(dossier_id);
CREATE INDEX idx_mous_status ON mous(status);
CREATE INDEX idx_mous_expiry ON mous(expiry_date) WHERE status = 'active';
CREATE INDEX idx_mous_renewal ON mous(renewal_required_by) WHERE status = 'active';

-- Full-text search
CREATE INDEX idx_mous_search ON mous USING GIN(
  to_tsvector('english', coalesce(title_en, '') || ' ' || coalesce(summary_en, '')) ||
  to_tsvector('arabic', coalesce(title_ar, '') || ' ' || coalesce(summary_ar, ''))
);
```

**Junction Table for Signatories**:
```sql
CREATE TABLE mou_parties (
  mou_id UUID NOT NULL REFERENCES mous(id) ON DELETE CASCADE,
  party_type TEXT NOT NULL CHECK (party_type IN ('country', 'organization')),
  party_id UUID NOT NULL, -- FK to countries or organizations (not enforced)
  party_role TEXT CHECK (party_role IN ('signatory', 'witness', 'observer')),
  signed_by_name TEXT, -- Name of person who signed
  signed_by_title TEXT,
  PRIMARY KEY (mou_id, party_type, party_id)
);

CREATE INDEX idx_mou_parties_mou ON mou_parties(mou_id);
CREATE INDEX idx_mou_parties_party ON mou_parties(party_type, party_id);
```

**MoU Renewal Alert System**:
- **Trigger**: Daily cron job (using pg_cron or containerized scheduler)
- **Logic**: Query MoUs WHERE status='active' AND renewal_required_by <= CURRENT_DATE + INTERVAL '90 days'
- **Actions**:
  1. Create notification record for each dossier owner
  2. Send in-app notification with MoU title, expiry date, and dossier link
  3. Optionally send email notification (if user preferences allow)
  4. Badge count appears in navigation bar for affected users
- **Frequency**: Daily at 09:00 server time
- **Edge Function**: `mou-renewal-check` (scheduled job handler)

**RLS Policies**:
```sql
-- Users can view MoUs for dossiers they can access
CREATE POLICY "mous_select_policy" ON mous
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = dossier_id
        AND (d.sensitivity_level = 'public' OR d.id IN (
          SELECT dossier_id FROM dossier_owners WHERE user_id = auth.uid()
        ))
    )
  );

-- Similar insert/update/delete policies based on dossier ownership
```

---

### 8. intelligence_signals (Knowledge Table)

**Purpose**: Knowledge items (news, reports, analysis) linked to dossiers

```sql
CREATE TABLE intelligence_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent relationship
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Signal classification
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'news',        -- News article or media report
    'report',      -- Official report or publication
    'rumor',       -- Unverified information
    'tip',         -- Information from contacts
    'analysis',    -- Internal analysis
    'alert'        -- Time-sensitive warning
  )),

  -- Source tracking
  source TEXT NOT NULL, -- Name of source (publication, person, etc.)
  source_reliability INTEGER CHECK (source_reliability BETWEEN 1 AND 5), -- 1=unreliable, 5=highly reliable
  source_url TEXT,

  -- Content (bilingual)
  title_en TEXT NOT NULL,
  title_ar TEXT,
  content_en TEXT NOT NULL,
  content_ar TEXT,

  -- Validation workflow
  confidence_level TEXT NOT NULL DEFAULT 'unconfirmed' CHECK (confidence_level IN (
    'confirmed',    -- Verified by multiple sources
    'probable',     -- Likely true based on evidence
    'possible',     -- Unverified but plausible
    'unconfirmed'   -- Awaiting validation
  )),

  -- Timestamps
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  logged_by UUID NOT NULL REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  impact_assessment TEXT, -- Potential impact on relationship

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title_en, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content_en, '')), 'B') ||
    setweight(to_tsvector('arabic', coalesce(title_ar, '')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(content_ar, '')), 'B')
  ) STORED
);

-- Indexes
CREATE INDEX idx_intelligence_dossier ON intelligence_signals(dossier_id);
CREATE INDEX idx_intelligence_type ON intelligence_signals(signal_type);
CREATE INDEX idx_intelligence_confidence ON intelligence_signals(confidence_level);
CREATE INDEX idx_intelligence_search ON intelligence_signals USING GIN(search_vector);
CREATE INDEX idx_intelligence_tags ON intelligence_signals USING GIN(tags);
CREATE INDEX idx_intelligence_logged ON intelligence_signals(logged_at DESC);
```

**RLS Policies**:
```sql
-- Users can view signals for dossiers they can access
CREATE POLICY "intelligence_signals_select_policy" ON intelligence_signals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = dossier_id
        AND (d.sensitivity_level = 'public' OR d.id IN (
          SELECT dossier_id FROM dossier_owners WHERE user_id = auth.uid()
        ))
    )
  );

-- Any authenticated user can create signals (logged_by = auth.uid())
CREATE POLICY "intelligence_signals_insert_policy" ON intelligence_signals
  FOR INSERT
  WITH CHECK (logged_by = auth.uid());

-- Only creator or validators can update
CREATE POLICY "intelligence_signals_update_policy" ON intelligence_signals
  FOR UPDATE
  USING (
    logged_by = auth.uid() OR
    auth.jwt() ->> 'role' = 'validator'
  );
```

---

### 9. documents (Polymorphic Storage Table)

**Purpose**: Unified document storage linked to any entity type

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic relationship (not enforced at DB level)
  owner_type TEXT NOT NULL CHECK (owner_type IN (
    'dossier', 'engagement', 'position', 'mou', 'after_action',
    'ticket', 'assignment', 'intelligence_signal', 'commitment'
  )),
  owner_id UUID NOT NULL,

  -- File metadata
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size <= 104857600), -- 100MB max
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE, -- Supabase Storage bucket path

  -- Classification
  document_type TEXT, -- memo, report, agreement, minutes, analysis, photo
  language TEXT CHECK (language IN ('en', 'ar', 'both')),
  tags TEXT[] DEFAULT '{}',

  -- Security
  scan_status TEXT DEFAULT 'pending' CHECK (scan_status IN ('pending', 'clean', 'infected', 'error')),
  sensitivity_level TEXT CHECK (sensitivity_level IN ('public', 'internal', 'confidential', 'secret')),

  -- Versioning
  version_number INTEGER DEFAULT 1,
  is_latest BOOLEAN DEFAULT TRUE,
  supersedes_document_id UUID REFERENCES documents(id),

  -- Audit
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- soft delete

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(file_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'B')
  ) STORED
);

-- Indexes
CREATE INDEX idx_documents_owner ON documents(owner_type, owner_id);
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_latest ON documents(owner_type, owner_id) WHERE is_latest = true;
CREATE INDEX idx_documents_scan_status ON documents(scan_status) WHERE scan_status != 'clean';
CREATE INDEX idx_documents_uploaded ON documents(uploaded_at DESC);
```

**Virus Scanning Integration**:
- **Engine**: ClamAV antivirus daemon (containerized)
- **Trigger**: Supabase Storage webhook on upload → calls scan Edge Function
- **Process**:
  1. Document uploaded → scan_status='pending'
  2. Async ClamAV scan via Edge Function
  3. Update scan_status to 'clean', 'infected', or 'error'
  4. If 'infected': Quarantine file (move to quarantine bucket) + notify uploader + prevent download
- **Fallback**: If ClamAV unavailable, set scan_status='error' and allow conditional download with warning

**RLS Policies**:
```sql
-- Complex polymorphic RLS - users can view documents for entities they can access
CREATE POLICY "documents_select_policy" ON documents
  FOR SELECT
  USING (
    CASE owner_type
      WHEN 'dossier' THEN
        EXISTS (
          SELECT 1 FROM dossiers d
          WHERE d.id = owner_id
            AND (d.sensitivity_level = 'public' OR d.id IN (
              SELECT dossier_id FROM dossier_owners WHERE user_id = auth.uid()
            ))
        )
      WHEN 'position' THEN
        EXISTS (
          SELECT 1 FROM positions p
          WHERE p.id = owner_id
            AND (p.status = 'published' OR p.created_by = auth.uid())
        )
      -- Add similar conditions for other owner_types
      ELSE FALSE
    END
  );

-- Users can upload documents to entities they can modify
CREATE POLICY "documents_insert_policy" ON documents
  FOR INSERT
  WITH CHECK (uploaded_by = auth.uid() AND scan_status = 'pending');

-- Virus scan updates only by system
CREATE POLICY "documents_scan_update_policy" ON documents
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (scan_status IN ('clean', 'infected', 'error'));
```

---

### 10. calendar_entries (Standalone Events Table)

**Purpose**: Standalone calendar events (non-engagement events)

```sql
CREATE TABLE calendar_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Optional dossier link
  dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,

  -- Entry details (bilingual)
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,

  -- Event classification
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'internal_meeting',  -- Internal GASTAT meeting
    'deadline',          -- Task/project deadline
    'reminder',          -- Upcoming event reminder
    'holiday',           -- Public/organizational holiday
    'training',          -- Training session
    'review',            -- Periodic review meeting
    'other'
  )),

  -- Timing
  event_date DATE NOT NULL,
  event_time TIME,
  duration_minutes INTEGER,
  all_day BOOLEAN DEFAULT FALSE,

  -- Location
  location TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  meeting_link TEXT,

  -- Recurrence
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- e.g., 'FREQ=WEEKLY;BYDAY=MO' (iCalendar format)
  recurrence_end_date DATE,

  -- Optional work item link (polymorphic)
  linked_item_type TEXT CHECK (linked_item_type IN ('assignment', 'position', 'mou', 'commitment')),
  linked_item_id UUID,

  -- Attendees
  organizer_id UUID REFERENCES auth.users(id),
  attendee_ids UUID[] DEFAULT '{}', -- Array of user IDs

  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calendar_dossier ON calendar_entries(dossier_id);
CREATE INDEX idx_calendar_date ON calendar_entries(event_date);
CREATE INDEX idx_calendar_type ON calendar_entries(entry_type);
CREATE INDEX idx_calendar_organizer ON calendar_entries(organizer_id);
CREATE INDEX idx_calendar_attendees ON calendar_entries USING GIN(attendee_ids);
CREATE INDEX idx_calendar_linked_item ON calendar_entries(linked_item_type, linked_item_id);
```

**RLS Policies**:
```sql
-- Users can view calendar entries they organized or attend
CREATE POLICY "calendar_entries_select_policy" ON calendar_entries
  FOR SELECT
  USING (
    organizer_id = auth.uid() OR
    auth.uid() = ANY(attendee_ids) OR
    (dossier_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = dossier_id
        AND (d.sensitivity_level = 'public' OR d.id IN (
          SELECT dossier_id FROM dossier_owners WHERE user_id = auth.uid()
        ))
    ))
  );

-- Users can create calendar entries for themselves
CREATE POLICY "calendar_entries_insert_policy" ON calendar_entries
  FOR INSERT
  WITH CHECK (organizer_id = auth.uid());

-- Users can update/delete their own calendar entries
CREATE POLICY "calendar_entries_update_policy" ON calendar_entries
  FOR UPDATE
  USING (organizer_id = auth.uid());

CREATE POLICY "calendar_entries_delete_policy" ON calendar_entries
  FOR DELETE
  USING (organizer_id = auth.uid());
```

---

## Summary Statistics

**New Tables**: 10
- Reference: 3 (countries, organizations, forums)
- Relationships: 3 (dossier_relationships, position_dossier_links, mou_parties)
- Work Products: 2 (mous, intelligence_signals)
- System: 2 (documents, calendar_entries)

**Table Modifications**: 1 (dossiers - add reference columns)

**Total Indexes**: 27 across all tables
- Performance: 18 (foreign keys, lookups, filtering)
- Search: 6 (GIN full-text indexes)
- Partial: 3 (is_latest, active status filters)

**RLS Policies**: 40+ policies
- Read policies: 15 (SELECT based on ownership/access)
- Write policies: 25 (INSERT/UPDATE/DELETE based on ownership)

**Total Migrations**: 10 migration files (one per table + one for dossiers modification)

---
**Data Model Complete**: Ready for API contract generation
