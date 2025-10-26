# Data Model: Contact Directory

**Feature**: 027-contact-directory
**Date**: 2025-10-26
**Database**: PostgreSQL 15+ (Supabase)

## Entity Relationship Diagram

```
┌─────────────────┐
│   Contact       │
├─────────────────┤
│ id (PK)         │─────────┐
│ full_name       │         │
│ organization_id │────┐    │
│ position        │    │    │
│ email_addresses │    │    │
│ phone_numbers   │    │    │
│ notes           │    │    │
│ tags            │─┐  │    │
│ created_by      │ │  │    │
│ created_at      │ │  │    │
│ updated_at      │ │  │    │
└─────────────────┘ │  │    │
                    │  │    │
┌─────────────────┐ │  │    │
│  Organization   │ │  │    │
├─────────────────┤ │  │    │
│ id (PK)         │◄┘  │    │
│ name            │    │    │
│ type            │    │    │
│ country         │    │    │
│ primary_address │    │    │
│ created_at      │    │    │
│ updated_at      │    │    │
└─────────────────┘    │    │
                       │    │
┌─────────────────┐    │    │
│      Tag        │    │    │
├─────────────────┤    │    │
│ id (PK)         │◄───┘    │
│ name            │         │
│ category        │         │
│ color           │         │
│ created_at      │         │
└─────────────────┘         │
                            │
┌─────────────────┐         │
│ InteractionNote │         │
├─────────────────┤         │
│ id (PK)         │         │
│ contact_id (FK) │◄────────┘
│ date            │
│ type            │
│ details         │
│ attachments     │
│ created_by      │
│ created_at      │
└─────────────────┘

┌─────────────────┐         ┌─────────────────┐
│  Relationship   │         │ DocumentSource  │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ from_contact_id │─────┐   │ file_name       │
│ to_contact_id   │─────┼───│ file_type       │
│ relationship_   │     │   │ upload_date     │
│ type            │     │   │ extracted_      │
│ start_date      │     │   │ contacts_count  │
│ end_date        │     │   │ processing_     │
│ created_at      │     │   │ status          │
└─────────────────┘     │   │ storage_path    │
                        │   │ uploaded_by     │
                        │   │ created_at      │
                        │   └─────────────────┘
                        │
                        └──► Contact (bidirectional)
```

---

## 1. Contact

**Purpose**: Core entity representing an individual person with contact information.

**Table**: `contacts`

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `full_name` | `text` | NOT NULL | Person's full name (supports Arabic/English) |
| `organization_id` | `uuid` | FOREIGN KEY → organizations(id) | Associated organization |
| `position` | `text` | NULL | Job title or role |
| `email_addresses` | `text[]` | NULL | Array of email addresses |
| `phone_numbers` | `text[]` | NULL | Array of phone numbers (international format) |
| `notes` | `text` | NULL | General notes about the contact |
| `tags` | `uuid[]` | NULL | Array of tag IDs for categorization |
| `source_type` | `text` | DEFAULT 'manual', CHECK (source_type IN ('manual', 'business_card', 'document')) | How contact was added |
| `source_document_id` | `uuid` | FOREIGN KEY → document_sources(id), NULL | Source document if extracted |
| `ocr_confidence` | `numeric(5,2)` | NULL, CHECK (ocr_confidence BETWEEN 0 AND 100) | OCR extraction confidence (0-100%) |
| `duplicate_of` | `uuid` | FOREIGN KEY → contacts(id), NULL | Reference to original if duplicate |
| `is_archived` | `boolean` | DEFAULT false | Soft delete flag |
| `created_by` | `uuid` | NOT NULL, FOREIGN KEY → auth.users(id) | User who created contact |
| `created_at` | `timestamptz` | DEFAULT now() | Creation timestamp |
| `updated_at` | `timestamptz` | DEFAULT now() | Last update timestamp |

### Indexes

```sql
CREATE INDEX idx_contacts_full_name ON contacts USING gin (to_tsvector('simple', full_name));
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX idx_contacts_email_addresses ON contacts USING gin (email_addresses);
CREATE INDEX idx_contacts_tags ON contacts USING gin (tags);
CREATE INDEX idx_contacts_created_by ON contacts(created_by);
CREATE INDEX idx_contacts_source_type ON contacts(source_type);
```

### Validation Rules (Application-Level)

- `full_name`: Min 2 characters, max 200 characters
- `email_addresses`: Valid email format (RFC 5322)
- `phone_numbers`: International format with country code (E.164)
- `position`: Max 200 characters
- `notes`: Max 5000 characters

### Example Data

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "خالد الزهراني",
  "organization_id": "660e8400-e29b-41d4-a716-446655440001",
  "position": "Director of International Cooperation",
  "email_addresses": ["khalid@example.gov.sa", "k.alzahrani@stats.gov.sa"],
  "phone_numbers": ["+966501234567"],
  "notes": "Met at UN Statistical Commission 2024. Key stakeholder for GASTAT-Saudi Arabia data exchange.",
  "tags": ["770e8400-e29b-41d4-a716-446655440010"],
  "source_type": "business_card",
  "ocr_confidence": 92.5,
  "created_by": "880e8400-e29b-41d4-a716-446655440099",
  "created_at": "2025-10-26T10:30:00Z"
}
```

---

## 2. Organization

**Purpose**: Represents an organization or partnership entity that contacts are affiliated with.

**Table**: `organizations`

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | `text` | NOT NULL | Organization name |
| `type` | `text` | NOT NULL, CHECK (type IN ('government', 'ngo', 'private_sector', 'international', 'other')) | Organization category |
| `country` | `text` | NULL | ISO 3166-1 alpha-2 country code |
| `primary_address` | `jsonb` | NULL | Address object (street, city, postal_code, country) |
| `website` | `text` | NULL | Official website URL |
| `created_at` | `timestamptz` | DEFAULT now() | Creation timestamp |
| `updated_at` | `timestamptz` | DEFAULT now() | Last update timestamp |

### Indexes

```sql
CREATE INDEX idx_organizations_name ON organizations USING gin (to_tsvector('simple', name));
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_country ON organizations(country);
```

### Validation Rules

- `name`: Min 2 characters, max 300 characters
- `country`: Valid ISO 3166-1 alpha-2 code (e.g., "SA", "US", "GB")
- `website`: Valid URL format
- `primary_address`: JSON schema validation for {street, city, postal_code, country}

### Example Data

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "الهيئة العامة للإحصاء",
  "type": "government",
  "country": "SA",
  "primary_address": {
    "street": "King Khalid Road",
    "city": "Riyadh",
    "postal_code": "11481",
    "country": "SA"
  },
  "website": "https://www.stats.gov.sa",
  "created_at": "2025-10-26T08:00:00Z"
}
```

---

## 3. InteractionNote

**Purpose**: Records engagements, meetings, calls, or emails with contacts to preserve institutional knowledge.

**Table**: `interaction_notes`

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `contact_id` | `uuid` | NOT NULL, FOREIGN KEY → contacts(id) ON DELETE CASCADE | Associated contact |
| `date` | `date` | NOT NULL | Interaction date |
| `type` | `text` | NOT NULL, CHECK (type IN ('meeting', 'email', 'call', 'conference', 'other')) | Interaction type |
| `details` | `text` | NOT NULL | Interaction summary or notes |
| `attendees` | `uuid[]` | NULL | Other contacts present (group meetings) |
| `attachments` | `text[]` | NULL | Array of file storage paths (meeting notes, emails) |
| `created_by` | `uuid` | NOT NULL, FOREIGN KEY → auth.users(id) | User who logged interaction |
| `created_at` | `timestamptz` | DEFAULT now() | Creation timestamp |
| `updated_at` | `timestamptz` | DEFAULT now() | Last update timestamp |

### Indexes

```sql
CREATE INDEX idx_interaction_notes_contact_id ON interaction_notes(contact_id);
CREATE INDEX idx_interaction_notes_date ON interaction_notes(date DESC);
CREATE INDEX idx_interaction_notes_type ON interaction_notes(type);
CREATE INDEX idx_interaction_notes_details ON interaction_notes USING gin (to_tsvector('simple', details));
CREATE INDEX idx_interaction_notes_created_by ON interaction_notes(created_by);
```

### Validation Rules

- `details`: Min 10 characters, max 10,000 characters
- `date`: Cannot be in the future (application-level check)
- `attendees`: All UUIDs must reference valid contacts
- `attachments`: Valid storage paths in Supabase Storage

### Example Data

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440020",
  "contact_id": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2024-11-15",
  "type": "meeting",
  "details": "Discussed bilateral data sharing agreement. Khalid expressed interest in harmonizing statistical classifications for trade data. Follow-up: Send draft MoU by end of month.",
  "attendees": ["551e8400-e29b-41d4-a716-446655440001"],
  "attachments": ["contacts/interactions/2024-11-15-meeting-notes.pdf"],
  "created_by": "880e8400-e29b-41d4-a716-446655440099",
  "created_at": "2024-11-15T16:00:00Z"
}
```

---

## 4. Relationship

**Purpose**: Defines connections between contacts (e.g., reporting structures, collaboration partners).

**Table**: `contact_relationships`

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `from_contact_id` | `uuid` | NOT NULL, FOREIGN KEY → contacts(id) ON DELETE CASCADE | Source contact |
| `to_contact_id` | `uuid` | NOT NULL, FOREIGN KEY → contacts(id) ON DELETE CASCADE | Target contact |
| `relationship_type` | `text` | NOT NULL, CHECK (relationship_type IN ('reports_to', 'collaborates_with', 'partner', 'colleague', 'other')) | Type of relationship |
| `start_date` | `date` | NULL | When relationship began |
| `end_date` | `date` | NULL | When relationship ended (if applicable) |
| `notes` | `text` | NULL | Additional context about relationship |
| `created_at` | `timestamptz` | DEFAULT now() | Creation timestamp |

### Indexes

```sql
CREATE INDEX idx_contact_relationships_from ON contact_relationships(from_contact_id);
CREATE INDEX idx_contact_relationships_to ON contact_relationships(to_contact_id);
CREATE INDEX idx_contact_relationships_type ON contact_relationships(relationship_type);
```

### Constraints

- `CHECK (from_contact_id != to_contact_id)` - Prevent self-relationships
- Unique constraint on (from_contact_id, to_contact_id, relationship_type) - Prevent duplicate relationships

### Validation Rules

- `end_date`: Must be after `start_date` if both are set
- `notes`: Max 1000 characters

### Example Data

```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440030",
  "from_contact_id": "551e8400-e29b-41d4-a716-446655440001",
  "to_contact_id": "550e8400-e29b-41d4-a716-446655440000",
  "relationship_type": "reports_to",
  "start_date": "2023-01-01",
  "notes": "Direct reporting relationship",
  "created_at": "2025-10-26T10:35:00Z"
}
```

---

## 5. Tag

**Purpose**: Categorization labels for filtering and organizing contacts by projects, topics, or regions.

**Table**: `tags`

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | `text` | NOT NULL, UNIQUE | Tag name (supports Arabic/English) |
| `category` | `text` | NOT NULL, CHECK (category IN ('project', 'topic', 'region', 'event', 'custom')) | Tag category |
| `color` | `text` | DEFAULT '#6B7280' | Hex color for UI display |
| `icon` | `text` | NULL | Icon identifier (e.g., 'project', 'globe', 'user') |
| `created_at` | `timestamptz` | DEFAULT now() | Creation timestamp |

### Indexes

```sql
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_category ON tags(category);
```

### Validation Rules

- `name`: Min 2 characters, max 50 characters, unique
- `color`: Valid hex color format (#RRGGBB)
- `category`: One of predefined categories

### Example Data

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440010",
  "name": "UN Statistical Commission",
  "category": "event",
  "color": "#3B82F6",
  "icon": "globe",
  "created_at": "2025-10-26T08:00:00Z"
}
```

---

## 6. DocumentSource

**Purpose**: Tracks uploaded documents (business cards, letters, invitations) used for bulk contact extraction.

**Table**: `document_sources`

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `file_name` | `text` | NOT NULL | Original file name |
| `file_type` | `text` | NOT NULL, CHECK (file_type IN ('business_card', 'invitation', 'letter', 'meeting_notes', 'other')) | Document category |
| `file_format` | `text` | NOT NULL, CHECK (file_format IN ('pdf', 'docx', 'jpg', 'png')) | File format |
| `file_size_bytes` | `integer` | NOT NULL | File size in bytes |
| `storage_path` | `text` | NOT NULL | Path in Supabase Storage |
| `upload_date` | `timestamptz` | DEFAULT now() | Upload timestamp |
| `extracted_contacts_count` | `integer` | DEFAULT 0 | Number of contacts extracted |
| `processing_status` | `text` | DEFAULT 'pending', CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) | OCR/extraction status |
| `processing_error` | `text` | NULL | Error message if failed |
| `ocr_language` | `text` | NULL, CHECK (ocr_language IN ('ar', 'en', 'mixed')) | Detected language |
| `uploaded_by` | `uuid` | NOT NULL, FOREIGN KEY → auth.users(id) | User who uploaded |
| `created_at` | `timestamptz` | DEFAULT now() | Creation timestamp |
| `updated_at` | `timestamptz` | DEFAULT now() | Last update timestamp |

### Indexes

```sql
CREATE INDEX idx_document_sources_uploaded_by ON document_sources(uploaded_by);
CREATE INDEX idx_document_sources_processing_status ON document_sources(processing_status);
CREATE INDEX idx_document_sources_file_type ON document_sources(file_type);
CREATE INDEX idx_document_sources_upload_date ON document_sources(upload_date DESC);
```

### Validation Rules

- `file_name`: Max 255 characters
- `file_size_bytes`: Max 50MB (52,428,800 bytes) enforced at application level
- `storage_path`: Must be valid Supabase Storage path
- `processing_error`: Max 500 characters

### Example Data

```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440040",
  "file_name": "business-card-khalid-alzahrani.jpg",
  "file_type": "business_card",
  "file_format": "jpg",
  "file_size_bytes": 2485760,
  "storage_path": "contacts/business-cards/2025/10/bb0e8400-khalid.jpg",
  "upload_date": "2025-10-26T10:25:00Z",
  "extracted_contacts_count": 1,
  "processing_status": "completed",
  "ocr_language": "ar",
  "uploaded_by": "880e8400-e29b-41d4-a716-446655440099",
  "created_at": "2025-10-26T10:25:00Z"
}
```

---

## Row Level Security (RLS) Policies

All tables MUST have RLS enabled with the following policies:

### Contacts

```sql
-- Users can view contacts they created or have been granted access to
CREATE POLICY "Users can view accessible contacts"
  ON contacts FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM contact_access
      WHERE contact_id = contacts.id AND user_id = auth.uid()
    )
  );

-- Users can create contacts
CREATE POLICY "Users can create contacts"
  ON contacts FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Users can update contacts they created
CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  USING (created_by = auth.uid());

-- Users can soft-delete contacts they created
CREATE POLICY "Users can archive own contacts"
  ON contacts FOR UPDATE
  USING (created_by = auth.uid() AND is_archived = false)
  WITH CHECK (is_archived = true);
```

### Organizations

```sql
-- Everyone can view organizations (public directory)
CREATE POLICY "Everyone can view organizations"
  ON organizations FOR SELECT
  USING (true);

-- Only authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

### InteractionNotes

```sql
-- Users can view notes for contacts they have access to
CREATE POLICY "Users can view accessible interaction notes"
  ON interaction_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE id = interaction_notes.contact_id
        AND (created_by = auth.uid() OR
             EXISTS (SELECT 1 FROM contact_access WHERE contact_id = contacts.id AND user_id = auth.uid()))
    )
  );

-- Users can create notes for accessible contacts
CREATE POLICY "Users can create interaction notes"
  ON interaction_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE id = interaction_notes.contact_id
        AND (created_by = auth.uid() OR
             EXISTS (SELECT 1 FROM contact_access WHERE contact_id = contacts.id AND user_id = auth.uid()))
    )
  );
```

### ContactRelationships

```sql
-- Users can view relationships for contacts they have access to
CREATE POLICY "Users can view accessible relationships"
  ON contact_relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE id IN (contact_relationships.from_contact_id, contact_relationships.to_contact_id)
        AND (created_by = auth.uid() OR
             EXISTS (SELECT 1 FROM contact_access WHERE contact_id = contacts.id AND user_id = auth.uid()))
    )
  );
```

### Tags

```sql
-- Everyone can view tags (shared vocabulary)
CREATE POLICY "Everyone can view tags"
  ON tags FOR SELECT
  USING (true);

-- Authenticated users can create tags
CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

### DocumentSources

```sql
-- Users can view documents they uploaded
CREATE POLICY "Users can view own documents"
  ON document_sources FOR SELECT
  USING (uploaded_by = auth.uid());

-- Users can upload documents
CREATE POLICY "Users can upload documents"
  ON document_sources FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());
```

---

## Audit Logging

All CRUD operations on `contacts`, `interaction_notes`, and `contact_relationships` MUST be logged to `audit_logs` table (FR-022, Constitution requirement).

### Audit Trigger Example

```sql
CREATE OR REPLACE FUNCTION log_contact_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (auth.uid(), 'CREATE', 'contact', NEW.id, row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', 'contact', NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
    VALUES (auth.uid(), 'DELETE', 'contact', OLD.id, row_to_json(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_contacts
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION log_contact_changes();
```

---

## Migration Script Location

**File**: `/supabase/migrations/20251026000001_create_contact_directory.sql`

This migration will include:
1. All 6 table definitions
2. Indexes for performance
3. RLS policies for security
4. Audit triggers for compliance
5. Seed data for testing (optional)

---

## Future Enhancements (Out of Scope for Initial Release)

- **Contact Sharing**: `contact_access` table for granular permission sharing
- **Contact History**: Temporal tables to track all field changes over time
- **Email Integration**: `email_threads` table to link contacts to email conversations
- **Calendar Integration**: `calendar_events` table to link contacts to meetings
- **Social Media Profiles**: JSONB field in contacts for LinkedIn, Twitter, etc.
- **Contact Deduplication**: ML-based duplicate detection and merge suggestions
- **Contact Scoring**: Engagement score based on interaction frequency

---

**Data Model Complete**: 6 entities, comprehensive RLS policies, audit logging, ready for implementation.
