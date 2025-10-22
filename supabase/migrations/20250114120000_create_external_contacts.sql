-- Migration: Create external_contacts table
-- Purpose: Store non-system users who can be assigned commitments
-- Feature: After-Action Structured Documentation
-- Date: 2025-01-14

-- Enable pg_trgm extension for fuzzy search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create external_contacts table
CREATE TABLE IF NOT EXISTS public.external_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
    organization TEXT,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    contact_notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Create unique case-insensitive index on email
CREATE UNIQUE INDEX idx_external_contacts_email_unique ON public.external_contacts (LOWER(email));

-- Create index for fuzzy name search using trigram
CREATE INDEX idx_external_contacts_name_trgm ON public.external_contacts USING gin (name gin_trgm_ops);

-- Create index on created_by for user's contacts lookup
CREATE INDEX idx_external_contacts_created_by ON public.external_contacts (created_by);

-- Add trigger to lowercase email on insert/update for case-insensitive uniqueness
CREATE OR REPLACE FUNCTION lowercase_email_external_contacts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email = LOWER(NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lowercase_email_external_contacts
    BEFORE INSERT OR UPDATE OF email ON public.external_contacts
    FOR EACH ROW
    EXECUTE FUNCTION lowercase_email_external_contacts();

-- Add trigger to auto-update updated_at
CREATE TRIGGER trigger_update_updated_at_external_contacts
    BEFORE UPDATE ON public.external_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.external_contacts IS 'Non-system users who can be assigned commitments in after-action records';
COMMENT ON COLUMN public.external_contacts.email IS 'Contact email address (case-insensitive unique)';
COMMENT ON COLUMN public.external_contacts.email_enabled IS 'Whether to send email notifications to this contact';
COMMENT ON COLUMN public.external_contacts.contact_notes IS 'Internal notes about this external contact';
