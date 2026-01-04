-- AI Brief Generation Feature: AI Briefs Table
-- Migration: 20251206000001_ai_briefs.sql

CREATE TABLE IF NOT EXISTS ai_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Target entity
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,
  
  -- Generation context
  run_id UUID REFERENCES ai_runs(id) ON DELETE SET NULL,
  custom_prompt TEXT,
  
  -- Generation status
  status ai_brief_status NOT NULL DEFAULT 'generating',
  timeout_at TIMESTAMPTZ,
  
  -- Brief content (structured)
  title TEXT NOT NULL,
  executive_summary TEXT,
  background TEXT,
  key_participants JSONB DEFAULT '[]',
  relevant_positions JSONB DEFAULT '[]',
  active_commitments JSONB DEFAULT '[]',
  historical_context TEXT,
  talking_points JSONB DEFAULT '[]',
  recommendations TEXT,
  
  -- Full structured content
  full_content JSONB NOT NULL DEFAULT '{}',
  
  -- Source citations
  citations JSONB DEFAULT '[]',
  
  -- Metadata
  generation_params JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_briefs_org 
  ON ai_briefs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_briefs_engagement 
  ON ai_briefs(engagement_id) WHERE engagement_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_briefs_dossier 
  ON ai_briefs(dossier_id) WHERE dossier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_briefs_user 
  ON ai_briefs(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_briefs_status 
  ON ai_briefs(status) WHERE status = 'generating';

COMMENT ON TABLE ai_briefs IS 'AI-generated briefs for engagements and dossiers';

-- Enable RLS
ALTER TABLE ai_briefs ENABLE ROW LEVEL SECURITY;

-- Users can view their own briefs
DROP POLICY IF EXISTS "Users can view own briefs" ON ai_briefs;
CREATE POLICY "Users can view own briefs"
ON ai_briefs FOR SELECT TO authenticated
USING (created_by = auth.uid());

-- Users can view briefs in their organization
DROP POLICY IF EXISTS "Users can view org briefs" ON ai_briefs;
CREATE POLICY "Users can view org briefs"
ON ai_briefs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = ai_briefs.organization_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
  )
);

-- Users can create briefs in their organization
DROP POLICY IF EXISTS "Users can create briefs" ON ai_briefs;
CREATE POLICY "Users can create briefs"
ON ai_briefs FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = ai_briefs.organization_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
  )
);

-- Users can update their own briefs
DROP POLICY IF EXISTS "Users can update own briefs" ON ai_briefs;
CREATE POLICY "Users can update own briefs"
ON ai_briefs FOR UPDATE TO authenticated
USING (created_by = auth.uid());

-- Service role full access
DROP POLICY IF EXISTS "Service role can manage briefs" ON ai_briefs;
CREATE POLICY "Service role can manage briefs"
ON ai_briefs FOR ALL TO service_role
USING (true)
WITH CHECK (true);
