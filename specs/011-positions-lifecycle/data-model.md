# Data Model — Positions Lifecycle

Use existing `positions` table (backend/migrations/003_create_core_entities.sql).

Add tables:

### position_versions

- id (uuid, pk)
- position_id (uuid)
- version_number (int)
- content_en (text)
- content_ar (text)
- changes_summary (text)
- changed_by (uuid)
- changed_at (timestamptz)

### position_approvals

- id (uuid)
- position_id (uuid)
- approver_id (uuid)
- role (text)
- approved (bool)
- comments (text)
- approved_at (timestamptz)

### position_publications

- id (uuid)
- position_id (uuid)
- published_at (timestamptz)
- published_by (uuid)
- audience (text[])
