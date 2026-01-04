-- AI Brief Generation Feature: Organization LLM Policies
-- Migration: 20251205000003_organization_llm_policies.sql

CREATE TABLE IF NOT EXISTS organization_llm_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Default provider/model
  default_provider ai_provider NOT NULL DEFAULT 'openai',
  default_model TEXT NOT NULL DEFAULT 'gpt-4o',
  
  -- Arabic routing
  arabic_provider ai_provider,
  arabic_model TEXT,
  
  -- Privacy routing
  allow_cloud_for_confidential BOOLEAN NOT NULL DEFAULT false,
  private_provider ai_provider,
  private_model TEXT,
  private_endpoint_url TEXT,
  
  -- Spend management
  monthly_spend_cap_usd DECIMAL(10, 2),
  alert_threshold_percent INTEGER DEFAULT 80,
  
  -- Feature flags
  brief_generation_enabled BOOLEAN NOT NULL DEFAULT true,
  chat_enabled BOOLEAN NOT NULL DEFAULT true,
  entity_linking_enabled BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (organization_id)
);

CREATE INDEX IF NOT EXISTS idx_org_llm_policies_org 
  ON organization_llm_policies(organization_id);

COMMENT ON TABLE organization_llm_policies IS 'Organization-level AI configuration and routing rules';

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_organization_llm_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_organization_llm_policies_updated_at ON organization_llm_policies;
CREATE TRIGGER trigger_organization_llm_policies_updated_at
  BEFORE UPDATE ON organization_llm_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_llm_policies_updated_at();
