# Data Model: After-Action Structured Documentation

**Feature**: After-Action Structured Documentation  
**Date**: 2025-01-14  
**Status**: Complete

## Entity Relationship Diagram

```
┌─────────────────────┐
│     dossiers        │
│ (existing entity)   │
└──────────┬──────────┘
           │
           │ 1:N
           │
┌──────────▼──────────┐         ┌─────────────────────┐
│    engagements      │         │       users         │
│ (existing entity)   │         │ (existing entity)   │
└──────────┬──────────┘         └──────────┬──────────┘
           │                               │
           │ 1:N                           │ creator/publisher/approver
           │                               │
┌──────────▼──────────────────────────────▼──────────┐
│           after_action_records                      │
│  - id, engagement_id, dossier_id                    │
│  - title, description, confidentiality_level        │
│  - status (draft/published/edit_pending)            │
│  - created_by, published_by, published_at           │
│  - _version (optimistic locking)                    │
└──────────┬───────────────┬────────────┬─────────────┘
           │               │            │
           │ 1:N           │ 1:N        │ 1:N
           │               │            │
 ┌─────────▼──────┐  ┌────▼────────┐  ┌▼──────────────┐
 │   decisions    │  │commitments  │  │     risks     │
 │ - description  │  │ - owner_id  │  │ - severity    │
 │ - rationale    │  │ - due_date  │  │ - mitigation  │
 │ - maker        │  │ - status    │  │ - owner_id    │
 └────────────────┘  └─────┬───────┘  └───────────────┘
                           │
                           │ N:1 (internal) OR N:1 (external)
                           │
              ┌────────────▼──────────────┐
              │   external_contacts       │
              │ - email (unique)          │
              │ - name, organization      │
              │ - contact_preferences     │
              └───────────────────────────┘

┌──────────────────────────┐         ┌─────────────────────────┐
│    follow_up_actions     │         │      attachments        │
│  - after_action_id       │         │  - after_action_id      │
│  - description           │         │  - file_name, file_size │
│  - owner_id (optional)   │         │  - storage_url          │
│  - due_date (optional)   │         │  - scan_status          │
└──────────────────────────┘         └─────────────────────────┘

┌─────────────────────────────────────┐
│        version_snapshots            │
│  - after_action_id                  │
│  - version_number                   │
│  - snapshot_data (JSONB)            │
│  - change_diff (JSONB)              │
│  - created_by, approved_by          │
└─────────────────────────────────────┘
```

## Entity Definitions

### 1. after_action_records

**Purpose**: Core entity representing complete after-action documentation for an engagement

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| engagement_id | UUID | NOT NULL, FOREIGN KEY → engagements(id) | Link to source engagement |
| dossier_id | UUID | NOT NULL, FOREIGN KEY → dossiers(id) | Link to parent dossier |
| title | TEXT | NOT NULL, LENGTH 5-200 | Short descriptive title |
| description | TEXT | NULL | Detailed context and summary |
| confidentiality_level | ENUM | NOT NULL, DEFAULT 'internal' | public \| internal \| confidential \| secret |
| status | ENUM | NOT NULL, DEFAULT 'draft' | draft \| published \| edit_pending |
| attendance_list | JSONB | NOT NULL, DEFAULT '[]' | Array of {name, role, organization} |
| created_by | UUID | NOT NULL, FOREIGN KEY → users(id) | Creator user ID |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_by | UUID | NULL, FOREIGN KEY → users(id) | Last updater user ID |
| updated_at | TIMESTAMPTZ | NULL | Last update timestamp |
| published_by | UUID | NULL, FOREIGN KEY → users(id) | Publisher user ID |
| published_at | TIMESTAMPTZ | NULL | Publication timestamp |
| edit_requested_by | UUID | NULL, FOREIGN KEY → users(id) | Edit requester user ID |
| edit_requested_at | TIMESTAMPTZ | NULL | Edit request timestamp |
| edit_request_reason | TEXT | NULL | Reason for edit request |
| edit_approved_by | UUID | NULL, FOREIGN KEY → users(id) | Edit approver user ID |
| edit_approved_at | TIMESTAMPTZ | NULL | Edit approval timestamp |
| edit_rejection_reason | TEXT | NULL | Reason for edit rejection |
| _version | INTEGER | NOT NULL, DEFAULT 1 | Optimistic locking version |

**Indexes**:
- `idx_after_action_engagement` ON engagement_id
- `idx_after_action_dossier` ON dossier_id
- `idx_after_action_status` ON status
- `idx_after_action_created_by` ON created_by
- `idx_after_action_published_at` ON published_at WHERE published_at IS NOT NULL
- `idx_after_action_updated_at` ON updated_at (for incremental sync)

**Validation Rules**:
- `title` must be 5-200 characters
- `status` transitions: draft → published → edit_pending → published
- `published_at` must be NULL when status='draft'
- `published_by` must be NOT NULL when status='published' or 'edit_pending'
- `edit_requested_by` must be NOT NULL when status='edit_pending'
- Cannot delete if status='published' (archive instead)

**State Machine**:
```
draft ──publish()──→ published ──request_edit()──→ edit_pending ──┐
  ▲                                                                 │
  │                                                                 │
  └──────────────────────approve_edit()─────────────────────────────┤
                                                                    │
                         reject_edit()──────────────────────────────┘
```

---

### 2. decisions

**Purpose**: Individual decisions made during the engagement

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| after_action_id | UUID | NOT NULL, FOREIGN KEY → after_action_records(id) ON DELETE CASCADE | Parent after-action |
| description | TEXT | NOT NULL, LENGTH 10-2000 | Decision description |
| rationale | TEXT | NULL | Reasoning behind decision |
| decision_maker | TEXT | NOT NULL | Name/role of decision maker |
| decided_at | TIMESTAMPTZ | NOT NULL | When decision was made |
| supporting_context | TEXT | NULL | Additional context |
| ai_extracted | BOOLEAN | NOT NULL, DEFAULT false | Whether extracted by AI |
| confidence_score | NUMERIC(3,2) | NULL, CHECK >= 0 AND <= 1 | AI confidence (0.00-1.00) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation time |

**Indexes**:
- `idx_decisions_after_action` ON after_action_id
- `idx_decisions_ai_extracted` ON ai_extracted WHERE ai_extracted = true

**Validation Rules**:
- `description` must be 10-2000 characters
- `confidence_score` must be between 0.00 and 1.00
- `confidence_score` required when `ai_extracted=true`
- `decided_at` must be ≤ current timestamp

---

### 3. commitments

**Purpose**: Action items and deliverables agreed upon during engagement

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| after_action_id | UUID | NOT NULL, FOREIGN KEY → after_action_records(id) ON DELETE CASCADE | Parent after-action |
| dossier_id | UUID | NOT NULL, FOREIGN KEY → dossiers(id) | Parent dossier (denormalized for queries) |
| description | TEXT | NOT NULL, LENGTH 10-2000 | Commitment description |
| owner_type | ENUM | NOT NULL | internal \| external |
| owner_internal_id | UUID | NULL, FOREIGN KEY → users(id) | Internal user owner |
| owner_external_id | UUID | NULL, FOREIGN KEY → external_contacts(id) | External contact owner |
| due_date | DATE | NOT NULL | Commitment due date |
| priority | ENUM | NOT NULL, DEFAULT 'medium' | low \| medium \| high \| critical |
| status | ENUM | NOT NULL, DEFAULT 'pending' | pending \| in_progress \| completed \| cancelled \| overdue |
| tracking_type | ENUM | NOT NULL | automatic \| manual |
| completion_notes | TEXT | NULL | Notes on completion/cancellation |
| completed_at | TIMESTAMPTZ | NULL | When completed |
| ai_extracted | BOOLEAN | NOT NULL, DEFAULT false | Whether extracted by AI |
| confidence_score | NUMERIC(3,2) | NULL, CHECK >= 0 AND <= 1 | AI confidence (0.00-1.00) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation time |
| updated_at | TIMESTAMPTZ | NULL | Last status update time |

**Indexes**:
- `idx_commitments_after_action` ON after_action_id
- `idx_commitments_dossier` ON dossier_id
- `idx_commitments_internal_owner` ON owner_internal_id WHERE owner_type='internal'
- `idx_commitments_external_owner` ON owner_external_id WHERE owner_type='external'
- `idx_commitments_due_date` ON due_date
- `idx_commitments_status` ON status

**Validation Rules**:
- `description` must be 10-2000 characters
- `owner_internal_id` required when `owner_type='internal'`, must be NULL otherwise
- `owner_external_id` required when `owner_type='external'`, must be NULL otherwise
- `due_date` must be ≥ after_action.created_at date
- `tracking_type='automatic'` only allowed when `owner_type='internal'`
- `tracking_type='manual'` required when `owner_type='external'`
- `completed_at` required when `status='completed'`
- Status auto-updates to 'overdue' when `due_date < current_date AND status IN ('pending', 'in_progress')`

**Triggers**:
- Update `updated_at` on status change
- Auto-create task record when after-action is published (via Edge Function, not DB trigger)

---

### 4. external_contacts

**Purpose**: Non-system users who can be assigned commitments

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| email | TEXT | NOT NULL, UNIQUE (case-insensitive) | Contact email |
| name | TEXT | NOT NULL, LENGTH 2-100 | Full name |
| organization | TEXT | NULL | Organization/affiliation |
| email_enabled | BOOLEAN | NOT NULL, DEFAULT true | Opt-in for email notifications |
| contact_notes | TEXT | NULL | Internal notes about contact |
| created_by | UUID | NOT NULL, FOREIGN KEY → users(id) | Who created this contact |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NULL | Last update timestamp |

**Indexes**:
- `idx_external_contacts_email` ON LOWER(email) (case-insensitive search)
- `idx_external_contacts_name_trgm` USING gin (name gin_trgm_ops) (fuzzy search)

**Validation Rules**:
- `email` must match regex: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
- `email` must be lowercase (enforced via trigger)
- `name` must be 2-100 characters
- Cannot delete if referenced by any commitment (enforce via foreign key constraint)

**Triggers**:
- Lowercase email on insert/update for case-insensitive uniqueness

---

### 5. risks

**Purpose**: Risks identified during engagement

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| after_action_id | UUID | NOT NULL, FOREIGN KEY → after_action_records(id) ON DELETE CASCADE | Parent after-action |
| description | TEXT | NOT NULL, LENGTH 10-2000 | Risk description |
| severity | ENUM | NOT NULL | low \| medium \| high \| critical |
| likelihood | ENUM | NOT NULL | rare \| unlikely \| possible \| likely \| certain |
| mitigation_strategy | TEXT | NULL | How to mitigate the risk |
| owner_id | UUID | NULL, FOREIGN KEY → users(id) | User responsible for monitoring |
| ai_extracted | BOOLEAN | NOT NULL, DEFAULT false | Whether extracted by AI |
| confidence_score | NUMERIC(3,2) | NULL, CHECK >= 0 AND <= 1 | AI confidence (0.00-1.00) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation time |

**Indexes**:
- `idx_risks_after_action` ON after_action_id
- `idx_risks_severity` ON severity
- `idx_risks_owner` ON owner_id WHERE owner_id IS NOT NULL

**Validation Rules**:
- `description` must be 10-2000 characters
- Risk score (severity × likelihood) calculated for prioritization

**Calculated Fields**:
- `risk_score`: INTEGER = (severity_value * likelihood_value) where:
  - severity_value: low=1, medium=2, high=3, critical=4
  - likelihood_value: rare=1, unlikely=2, possible=3, likely=4, certain=5

---

### 6. follow_up_actions

**Purpose**: Next steps or actions needed (may have TBD owner/date initially)

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| after_action_id | UUID | NOT NULL, FOREIGN KEY → after_action_records(id) ON DELETE CASCADE | Parent after-action |
| description | TEXT | NOT NULL, LENGTH 10-2000 | Action description |
| owner_id | UUID | NULL, FOREIGN KEY → users(id) | Owner (may be TBD) |
| due_date | DATE | NULL | Due date (may be TBD) |
| ai_extracted | BOOLEAN | NOT NULL, DEFAULT false | Whether extracted by AI |
| confidence_score | NUMERIC(3,2) | NULL, CHECK >= 0 AND <= 1 | AI confidence (0.00-1.00) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation time |

**Indexes**:
- `idx_follow_up_actions_after_action` ON after_action_id
- `idx_follow_up_actions_owner` ON owner_id WHERE owner_id IS NOT NULL

**Validation Rules**:
- `description` must be 10-2000 characters
- `due_date` should be ≥ current date if specified (warning, not error)

**Notes**:
- Follow-up actions differ from commitments: they may not have assigned owners/dates yet
- Can be converted to commitments later once details are determined

---

### 7. attachments

**Purpose**: Supporting documents and evidence

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| after_action_id | UUID | NOT NULL, FOREIGN KEY → after_action_records(id) ON DELETE CASCADE | Parent after-action |
| file_name | TEXT | NOT NULL | Original filename |
| file_size | BIGINT | NOT NULL, CHECK > 0 | File size in bytes |
| file_type | TEXT | NOT NULL | MIME type |
| storage_path | TEXT | NOT NULL | Supabase Storage path |
| storage_url | TEXT | NULL | Signed URL (24h expiry) |
| scan_status | ENUM | NOT NULL, DEFAULT 'pending' | pending \| clean \| infected \| failed |
| scan_result | TEXT | NULL | ClamAV scan output |
| uploaded_by | UUID | NOT NULL, FOREIGN KEY → users(id) | Uploader user ID |
| uploaded_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Upload timestamp |

**Indexes**:
- `idx_attachments_after_action` ON after_action_id
- `idx_attachments_scan_status` ON scan_status WHERE scan_status='pending'
- `idx_attachments_uploaded_by` ON uploaded_by

**Validation Rules**:
- `file_size` must be ≤ 100MB (104857600 bytes)
- `file_type` must be in allowed list: PDF, DOCX, XLSX, PPTX, PNG, JPG, TXT, CSV
- Max 10 attachments per after_action_id (enforced via application logic)
- Cannot download when `scan_status='infected'` or `scan_status='pending'`

**Triggers**:
- Generate signed URL on select (via Edge Function, not stored in DB for security)
- Trigger virus scan Edge Function on insert

---

### 8. version_snapshots

**Purpose**: Historical versions for audit trail and rollback

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| after_action_id | UUID | NOT NULL, FOREIGN KEY → after_action_records(id) ON DELETE CASCADE | Parent after-action |
| version_number | INTEGER | NOT NULL, CHECK > 0 | Sequential version number |
| snapshot_data | JSONB | NOT NULL | Full record content at version time |
| change_diff | JSONB | NULL | Field-level changes from previous version |
| version_reason | TEXT | NULL | Why version was created |
| created_by | UUID | NULL, FOREIGN KEY → users(id) | Who triggered version |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Version creation time |
| approved_by | UUID | NULL, FOREIGN KEY → users(id) | Who approved (if applicable) |
| approved_at | TIMESTAMPTZ | NULL | Approval timestamp |

**Indexes**:
- `idx_version_snapshots_after_action` ON after_action_id
- `idx_version_snapshots_version` ON (after_action_id, version_number) UNIQUE

**Validation Rules**:
- `version_number` must be sequential (1, 2, 3, ...)
- Cannot delete version snapshots (immutable audit trail)
- `snapshot_data` must contain complete after_action_record + related entities (decisions, commitments, risks, follow_ups)

**Triggers**:
- Create snapshot on after_action status change from 'edit_pending' to 'published'
- Calculate `change_diff` by comparing current snapshot_data to previous version

---

## Relationships Summary

| Parent Entity | Child Entity | Relationship | Cascade |
|---------------|--------------|--------------|---------|
| dossiers | after_action_records | 1:N | RESTRICT |
| engagements | after_action_records | 1:N | RESTRICT |
| users | after_action_records (creator) | 1:N | RESTRICT |
| users | after_action_records (publisher) | 1:N | RESTRICT |
| after_action_records | decisions | 1:N | CASCADE |
| after_action_records | commitments | 1:N | CASCADE |
| after_action_records | risks | 1:N | CASCADE |
| after_action_records | follow_up_actions | 1:N | CASCADE |
| after_action_records | attachments | 1:N | CASCADE |
| after_action_records | version_snapshots | 1:N | CASCADE |
| users | commitments (internal owner) | 1:N | RESTRICT |
| external_contacts | commitments (external owner) | 1:N | RESTRICT |
| users | risks (owner) | 1:N | SET NULL |
| users | follow_up_actions (owner) | 1:N | SET NULL |
| users | external_contacts (creator) | 1:N | RESTRICT |
| users | attachments (uploader) | 1:N | RESTRICT |

**Cascade Behavior**:
- CASCADE: Delete children when parent is deleted (cleanup)
- RESTRICT: Prevent deletion if children exist (data integrity)
- SET NULL: Nullify foreign key when parent is deleted (preserve record)

---

## WatermelonDB Schema (Mobile Offline)

For mobile offline-first architecture, the following entities are replicated to WatermelonDB:

**Replicated Tables**:
- `after_action_records` (full table)
- `decisions` (full table)
- `commitments` (full table)
- `risks` (full table)
- `follow_up_actions` (full table)
- `external_contacts` (full table, cached for offline assignment)
- `attachments` (metadata only, files queued for download/upload)

**Sync Strategy**:
- Incremental sync using `updated_at > last_sync_timestamp`
- Optimistic locking via `_version` column
- Conflict resolution via hybrid approach (auto-merge + user prompt)

**Not Replicated** (server-only):
- `version_snapshots` (audit trail, too large for mobile storage)
- Attachment file blobs (queued for background upload/download)

---

## Data Integrity Constraints

1. **After-Action Status Transitions**: Enforced via application logic (state machine pattern)
2. **Commitment Owner Exclusivity**: CHECK constraint ensures only one of (owner_internal_id, owner_external_id) is NOT NULL
3. **Email Uniqueness**: Case-insensitive unique index on external_contacts.email
4. **Attachment Limits**: Application logic enforces max 10 attachments and 100MB size limit
5. **AI Confidence Scores**: CHECK constraint ensures range 0.00-1.00
6. **Version Snapshot Immutability**: No UPDATE/DELETE permissions granted, INSERT only

---

## RLS Policies

All tables inherit base RLS policies:

**after_action_records**:
- SELECT: User has dossier assignment for dossier_id
- INSERT: User has dossier assignment AND role IN ('staff', 'supervisor', 'admin')
- UPDATE: User has dossier assignment AND (user is creator OR user has supervisor role) AND status allows edit
- DELETE: User has dossier assignment AND user is creator AND status='draft'

**Child Entities** (decisions, commitments, risks, follow_up_actions, attachments):
- Inherit parent after_action_record RLS via foreign key relationship
- Additional policy: Commitment.owner_internal_id = auth.uid() (users can always view their own commitments)

**external_contacts**:
- SELECT: Any authenticated user (needed for assignment dropdown)
- INSERT: Any authenticated user with role IN ('staff', 'supervisor', 'admin')
- UPDATE: User is creator OR user has supervisor role
- DELETE: Restricted (foreign key constraints prevent deletion if referenced)

**version_snapshots**:
- SELECT: User has dossier assignment for parent after_action's dossier_id
- INSERT: System only (via Edge Function)
- UPDATE/DELETE: Denied (immutable audit trail)

---

## Migration Strategy

Migrations will be created in this order:

1. `YYYYMMDDHHMMSS_create_external_contacts.sql` (no dependencies)
2. `YYYYMMDDHHMMSS_create_after_action_records.sql` (depends on engagements, dossiers, users)
3. `YYYYMMDDHHMMSS_create_decisions.sql` (depends on after_action_records)
4. `YYYYMMDDHHMMSS_create_commitments.sql` (depends on after_action_records, users, external_contacts)
5. `YYYYMMDDHHMMSS_create_risks.sql` (depends on after_action_records, users)
6. `YYYYMMDDHHMMSS_create_follow_up_actions.sql` (depends on after_action_records, users)
7. `YYYYMMDDHHMMSS_create_attachments.sql` (depends on after_action_records, users)
8. `YYYYMMDDHHMMSS_create_version_snapshots.sql` (depends on after_action_records, users)
9. `YYYYMMDDHHMMSS_add_after_action_rls_policies.sql` (RLS policies for all tables)
10. `YYYYMMDDHHMMSS_add_after_action_indexes.sql` (performance indexes)
11. `YYYYMMDDHHMMSS_add_after_action_triggers.sql` (lowercase email, auto-update timestamps)

**Total Tables**: 8 new tables  
**Total Indexes**: 27 indexes  
**Total RLS Policies**: 24 policies (3 per table on average)

---

## Next Steps

Data model is complete. Proceed to generate API contracts in `/contracts/` directory.
