-- AI Brief Generation Feature: Helper Functions
-- Migration: 20251205000006_ai_functions.sql

-- Get monthly AI spend for an organization
CREATE OR REPLACE FUNCTION get_monthly_ai_spend(p_org_id UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(estimated_cost_usd), 0)::DECIMAL(10, 2)
  FROM ai_runs
  WHERE organization_id = p_org_id
    AND status = 'completed'
    AND created_at >= date_trunc('month', NOW());
$$;

COMMENT ON FUNCTION get_monthly_ai_spend IS 'Calculate organization monthly AI spend for cap enforcement';

-- Check if organization has reached spend cap
CREATE OR REPLACE FUNCTION check_ai_spend_cap(p_org_id UUID)
RETURNS TABLE(
  current_spend DECIMAL(10, 2),
  monthly_cap DECIMAL(10, 2),
  cap_reached BOOLEAN,
  alert_threshold_reached BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    get_monthly_ai_spend(p_org_id) AS current_spend,
    COALESCE(olp.monthly_spend_cap_usd, 999999) AS monthly_cap,
    get_monthly_ai_spend(p_org_id) >= COALESCE(olp.monthly_spend_cap_usd, 999999) AS cap_reached,
    get_monthly_ai_spend(p_org_id) >= (COALESCE(olp.monthly_spend_cap_usd, 999999) * COALESCE(olp.alert_threshold_percent, 80) / 100) AS alert_threshold_reached
  FROM organization_llm_policies olp
  WHERE olp.organization_id = p_org_id;
$$;

COMMENT ON FUNCTION check_ai_spend_cap IS 'Check if organization has reached monthly spend cap';

-- Calculate cost for a run based on current pricing
CREATE OR REPLACE FUNCTION calculate_ai_cost(
  p_provider ai_provider,
  p_model TEXT,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER
)
RETURNS DECIMAL(10, 6)
LANGUAGE SQL
STABLE
SECURITY DEFINER
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

COMMENT ON FUNCTION calculate_ai_cost IS 'Calculate cost for an AI run based on current pricing';

-- Get organization LLM policy with defaults
CREATE OR REPLACE FUNCTION get_org_llm_policy(p_org_id UUID)
RETURNS TABLE(
  default_provider ai_provider,
  default_model TEXT,
  arabic_provider ai_provider,
  arabic_model TEXT,
  allow_cloud_for_confidential BOOLEAN,
  private_provider ai_provider,
  private_model TEXT,
  private_endpoint_url TEXT,
  monthly_spend_cap_usd DECIMAL(10, 2),
  brief_generation_enabled BOOLEAN,
  chat_enabled BOOLEAN,
  entity_linking_enabled BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(olp.default_provider, 'openai'::ai_provider),
    COALESCE(olp.default_model, 'gpt-4o'),
    olp.arabic_provider,
    olp.arabic_model,
    COALESCE(olp.allow_cloud_for_confidential, false),
    olp.private_provider,
    olp.private_model,
    olp.private_endpoint_url,
    olp.monthly_spend_cap_usd,
    COALESCE(olp.brief_generation_enabled, true),
    COALESCE(olp.chat_enabled, true),
    COALESCE(olp.entity_linking_enabled, true)
  FROM organization_llm_policies olp
  WHERE olp.organization_id = p_org_id;
$$;

COMMENT ON FUNCTION get_org_llm_policy IS 'Get organization LLM policy with sensible defaults';

-- Record AI run start
CREATE OR REPLACE FUNCTION start_ai_run(
  p_org_id UUID,
  p_user_id UUID,
  p_feature ai_feature,
  p_provider ai_provider,
  p_model TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID;
BEGIN
  INSERT INTO ai_runs (
    organization_id,
    user_id,
    feature,
    provider,
    model,
    status,
    started_at,
    request_metadata
  ) VALUES (
    p_org_id,
    p_user_id,
    p_feature,
    p_provider,
    p_model,
    'running',
    NOW(),
    p_metadata
  ) RETURNING id INTO v_run_id;
  
  RETURN v_run_id;
END;
$$;

COMMENT ON FUNCTION start_ai_run IS 'Record the start of an AI run';

-- Complete AI run
CREATE OR REPLACE FUNCTION complete_ai_run(
  p_run_id UUID,
  p_status ai_run_status,
  p_input_tokens INTEGER DEFAULT NULL,
  p_output_tokens INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider ai_provider;
  v_model TEXT;
  v_cost DECIMAL(10, 6);
  v_started_at TIMESTAMPTZ;
  v_latency INTEGER;
BEGIN
  -- Get run details
  SELECT provider, model, started_at 
  INTO v_provider, v_model, v_started_at
  FROM ai_runs WHERE id = p_run_id;
  
  -- Calculate latency
  v_latency := EXTRACT(MILLISECONDS FROM (NOW() - v_started_at));
  
  -- Calculate cost if tokens provided
  IF p_input_tokens IS NOT NULL AND p_output_tokens IS NOT NULL THEN
    v_cost := calculate_ai_cost(v_provider, v_model, p_input_tokens, p_output_tokens);
  END IF;
  
  -- Update run
  UPDATE ai_runs SET
    status = p_status,
    input_tokens = p_input_tokens,
    output_tokens = p_output_tokens,
    estimated_cost_usd = v_cost,
    latency_ms = v_latency,
    completed_at = NOW(),
    error_message = p_error_message
  WHERE id = p_run_id;
END;
$$;

COMMENT ON FUNCTION complete_ai_run IS 'Mark an AI run as complete with metrics';
