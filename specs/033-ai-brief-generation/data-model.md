# Data Model: AI Brief Generation & Intelligence Layer

**Feature Branch**: `033-ai-brief-generation`
**Created**: 2025-12-05

## Overview

This data model defines the database schema for AI infrastructure, brief generation, chat, entity linking, and observability. All tables use Row Level Security (RLS) for access control.

---

## Database Enums

```sql
-- AI provider types
CREATE TYPE ai_provider AS ENUM (
  'openai',
  'anthropic',
  'google',
  'vllm',
  'ollama'
);

-- AI run status
CREATE TYPE ai_run_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled'
);

-- AI feature types
CREATE TYPE ai_feature AS ENUM (
  'brief_generation',
  'chat',
  'entity_linking',
  'semantic_search',
  'embeddings'
);

-- Entity link proposal status
CREATE TYPE link_proposal_status AS ENUM (
  'pending_approval',
  'approved',
  'rejected',
  'expired'
);

-- Brief generation status
CREATE TYPE brief_status AS ENUM (
  'generating',
  'completed',
  'partial',
  'failed'
);

-- Linkable entity types (unified across entity linking)
CREATE TYPE linkable_entity_type AS ENUM (
  'dossier',
  'position',
  'brief',
  'person',
  'engagement',
  'commitment'
);

-- Data classification levels
CREATE TYPE data_classification AS ENUM (
  'public',
  'internal',
  'confidential',
  'secret'
);
```

---

## Core Tables

### organization_llm_policies

Organization-level AI configuration and routing rules.

```sql
CREATE TABLE organization_llm_policies (
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

CREATE INDEX idx_org_llm_policies_org ON organization_llm_policies(organization_id);
```

### ai_model_pricing

Model pricing for cost calculation (updatable without code deploy).

```sql
CREATE TABLE ai_model_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider ai_provider NOT NULL,
  model TEXT NOT NULL,

  input_price_per_1m_tokens DECIMAL(10, 6) NOT NULL,
  output_price_per_1m_tokens DECIMAL(10, 6) NOT NULL,

  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (provider, model, effective_date)
);

CREATE INDEX idx_ai_pricing_provider_model ON ai_model_pricing(provider, model, is_active);
```

### ai_runs

Observability: records every AI operation.

```sql
CREATE TABLE ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Operation metadata
  feature ai_feature NOT NULL,
  provider ai_provider NOT NULL,
  model TEXT NOT NULL,
  status ai_run_status NOT NULL DEFAULT 'pending',

  -- Token usage
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER GENERATED ALWAYS AS (COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0)) STORED,

  -- Cost (USD)
  estimated_cost_usd DECIMAL(10, 6),

  -- Performance
  latency_ms INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Context
  request_metadata JSONB DEFAULT '{}',
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_runs_org_created ON ai_runs(organization_id, created_at DESC);
CREATE INDEX idx_ai_runs_user ON ai_runs(user_id, created_at DESC);
CREATE INDEX idx_ai_runs_feature ON ai_runs(feature, created_at DESC);
CREATE INDEX idx_ai_runs_org_month ON ai_runs(organization_id, created_at DESC)
  WHERE status = 'completed';
```

### ai_messages

Chat messages within an AI run.

```sql
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES ai_runs(id) ON DELETE CASCADE,

  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT,

  -- Tool results
  tool_call_id TEXT,
  tool_name TEXT,
  tool_result JSONB,

  -- Citations
  citations JSONB DEFAULT '[]',

  sequence_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_messages_run ON ai_messages(run_id, sequence_number);
```

### ai_tool_calls

Detailed tool call logging for observability.

```sql
CREATE TABLE ai_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES ai_runs(id) ON DELETE CASCADE,
  message_id UUID REFERENCES ai_messages(id) ON DELETE SET NULL,

  tool_name TEXT NOT NULL,
  tool_input JSONB NOT NULL,
  tool_output JSONB,

  latency_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error')),
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_tool_calls_run ON ai_tool_calls(run_id);
```

---

## Brief Generation Tables

### ai_briefs

Generated briefs stored for reference.

```sql
CREATE TABLE ai_briefs (
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
  status brief_status NOT NULL DEFAULT 'generating',
  timeout_at TIMESTAMPTZ, -- Set if generation timed out (partial results)

  -- Brief content
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
  full_content JSONB NOT NULL,

  -- Source citations
  citations JSONB DEFAULT '[]',

  -- Metadata
  generation_params JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ -- When generation finished (success or partial)
);

CREATE INDEX idx_ai_briefs_org ON ai_briefs(organization_id, created_at DESC);
CREATE INDEX idx_ai_briefs_engagement ON ai_briefs(engagement_id) WHERE engagement_id IS NOT NULL;
CREATE INDEX idx_ai_briefs_dossier ON ai_briefs(dossier_id) WHERE dossier_id IS NOT NULL;
CREATE INDEX idx_ai_briefs_user ON ai_briefs(created_by, created_at DESC);
```

---

## Entity Linking Tables

### ai_entity_link_proposals

AI-suggested links for intake tickets pending human approval.

```sql
CREATE TABLE ai_entity_link_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Source
  intake_ticket_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,
  run_id UUID REFERENCES ai_runs(id) ON DELETE SET NULL,

  -- Proposed link
  entity_type linkable_entity_type NOT NULL,
  entity_id UUID NOT NULL,

  -- AI reasoning
  confidence_score DECIMAL(5, 2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  justification TEXT NOT NULL,

  -- Approval workflow
  status link_proposal_status NOT NULL DEFAULT 'pending_approval',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Expiration
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_link_proposals_ticket ON ai_entity_link_proposals(intake_ticket_id, status);
CREATE INDEX idx_link_proposals_status ON ai_entity_link_proposals(status, created_at DESC);
CREATE INDEX idx_link_proposals_org ON ai_entity_link_proposals(organization_id, created_at DESC);
```

### intake_entity_links

Approved links between intake tickets and entities.

```sql
CREATE TABLE intake_entity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  intake_ticket_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,
  entity_type linkable_entity_type NOT NULL,
  entity_id UUID NOT NULL,

  -- Provenance
  proposal_id UUID REFERENCES ai_entity_link_proposals(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_ai_suggested BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (intake_ticket_id, entity_type, entity_id)
);

CREATE INDEX idx_intake_links_ticket ON intake_entity_links(intake_ticket_id);
CREATE INDEX idx_intake_links_entity ON intake_entity_links(entity_type, entity_id);
```

---

## Views

### ai_usage_summary

Daily aggregation of AI usage for admin dashboards.

```sql
CREATE OR REPLACE VIEW ai_usage_summary AS
SELECT
  date_trunc('day', created_at) AS usage_date,
  organization_id,
  feature,
  provider,
  model,
  COUNT(*) AS run_count,
  SUM(total_tokens) AS total_tokens,
  SUM(estimated_cost_usd) AS total_cost_usd,
  AVG(latency_ms) AS avg_latency_ms,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_count
FROM ai_runs
WHERE status IN ('completed', 'failed')
GROUP BY
  date_trunc('day', created_at),
  organization_id,
  feature,
  provider,
  model;
```

### user_ai_usage

User-specific usage metrics.

```sql
CREATE OR REPLACE VIEW user_ai_usage AS
SELECT
  user_id,
  organization_id,
  feature,
  date_trunc('month', created_at) AS usage_month,
  COUNT(*) AS run_count,
  SUM(total_tokens) AS total_tokens,
  SUM(estimated_cost_usd) AS total_cost_usd
FROM ai_runs
WHERE status = 'completed'
GROUP BY
  user_id,
  organization_id,
  feature,
  date_trunc('month', created_at);
```

---

## Functions

### get_monthly_ai_spend

Calculate organization's monthly AI spend for cap enforcement.

```sql
CREATE OR REPLACE FUNCTION get_monthly_ai_spend(p_org_id UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(SUM(estimated_cost_usd), 0)::DECIMAL(10, 2)
  FROM ai_runs
  WHERE organization_id = p_org_id
    AND status = 'completed'
    AND created_at >= date_trunc('month', NOW());
$$;
```

### check_ai_spend_cap

Check if organization has reached spend cap.

```sql
CREATE OR REPLACE FUNCTION check_ai_spend_cap(p_org_id UUID)
RETURNS TABLE(
  current_spend DECIMAL(10, 2),
  monthly_cap DECIMAL(10, 2),
  cap_reached BOOLEAN,
  alert_threshold_reached BOOLEAN
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    get_monthly_ai_spend(p_org_id) AS current_spend,
    COALESCE(olp.monthly_spend_cap_usd, 999999) AS monthly_cap,
    get_monthly_ai_spend(p_org_id) >= COALESCE(olp.monthly_spend_cap_usd, 999999) AS cap_reached,
    get_monthly_ai_spend(p_org_id) >= (COALESCE(olp.monthly_spend_cap_usd, 999999) * COALESCE(olp.alert_threshold_percent, 80) / 100) AS alert_threshold_reached
  FROM organization_llm_policies olp
  WHERE olp.organization_id = p_org_id;
$$;
```

### calculate_ai_cost

Calculate cost for a run based on current pricing.

```sql
CREATE OR REPLACE FUNCTION calculate_ai_cost(
  p_provider ai_provider,
  p_model TEXT,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER
)
RETURNS DECIMAL(10, 6)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    (p_input_tokens * input_price_per_1m_tokens / 1000000) +
    (p_output_tokens * output_price_per_1m_tokens / 1000000)
  FROM ai_model_pricing
  WHERE provider = p_provider
    AND model = p_model
    AND is_active = true
  ORDER BY effective_date DESC
  LIMIT 1;
$$;
```

---

## Row Level Security Policies

### ai_runs

```sql
ALTER TABLE ai_runs ENABLE ROW LEVEL SECURITY;

-- Users can view their own runs
CREATE POLICY "Users can view own AI runs"
ON ai_runs FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admins can view all org runs
CREATE POLICY "Admins can view org AI runs"
ON ai_runs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = ai_runs.organization_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
      AND om.role IN ('admin', 'owner')
  )
);

-- Service role can insert
CREATE POLICY "Service role can insert AI runs"
ON ai_runs FOR INSERT TO service_role
WITH CHECK (true);

-- Service role can update
CREATE POLICY "Service role can update AI runs"
ON ai_runs FOR UPDATE TO service_role
USING (true);
```

### ai_briefs

```sql
ALTER TABLE ai_briefs ENABLE ROW LEVEL SECURITY;

-- Users can view briefs they created
CREATE POLICY "Users can view own briefs"
ON ai_briefs FOR SELECT TO authenticated
USING (created_by = auth.uid());

-- Users can view org briefs
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

-- Authenticated users can create briefs
CREATE POLICY "Users can create briefs"
ON ai_briefs FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());
```

### organization_llm_policies

```sql
ALTER TABLE organization_llm_policies ENABLE ROW LEVEL SECURITY;

-- Org members can view their org's policy
CREATE POLICY "Members can view org LLM policy"
ON organization_llm_policies FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_llm_policies.organization_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
  )
);

-- Only admins can update
CREATE POLICY "Admins can update org LLM policy"
ON organization_llm_policies FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_llm_policies.organization_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
      AND om.role IN ('admin', 'owner')
  )
);
```

---

## Seed Data

### Default Model Pricing

```sql
INSERT INTO ai_model_pricing (provider, model, input_price_per_1m_tokens, output_price_per_1m_tokens)
VALUES
  -- OpenAI
  ('openai', 'gpt-4o', 2.50, 10.00),
  ('openai', 'gpt-4o-mini', 0.15, 0.60),
  ('openai', 'gpt-4-turbo', 10.00, 30.00),
  ('openai', 'text-embedding-3-small', 0.02, 0.00),
  ('openai', 'text-embedding-3-large', 0.13, 0.00),

  -- Anthropic
  ('anthropic', 'claude-3-5-sonnet-20241022', 3.00, 15.00),
  ('anthropic', 'claude-3-5-haiku-20241022', 1.00, 5.00),
  ('anthropic', 'claude-3-opus-20240229', 15.00, 75.00),

  -- Google
  ('google', 'gemini-1.5-pro', 1.25, 5.00),
  ('google', 'gemini-1.5-flash', 0.075, 0.30),

  -- Private (zero cost for self-hosted)
  ('vllm', 'llama-3.1-70b', 0.00, 0.00),
  ('ollama', 'llama3.1', 0.00, 0.00);
```

---

## Migration Order

1. Create enums
2. Create `ai_model_pricing` table + seed data
3. Create `organization_llm_policies` table
4. Create `ai_runs` table
5. Create `ai_messages` table
6. Create `ai_tool_calls` table
7. Create `ai_briefs` table
8. Create `ai_entity_link_proposals` table
9. Create `intake_entity_links` table
10. Create views
11. Create functions
12. Apply RLS policies
