# Data Model: Core Module Implementation

## Entity Definitions

### User
Primary entity representing system users with authentication and preferences.

**Fields:**
- `id`: UUID (Primary Key)
- `email`: String (Unique, Required)
- `username`: String (Unique, Required)
- `full_name`: String (Required)
- `language_preference`: Enum ['en', 'ar'] (Default: 'en')
- `timezone`: String (Default: 'UTC')
- `avatar_url`: String (Nullable)
- `role`: Enum ['admin', 'editor', 'viewer'] (Required)
- `is_active`: Boolean (Default: true)
- `mfa_enabled`: Boolean (Default: false)
- `last_login_at`: Timestamp (Nullable)
- `created_at`: Timestamp (Auto)
- `updated_at`: Timestamp (Auto)

**Relationships:**
- Has many Events (as creator)
- Has many MoUs (as owner)
- Has many Intelligence Reports (as author)

**Validation Rules:**
- Email must be valid format
- Username must be 3-30 characters, alphanumeric + underscore
- Password must meet complexity requirements (handled by Supabase Auth)

**State Transitions:**
- Active → Suspended (by admin)
- Suspended → Active (by admin)
- Any → Deleted (soft delete)

---

### Country
Represents nations with multilingual support and regional classification.

**Fields:**
- `id`: UUID (Primary Key)
- `iso_code_2`: String(2) (Unique, Required)
- `iso_code_3`: String(3) (Unique, Required)
- `name_en`: String (Required)
- `name_ar`: String (Required)
- `region`: Enum ['africa', 'americas', 'asia', 'europe', 'oceania'] (Required)
- `sub_region`: String (Nullable)
- `capital_en`: String (Nullable)
- `capital_ar`: String (Nullable)
- `population`: Integer (Nullable)
- `area_sq_km`: Integer (Nullable)
- `flag_url`: String (Nullable)
- `status`: Enum ['active', 'inactive'] (Default: 'active')
- `created_at`: Timestamp (Auto)
- `updated_at`: Timestamp (Auto)

**Relationships:**
- Has many Organizations
- Has many Events
- Referenced in MoUs (as party)

**Validation Rules:**
- ISO codes must be uppercase
- Names must be non-empty
- Population and area must be positive if provided

---

### Organization
Represents entities that interact with the system, with hierarchical support.

**Fields:**
- `id`: UUID (Primary Key)
- `code`: String (Unique, Required)
- `name_en`: String (Required)
- `name_ar`: String (Required)
- `type`: Enum ['government', 'ngo', 'private', 'international', 'academic'] (Required)
- `country_id`: UUID (Foreign Key → Country, Required)
- `parent_organization_id`: UUID (Foreign Key → Organization, Nullable)
- `website`: String (Nullable)
- `email`: String (Nullable)
- `phone`: String (Nullable)
- `address_en`: Text (Nullable)
- `address_ar`: Text (Nullable)
- `logo_url`: String (Nullable)
- `status`: Enum ['active', 'pending', 'suspended', 'inactive'] (Default: 'pending')
- `established_date`: Date (Nullable)
- `created_at`: Timestamp (Auto)
- `updated_at`: Timestamp (Auto)

**Relationships:**
- Belongs to Country
- Has many child Organizations (self-referential)
- Has many MoUs
- Has many Events

**Validation Rules:**
- Code must be 3-20 characters, uppercase
- Email must be valid format if provided
- Website must be valid URL if provided
- Parent organization cannot be self

---

### MoU (Memorandum of Understanding)
Represents agreements with comprehensive workflow and document management.

**Fields:**
- `id`: UUID (Primary Key)
- `reference_number`: String (Unique, Required)
- `title_en`: String (Required)
- `title_ar`: String (Required)
- `description_en`: Text (Nullable)
- `description_ar`: Text (Nullable)
- `workflow_state`: Enum ['draft', 'internal_review', 'external_review', 'negotiation', 'signed', 'active', 'renewed', 'expired'] (Default: 'draft')
- `primary_party_id`: UUID (Foreign Key → Organization, Required)
- `secondary_party_id`: UUID (Foreign Key → Organization, Required)
- `document_url`: String (Nullable)
- `document_version`: Integer (Default: 1)
- `signing_date`: Date (Nullable)
- `effective_date`: Date (Nullable)
- `expiry_date`: Date (Nullable)
- `auto_renewal`: Boolean (Default: false)
- `renewal_period_months`: Integer (Nullable)
- `owner_id`: UUID (Foreign Key → User, Required)
- `created_at`: Timestamp (Auto)
- `updated_at`: Timestamp (Auto)

**Relationships:**
- Belongs to primary Organization
- Belongs to secondary Organization
- Belongs to User (owner)
- Has many MoU Documents (versions)

**Validation Rules:**
- Reference number format: MOU-YYYY-NNNN
- Secondary party must differ from primary party
- Expiry date must be after effective date
- File size limit: 50MB
- Allowed file types: PDF, DOCX

**State Transitions:**
- draft → internal_review
- internal_review → external_review OR draft
- external_review → negotiation OR internal_review
- negotiation → signed OR external_review
- signed → active
- active → renewed OR expired
- expired → renewed (if within grace period)

---

### Event
Represents scheduled activities with conflict detection capabilities.

**Fields:**
- `id`: UUID (Primary Key)
- `title_en`: String (Required)
- `title_ar`: String (Required)
- `description_en`: Text (Nullable)
- `description_ar`: Text (Nullable)
- `type`: Enum ['meeting', 'conference', 'workshop', 'training', 'ceremony', 'other'] (Required)
- `start_datetime`: Timestamp (Required)
- `end_datetime`: Timestamp (Required)
- `timezone`: String (Required)
- `location_en`: String (Nullable)
- `location_ar`: String (Nullable)
- `venue_en`: String (Nullable)
- `venue_ar`: String (Nullable)
- `is_virtual`: Boolean (Default: false)
- `virtual_link`: String (Nullable)
- `country_id`: UUID (Foreign Key → Country, Nullable)
- `organizer_id`: UUID (Foreign Key → Organization, Required)
- `max_participants`: Integer (Nullable)
- `registration_required`: Boolean (Default: false)
- `registration_deadline`: Timestamp (Nullable)
- `status`: Enum ['draft', 'scheduled', 'ongoing', 'completed', 'cancelled'] (Default: 'draft')
- `created_by`: UUID (Foreign Key → User, Required)
- `created_at`: Timestamp (Auto)
- `updated_at`: Timestamp (Auto)

**Relationships:**
- Belongs to Country (optional)
- Belongs to Organization (organizer)
- Belongs to User (creator)
- Has many Event Participants
- Has many Event Documents

**Validation Rules:**
- End datetime must be after start datetime
- Virtual link required if is_virtual is true
- Registration deadline must be before start datetime

**Conflict Detection:**
- Check for overlapping events at same venue
- Check for participant availability conflicts
- Alert on national holiday conflicts

---

### Forum (extends Event)
Specialized event type for forums and conferences.

**Fields (additional to Event):**
- `agenda_url`: String (Nullable)
- `number_of_sessions`: Integer (Default: 1)
- `keynote_speakers`: JSONB (Array of speaker objects)
- `sponsors`: JSONB (Array of sponsor organizations)
- `registration_fee`: Decimal (Nullable)
- `currency`: String(3) (Nullable)
- `live_stream_url`: String (Nullable)

**Validation Rules:**
- Registration fee must be positive if provided
- Currency must be valid ISO 4217 code

---

### Brief
Summary documents with structured content.

**Fields:**
- `id`: UUID (Primary Key)
- `reference_number`: String (Unique, Required)
- `title_en`: String (Required)
- `title_ar`: String (Required)
- `summary_en`: Text (Required)
- `summary_ar`: Text (Required)
- `full_content_en`: Text (Nullable)
- `full_content_ar`: Text (Nullable)
- `category`: Enum ['policy', 'analysis', 'news', 'report', 'other'] (Required)
- `tags`: JSONB (Array of strings)
- `related_country_id`: UUID (Foreign Key → Country, Nullable)
- `related_organization_id`: UUID (Foreign Key → Organization, Nullable)
- `related_event_id`: UUID (Foreign Key → Event, Nullable)
- `is_published`: Boolean (Default: false)
- `published_date`: Date (Nullable)
- `author_id`: UUID (Foreign Key → User, Required)
- `created_at`: Timestamp (Auto)
- `updated_at`: Timestamp (Auto)

**Relationships:**
- Belongs to User (author)
- May relate to Country
- May relate to Organization
- May relate to Event

**Validation Rules:**
- Summary limited to 500 characters
- At least one relationship (country/org/event) recommended
- Published date set automatically when is_published becomes true

---

### IntelligenceReport
Analytical outputs with confidence scoring and classification.

**Fields:**
- `id`: UUID (Primary Key)
- `report_number`: String (Unique, Required)
- `title_en`: String (Required)
- `title_ar`: String (Required)
- `executive_summary_en`: Text (Required)
- `executive_summary_ar`: Text (Required)
- `analysis_en`: Text (Required)
- `analysis_ar`: Text (Required)
- `data_sources`: JSONB (Array of source objects)
- `confidence_level`: Enum ['low', 'medium', 'high', 'verified'] (Required)
- `classification`: Enum ['public', 'internal', 'confidential', 'restricted'] (Default: 'internal')
- `analysis_type`: JSONB (Array: ['trends', 'patterns', 'predictions', 'risks', 'opportunities'])
- `key_findings`: JSONB (Array of finding objects)
- `recommendations`: JSONB (Array of recommendation objects)
- `related_countries`: JSONB (Array of country IDs)
- `related_organizations`: JSONB (Array of organization IDs)
- `vector_embedding`: Vector(1536) (For AI similarity search)
- `status`: Enum ['draft', 'review', 'approved', 'published'] (Default: 'draft')
- `author_id`: UUID (Foreign Key → User, Required)
- `reviewed_by`: UUID (Foreign Key → User, Nullable)
- `approved_by`: UUID (Foreign Key → User, Nullable)
- `created_at`: Timestamp (Auto)
- `updated_at`: Timestamp (Auto)
- `published_at`: Timestamp (Nullable)

**Relationships:**
- Belongs to User (author)
- Reviewed by User
- Approved by User

**Validation Rules:**
- Report number format: INT-YYYY-MM-NNNN
- Confidence level 'verified' requires approved_by
- Classification 'restricted' requires special permissions
- Vector embedding generated via AnythingLLM

**State Transitions:**
- draft → review
- review → approved OR draft
- approved → published

---

### DataLibraryItem
Documents and resources in the data library.

**Fields:**
- `id`: UUID (Primary Key)
- `title_en`: String (Required)
- `title_ar`: String (Required)
- `description_en`: Text (Nullable)
- `description_ar`: Text (Nullable)
- `file_url`: String (Required)
- `file_type`: String (Required)
- `file_size_bytes`: BigInt (Required)
- `mime_type`: String (Required)
- `category`: Enum ['document', 'dataset', 'image', 'video', 'other'] (Required)
- `tags`: JSONB (Array of strings)
- `metadata`: JSONB (Flexible metadata)
- `is_public`: Boolean (Default: false)
- `download_count`: Integer (Default: 0)
- `uploaded_by`: UUID (Foreign Key → User, Required)
- `created_at`: Timestamp (Auto)
- `updated_at`: Timestamp (Auto)

**Relationships:**
- Belongs to User (uploader)

**Validation Rules:**
- File size limit: 50MB
- Supported MIME types defined in config
- File URL must be valid Supabase Storage URL

---

## Indexes

### Performance Indexes
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Country searches
CREATE INDEX idx_countries_name_en ON countries(name_en);
CREATE INDEX idx_countries_name_ar ON countries(name_ar);
CREATE INDEX idx_countries_region ON countries(region);

-- Organization queries
CREATE INDEX idx_organizations_country ON organizations(country_id);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_parent ON organizations(parent_organization_id);

-- MoU filters
CREATE INDEX idx_mous_workflow_state ON mous(workflow_state);
CREATE INDEX idx_mous_expiry_date ON mous(expiry_date);
CREATE INDEX idx_mous_parties ON mous(primary_party_id, secondary_party_id);

-- Event scheduling
CREATE INDEX idx_events_datetime ON events(start_datetime, end_datetime);
CREATE INDEX idx_events_venue ON events(venue_en, venue_ar);
CREATE INDEX idx_events_organizer ON events(organizer_id);

-- Intelligence search
CREATE INDEX idx_intelligence_vector ON intelligence_reports USING ivfflat (vector_embedding vector_cosine_ops);
CREATE INDEX idx_intelligence_classification ON intelligence_reports(classification);

-- Full-text search
CREATE INDEX idx_briefs_search ON briefs USING gin(to_tsvector('english', title_en || ' ' || summary_en));
CREATE INDEX idx_briefs_search_ar ON briefs USING gin(to_tsvector('arabic', title_ar || ' ' || summary_ar));
```

## Row-Level Security (RLS) Policies

### Users Table
```sql
-- Users can read their own profile
CREATE POLICY users_read_own ON users
  FOR SELECT USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY users_read_admin ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update their own profile (except role)
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = OLD.role);
```

### MoUs Table
```sql
-- Read based on workflow state and user role
CREATE POLICY mous_read ON mous
  FOR SELECT USING (
    workflow_state IN ('active', 'renewed', 'expired')
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- Only owner and editors can update
CREATE POLICY mous_update ON mous
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );
```

### Intelligence Reports Table
```sql
-- Classification-based access control
CREATE POLICY intelligence_read ON intelligence_reports
  FOR SELECT USING (
    (classification = 'public')
    OR (classification = 'internal' AND auth.uid() IS NOT NULL)
    OR (classification IN ('confidential', 'restricted') AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    ))
    OR author_id = auth.uid()
  );
```

## Audit Trail

All tables include audit triggers for compliance:
```sql
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  row_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger function for all tables
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, row_id, old_data, new_data, user_id)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW),
    auth.uid()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---
*Data model defined: 2025-09-26*