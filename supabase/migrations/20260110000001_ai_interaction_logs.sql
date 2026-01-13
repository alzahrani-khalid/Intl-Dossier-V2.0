-- AI Interaction Logging: Comprehensive governance and accountability
-- Migration: 20260110000001_ai_interaction_logs.sql
-- Feature: ai-interaction-logging
-- Description: Enables comprehensive logging of all AI interactions including prompts sent,
--              responses received, user edits, and approval decisions for governance and accountability.

-- =====================================================
-- ENUMS
-- =====================================================

-- Interaction types for categorizing AI operations
DO $$ BEGIN
  CREATE TYPE ai_interaction_type AS ENUM (
    'generation',        -- AI generates new content
    'suggestion',        -- AI suggests edits/improvements
    'classification',    -- AI classifies/categorizes
    'extraction',        -- AI extracts information
    'translation',       -- AI translates content
    'summarization',     -- AI summarizes content
    'analysis',          -- AI analyzes data
    'chat'               -- Conversational interaction
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Decision types for approval workflow
DO $$ BEGIN
  CREATE TYPE ai_decision_type AS ENUM (
    'approved',              -- User accepted AI output as-is
    'approved_with_edits',   -- User accepted after making edits
    'rejected',              -- User rejected AI output
    'revision_requested',    -- User requested AI regeneration
    'pending',               -- Awaiting user decision
    'expired',               -- Decision window expired
    'auto_approved'          -- System auto-approved (e.g., low-risk content)
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Content types that AI can generate/modify
DO $$ BEGIN
  CREATE TYPE ai_content_type AS ENUM (
    'brief',             -- Briefing documents
    'position',          -- Position statements
    'summary',           -- Content summaries
    'analysis',          -- Analysis reports
    'recommendation',    -- AI recommendations
    'entity_link',       -- Entity linking suggestions
    'translation',       -- Translation output
    'extraction',        -- Extracted data
    'chat_response'      -- Chat/conversational response
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE ai_interaction_type IS 'Categories of AI interactions for governance tracking';
COMMENT ON TYPE ai_decision_type IS 'User decision types for AI output approval workflow';
COMMENT ON TYPE ai_content_type IS 'Types of content AI can generate or modify';

-- =====================================================
-- MAIN TABLES
-- =====================================================

-- AI Interaction Logs: Master record for each AI interaction
CREATE TABLE IF NOT EXISTS ai_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Run reference (links to existing ai_runs table)
  run_id UUID REFERENCES ai_runs(id) ON DELETE SET NULL,

  -- Organization context
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Interaction classification
  interaction_type ai_interaction_type NOT NULL,
  content_type ai_content_type NOT NULL,

  -- Target entity (what is being generated/modified)
  target_entity_type linkable_entity_type,
  target_entity_id UUID,

  -- Session tracking for multi-turn interactions
  session_id UUID,
  parent_interaction_id UUID REFERENCES ai_interaction_logs(id) ON DELETE SET NULL,
  sequence_number INTEGER DEFAULT 1,

  -- Prompt details
  system_prompt TEXT,
  user_prompt TEXT NOT NULL,
  prompt_template_id TEXT,
  prompt_variables JSONB DEFAULT '{}',

  -- Context provided to AI
  context_sources JSONB DEFAULT '[]', -- Array of {type, id, snippet}
  context_token_count INTEGER,

  -- Response details
  ai_response TEXT,
  ai_response_structured JSONB, -- For structured outputs
  response_token_count INTEGER,

  -- Model information
  model_provider ai_provider NOT NULL,
  model_name TEXT NOT NULL,
  model_version TEXT,
  model_parameters JSONB DEFAULT '{}', -- temperature, top_p, etc.

  -- Performance metrics
  latency_ms INTEGER,
  total_tokens INTEGER GENERATED ALWAYS AS (COALESCE(context_token_count, 0) + COALESCE(response_token_count, 0)) STORED,
  estimated_cost_usd DECIMAL(10, 6),

  -- Governance metadata
  data_classification data_classification DEFAULT 'internal',
  contains_pii BOOLEAN DEFAULT false,
  governance_flags JSONB DEFAULT '{}', -- e.g., {high_risk: true, reason: "..."}

  -- Status
  status ai_run_status NOT NULL DEFAULT 'pending',
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Audit trail
  request_ip INET,
  user_agent TEXT
);

COMMENT ON TABLE ai_interaction_logs IS 'Comprehensive logging of all AI interactions for governance and accountability';

-- User Edits: Track modifications users make to AI-generated content
CREATE TABLE IF NOT EXISTS ai_user_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to interaction
  interaction_id UUID NOT NULL REFERENCES ai_interaction_logs(id) ON DELETE CASCADE,

  -- User who made edits
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Edit versioning
  version_number INTEGER NOT NULL DEFAULT 1,

  -- Original and edited content
  original_content TEXT NOT NULL,
  edited_content TEXT NOT NULL,

  -- Diff information (for auditing)
  diff_summary JSONB DEFAULT '{}', -- {additions: n, deletions: n, changes: [...]}
  change_percentage DECIMAL(5, 2), -- Percentage of content changed

  -- Edit categorization
  edit_reason TEXT, -- User-provided reason for edits
  edit_categories TEXT[], -- ['factual_correction', 'tone_adjustment', 'formatting', etc.]

  -- Time spent editing
  edit_duration_seconds INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_user_edits IS 'Tracks user modifications to AI-generated content before approval';

-- Approval Decisions: Track approval workflow decisions
CREATE TABLE IF NOT EXISTS ai_approval_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to interaction
  interaction_id UUID NOT NULL REFERENCES ai_interaction_logs(id) ON DELETE CASCADE,

  -- Decision maker
  decided_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Decision details
  decision ai_decision_type NOT NULL,
  decision_rationale TEXT,

  -- Content state at decision
  content_at_decision TEXT NOT NULL, -- What was approved/rejected
  final_version_number INTEGER, -- If edits were made, which version

  -- Risk assessment
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors JSONB DEFAULT '[]', -- Array of identified risks

  -- Compliance flags
  compliance_checks JSONB DEFAULT '{}', -- {policy_compliant: true, ...}
  requires_second_approval BOOLEAN DEFAULT false,
  second_approver_id UUID REFERENCES auth.users(id),
  second_approval_at TIMESTAMPTZ,

  -- Decision timing
  decision_time_seconds INTEGER, -- Time from interaction creation to decision
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_approval_decisions IS 'Records user approval/rejection decisions for AI-generated content';

-- Governance Audit Trail: Immutable log for compliance
CREATE TABLE IF NOT EXISTS ai_governance_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to interaction
  interaction_id UUID NOT NULL REFERENCES ai_interaction_logs(id) ON DELETE CASCADE,

  -- Event type
  event_type TEXT NOT NULL CHECK (event_type IN (
    'interaction_started',
    'prompt_sent',
    'response_received',
    'user_edit',
    'approval_requested',
    'approved',
    'rejected',
    'revision_requested',
    'content_published',
    'content_retracted',
    'policy_violation',
    'risk_flagged',
    'review_escalated'
  )),

  -- Event details
  event_data JSONB NOT NULL DEFAULT '{}',

  -- Actor
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'ai')),

  -- Timestamps (immutable)
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_governance_audit IS 'Immutable audit trail for AI governance and compliance';

-- =====================================================
-- INDEXES
-- =====================================================

-- ai_interaction_logs indexes
CREATE INDEX IF NOT EXISTS idx_ai_interaction_org_created
  ON ai_interaction_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interaction_user
  ON ai_interaction_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interaction_type
  ON ai_interaction_logs(interaction_type, content_type);
CREATE INDEX IF NOT EXISTS idx_ai_interaction_target
  ON ai_interaction_logs(target_entity_type, target_entity_id)
  WHERE target_entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_interaction_session
  ON ai_interaction_logs(session_id)
  WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_interaction_status
  ON ai_interaction_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interaction_run
  ON ai_interaction_logs(run_id)
  WHERE run_id IS NOT NULL;

-- ai_user_edits indexes
CREATE INDEX IF NOT EXISTS idx_ai_edits_interaction
  ON ai_user_edits(interaction_id, version_number);
CREATE INDEX IF NOT EXISTS idx_ai_edits_user
  ON ai_user_edits(user_id, created_at DESC);

-- ai_approval_decisions indexes
CREATE INDEX IF NOT EXISTS idx_ai_approval_interaction
  ON ai_approval_decisions(interaction_id);
CREATE INDEX IF NOT EXISTS idx_ai_approval_decision
  ON ai_approval_decisions(decision, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_approval_user
  ON ai_approval_decisions(decided_by, created_at DESC);

-- ai_governance_audit indexes
CREATE INDEX IF NOT EXISTS idx_ai_audit_interaction
  ON ai_governance_audit(interaction_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_ai_audit_type
  ON ai_governance_audit(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_actor
  ON ai_governance_audit(actor_id, occurred_at DESC)
  WHERE actor_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE ai_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_approval_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_governance_audit ENABLE ROW LEVEL SECURITY;

-- ai_interaction_logs policies
DROP POLICY IF EXISTS "Users can view own interactions" ON ai_interaction_logs;
CREATE POLICY "Users can view own interactions"
ON ai_interaction_logs FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view org interactions" ON ai_interaction_logs;
CREATE POLICY "Admins can view org interactions"
ON ai_interaction_logs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = ai_interaction_logs.organization_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
      AND om.role IN ('admin', 'owner')
  )
);

DROP POLICY IF EXISTS "Service role full access interactions" ON ai_interaction_logs;
CREATE POLICY "Service role full access interactions"
ON ai_interaction_logs FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ai_user_edits policies
DROP POLICY IF EXISTS "Users can view edits on own interactions" ON ai_user_edits;
CREATE POLICY "Users can view edits on own interactions"
ON ai_user_edits FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_interaction_logs ail
    WHERE ail.id = ai_user_edits.interaction_id
      AND ail.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create own edits" ON ai_user_edits;
CREATE POLICY "Users can create own edits"
ON ai_user_edits FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access edits" ON ai_user_edits;
CREATE POLICY "Service role full access edits"
ON ai_user_edits FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ai_approval_decisions policies
DROP POLICY IF EXISTS "Users can view own decisions" ON ai_approval_decisions;
CREATE POLICY "Users can view own decisions"
ON ai_approval_decisions FOR SELECT TO authenticated
USING (decided_by = auth.uid());

DROP POLICY IF EXISTS "Users can view decisions on own interactions" ON ai_approval_decisions;
CREATE POLICY "Users can view decisions on own interactions"
ON ai_approval_decisions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_interaction_logs ail
    WHERE ail.id = ai_approval_decisions.interaction_id
      AND ail.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create decisions" ON ai_approval_decisions;
CREATE POLICY "Users can create decisions"
ON ai_approval_decisions FOR INSERT TO authenticated
WITH CHECK (decided_by = auth.uid());

DROP POLICY IF EXISTS "Service role full access decisions" ON ai_approval_decisions;
CREATE POLICY "Service role full access decisions"
ON ai_approval_decisions FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ai_governance_audit policies (read-only for users, admins can view all org)
DROP POLICY IF EXISTS "Users can view audit for own interactions" ON ai_governance_audit;
CREATE POLICY "Users can view audit for own interactions"
ON ai_governance_audit FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_interaction_logs ail
    WHERE ail.id = ai_governance_audit.interaction_id
      AND ail.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can view all org audit" ON ai_governance_audit;
CREATE POLICY "Admins can view all org audit"
ON ai_governance_audit FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_interaction_logs ail
    JOIN organization_members om ON om.organization_id = ail.organization_id
    WHERE ail.id = ai_governance_audit.interaction_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
      AND om.role IN ('admin', 'owner')
  )
);

DROP POLICY IF EXISTS "Service role full access audit" ON ai_governance_audit;
CREATE POLICY "Service role full access audit"
ON ai_governance_audit FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Log AI interaction start
CREATE OR REPLACE FUNCTION log_ai_interaction_start(
  p_org_id UUID,
  p_user_id UUID,
  p_interaction_type ai_interaction_type,
  p_content_type ai_content_type,
  p_model_provider ai_provider,
  p_model_name TEXT,
  p_user_prompt TEXT,
  p_system_prompt TEXT DEFAULT NULL,
  p_target_entity_type linkable_entity_type DEFAULT NULL,
  p_target_entity_id UUID DEFAULT NULL,
  p_session_id UUID DEFAULT NULL,
  p_parent_interaction_id UUID DEFAULT NULL,
  p_context_sources JSONB DEFAULT '[]',
  p_prompt_variables JSONB DEFAULT '{}',
  p_data_classification data_classification DEFAULT 'internal',
  p_request_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_interaction_id UUID;
  v_sequence_number INTEGER := 1;
BEGIN
  -- Calculate sequence number for session
  IF p_session_id IS NOT NULL THEN
    SELECT COALESCE(MAX(sequence_number), 0) + 1
    INTO v_sequence_number
    FROM ai_interaction_logs
    WHERE session_id = p_session_id;
  END IF;

  -- Insert interaction log
  INSERT INTO ai_interaction_logs (
    organization_id,
    user_id,
    interaction_type,
    content_type,
    model_provider,
    model_name,
    user_prompt,
    system_prompt,
    target_entity_type,
    target_entity_id,
    session_id,
    parent_interaction_id,
    sequence_number,
    context_sources,
    prompt_variables,
    data_classification,
    status,
    request_ip,
    user_agent
  ) VALUES (
    p_org_id,
    p_user_id,
    p_interaction_type,
    p_content_type,
    p_model_provider,
    p_model_name,
    p_user_prompt,
    p_system_prompt,
    p_target_entity_type,
    p_target_entity_id,
    p_session_id,
    p_parent_interaction_id,
    v_sequence_number,
    p_context_sources,
    p_prompt_variables,
    p_data_classification,
    'running',
    p_request_ip,
    p_user_agent
  ) RETURNING id INTO v_interaction_id;

  -- Log to governance audit
  INSERT INTO ai_governance_audit (
    interaction_id,
    event_type,
    event_data,
    actor_id,
    actor_type
  ) VALUES (
    v_interaction_id,
    'interaction_started',
    jsonb_build_object(
      'interaction_type', p_interaction_type,
      'content_type', p_content_type,
      'model', p_model_provider || '/' || p_model_name
    ),
    p_user_id,
    'user'
  );

  -- Log prompt sent
  INSERT INTO ai_governance_audit (
    interaction_id,
    event_type,
    event_data,
    actor_id,
    actor_type
  ) VALUES (
    v_interaction_id,
    'prompt_sent',
    jsonb_build_object(
      'prompt_length', LENGTH(p_user_prompt),
      'has_system_prompt', p_system_prompt IS NOT NULL,
      'context_sources_count', jsonb_array_length(p_context_sources)
    ),
    p_user_id,
    'user'
  );

  RETURN v_interaction_id;
END;
$$;

COMMENT ON FUNCTION log_ai_interaction_start IS 'Log the start of an AI interaction with full context';

-- Log AI interaction completion
CREATE OR REPLACE FUNCTION log_ai_interaction_complete(
  p_interaction_id UUID,
  p_status ai_run_status,
  p_ai_response TEXT DEFAULT NULL,
  p_ai_response_structured JSONB DEFAULT NULL,
  p_context_token_count INTEGER DEFAULT NULL,
  p_response_token_count INTEGER DEFAULT NULL,
  p_latency_ms INTEGER DEFAULT NULL,
  p_estimated_cost_usd DECIMAL DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_contains_pii BOOLEAN DEFAULT false,
  p_governance_flags JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id from interaction
  SELECT user_id INTO v_user_id
  FROM ai_interaction_logs
  WHERE id = p_interaction_id;

  -- Update interaction
  UPDATE ai_interaction_logs SET
    status = p_status,
    ai_response = p_ai_response,
    ai_response_structured = p_ai_response_structured,
    context_token_count = p_context_token_count,
    response_token_count = p_response_token_count,
    latency_ms = p_latency_ms,
    estimated_cost_usd = p_estimated_cost_usd,
    error_message = p_error_message,
    completed_at = NOW(),
    contains_pii = p_contains_pii,
    governance_flags = p_governance_flags
  WHERE id = p_interaction_id;

  -- Log to governance audit
  INSERT INTO ai_governance_audit (
    interaction_id,
    event_type,
    event_data,
    actor_id,
    actor_type
  ) VALUES (
    p_interaction_id,
    'response_received',
    jsonb_build_object(
      'status', p_status,
      'response_length', COALESCE(LENGTH(p_ai_response), 0),
      'latency_ms', p_latency_ms,
      'tokens', p_context_token_count + COALESCE(p_response_token_count, 0),
      'cost_usd', p_estimated_cost_usd,
      'contains_pii', p_contains_pii
    ),
    v_user_id,
    'ai'
  );
END;
$$;

COMMENT ON FUNCTION log_ai_interaction_complete IS 'Log completion of an AI interaction';

-- Log user edit
CREATE OR REPLACE FUNCTION log_ai_user_edit(
  p_interaction_id UUID,
  p_user_id UUID,
  p_original_content TEXT,
  p_edited_content TEXT,
  p_edit_reason TEXT DEFAULT NULL,
  p_edit_categories TEXT[] DEFAULT '{}',
  p_edit_duration_seconds INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_edit_id UUID;
  v_version_number INTEGER;
  v_change_percentage DECIMAL(5, 2);
  v_original_len INTEGER;
  v_edit_distance INTEGER;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM ai_user_edits
  WHERE interaction_id = p_interaction_id;

  -- Calculate change percentage (simple length-based approximation)
  v_original_len := LENGTH(p_original_content);
  IF v_original_len > 0 THEN
    v_change_percentage := (ABS(LENGTH(p_edited_content) - v_original_len)::DECIMAL / v_original_len) * 100;
    v_change_percentage := LEAST(v_change_percentage, 100.00);
  ELSE
    v_change_percentage := 100.00;
  END IF;

  -- Insert edit record
  INSERT INTO ai_user_edits (
    interaction_id,
    user_id,
    version_number,
    original_content,
    edited_content,
    change_percentage,
    edit_reason,
    edit_categories,
    edit_duration_seconds,
    diff_summary
  ) VALUES (
    p_interaction_id,
    p_user_id,
    v_version_number,
    p_original_content,
    p_edited_content,
    v_change_percentage,
    p_edit_reason,
    p_edit_categories,
    p_edit_duration_seconds,
    jsonb_build_object(
      'version', v_version_number,
      'original_length', v_original_len,
      'edited_length', LENGTH(p_edited_content),
      'change_percentage', v_change_percentage
    )
  ) RETURNING id INTO v_edit_id;

  -- Log to governance audit
  INSERT INTO ai_governance_audit (
    interaction_id,
    event_type,
    event_data,
    actor_id,
    actor_type
  ) VALUES (
    p_interaction_id,
    'user_edit',
    jsonb_build_object(
      'edit_id', v_edit_id,
      'version', v_version_number,
      'change_percentage', v_change_percentage,
      'categories', p_edit_categories
    ),
    p_user_id,
    'user'
  );

  RETURN v_edit_id;
END;
$$;

COMMENT ON FUNCTION log_ai_user_edit IS 'Log user edits to AI-generated content';

-- Log approval decision
CREATE OR REPLACE FUNCTION log_ai_approval_decision(
  p_interaction_id UUID,
  p_user_id UUID,
  p_decision ai_decision_type,
  p_content_at_decision TEXT,
  p_decision_rationale TEXT DEFAULT NULL,
  p_final_version_number INTEGER DEFAULT NULL,
  p_risk_level TEXT DEFAULT 'low',
  p_risk_factors JSONB DEFAULT '[]',
  p_compliance_checks JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_decision_id UUID;
  v_interaction_created_at TIMESTAMPTZ;
  v_decision_time_seconds INTEGER;
BEGIN
  -- Get interaction created_at for timing
  SELECT created_at INTO v_interaction_created_at
  FROM ai_interaction_logs
  WHERE id = p_interaction_id;

  v_decision_time_seconds := EXTRACT(EPOCH FROM (NOW() - v_interaction_created_at))::INTEGER;

  -- Insert decision
  INSERT INTO ai_approval_decisions (
    interaction_id,
    decided_by,
    decision,
    content_at_decision,
    decision_rationale,
    final_version_number,
    risk_level,
    risk_factors,
    compliance_checks,
    decision_time_seconds
  ) VALUES (
    p_interaction_id,
    p_user_id,
    p_decision,
    p_content_at_decision,
    p_decision_rationale,
    p_final_version_number,
    p_risk_level,
    p_risk_factors,
    p_compliance_checks,
    v_decision_time_seconds
  ) RETURNING id INTO v_decision_id;

  -- Log to governance audit
  INSERT INTO ai_governance_audit (
    interaction_id,
    event_type,
    event_data,
    actor_id,
    actor_type
  ) VALUES (
    p_interaction_id,
    CASE p_decision
      WHEN 'approved' THEN 'approved'
      WHEN 'approved_with_edits' THEN 'approved'
      WHEN 'rejected' THEN 'rejected'
      WHEN 'revision_requested' THEN 'revision_requested'
      ELSE 'approval_requested'
    END,
    jsonb_build_object(
      'decision_id', v_decision_id,
      'decision', p_decision,
      'risk_level', p_risk_level,
      'time_to_decision_seconds', v_decision_time_seconds,
      'had_edits', p_final_version_number IS NOT NULL AND p_final_version_number > 0
    ),
    p_user_id,
    'user'
  );

  RETURN v_decision_id;
END;
$$;

COMMENT ON FUNCTION log_ai_approval_decision IS 'Log user approval/rejection decision for AI content';

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Interaction summary view
CREATE OR REPLACE VIEW ai_interaction_summary AS
SELECT
  date_trunc('day', ail.created_at) AS interaction_date,
  ail.organization_id,
  ail.interaction_type,
  ail.content_type,
  ail.model_provider,
  ail.model_name,
  COUNT(*) AS total_interactions,
  COUNT(*) FILTER (WHERE ail.status = 'completed') AS completed_count,
  COUNT(*) FILTER (WHERE ail.status = 'failed') AS failed_count,
  AVG(ail.latency_ms) AS avg_latency_ms,
  SUM(ail.total_tokens) AS total_tokens,
  SUM(ail.estimated_cost_usd) AS total_cost_usd,
  COUNT(DISTINCT aad.id) FILTER (WHERE aad.decision = 'approved') AS approved_count,
  COUNT(DISTINCT aad.id) FILTER (WHERE aad.decision = 'approved_with_edits') AS approved_with_edits_count,
  COUNT(DISTINCT aad.id) FILTER (WHERE aad.decision = 'rejected') AS rejected_count,
  AVG(aue.change_percentage) FILTER (WHERE aue.id IS NOT NULL) AS avg_edit_percentage
FROM ai_interaction_logs ail
LEFT JOIN ai_approval_decisions aad ON aad.interaction_id = ail.id
LEFT JOIN ai_user_edits aue ON aue.interaction_id = ail.id
GROUP BY
  date_trunc('day', ail.created_at),
  ail.organization_id,
  ail.interaction_type,
  ail.content_type,
  ail.model_provider,
  ail.model_name;

COMMENT ON VIEW ai_interaction_summary IS 'Daily summary of AI interactions for governance reporting';

-- User AI activity view
CREATE OR REPLACE VIEW user_ai_activity AS
SELECT
  ail.user_id,
  ail.organization_id,
  u.email AS user_email,
  COUNT(*) AS total_interactions,
  COUNT(*) FILTER (WHERE ail.status = 'completed') AS completed_interactions,
  COUNT(DISTINCT aad.id) AS total_decisions,
  COUNT(DISTINCT aad.id) FILTER (WHERE aad.decision IN ('approved', 'approved_with_edits')) AS approvals,
  COUNT(DISTINCT aad.id) FILTER (WHERE aad.decision = 'rejected') AS rejections,
  COUNT(DISTINCT aue.id) AS total_edits,
  AVG(aue.change_percentage) AS avg_edit_percentage,
  SUM(ail.total_tokens) AS total_tokens_used,
  SUM(ail.estimated_cost_usd) AS total_cost_usd,
  MAX(ail.created_at) AS last_interaction_at
FROM ai_interaction_logs ail
JOIN auth.users u ON u.id = ail.user_id
LEFT JOIN ai_approval_decisions aad ON aad.interaction_id = ail.id
LEFT JOIN ai_user_edits aue ON aue.interaction_id = ail.id
GROUP BY
  ail.user_id,
  ail.organization_id,
  u.email;

COMMENT ON VIEW user_ai_activity IS 'User-level AI activity summary for accountability';

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON ai_interaction_logs TO authenticated;
GRANT SELECT, INSERT ON ai_user_edits TO authenticated;
GRANT SELECT, INSERT ON ai_approval_decisions TO authenticated;
GRANT SELECT ON ai_governance_audit TO authenticated;
GRANT SELECT ON ai_interaction_summary TO authenticated;
GRANT SELECT ON user_ai_activity TO authenticated;

GRANT ALL ON ai_interaction_logs TO service_role;
GRANT ALL ON ai_user_edits TO service_role;
GRANT ALL ON ai_approval_decisions TO service_role;
GRANT ALL ON ai_governance_audit TO service_role;
