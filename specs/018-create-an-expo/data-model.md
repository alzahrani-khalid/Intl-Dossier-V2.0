# Data Model: Mobile Application Local Storage

**Feature**: 018-create-an-expo
**Date**: 2025-10-10
**Storage**: WatermelonDB (SQLite) for offline-first local cache
**Server**: Supabase PostgreSQL 17 (existing backend)

---

## Overview

The mobile app uses **WatermelonDB** for local SQLite storage to enable offline-first data access. The local schema mirrors the server-side Supabase PostgreSQL schema for dossiers, briefs, intake requests, and related entities. **Synchronization** occurs bidirectionally when the device is online, with the server as the source of truth for all data (read-only mobile app).

### Sync Strategy
- **Incremental sync**: Only download changes since last sync timestamp
- **Offline storage limit**: Most recent 20 dossiers + all assigned dossiers (per user)
- **Automatic cleanup**: Remove older unassigned dossiers when storage limit reached
- **Conflict resolution**: Server wins (read-only app, no local changes to sync up)

---

## Entity Relationships Diagram

```
┌──────────────┐
│     User     │
└──────┬───────┘
       │
       │ has many
       ▼
┌──────────────┐         ┌──────────────┐
│  Assignment  │────────>│   Dossier    │
└──────────────┘         └──────┬───────┘
                                │
                  ┌─────────────┼─────────────┬──────────────┐
                  │             │             │              │
                  ▼             ▼             ▼              ▼
           ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐
           │ Country  │  │Organizatio│  │ Position │  │ Document │
           └──────────┘  │n          │  └──────────┘  └──────────┘
                         └───────────┘

┌──────────────┐         ┌──────────────┐
│    Brief     │         │IntakeRequest │
└──────────────┘         └──────────────┘

┌──────────────┐         ┌──────────────┐
│Notification  │         │  SyncStatus  │
└──────────────┘         └──────────────┘
```

---

## WatermelonDB Schema Definition

### 1. User

Represents the authenticated staff member. Single user per device (currentUser from Supabase Auth).

**Fields**:
- `id` (string, primary key) - Supabase Auth user UUID
- `email` (string, indexed) - User email address
- `name` (string) - Full name
- `role` (string) - User role (analyst, field_staff, intake_officer)
- `assigned_countries` (string, JSON array) - List of assigned country IDs
- `assigned_regions` (string, JSON array) - List of assigned region names
- `language` (string) - Preferred language (en, ar)
- `notification_preferences` (string, JSON object) - Notification settings
- `biometric_enabled` (boolean) - Biometric authentication enabled
- `created_at` (number, timestamp)
- `updated_at` (number, timestamp)
- `synced_at` (number, timestamp)

**Relationships**:
- Has many `assignments`
- Has many `notifications`

**Indexes**:
- `email` (unique)

---

### 2. Dossier

Represents a collection of information about international activities.

**Fields**:
- `id` (string, primary key) - Supabase dossier UUID
- `title` (string, indexed) - Dossier title
- `title_ar` (string) - Arabic title
- `description` (string) - Dossier description
- `description_ar` (string) - Arabic description
- `status` (string) - Status (draft, active, archived)
- `priority` (string) - Priority level (low, medium, high, urgent)
- `assigned_analyst_id` (string) - Foreign key to User
- `created_at` (number, timestamp, indexed)
- `updated_at` (number, timestamp)
- `synced_at` (number, timestamp)
- `is_assigned_to_user` (boolean, indexed) - Flag for user assignment (for storage cleanup)

**Relationships**:
- Belongs to `user` (assigned analyst)
- Has many `countries` (many-to-many via join table)
- Has many `organizations` (many-to-many via join table)
- Has many `positions`
- Has many `documents`
- Has many `assignments`

**Indexes**:
- `title` (full-text search)
- `created_at` (for sorting)
- `is_assigned_to_user` (for offline storage cleanup)

**Validation**:
- `title` required, min 3 characters
- `status` enum: draft, active, archived
- `priority` enum: low, medium, high, urgent

---

### 3. Country

Represents a nation involved in international activities.

**Fields**:
- `id` (string, primary key) - Supabase country UUID
- `name` (string, indexed) - Country name (English)
- `name_ar` (string, indexed) - Country name (Arabic)
- `iso_code` (string, unique, indexed) - ISO 3166-1 alpha-2 code
- `region` (string) - Geographical region
- `created_at` (number, timestamp)
- `updated_at` (number, timestamp)
- `synced_at` (number, timestamp)

**Relationships**:
- Has many `dossiers` (many-to-many)

**Indexes**:
- `name` (full-text search)
- `name_ar` (full-text search)
- `iso_code` (unique)

---

### 4. Organization

Represents an entity involved in international activities.

**Fields**:
- `id` (string, primary key) - Supabase organization UUID
- `name` (string, indexed) - Organization name (English)
- `name_ar` (string, indexed) - Organization name (Arabic)
- `type` (string) - Organization type (government, ngo, international, private)
- `country_id` (string) - Foreign key to Country (country of origin)
- `created_at` (number, timestamp)
- `updated_at` (number, timestamp)
- `synced_at` (number, timestamp)

**Relationships**:
- Belongs to `country`
- Has many `dossiers` (many-to-many)

**Indexes**:
- `name` (full-text search)
- `name_ar` (full-text search)
- `country_id` (foreign key)

---

### 5. Position

Represents a stance or viewpoint held by a country or organization.

**Fields**:
- `id` (string, primary key) - Supabase position UUID
- `title` (string, indexed) - Position title
- `title_ar` (string) - Arabic title
- `description` (string) - Position description
- `description_ar` (string) - Arabic description
- `dossier_id` (string, indexed) - Foreign key to Dossier
- `country_id` (string, nullable) - Foreign key to Country (if position is held by country)
- `organization_id` (string, nullable) - Foreign key to Organization (if position is held by org)
- `created_at` (number, timestamp)
- `updated_at` (number, timestamp)
- `synced_at` (number, timestamp)

**Relationships**:
- Belongs to `dossier`
- Belongs to `country` (optional)
- Belongs to `organization` (optional)
- Has many `documents`

**Indexes**:
- `title` (full-text search)
- `dossier_id` (foreign key)
- `country_id` (foreign key)
- `organization_id` (foreign key)

**Validation**:
- Either `country_id` OR `organization_id` must be set (not both, not neither)

---

### 6. Brief

Represents a policy document summarizing analysis and recommendations.

**Fields**:
- `id` (string, primary key) - Supabase brief UUID
- `title` (string, indexed) - Brief title
- `title_ar` (string) - Arabic title
- `summary` (string) - Executive summary
- `summary_ar` (string) - Arabic summary
- `content` (string) - Full brief content (Markdown)
- `content_ar` (string) - Arabic content (Markdown)
- `recommendations` (string, JSON array) - List of recommendation strings
- `author_id` (string) - Foreign key to User
- `status` (string) - Status (draft, published, archived)
- `created_at` (number, timestamp, indexed)
- `updated_at` (number, timestamp)
- `synced_at` (number, timestamp)

**Relationships**:
- Belongs to `user` (author)
- Has many `dossiers` (related dossiers, many-to-many)

**Indexes**:
- `title` (full-text search)
- `created_at` (for sorting)
- `status` (for filtering)

---

### 7. IntakeRequest

Represents a request to create a new dossier.

**Fields**:
- `id` (string, primary key) - Supabase intake request UUID
- `requester_name` (string) - Name of person requesting
- `requester_email` (string) - Email of requester
- `country_id` (string, nullable) - Foreign key to Country (if request involves a country)
- `organization_id` (string, nullable) - Foreign key to Organization (if request involves an org)
- `priority` (string) - Priority level (low, medium, high, urgent)
- `justification` (string) - Reason for request
- `justification_ar` (string) - Arabic justification
- `status` (string, indexed) - Status (pending, approved, rejected)
- `submission_date` (number, timestamp, indexed)
- `reviewed_by` (string, nullable) - Foreign key to User (intake officer who reviewed)
- `created_at` (number, timestamp)
- `updated_at` (number, timestamp)
- `synced_at` (number, timestamp)

**Relationships**:
- Belongs to `country` (optional)
- Belongs to `organization` (optional)
- Belongs to `user` (reviewer)

**Indexes**:
- `status` (for filtering)
- `submission_date` (for sorting)

**Validation**:
- Either `country_id` OR `organization_id` must be set
- `status` enum: pending, approved, rejected
- `priority` enum: low, medium, high, urgent

---

### 8. Document

Represents file attachments associated with dossiers, positions, or briefs.

**Fields**:
- `id` (string, primary key) - Supabase document UUID
- `filename` (string) - Original filename
- `file_type` (string) - MIME type (e.g., application/pdf, image/jpeg)
- `file_size` (number) - File size in bytes
- `storage_url` (string) - Supabase Storage URL
- `dossier_id` (string, nullable, indexed) - Foreign key to Dossier
- `position_id` (string, nullable, indexed) - Foreign key to Position
- `brief_id` (string, nullable, indexed) - Foreign key to Brief
- `is_cached_offline` (boolean) - Whether file is downloaded locally
- `local_uri` (string, nullable) - Local file path (Expo FileSystem)
- `upload_date` (number, timestamp)
- `created_at` (number, timestamp)
- `updated_at` (number, timestamp)
- `synced_at` (number, timestamp)

**Relationships**:
- Belongs to `dossier` (optional)
- Belongs to `position` (optional)
- Belongs to `brief` (optional)

**Indexes**:
- `dossier_id` (foreign key)
- `position_id` (foreign key)
- `brief_id` (foreign key)

**Validation**:
- One of `dossier_id`, `position_id`, or `brief_id` must be set

---

### 9. Assignment

Represents the association between a user and a work item (dossier, brief, intake request).

**Fields**:
- `id` (string, primary key) - Supabase assignment UUID
- `user_id` (string, indexed) - Foreign key to User
- `dossier_id` (string, nullable, indexed) - Foreign key to Dossier
- `brief_id` (string, nullable, indexed) - Foreign key to Brief
- `intake_request_id` (string, nullable, indexed) - Foreign key to IntakeRequest
- `assignment_date` (number, timestamp, indexed)
- `priority` (string) - Assignment priority (low, medium, high, urgent)
- `notification_sent` (boolean) - Whether push notification was sent
- `created_at` (number, timestamp)
- `updated_at` (number, timestamp)
- `synced_at` (number, timestamp)

**Relationships**:
- Belongs to `user`
- Belongs to `dossier` (optional)
- Belongs to `brief` (optional)
- Belongs to `intake_request` (optional)

**Indexes**:
- `user_id` (foreign key)
- `dossier_id` (foreign key)
- `brief_id` (foreign key)
- `intake_request_id` (foreign key)
- `assignment_date` (for sorting)

**Validation**:
- One of `dossier_id`, `brief_id`, or `intake_request_id` must be set

---

### 10. Notification

Represents a push notification event.

**Fields**:
- `id` (string, primary key) - Supabase notification UUID
- `user_id` (string, indexed) - Foreign key to User (recipient)
- `title` (string) - Notification title
- `title_ar` (string) - Arabic title
- `message` (string) - Notification message
- `message_ar` (string) - Arabic message
- `type` (string) - Notification type (assignment, update, reminder)
- `dossier_id` (string, nullable) - Related dossier ID
- `brief_id` (string, nullable) - Related brief ID
- `intake_request_id` (string, nullable) - Related intake request ID
- `read_status` (boolean, indexed) - Whether notification was read
- `created_at` (number, timestamp, indexed)
- `updated_at` (number, timestamp)
- `synced_at` (number, timestamp)

**Relationships**:
- Belongs to `user`
- May reference `dossier`, `brief`, or `intake_request`

**Indexes**:
- `user_id` (foreign key)
- `read_status` (for filtering)
- `created_at` (for sorting)

---

### 11. SyncStatus

Represents the synchronization state between local cache and server.

**Fields**:
- `id` (string, primary key) - Always "singleton" (single row)
- `last_sync_timestamp` (number, timestamp) - Last successful sync time
- `sync_in_progress` (boolean) - Whether sync is currently running
- `sync_error_message` (string, nullable) - Error message if last sync failed
- `pending_changes_count` (number) - Number of local changes waiting to sync (always 0 for read-only app)
- `updated_at` (number, timestamp)

**Note**: This is a singleton table (only one row) storing global sync state.

---

## State Transitions

### Dossier Status Lifecycle
```
draft → active → archived
```

### Brief Status Lifecycle
```
draft → published → archived
```

### Intake Request Status Lifecycle
```
pending → approved/rejected
```

---

## Offline Storage Cleanup Strategy

**Trigger**: When local storage exceeds limit (estimated by dossier count + file cache size)

**Strategy**:
1. Identify dossiers not assigned to current user (`is_assigned_to_user = false`)
2. Sort by `created_at` (oldest first)
3. Delete oldest dossiers until storage is under limit
4. Keep most recent 20 dossiers even if not assigned
5. NEVER delete assigned dossiers
6. Clean up orphaned documents (no parent dossier/brief)

**Implementation**: Background task triggered by `SyncService` after successful sync

---

## Validation Rules Summary

| Entity | Field | Rule |
|--------|-------|------|
| Dossier | title | Required, min 3 chars |
| Dossier | status | Enum: draft, active, archived |
| Dossier | priority | Enum: low, medium, high, urgent |
| Position | country_id OR organization_id | One must be set (XOR) |
| IntakeRequest | country_id OR organization_id | One must be set (XOR) |
| IntakeRequest | status | Enum: pending, approved, rejected |
| Assignment | dossier_id OR brief_id OR intake_request_id | One must be set |
| Document | dossier_id OR position_id OR brief_id | One must be set |

---

## Next Steps

See `contracts/` directory for API endpoint specifications that populate this local data model via sync operations.
