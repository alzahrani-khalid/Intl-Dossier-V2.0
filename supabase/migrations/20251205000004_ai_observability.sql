-- AI Brief Generation Feature: Observability Tables
-- Migration: 20251205000004_ai_observability.sql

-- AI Runs: Records every AI operation
CREATE TABLE IF NOT EXISTS ai_runs (
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

CREATE INDEX IF NOT EXISTS idx_ai_runs_org_created 
  ON ai_runs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_runs_user 
  ON ai_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_runs_feature 
  ON ai_runs(feature, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_runs_org_month 
  ON ai_runs(organization_id, created_at DESC) 
  WHERE status = 'completed';

COMMENT ON TABLE ai_runs IS 'Observability: records every AI operation';

-- AI Messages: Chat messages within an AI run
CREATE TABLE IF NOT EXISTS ai_messages (
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

CREATE INDEX IF NOT EXISTS idx_ai_messages_run 
  ON ai_messages(run_id, sequence_number);

COMMENT ON TABLE ai_messages IS 'Chat messages within an AI run';

-- AI Tool Calls: Detailed tool call logging
CREATE TABLE IF NOT EXISTS ai_tool_calls (
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

CREATE INDEX IF NOT EXISTS idx_ai_tool_calls_run 
  ON ai_tool_calls(run_id);

COMMENT ON TABLE ai_tool_calls IS 'Detailed tool call logging for observability';

-- Views for aggregated usage

-- Daily usage summary
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

-- User-specific usage
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
