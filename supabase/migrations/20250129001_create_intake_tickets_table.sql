-- Migration: 001_create_intake_tickets_table
-- Description: Create the main intake_tickets table for support requests
-- Date: 2025-01-29

-- Create enum types for ticket fields
CREATE TYPE request_type AS ENUM ('engagement', 'position', 'mou_action', 'foresight');
CREATE TYPE sensitivity_level AS ENUM ('public', 'internal', 'confidential', 'secret');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_status AS ENUM ('draft', 'submitted', 'triaged', 'assigned', 'in_progress', 'converted', 'closed', 'merged');
CREATE TYPE ticket_source AS ENUM ('web', 'api', 'email', 'import');

-- Create the intake_tickets table
CREATE TABLE IF NOT EXISTS intake_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    
    -- Request Details
    request_type request_type NOT NULL,
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    type_specific_fields JSONB DEFAULT '{}',
    
    -- Classification (from AI or manual)
    sensitivity sensitivity_level NOT NULL DEFAULT 'internal',
    urgency urgency_level NOT NULL DEFAULT 'medium',
    priority priority_level NOT NULL DEFAULT 'medium',
    
    -- Relationships
    dossier_id UUID,
    parent_ticket_id UUID REFERENCES intake_tickets(id),
    converted_to_type request_type,
    converted_to_id UUID,
    
    -- Assignment
    assigned_to UUID,
    assigned_unit TEXT,
    
    -- Status
    status ticket_status NOT NULL DEFAULT 'draft',
    resolution TEXT,
    resolution_ar TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    submitted_at TIMESTAMPTZ,
    triaged_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    
    -- Metadata
    source ticket_source NOT NULL DEFAULT 'web',
    client_metadata JSONB DEFAULT '{}'
);

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    new_ticket_number TEXT;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(ticket_number FROM 'TKT-\d{4}-(\d{6})') AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM intake_tickets
    WHERE ticket_number LIKE 'TKT-' || year_part || '-%';
    
    -- Format the ticket number
    new_ticket_number := 'TKT-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN new_ticket_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
    BEFORE INSERT ON intake_tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_intake_tickets_updated_at
    BEFORE UPDATE ON intake_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE intake_tickets IS 'Primary table for support requests submitted through the Front Door';
COMMENT ON COLUMN intake_tickets.ticket_number IS 'Human-readable ticket ID (e.g., TKT-2025-001234)';
COMMENT ON COLUMN intake_tickets.type_specific_fields IS 'JSON for 2-3 unique fields per request type';
COMMENT ON COLUMN intake_tickets.priority IS 'Computed from urgency + sensitivity';
COMMENT ON COLUMN intake_tickets.dossier_id IS 'Foreign key to dossiers table (optional)';
COMMENT ON COLUMN intake_tickets.parent_ticket_id IS 'Self-reference for merged tickets';
COMMENT ON COLUMN intake_tickets.converted_to_id IS 'ID of the created artifact after conversion';