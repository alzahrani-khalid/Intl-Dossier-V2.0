-- Migration: Create Key Contacts Table
-- Date: 2025-09-30
-- Task: T008

-- Create key_contacts table
CREATE TABLE key_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Contact info
  name TEXT NOT NULL CHECK (length(name) <= 200),
  role TEXT,
  organization TEXT,
  email TEXT CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone TEXT CHECK (phone IS NULL OR length(phone) <= 50),

  -- Interaction tracking
  last_interaction_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_key_contacts_dossier ON key_contacts(dossier_id);
CREATE INDEX idx_key_contacts_last_interaction ON key_contacts(last_interaction_date DESC);
CREATE INDEX idx_key_contacts_organization ON key_contacts(organization);

-- Trigger for updated_at
CREATE TRIGGER set_key_contacts_updated_at
  BEFORE UPDATE ON key_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE key_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- View: Inherit permissions from parent dossier (read)
CREATE POLICY "view_key_contacts_via_dossier"
ON key_contacts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = dossier_id
    AND get_user_clearance_level(auth.uid()) >=
      CASE sensitivity_level 
        WHEN 'low' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'high' THEN 3 
      END
  )
);

-- Manage: Only users who can edit the dossier can manage contacts
CREATE POLICY "manage_key_contacts_via_dossier"
ON key_contacts FOR ALL
TO authenticated
USING (can_edit_dossier(dossier_id))
WITH CHECK (can_edit_dossier(dossier_id));

-- Comments
COMMENT ON TABLE key_contacts IS 'Key contacts associated with dossiers (not system users)';
COMMENT ON COLUMN key_contacts.last_interaction_date IS 'Date of last interaction with this contact';
COMMENT ON COLUMN key_contacts.notes IS 'Internal notes about the contact or relationship';
