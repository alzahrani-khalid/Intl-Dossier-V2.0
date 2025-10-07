# Data Model: After-Action Notes

**Feature**: 010-after-action-notes
**Date**: 2025-09-30
**Phase**: 1 (Design & Contracts)

## Entity Relationship Diagram

```
┌──────────────┐
│   Dossiers   │───┐
└──────────────┘   │
                   │ 1:N
                   ▼
            ┌──────────────┐
            │ Engagements  │
            └──────────────┘
                   │ 1:1
                   ▼
         ┌─────────────────────┐
         │ After-Action Records│
         └─────────────────────┘
                │      │      │
         ┌──────┼──────┼──────┐
         │      │      │      │
         ▼      ▼      ▼      ▼
    ┌────────┬────────┬──────┬────────────┐
    │Decision│Commitment│Risk │ Follow-Up │
    └────────┴────────┴──────┴────────────┘
                │
                │ M:1 (owner)
                ▼
       ┌─────────────────┐
       │ Internal Users  │
       │ OR              │
       │External Contacts│
       └─────────────────┘
```

---

## Core Entities

### 1. Engagements

**Purpose**: Represents meetings, consultations, or coordination sessions related to a dossier.

**Attributes**:
```typescript
interface Engagement {
  id: string;                    // UUID, primary key
  dossier_id: string;            // Foreign key to dossiers table
  title: string;                 // e.g., "Q1 Planning Meeting"
  engagement_type: EngagementType;
  engagement_date: Date;
  location: string | null;       // Physical or virtual location
  description: string | null;
  created_by: string;            // Foreign key to auth.users
  created_at: Date;
  updated_at: Date;
}

enum EngagementType {
  MEETING = 'meeting',
  CONSULTATION = 'consultation',
  COORDINATION = 'coordination',
  WORKSHOP = 'workshop',
  CONFERENCE = 'conference',
  SITE_VISIT = 'site_visit',
  OTHER = 'other'
}
```

**Schema**:
```sql
CREATE TABLE engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 500),
  engagement_type TEXT NOT NULL CHECK (engagement_type IN (
    'meeting', 'consultation', 'coordination', 'workshop',
    'conference', 'site_visit', 'other'
  )),
  engagement_date TIMESTAMPTZ NOT NULL,
  location TEXT CHECK (char_length(location) <= 500),
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_engagements_dossier_id ON engagements(dossier_id);
CREATE INDEX idx_engagements_date ON engagements(engagement_date DESC);
```

**Relationships**:
- N:1 with Dossiers (many engagements per dossier)
- 1:1 with After-Action Records (one after-action per engagement)

**Validation Rules**:
- `title`: 1-500 characters
- `engagement_date`: Cannot be in future (business rule)
- `engagement_type`: Must be one of enum values
- `dossier_id`: Must reference existing dossier user is assigned to

---

### 2. After-Action Records

**Purpose**: Complete documented outcome of an engagement.

**Attributes**:
```typescript
interface AfterActionRecord {
  id: string;                    // UUID, primary key
  engagement_id: string;         // Foreign key to engagements
  dossier_id: string;            // Foreign key to dossiers (denormalized for performance)
  publication_status: PublicationStatus;
  is_confidential: boolean;
  attendees: string[];           // Array of user names or emails
  notes: string | null;          // Additional context or summary
  created_by: string;            // Foreign key to auth.users
  created_at: Date;
  updated_by: string | null;
  updated_at: Date;
  published_by: string | null;
  published_at: Date | null;
  edit_requested_by: string | null;
  edit_requested_at: Date | null;
  edit_request_reason: string | null;
  edit_approved_by: string | null;
  edit_approved_at: Date | null;
  edit_rejection_reason: string | null;
  version: number;               // Optimistic locking
}

enum PublicationStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  EDIT_REQUESTED = 'edit_requested',
  EDIT_APPROVED = 'edit_approved',
  EDIT_REJECTED = 'edit_rejected'
}
```

**Schema**:
```sql
CREATE TABLE after_action_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL UNIQUE REFERENCES engagements(id) ON DELETE CASCADE,
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN (
    'draft', 'published', 'edit_requested', 'edit_approved', 'edit_rejected'
  )),
  is_confidential BOOLEAN NOT NULL DEFAULT false,
  attendees TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  edit_requested_by UUID REFERENCES auth.users(id),
  edit_requested_at TIMESTAMPTZ,
  edit_request_reason TEXT,
  edit_approved_by UUID REFERENCES auth.users(id),
  edit_approved_at TIMESTAMPTZ,
  edit_rejection_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_after_actions_engagement ON after_action_records(engagement_id);
CREATE INDEX idx_after_actions_dossier ON after_action_records(dossier_id);
CREATE INDEX idx_after_actions_status ON after_action_records(publication_status);
CREATE INDEX idx_after_actions_confidential ON after_action_records(is_confidential);
```

**Relationships**:
- 1:1 with Engagements
- N:1 with Dossiers (denormalized from engagement)
- 1:N with Decisions, Commitments, Risks, Follow-Ups
- 1:N with AfterActionVersions

**State Machine**:
```
draft ──publish──> published
                      │
          ┌───────────┴───────────┐
          │                       │
   request_edit             (read-only)
          │                       │
          ▼                       │
   edit_requested                 │
          │                       │
    ┌─────┴─────┐                 │
    │           │                 │
 approve     reject               │
    │           │                 │
    ▼           ▼                 │
edit_approved edit_rejected       │
    │           │                 │
    └───────────┴─────────────────┘
```

**Validation Rules**:
- `publication_status`: Only supervisors/admins can transition to 'published'
- `is_confidential`: If true, triggers step-up auth on publish/PDF generation
- `attendees`: Max 100 entries
- `version`: Incremented on every update (optimistic locking)

---

### 3. After-Action Versions

**Purpose**: Full audit trail of all changes to after-action records.

**Attributes**:
```typescript
interface AfterActionVersion {
  id: string;                    // UUID, primary key
  after_action_id: string;       // Foreign key to after_action_records
  version_number: number;
  content: Record<string, any>;  // JSONB snapshot of entire record
  change_summary: string | null;
  changed_by: string;            // Foreign key to auth.users
  changed_at: Date;
}
```

**Schema**:
```sql
CREATE TABLE after_action_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  after_action_id UUID NOT NULL REFERENCES after_action_records(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  change_summary TEXT,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(after_action_id, version_number)
);

CREATE INDEX idx_after_action_versions_record ON after_action_versions(after_action_id, version_number DESC);
```

**Relationships**:
- N:1 with After-Action Records

**Validation Rules**:
- `version_number`: Sequential, starting from 1
- `content`: Complete snapshot, includes all child entities (decisions, commitments, etc.)
- Append-only table (no updates or deletes)

---

### 4. Decisions

**Purpose**: Captures decisions made during the engagement.

**Attributes**:
```typescript
interface Decision {
  id: string;
  after_action_id: string;
  description: string;
  rationale: string | null;
  decision_maker: string;        // Name or role
  decision_date: Date;
  created_at: Date;
  updated_at: Date;
}
```

**Schema**:
```sql
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  after_action_id UUID NOT NULL REFERENCES after_action_records(id) ON DELETE CASCADE,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  rationale TEXT,
  decision_maker TEXT NOT NULL CHECK (char_length(decision_maker) BETWEEN 1 AND 200),
  decision_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decisions_after_action ON decisions(after_action_id);
```

**Relationships**:
- N:1 with After-Action Records

**Validation Rules**:
- `description`: 1-2000 characters
- `decision_maker`: 1-200 characters
- `decision_date`: Must be <= engagement date

---

### 5. Commitments

**Purpose**: Tracks agreed-upon actions with assigned owners and due dates.

**Attributes**:
```typescript
interface Commitment {
  id: string;
  after_action_id: string;
  dossier_id: string;            // Denormalized for queries
  description: string;
  priority: Priority;
  status: CommitmentStatus;
  owner_type: OwnerType;
  owner_user_id: string | null;
  owner_contact_id: string | null;
  tracking_mode: TrackingMode;
  due_date: Date;
  completed_at: Date | null;
  ai_confidence: number | null;  // 0.0-1.0, from AI extraction
  created_at: Date;
  updated_at: Date;
}

enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum CommitmentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue'
}

enum OwnerType {
  INTERNAL = 'internal',
  EXTERNAL = 'external'
}

enum TrackingMode {
  AUTOMATIC = 'automatic',  // Internal users via system
  MANUAL = 'manual'         // External contacts, manual updates
}
```

**Schema**:
```sql
CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  after_action_id UUID NOT NULL REFERENCES after_action_records(id) ON DELETE CASCADE,
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'cancelled', 'overdue'
  )),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('internal', 'external')),
  owner_user_id UUID REFERENCES auth.users(id),
  owner_contact_id UUID REFERENCES external_contacts(id),
  tracking_mode TEXT NOT NULL CHECK (tracking_mode IN ('automatic', 'manual')),
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  ai_confidence NUMERIC(3,2) CHECK (ai_confidence BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_owner CHECK (
    (owner_type = 'internal' AND owner_user_id IS NOT NULL AND owner_contact_id IS NULL) OR
    (owner_type = 'external' AND owner_contact_id IS NOT NULL AND owner_user_id IS NULL)
  ),
  CONSTRAINT valid_tracking CHECK (
    (tracking_mode = 'automatic' AND owner_type = 'internal') OR
    (tracking_mode = 'manual' AND owner_type = 'external')
  )
);

CREATE INDEX idx_commitments_after_action ON commitments(after_action_id);
CREATE INDEX idx_commitments_dossier ON commitments(dossier_id);
CREATE INDEX idx_commitments_owner_user ON commitments(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX idx_commitments_owner_contact ON commitments(owner_contact_id) WHERE owner_contact_id IS NOT NULL;
CREATE INDEX idx_commitments_status ON commitments(status);
CREATE INDEX idx_commitments_due_date ON commitments(due_date);
```

**Relationships**:
- N:1 with After-Action Records
- N:1 with Dossiers (denormalized)
- N:1 with Users (internal owner) OR External Contacts (external owner)

**Validation Rules**:
- `description`: 1-2000 characters
- `due_date`: Must be >= engagement date
- `owner_type` + `owner_user_id`/`owner_contact_id`: Enforced by constraint
- `status`: Auto-calculated to 'overdue' if past due_date and not completed

---

### 6. External Contacts

**Purpose**: Represents non-system users who can be assigned commitments.

**Attributes**:
```typescript
interface ExternalContact {
  id: string;
  email: string;                 // Unique
  full_name: string;
  organization: string | null;
  notification_preference: NotificationPreference;
  created_at: Date;
  updated_at: Date;
}

enum NotificationPreference {
  EMAIL = 'email',
  NONE = 'none'
}
```

**Schema**:
```sql
CREATE TABLE external_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 200),
  organization TEXT CHECK (char_length(organization) <= 200),
  notification_preference TEXT NOT NULL DEFAULT 'email' CHECK (notification_preference IN ('email', 'none')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_external_contacts_email ON external_contacts(email);
```

**Relationships**:
- 1:N with Commitments

**Validation Rules**:
- `email`: Must be valid email format, unique across table
- `full_name`: 1-200 characters
- `organization`: Max 200 characters

---

### 7. Risks

**Purpose**: Documents risks identified during the engagement.

**Attributes**:
```typescript
interface Risk {
  id: string;
  after_action_id: string;
  description: string;
  severity: Severity;
  likelihood: Likelihood;
  mitigation_strategy: string | null;
  owner: string | null;          // Name or role responsible for monitoring
  ai_confidence: number | null;  // 0.0-1.0, from AI extraction
  created_at: Date;
  updated_at: Date;
}

enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum Likelihood {
  UNLIKELY = 'unlikely',
  POSSIBLE = 'possible',
  LIKELY = 'likely',
  CERTAIN = 'certain'
}
```

**Schema**:
```sql
CREATE TABLE risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  after_action_id UUID NOT NULL REFERENCES after_action_records(id) ON DELETE CASCADE,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  likelihood TEXT NOT NULL CHECK (likelihood IN ('unlikely', 'possible', 'likely', 'certain')),
  mitigation_strategy TEXT,
  owner TEXT CHECK (char_length(owner) <= 200),
  ai_confidence NUMERIC(3,2) CHECK (ai_confidence BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risks_after_action ON risks(after_action_id);
CREATE INDEX idx_risks_severity ON risks(severity);
```

**Relationships**:
- N:1 with After-Action Records

**Validation Rules**:
- `description`: 1-2000 characters
- `severity` + `likelihood`: Composite risk score can be calculated: `(severity * 2 + likelihood) / 3`

---

### 8. Follow-Up Actions

**Purpose**: Next steps or actions that need to occur (may not have owners/dates yet).

**Attributes**:
```typescript
interface FollowUpAction {
  id: string;
  after_action_id: string;
  description: string;
  assigned_to: string | null;    // Optional, may be TBD
  target_date: Date | null;      // Optional, may be TBD
  completed: boolean;
  created_at: Date;
  updated_at: Date;
}
```

**Schema**:
```sql
CREATE TABLE follow_up_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  after_action_id UUID NOT NULL REFERENCES after_action_records(id) ON DELETE CASCADE,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  assigned_to TEXT CHECK (char_length(assigned_to) <= 200),
  target_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_follow_ups_after_action ON follow_up_actions(after_action_id);
CREATE INDEX idx_follow_ups_completed ON follow_up_actions(completed);
```

**Relationships**:
- N:1 with After-Action Records

**Validation Rules**:
- `description`: 1-2000 characters
- `assigned_to` and `target_date` are optional (may be determined later)

---

### 9. Attachments

**Purpose**: Supporting documents/evidence for after-action records.

**Attributes**:
```typescript
interface Attachment {
  id: string;
  after_action_id: string;
  file_name: string;
  file_key: string;              // Supabase Storage key
  file_size: number;             // Bytes
  mime_type: string;
  scan_status: ScanStatus;
  uploaded_by: string;
  uploaded_at: Date;
}

enum ScanStatus {
  PENDING = 'pending',
  CLEAN = 'clean',
  INFECTED = 'infected',
  SCAN_FAILED = 'scan_failed'
}
```

**Schema**:
```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  after_action_id UUID NOT NULL REFERENCES after_action_records(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL CHECK (char_length(file_name) BETWEEN 1 AND 255),
  file_key TEXT NOT NULL UNIQUE,
  file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 104857600), -- 100MB
  mime_type TEXT NOT NULL CHECK (mime_type IN (
    'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png', 'image/jpeg', 'text/plain', 'text/csv'
  )),
  scan_status TEXT NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending', 'clean', 'infected', 'scan_failed')),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_after_action ON attachments(after_action_id);
CREATE INDEX idx_attachments_scan_status ON attachments(scan_status);

-- Constraint: Max 10 attachments per after-action
CREATE OR REPLACE FUNCTION check_attachment_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM attachments WHERE after_action_id = NEW.after_action_id) >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 attachments per after-action record';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_attachment_limit
BEFORE INSERT ON attachments
FOR EACH ROW EXECUTE FUNCTION check_attachment_limit();
```

**Relationships**:
- N:1 with After-Action Records

**Validation Rules**:
- `file_size`: Max 100MB (104857600 bytes)
- `mime_type`: Only allowed types (PDF, DOCX, XLSX, PPTX, PNG, JPG, TXT, CSV)
- Max 10 attachments per after-action record (enforced by trigger)
- `scan_status`: Must be 'clean' before record can be published

---

### 10. User Notification Preferences

**Purpose**: Per-user configurable notification settings.

**Attributes**:
```typescript
interface UserNotificationPreferences {
  user_id: string;               // Primary key, foreign key to auth.users
  commitment_assigned_in_app: boolean;
  commitment_assigned_email: boolean;
  commitment_due_soon_in_app: boolean;
  commitment_due_soon_email: boolean;
  language_preference: Language;
  updated_at: Date;
}

enum Language {
  EN = 'en',
  AR = 'ar'
}
```

**Schema**:
```sql
CREATE TABLE user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  commitment_assigned_in_app BOOLEAN DEFAULT true,
  commitment_assigned_email BOOLEAN DEFAULT true,
  commitment_due_soon_in_app BOOLEAN DEFAULT true,
  commitment_due_soon_email BOOLEAN DEFAULT false,
  language_preference TEXT CHECK (language_preference IN ('en', 'ar')) DEFAULT 'en',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships**:
- 1:1 with Users

**Validation Rules**:
- One record per user (primary key = user_id)
- Created on user's first login (via trigger or application logic)

---

### 11. Notifications

**Purpose**: In-app notification delivery log.

**Attributes**:
```typescript
interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read_at: Date | null;
  created_at: Date;
}

enum NotificationType {
  COMMITMENT_ASSIGNED = 'commitment_assigned',
  COMMITMENT_DUE_SOON = 'commitment_due_soon',
  AFTER_ACTION_PUBLISHED = 'after_action_published',
  EDIT_APPROVED = 'edit_approved',
  EDIT_REJECTED = 'edit_rejected'
}
```

**Schema**:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'commitment_assigned', 'commitment_due_soon', 'after_action_published',
    'edit_approved', 'edit_rejected'
  )),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000),
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

**Relationships**:
- N:1 with Users

**Validation Rules**:
- `title`: 1-200 characters
- `message`: 1-1000 characters
- `link`: Optional, deep link to related entity

---

## Row Level Security (RLS) Policies

### Policy: Hybrid Permission Model

**Rule**: Users can access after-action records if:
1. They are assigned to the parent dossier (via `dossier_owners` table), AND
2. Their role permits the operation:
   - **Staff**: Read/write drafts only
   - **Supervisor**: Read/write all, publish, approve edits
   - **Admin**: Full access

**Implementation**:
```sql
-- After-Action Records
CREATE POLICY "hybrid_access_after_actions" ON after_action_records
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM dossier_owners
    WHERE dossier_id = after_action_records.dossier_id
    AND user_id = auth.uid()
  )
  AND
  CASE
    WHEN auth.jwt()->>'role' = 'admin' THEN true
    WHEN auth.jwt()->>'role' = 'supervisor' THEN true
    WHEN auth.jwt()->>'role' = 'staff'
      AND after_action_records.publication_status IN ('draft', 'edit_requested') THEN true
    ELSE false
  END
);

-- Commitments (similar pattern)
CREATE POLICY "hybrid_access_commitments" ON commitments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM dossier_owners
    WHERE dossier_id = commitments.dossier_id
    AND user_id = auth.uid()
  )
  OR
  commitments.owner_user_id = auth.uid() -- Users can always see their own commitments
);

-- Decisions, Risks, Follow-Ups (cascade from after-action access)
CREATE POLICY "cascade_access_decisions" ON decisions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM after_action_records aa
    JOIN dossier_owners do ON do.dossier_id = aa.dossier_id
    WHERE aa.id = decisions.after_action_id
    AND do.user_id = auth.uid()
  )
);
```

---

## Materialized Views

### View: Commitment Summary by Dossier

**Purpose**: Performance optimization for dashboard queries.

```sql
CREATE MATERIALIZED VIEW commitment_summary_by_dossier AS
SELECT
  dossier_id,
  COUNT(*) AS total_commitments,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE status = 'overdue') AS overdue,
  COUNT(*) FILTER (WHERE priority = 'critical') AS critical
FROM commitments
GROUP BY dossier_id;

CREATE UNIQUE INDEX idx_commitment_summary_dossier ON commitment_summary_by_dossier(dossier_id);

-- Refresh strategy: Real-time via trigger or periodic (hourly)
```

---

## Database Functions

### Function: Auto-Update Overdue Commitments

**Purpose**: Background job to mark commitments as overdue past their due date.

```sql
CREATE OR REPLACE FUNCTION update_overdue_commitments()
RETURNS void AS $$
BEGIN
  UPDATE commitments
  SET status = 'overdue', updated_at = NOW()
  WHERE due_date < CURRENT_DATE
  AND status NOT IN ('completed', 'cancelled', 'overdue');
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron (hourly)
SELECT cron.schedule('update-overdue-commitments', '0 * * * *', 'SELECT update_overdue_commitments()');
```

### Function: Auto-Create Notification Preferences

**Purpose**: Initialize preferences for new users.

```sql
CREATE OR REPLACE FUNCTION create_default_notification_prefs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_default_notification_prefs();
```

---

## Data Integrity Constraints

1. **Cascading Deletes**:
   - Deleting a dossier → cascades to engagements → cascades to after-actions → cascades to decisions/commitments/risks/follow-ups
   - Deleting an after-action → cascades to all child entities + versions

2. **Orphan Prevention**:
   - Every engagement must reference an existing dossier
   - Every after-action must reference an existing engagement
   - Every commitment must reference an existing after-action + dossier

3. **Enum Validation**:
   - All enum fields (status, priority, engagement_type, etc.) enforced via `CHECK` constraints

4. **Business Logic Constraints**:
   - Commitment owners: Either internal user OR external contact (not both, not neither)
   - Attachment limit: Max 10 per after-action record (trigger)
   - File size: Max 100MB per attachment

---

## Migration Strategy

**Order of Execution**:
1. Create `engagements` table
2. Create `after_action_records` table
3. Create `external_contacts` table
4. Create child tables (decisions, commitments, risks, follow_ups, attachments)
5. Create `after_action_versions` table
6. Create `user_notification_preferences` table
7. Create `notifications` table
8. Create indexes
9. Enable RLS on all tables
10. Create RLS policies
11. Create database functions
12. Create triggers

**Rollback Plan**:
- Each migration file includes `DROP TABLE IF EXISTS` statements in reverse order
- All tables use `ON DELETE CASCADE` to prevent orphaned records

---

## Performance Considerations

1. **Indexing Strategy**:
   - Foreign keys: All foreign key columns indexed
   - Query filters: Status, dates, scan_status indexed
   - Composite indexes: (user_id, dossier_id) for permission checks

2. **Query Optimization**:
   - Use `LEFT JOIN` with `json_agg()` to avoid N+1 queries
   - Materialized views for aggregated data (refresh hourly)
   - Partial indexes on frequently filtered fields (e.g., unread notifications)

3. **Storage Optimization**:
   - JSONB for version snapshots (compressed storage)
   - TEXT[] for attendees (no separate join table needed)
   - Date vs. Timestamptz: Use DATE for due_date (no time component needed)

---

## Conclusion

Data model supports all 25 functional requirements from spec.md:
- ✅ Hybrid permission model (FR-020)
- ✅ Version control with supervisor approval (FR-019)
- ✅ External contact management (FR-021)
- ✅ Configurable notifications (FR-024)
- ✅ AI confidence scoring (FR-014, FR-022)
- ✅ Attachment security (FR-023)
- ✅ Audit metadata (FR-025)

**Next Phase**: Generate API contracts and contract tests.