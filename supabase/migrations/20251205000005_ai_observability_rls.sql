-- AI Brief Generation Feature: RLS Policies for Observability
-- Migration: 20251205000005_ai_observability_rls.sql

-- Enable RLS
ALTER TABLE ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_llm_policies ENABLE ROW LEVEL SECURITY;

-- ai_runs policies
DROP POLICY IF EXISTS "Users can view own AI runs" ON ai_runs;
CREATE POLICY "Users can view own AI runs"
ON ai_runs FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view org AI runs" ON ai_runs;
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

DROP POLICY IF EXISTS "Service role can manage AI runs" ON ai_runs;
CREATE POLICY "Service role can manage AI runs"
ON ai_runs FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ai_messages policies
DROP POLICY IF EXISTS "Users can view messages for own runs" ON ai_messages;
CREATE POLICY "Users can view messages for own runs"
ON ai_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_runs
    WHERE ai_runs.id = ai_messages.run_id
      AND ai_runs.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role can manage AI messages" ON ai_messages;
CREATE POLICY "Service role can manage AI messages"
ON ai_messages FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ai_tool_calls policies
DROP POLICY IF EXISTS "Users can view tool calls for own runs" ON ai_tool_calls;
CREATE POLICY "Users can view tool calls for own runs"
ON ai_tool_calls FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_runs
    WHERE ai_runs.id = ai_tool_calls.run_id
      AND ai_runs.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role can manage AI tool calls" ON ai_tool_calls;
CREATE POLICY "Service role can manage AI tool calls"
ON ai_tool_calls FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ai_model_pricing policies (read-only for authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view pricing" ON ai_model_pricing;
CREATE POLICY "Authenticated users can view pricing"
ON ai_model_pricing FOR SELECT TO authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Service role can manage pricing" ON ai_model_pricing;
CREATE POLICY "Service role can manage pricing"
ON ai_model_pricing FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- organization_llm_policies policies
DROP POLICY IF EXISTS "Members can view org LLM policy" ON organization_llm_policies;
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

DROP POLICY IF EXISTS "Admins can update org LLM policy" ON organization_llm_policies;
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

DROP POLICY IF EXISTS "Service role can manage LLM policies" ON organization_llm_policies;
CREATE POLICY "Service role can manage LLM policies"
ON organization_llm_policies FOR ALL TO service_role
USING (true)
WITH CHECK (true);
