-- Supabase seed data for GASTAT International Dossier System

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Enable pgvector for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create custom types
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager', 'analyst', 'viewer');
CREATE TYPE mou_status AS ENUM ('draft', 'negotiation', 'signed', 'active', 'expired', 'terminated');
CREATE TYPE document_classification AS ENUM ('public', 'internal', 'confidential', 'secret');
CREATE TYPE relationship_health AS ENUM ('excellent', 'good', 'fair', 'poor', 'critical');
CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create audit log function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at = COALESCE(NEW.created_at, NOW());
    NEW.created_by = COALESCE(NEW.created_by, auth.uid());
  END IF;

  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create text search configuration for Arabic
CREATE TEXT SEARCH CONFIGURATION arabic (COPY = simple);

-- Function to generate slug from text
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(input_text),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  meetings_count INT,
  documents_count INT,
  commitments_fulfilled INT,
  commitments_total INT,
  days_since_last_contact INT
) RETURNS NUMERIC AS $$
DECLARE
  score NUMERIC := 0;
BEGIN
  -- Meeting frequency (30%)
  score := score + LEAST(meetings_count * 3, 30);

  -- Document exchange (20%)
  score := score + LEAST(documents_count * 2, 20);

  -- Commitment fulfillment (30%)
  IF commitments_total > 0 THEN
    score := score + (commitments_fulfilled::NUMERIC / commitments_total) * 30;
  END IF;

  -- Recency of contact (20%)
  score := score + GREATEST(0, 20 - (days_since_last_contact / 7));

  RETURN ROUND(score, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Insert default roles and permissions (for development)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@gastat.gov.sa', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'analyst@gastat.gov.sa', crypt('analyst123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('images', 'images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('briefs', 'briefs', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;