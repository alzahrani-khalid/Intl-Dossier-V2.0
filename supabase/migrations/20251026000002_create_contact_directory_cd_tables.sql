-- Migration: Create Contact Directory (CD-prefixed tables)
-- Feature: 027-contact-directory
-- Date: 2025-10-26
-- Description: Creates Contact Directory tables with cd_ prefix to avoid conflicts with existing contacts table
-- Tables: cd_contacts, cd_organizations, cd_tags, cd_interaction_notes, cd_contact_relationships, cd_document_sources

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Table: cd_organizations
CREATE TABLE IF NOT EXISTS cd_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 300),
  type text NOT NULL CHECK (type IN ('government', 'ngo', 'private_sector', 'international', 'other')),
  country text NULL CHECK (country ~ '^[A-Z]{2}$'),
  primary_address jsonb NULL,
  website text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: cd_tags
CREATE TABLE IF NOT EXISTS cd_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
  category text NOT NULL CHECK (category IN ('project', 'topic', 'region', 'event', 'custom')),
  color text DEFAULT '#6B7280' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon text NULL,
  created_at timestamptz DEFAULT now()
);

-- Table: cd_document_sources
CREATE TABLE IF NOT EXISTS cd_document_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL CHECK (char_length(file_name) <= 255),
  file_type text NOT NULL CHECK (file_type IN ('business_card', 'invitation', 'letter', 'meeting_notes', 'other')),
  file_format text NOT NULL CHECK (file_format IN ('pdf', 'docx', 'jpg', 'png')),
  file_size_bytes integer NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 52428800),
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

-- Table: cd_contacts
CREATE TABLE IF NOT EXISTS cd_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 200),
  organization_id uuid NULL REFERENCES cd_organizations(id) ON DELETE SET NULL,
  position text NULL CHECK (char_length(position) <= 200),
  email_addresses text[] NULL,
  phone_numbers text[] NULL,
  notes text NULL CHECK (char_length(notes) <= 5000),
  tags uuid[] NULL,
  source_type text DEFAULT 'manual' CHECK (source_type IN ('manual', 'business_card', 'document')),
  source_document_id uuid NULL REFERENCES cd_document_sources(id) ON DELETE SET NULL,
  ocr_confidence numeric(5,2) NULL CHECK (ocr_confidence >= 0 AND ocr_confidence <= 100),
  duplicate_of uuid NULL REFERENCES cd_contacts(id) ON DELETE SET NULL,
  is_archived boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: cd_contact_relationships
CREATE TABLE IF NOT EXISTS cd_contact_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_contact_id uuid NOT NULL REFERENCES cd_contacts(id) ON DELETE CASCADE,
  to_contact_id uuid NOT NULL REFERENCES cd_contacts(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('reports_to', 'collaborates_with', 'partner', 'colleague', 'other')),
  start_date date NULL,
  end_date date NULL,
  notes text NULL CHECK (char_length(notes) <= 1000),
  created_at timestamptz DEFAULT now(),
  CHECK (from_contact_id != to_contact_id),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  UNIQUE (from_contact_id, to_contact_id, relationship_type)
);

-- Table: cd_interaction_notes
CREATE TABLE IF NOT EXISTS cd_interaction_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES cd_contacts(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_cd_contacts_full_name ON cd_contacts USING gin (to_tsvector('simple', full_name));
CREATE INDEX IF NOT EXISTS idx_cd_contacts_organization_id ON cd_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_cd_contacts_email_addresses ON cd_contacts USING gin (email_addresses);
CREATE INDEX IF NOT EXISTS idx_cd_contacts_tags ON cd_contacts USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_cd_contacts_created_by ON cd_contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_cd_contacts_source_type ON cd_contacts(source_type);
CREATE INDEX IF NOT EXISTS idx_cd_contacts_is_archived ON cd_contacts(is_archived);

CREATE INDEX IF NOT EXISTS idx_cd_organizations_name ON cd_organizations USING gin (to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_cd_organizations_type ON cd_organizations(type);
CREATE INDEX IF NOT EXISTS idx_cd_organizations_country ON cd_organizations(country);

CREATE INDEX IF NOT EXISTS idx_cd_interaction_notes_contact_id ON cd_interaction_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_cd_interaction_notes_date ON cd_interaction_notes(date DESC);
CREATE INDEX IF NOT EXISTS idx_cd_interaction_notes_type ON cd_interaction_notes(type);
CREATE INDEX IF NOT EXISTS idx_cd_interaction_notes_details ON cd_interaction_notes USING gin (to_tsvector('simple', details));
CREATE INDEX IF NOT EXISTS idx_cd_interaction_notes_created_by ON cd_interaction_notes(created_by);

CREATE INDEX IF NOT EXISTS idx_cd_contact_relationships_from ON cd_contact_relationships(from_contact_id);
CREATE INDEX IF NOT EXISTS idx_cd_contact_relationships_to ON cd_contact_relationships(to_contact_id);
CREATE INDEX IF NOT EXISTS idx_cd_contact_relationships_type ON cd_contact_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_cd_tags_name ON cd_tags(name);
CREATE INDEX IF NOT EXISTS idx_cd_tags_category ON cd_tags(category);

CREATE INDEX IF NOT EXISTS idx_cd_document_sources_uploaded_by ON cd_document_sources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_cd_document_sources_processing_status ON cd_document_sources(processing_status);
CREATE INDEX IF NOT EXISTS idx_cd_document_sources_file_type ON cd_document_sources(file_type);
CREATE INDEX IF NOT EXISTS idx_cd_document_sources_upload_date ON cd_document_sources(upload_date DESC);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE cd_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cd_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cd_interaction_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cd_contact_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE cd_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE cd_document_sources ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view accessible cd_contacts" ON cd_contacts FOR SELECT USING (created_by = auth.uid() OR is_archived = false);
CREATE POLICY "Users can create cd_contacts" ON cd_contacts FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own cd_contacts" ON cd_contacts FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can archive own cd_contacts" ON cd_contacts FOR UPDATE USING (created_by = auth.uid() AND is_archived = false) WITH CHECK (is_archived = true);

CREATE POLICY "Everyone can view cd_organizations" ON cd_organizations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create cd_organizations" ON cd_organizations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view accessible cd_interaction_notes" ON cd_interaction_notes FOR SELECT USING (EXISTS (SELECT 1 FROM cd_contacts WHERE id = cd_interaction_notes.contact_id AND (created_by = auth.uid() OR is_archived = false)));
CREATE POLICY "Users can create cd_interaction_notes" ON cd_interaction_notes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM cd_contacts WHERE id = cd_interaction_notes.contact_id AND created_by = auth.uid()));

CREATE POLICY "Users can view accessible cd_relationships" ON cd_contact_relationships FOR SELECT USING (EXISTS (SELECT 1 FROM cd_contacts WHERE id IN (cd_contact_relationships.from_contact_id, cd_contact_relationships.to_contact_id) AND (created_by = auth.uid() OR is_archived = false)));

CREATE POLICY "Everyone can view cd_tags" ON cd_tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create cd_tags" ON cd_tags FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view own cd_documents" ON cd_document_sources FOR SELECT USING (uploaded_by = auth.uid());
CREATE POLICY "Users can upload cd_documents" ON cd_document_sources FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- =====================================================
-- 5. CREATE AUDIT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION log_cd_contact_changes() RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, changed_at)
    VALUES (auth.uid(), 'CREATE', TG_TABLE_NAME, NEW.id, row_to_json(NEW), now());
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, changed_at)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW), now());
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, changed_at)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD), now());
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE TRIGGER audit_cd_contacts AFTER INSERT OR UPDATE OR DELETE ON cd_contacts FOR EACH ROW EXECUTE FUNCTION log_cd_contact_changes();
CREATE TRIGGER audit_cd_interaction_notes AFTER INSERT OR UPDATE OR DELETE ON cd_interaction_notes FOR EACH ROW EXECUTE FUNCTION log_cd_contact_changes();
CREATE TRIGGER audit_cd_contact_relationships AFTER INSERT OR UPDATE OR DELETE ON cd_contact_relationships FOR EACH ROW EXECUTE FUNCTION log_cd_contact_changes();

-- =====================================================
-- 6. CREATE UPDATE TIMESTAMP TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_cd_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cd_contacts_updated_at BEFORE UPDATE ON cd_contacts FOR EACH ROW EXECUTE FUNCTION update_cd_updated_at_column();
CREATE TRIGGER update_cd_organizations_updated_at BEFORE UPDATE ON cd_organizations FOR EACH ROW EXECUTE FUNCTION update_cd_updated_at_column();
CREATE TRIGGER update_cd_interaction_notes_updated_at BEFORE UPDATE ON cd_interaction_notes FOR EACH ROW EXECUTE FUNCTION update_cd_updated_at_column();
CREATE TRIGGER update_cd_document_sources_updated_at BEFORE UPDATE ON cd_document_sources FOR EACH ROW EXECUTE FUNCTION update_cd_updated_at_column();

-- =====================================================
-- 7. ADD COMMENTS
-- =====================================================

COMMENT ON TABLE cd_contacts IS 'Contact Directory: Core entity representing individual persons with contact information';
COMMENT ON TABLE cd_organizations IS 'Contact Directory: Organizations or partnership entities that contacts are affiliated with';
COMMENT ON TABLE cd_interaction_notes IS 'Contact Directory: Records of engagements, meetings, calls, or emails with contacts';
COMMENT ON TABLE cd_contact_relationships IS 'Contact Directory: Connections between contacts (reporting structures, partnerships, etc.)';
COMMENT ON TABLE cd_tags IS 'Contact Directory: Categorization labels for filtering and organizing contacts';
COMMENT ON TABLE cd_document_sources IS 'Contact Directory: Tracks uploaded documents used for bulk contact extraction';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
