-- Migration: Create Contact Directory
-- Feature: 027-contact-directory
-- Date: 2025-10-26
-- Description: Creates all tables, indexes, RLS policies, and audit triggers for Contact Directory feature

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Table: organizations
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 300),
  type text NOT NULL CHECK (type IN ('government', 'ngo', 'private_sector', 'international', 'other')),
  country text NULL CHECK (country ~ '^[A-Z]{2}$'), -- ISO 3166-1 alpha-2
  primary_address jsonb NULL,
  website text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: tags
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
  category text NOT NULL CHECK (category IN ('project', 'topic', 'region', 'event', 'custom')),
  color text DEFAULT '#6B7280' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon text NULL,
  created_at timestamptz DEFAULT now()
);

-- Table: document_sources
CREATE TABLE IF NOT EXISTS document_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL CHECK (char_length(file_name) <= 255),
  file_type text NOT NULL CHECK (file_type IN ('business_card', 'invitation', 'letter', 'meeting_notes', 'other')),
  file_format text NOT NULL CHECK (file_format IN ('pdf', 'docx', 'jpg', 'png')),
  file_size_bytes integer NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 52428800), -- Max 50MB
  storage_path text NOT NULL,
  upload_date timestamptz DEFAULT now(),
  extracted_contacts_count integer DEFAULT 0,
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error text NULL CHECK (char_length(processing_error) <= 500),
  ocr_language text NULL CHECK (ocr_language IN ('ar', 'en', 'mixed')),
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: contacts
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 200),
  organization_id uuid NULL REFERENCES organizations(id) ON DELETE SET NULL,
  position text NULL CHECK (char_length(position) <= 200),
  email_addresses text[] NULL,
  phone_numbers text[] NULL,
  notes text NULL CHECK (char_length(notes) <= 5000),
  tags uuid[] NULL,
  source_type text DEFAULT 'manual' CHECK (source_type IN ('manual', 'business_card', 'document')),
  source_document_id uuid NULL REFERENCES document_sources(id) ON DELETE SET NULL,
  ocr_confidence numeric(5,2) NULL CHECK (ocr_confidence >= 0 AND ocr_confidence <= 100),
  duplicate_of uuid NULL REFERENCES contacts(id) ON DELETE SET NULL,
  is_archived boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: contact_relationships
CREATE TABLE IF NOT EXISTS contact_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  to_contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('reports_to', 'collaborates_with', 'partner', 'colleague', 'other')),
  start_date date NULL,
  end_date date NULL,
  notes text NULL CHECK (char_length(notes) <= 1000),
  created_at timestamptz DEFAULT now(),
  CHECK (from_contact_id != to_contact_id),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  UNIQUE (from_contact_id, to_contact_id, relationship_type)
);

-- Table: interaction_notes
CREATE TABLE IF NOT EXISTS interaction_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('meeting', 'email', 'call', 'conference', 'other')),
  details text NOT NULL CHECK (char_length(details) >= 10 AND char_length(details) <= 10000),
  attendees uuid[] NULL,
  attachments text[] NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_full_name
  ON contacts USING gin (to_tsvector('simple', full_name));
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id
  ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email_addresses
  ON contacts USING gin (email_addresses);
CREATE INDEX IF NOT EXISTS idx_contacts_tags
  ON contacts USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by
  ON contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_source_type
  ON contacts(source_type);

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_name
  ON organizations USING gin (to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_organizations_type
  ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_country
  ON organizations(country);

-- Interaction notes indexes
CREATE INDEX IF NOT EXISTS idx_interaction_notes_contact_id
  ON interaction_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_interaction_notes_date
  ON interaction_notes(date DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_notes_type
  ON interaction_notes(type);
CREATE INDEX IF NOT EXISTS idx_interaction_notes_details
  ON interaction_notes USING gin (to_tsvector('simple', details));
CREATE INDEX IF NOT EXISTS idx_interaction_notes_created_by
  ON interaction_notes(created_by);

-- Contact relationships indexes
CREATE INDEX IF NOT EXISTS idx_contact_relationships_from
  ON contact_relationships(from_contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_relationships_to
  ON contact_relationships(to_contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_relationships_type
  ON contact_relationships(relationship_type);

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_name
  ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_category
  ON tags(category);

-- Document sources indexes
CREATE INDEX IF NOT EXISTS idx_document_sources_uploaded_by
  ON document_sources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_document_sources_processing_status
  ON document_sources(processing_status);
CREATE INDEX IF NOT EXISTS idx_document_sources_file_type
  ON document_sources(file_type);
CREATE INDEX IF NOT EXISTS idx_document_sources_upload_date
  ON document_sources(upload_date DESC);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sources ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- Contacts RLS Policies
CREATE POLICY "Users can view accessible contacts"
  ON contacts FOR SELECT
  USING (
    created_by = auth.uid() OR
    is_archived = false
  );

CREATE POLICY "Users can create contacts"
  ON contacts FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can archive own contacts"
  ON contacts FOR UPDATE
  USING (created_by = auth.uid() AND is_archived = false)
  WITH CHECK (is_archived = true);

-- Organizations RLS Policies
CREATE POLICY "Everyone can view organizations"
  ON organizations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Interaction Notes RLS Policies
CREATE POLICY "Users can view accessible interaction notes"
  ON interaction_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE id = interaction_notes.contact_id
        AND (created_by = auth.uid() OR is_archived = false)
    )
  );

CREATE POLICY "Users can create interaction notes"
  ON interaction_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE id = interaction_notes.contact_id
        AND created_by = auth.uid()
    )
  );

-- Contact Relationships RLS Policies
CREATE POLICY "Users can view accessible relationships"
  ON contact_relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE id IN (contact_relationships.from_contact_id, contact_relationships.to_contact_id)
        AND (created_by = auth.uid() OR is_archived = false)
    )
  );

-- Tags RLS Policies
CREATE POLICY "Everyone can view tags"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Document Sources RLS Policies
CREATE POLICY "Users can view own documents"
  ON document_sources FOR SELECT
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can upload documents"
  ON document_sources FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- =====================================================
-- 5. CREATE AUDIT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION log_contact_changes()
RETURNS TRIGGER AS $$
DECLARE
  audit_table text;
BEGIN
  -- Determine audit table based on trigger table
  audit_table := TG_TABLE_NAME || '_audit';

  IF (TG_OP = 'INSERT') THEN
    -- Log insert
    EXECUTE format(
      'INSERT INTO %I (user_id, action, entity_type, entity_id, new_values, changed_at) VALUES ($1, $2, $3, $4, $5, now())',
      'audit_logs'
    ) USING auth.uid(), 'CREATE', TG_TABLE_NAME, NEW.id, row_to_json(NEW);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Log update
    EXECUTE format(
      'INSERT INTO %I (user_id, action, entity_type, entity_id, old_values, new_values, changed_at) VALUES ($1, $2, $3, $4, $5, $6, now())',
      'audit_logs'
    ) USING auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Log delete
    EXECUTE format(
      'INSERT INTO %I (user_id, action, entity_type, entity_id, old_values, changed_at) VALUES ($1, $2, $3, $4, $5, now())',
      'audit_logs'
    ) USING auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: audit_logs table is assumed to exist from previous migrations
-- If it doesn't exist, create it:
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  old_values jsonb NULL,
  new_values jsonb NULL,
  changed_at timestamptz DEFAULT now()
);

-- =====================================================
-- 6. CREATE AUDIT TRIGGERS
-- =====================================================

CREATE TRIGGER audit_contacts
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION log_contact_changes();

CREATE TRIGGER audit_interaction_notes
  AFTER INSERT OR UPDATE OR DELETE ON interaction_notes
  FOR EACH ROW EXECUTE FUNCTION log_contact_changes();

CREATE TRIGGER audit_contact_relationships
  AFTER INSERT OR UPDATE OR DELETE ON contact_relationships
  FOR EACH ROW EXECUTE FUNCTION log_contact_changes();

-- =====================================================
-- 7. CREATE UPDATE TIMESTAMP TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interaction_notes_updated_at
  BEFORE UPDATE ON interaction_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_sources_updated_at
  BEFORE UPDATE ON document_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE contacts IS 'Core entity representing individual persons with contact information';
COMMENT ON TABLE organizations IS 'Organizations or partnership entities that contacts are affiliated with';
COMMENT ON TABLE interaction_notes IS 'Records of engagements, meetings, calls, or emails with contacts';
COMMENT ON TABLE contact_relationships IS 'Connections between contacts (reporting structures, partnerships, etc.)';
COMMENT ON TABLE tags IS 'Categorization labels for filtering and organizing contacts';
COMMENT ON TABLE document_sources IS 'Tracks uploaded documents used for bulk contact extraction';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
