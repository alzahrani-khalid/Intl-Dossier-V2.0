# Data Model: Resolve Critical Issues in Core Module Implementation

**Date**: 2025-01-27  
**Feature**: 003-resolve-critical-issues  
**Status**: Complete

## Entity Overview

This data model defines the complete entity structure for the GASTAT International Dossier System, resolving all critical issues identified in spec 002.

## Core Entities

### 1. User
**Purpose**: System user with authentication, permissions, and preferences  
**Table**: `users`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Encrypted password |
| first_name | VARCHAR(100) | NOT NULL | User's first name |
| last_name | VARCHAR(100) | NOT NULL | User's last name |
| language_preference | ENUM | NOT NULL | 'en' or 'ar' |
| mfa_enabled | BOOLEAN | DEFAULT false | Multi-factor authentication status |
| mfa_secret | VARCHAR(255) | NULL | TOTP secret for MFA |
| role | ENUM | NOT NULL | 'admin', 'user', 'viewer' |
| is_active | BOOLEAN | DEFAULT true | Account status |
| last_login | TIMESTAMP | NULL | Last login timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Validation Rules**:
- Email must be valid format
- Password must meet security requirements
- Language preference must be supported
- MFA secret required when MFA enabled

### 2. Country
**Purpose**: Nation entity with multilingual support and ISO codes  
**Table**: `countries`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique country identifier |
| name_en | VARCHAR(255) | NOT NULL | English name |
| name_ar | VARCHAR(255) | NOT NULL | Arabic name |
| iso_alpha2 | CHAR(2) | UNIQUE, NOT NULL | ISO 3166-1 alpha-2 code |
| iso_alpha3 | CHAR(3) | UNIQUE, NOT NULL | ISO 3166-1 alpha-3 code |
| region | VARCHAR(100) | NOT NULL | Geographic region |
| status | ENUM | NOT NULL | 'active', 'inactive', 'suspended' |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Validation Rules**:
- ISO codes must be valid according to ISO 3166-1
- Names must be provided in both languages
- Region must be from predefined list

### 3. Organization
**Purpose**: Entity with hierarchical structure and country associations  
**Table**: `organizations`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique organization identifier |
| name | VARCHAR(255) | NOT NULL | Organization name |
| type | ENUM | NOT NULL | 'government', 'ngo', 'international', 'private' |
| country_id | UUID | FOREIGN KEY | Associated country |
| parent_organization_id | UUID | FOREIGN KEY | Parent organization (self-reference) |
| status | ENUM | NOT NULL | 'active', 'inactive', 'suspended' |
| description | TEXT | NULL | Organization description |
| website | VARCHAR(255) | NULL | Organization website |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Validation Rules**:
- Name must be unique within same parent
- Parent organization must exist and be different
- Country must be active
- Website must be valid URL format

### 4. MoU (Memorandum of Understanding)
**Purpose**: Agreement document with versioning and workflow states  
**Table**: `mous`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique MoU identifier |
| title | VARCHAR(255) | NOT NULL | MoU title |
| version | INTEGER | NOT NULL | Document version |
| status | ENUM | NOT NULL | Workflow state |
| organization_id | UUID | FOREIGN KEY | Associated organization |
| country_id | UUID | FOREIGN KEY | Associated country |
| document_path | VARCHAR(500) | NULL | File storage path |
| file_size | BIGINT | NULL | File size in bytes |
| mime_type | VARCHAR(100) | NULL | Document MIME type |
| effective_date | DATE | NULL | Effective date |
| expiry_date | DATE | NULL | Expiry date |
| description | TEXT | NULL | MoU description |
| created_by | UUID | FOREIGN KEY | Creator user |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Workflow States**: `draft`, `internal_review`, `external_review`, `negotiation`, `signed`, `active`, `renewed`, `expired`

**Validation Rules**:
- File size must not exceed 50MB
- MIME type must be allowed document type
- Effective date must be before expiry date
- Version must increment on updates

### 5. Event
**Purpose**: Scheduled activity with conflict detection and calendar integration  
**Table**: `events`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique event identifier |
| title | VARCHAR(255) | NOT NULL | Event title |
| description | TEXT | NULL | Event description |
| start_time | TIMESTAMP | NOT NULL | Event start time |
| end_time | TIMESTAMP | NOT NULL | Event end time |
| location | VARCHAR(255) | NULL | Event location |
| event_type | ENUM | NOT NULL | 'meeting', 'conference', 'workshop', 'other' |
| status | ENUM | NOT NULL | 'scheduled', 'in_progress', 'completed', 'cancelled' |
| is_recurring | BOOLEAN | DEFAULT false | Recurring event flag |
| recurrence_pattern | VARCHAR(100) | NULL | Recurrence pattern |
| created_by | UUID | FOREIGN KEY | Creator user |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Validation Rules**:
- End time must be after start time
- Recurring events must have pattern
- Location must be provided for in-person events

### 6. Forum/Conference
**Purpose**: Specialized event type with sessions and speakers  
**Table**: `forums`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique forum identifier |
| event_id | UUID | FOREIGN KEY | Associated event |
| forum_type | ENUM | NOT NULL | 'conference', 'seminar', 'workshop', 'summit' |
| agenda | JSONB | NULL | Event agenda structure |
| speakers | JSONB | NULL | Speaker information |
| capacity | INTEGER | NULL | Maximum attendees |
| registration_required | BOOLEAN | DEFAULT false | Registration requirement |
| registration_deadline | TIMESTAMP | NULL | Registration deadline |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Validation Rules**:
- Capacity must be positive if specified
- Registration deadline must be before event start
- Agenda must be valid JSON structure

### 7. Brief
**Purpose**: Summary document with structured content and attachments  
**Table**: `briefs`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique brief identifier |
| title | VARCHAR(255) | NOT NULL | Brief title |
| content | TEXT | NOT NULL | Brief content |
| summary | TEXT | NULL | Executive summary |
| attachments | JSONB | NULL | Attachment metadata |
| intelligence_report_id | UUID | FOREIGN KEY | Related intelligence report |
| country_id | UUID | FOREIGN KEY | Related country |
| organization_id | UUID | FOREIGN KEY | Related organization |
| status | ENUM | NOT NULL | 'draft', 'review', 'approved', 'published' |
| created_by | UUID | FOREIGN KEY | Creator user |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Validation Rules**:
- Content must not be empty
- Attachments must be valid file references
- Status must follow workflow progression

### 8. Intelligence Report
**Purpose**: Analytical output with data sources and confidence levels  
**Table**: `intelligence_reports`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique report identifier |
| title | VARCHAR(255) | NOT NULL | Report title |
| content | TEXT | NOT NULL | Report content |
| data_sources | JSONB | NOT NULL | Source information |
| confidence_level | ENUM | NOT NULL | 'low', 'medium', 'high', 'critical' |
| classification | ENUM | NOT NULL | 'public', 'internal', 'confidential', 'secret' |
| analysis_type | ENUM | NOT NULL | 'trend', 'pattern', 'prediction', 'assessment' |
| vector_embedding | VECTOR(1536) | NULL | pgvector embedding |
| status | ENUM | NOT NULL | 'draft', 'review', 'approved', 'published' |
| country_id | UUID | FOREIGN KEY | Related country |
| organization_id | UUID | FOREIGN KEY | Related organization |
| created_by | UUID | FOREIGN KEY | Creator user |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Workflow States**: `draft`, `review`, `approved`, `published`

**Validation Rules**:
- Data sources must be valid JSON array
- Confidence level must be appropriate for classification
- Vector embedding must be 1536 dimensions

### 9. Data Library Item
**Purpose**: File or document with metadata and access controls  
**Table**: `data_library_items`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique item identifier |
| name | VARCHAR(255) | NOT NULL | Item name |
| description | TEXT | NULL | Item description |
| file_path | VARCHAR(500) | NOT NULL | File storage path |
| file_size | BIGINT | NOT NULL | File size in bytes |
| mime_type | VARCHAR(100) | NOT NULL | File MIME type |
| file_hash | VARCHAR(64) | NOT NULL | SHA-256 file hash |
| version | INTEGER | DEFAULT 1 | File version |
| access_level | ENUM | NOT NULL | 'public', 'internal', 'confidential', 'secret' |
| tags | JSONB | NULL | Searchable tags |
| country_id | UUID | FOREIGN KEY | Related country |
| organization_id | UUID | FOREIGN KEY | Related organization |
| uploaded_by | UUID | FOREIGN KEY | Uploader user |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Validation Rules**:
- File size must not exceed 50MB
- MIME type must be allowed
- File hash must be valid SHA-256
- Access level must match user permissions

### 10. Permission Delegation
**Purpose**: Access control entity managing user permissions and role assignments  
**Table**: `permission_delegations`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique delegation identifier |
| user_id | UUID | FOREIGN KEY | User receiving permissions |
| delegated_by | UUID | FOREIGN KEY | User delegating permissions |
| entity_type | ENUM | NOT NULL | Entity type for permissions |
| entity_id | UUID | NULL | Specific entity ID (if applicable) |
| permissions | JSONB | NOT NULL | Permission details |
| expires_at | TIMESTAMP | NULL | Delegation expiry |
| is_active | BOOLEAN | DEFAULT true | Delegation status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Validation Rules**:
- User and delegator must be different
- Permissions must be valid JSON
- Expiry must be in future if specified

## Relationships

### One-to-Many Relationships
- Country → Organizations
- Country → Events
- Country → MoUs
- Country → Briefs
- Country → Intelligence Reports
- Country → Data Library Items
- Organization → MoUs
- Organization → Events
- Organization → Briefs
- Organization → Intelligence Reports
- Organization → Data Library Items
- User → MoUs (created_by)
- User → Events (created_by)
- User → Briefs (created_by)
- User → Intelligence Reports (created_by)
- User → Data Library Items (uploaded_by)
- Event → Forums

### Many-to-Many Relationships
- Users ↔ Events (participants)
- Users ↔ Organizations (memberships)
- Intelligence Reports ↔ Data Library Items (sources)

## Indexes

### Performance Indexes
- `countries(iso_alpha2, iso_alpha3)` - Fast country lookups
- `organizations(country_id, status)` - Country-based organization queries
- `events(start_time, end_time)` - Event conflict detection
- `mous(status, created_at)` - Workflow state queries
- `intelligence_reports(classification, status)` - Security-based filtering
- `data_library_items(tags)` - Tag-based search (GIN index)

### Search Indexes
- `countries(name_en, name_ar)` - Full-text search
- `organizations(name)` - Organization name search
- `events(title, description)` - Event content search
- `briefs(title, content)` - Brief content search
- `intelligence_reports(title, content)` - Report content search

## Constraints

### Data Integrity
- Foreign key constraints on all relationships
- Check constraints on enum values
- Unique constraints on business keys
- Not null constraints on required fields

### Business Rules
- File size limits (50MB maximum)
- Date range validations
- Workflow state transitions
- Permission inheritance rules
- Soft delete for audit trails

## Audit Trail

### Soft Delete Pattern
All entities include:
- `deleted_at` timestamp for soft deletes
- `deleted_by` user reference for audit
- Cascade soft delete for related entities

### Change Tracking
All entities include:
- `created_at` and `updated_at` timestamps
- `created_by` and `updated_by` user references
- Version tracking for documents

## Security Considerations

### Row Level Security (RLS)
- All tables have RLS policies enabled
- Policies based on user roles and permissions
- Country-based access restrictions
- Organization-based data isolation

### Data Encryption
- Sensitive fields encrypted at rest
- File uploads encrypted in storage
- Database connections use TLS
- API communications use HTTPS

This data model provides a complete foundation for the GASTAT International Dossier System with all critical issues from spec 002 resolved.
