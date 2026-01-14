-- ============================================================================
-- Migration: Compliance Rules Infrastructure
-- Feature: compliance-rules-management
-- Description: Define compliance rules for engagements, commitments, and
--              relationships with automated violation detection and sign-off workflows
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Compliance rule types
CREATE TYPE compliance_rule_type AS ENUM (
  'cooling_off_period',        -- Time gap required between specific activities
  'disclosure_requirement',    -- Required disclosures before engagement
  'conflict_check',            -- Check for conflicts of interest
  'approval_threshold',        -- Requires approval above certain thresholds
  'frequency_limit',           -- Limits on interaction frequency
  'relationship_restriction',  -- Restrictions on certain relationships
  'documentation_requirement', -- Required documentation for activities
  'gift_limit',                -- Limits on gifts/hospitality value
  'recusal_requirement',       -- When recusal is required
  'reporting_requirement'      -- Mandatory reporting after activities
);

-- Rule severity levels
CREATE TYPE compliance_severity AS ENUM (
  'info',      -- Informational - no action required
  'warning',   -- Warning - review recommended
  'critical',  -- Critical - requires sign-off
  'blocking'   -- Blocking - cannot proceed without approval
);

-- Entity types that rules apply to
CREATE TYPE compliance_entity_type AS ENUM (
  'engagement',
  'commitment',
  'relationship',
  'person',
  'organization',
  'country',
  'all'
);

-- Violation status
CREATE TYPE violation_status AS ENUM (
  'pending',            -- Newly detected, awaiting review
  'acknowledged',       -- User acknowledged the violation
  'signed_off',         -- Approved by authorized personnel
  'waived',             -- Rule waived with justification
  'resolved',           -- Issue has been resolved
  'escalated',          -- Escalated to higher authority
  'expired'             -- No longer relevant
);

-- Sign-off action types
CREATE TYPE signoff_action AS ENUM (
  'approve',
  'reject',
  'request_info',
  'escalate',
  'waive'
);

-- ============================================================================
-- COMPLIANCE RULES TABLE
-- ============================================================================

CREATE TABLE compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rule identification
  rule_code VARCHAR(50) UNIQUE NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Rule classification
  rule_type compliance_rule_type NOT NULL,
  severity compliance_severity NOT NULL DEFAULT 'warning',
  entity_types compliance_entity_type[] NOT NULL DEFAULT '{all}',

  -- Rule configuration (JSONB for flexibility)
  conditions JSONB NOT NULL DEFAULT '{}',
  /*
    conditions structure examples:
    - cooling_off_period: { "days": 90, "applies_to": ["organization_change", "contract_end"] }
    - disclosure_requirement: { "fields": ["financial_interest", "prior_relationship"], "threshold": 1000 }
    - conflict_check: { "check_relationships": true, "check_family": true, "degrees": 2 }
    - approval_threshold: { "amount": 5000, "currency": "USD" }
    - frequency_limit: { "max_interactions": 5, "period_days": 30 }
    - gift_limit: { "max_value": 100, "currency": "USD", "period": "annual" }
  */

  -- Actions when triggered
  notification_template_en TEXT,
  notification_template_ar TEXT,
  remediation_instructions_en TEXT,
  remediation_instructions_ar TEXT,

  -- Sign-off configuration
  requires_signoff BOOLEAN NOT NULL DEFAULT false,
  signoff_roles TEXT[] DEFAULT '{}', -- e.g., ['compliance_officer', 'supervisor', 'legal']
  signoff_deadline_hours INT DEFAULT 72,
  auto_escalate_hours INT DEFAULT 48,

  -- Rule applicability
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  applies_to_regions TEXT[] DEFAULT '{}', -- Empty = all regions
  applies_to_categories TEXT[] DEFAULT '{}', -- e.g., ['diplomatic', 'commercial']

  -- Metadata
  external_reference VARCHAR(255), -- Reference to external regulation
  regulatory_source TEXT, -- e.g., "FARA", "Lobbying Disclosure Act"
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMPLIANCE VIOLATIONS TABLE
-- ============================================================================

CREATE TABLE compliance_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rule reference
  rule_id UUID NOT NULL REFERENCES compliance_rules(id) ON DELETE RESTRICT,
  rule_code VARCHAR(50) NOT NULL, -- Denormalized for quick reference

  -- Violation context
  entity_type compliance_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  entity_name_en VARCHAR(255),
  entity_name_ar VARCHAR(255),

  -- Related entities (for relationship checks)
  related_entity_type compliance_entity_type,
  related_entity_id UUID,
  related_entity_name_en VARCHAR(255),
  related_entity_name_ar VARCHAR(255),

  -- Violation details
  severity compliance_severity NOT NULL,
  status violation_status NOT NULL DEFAULT 'pending',

  -- Detected violation info
  violation_details JSONB NOT NULL DEFAULT '{}',
  /*
    Example structures:
    - cooling_off: { "days_remaining": 45, "previous_activity": "...", "previous_date": "..." }
    - conflict: { "relationship_type": "...", "conflicting_party": "..." }
    - threshold: { "current_value": 6000, "threshold": 5000, "currency": "USD" }
  */

  -- Actions taken
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_by UUID REFERENCES auth.users(id),
  detected_method VARCHAR(50) DEFAULT 'automatic', -- 'automatic', 'manual_review', 'import'

  -- Resolution tracking
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledgement_notes TEXT,

  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,

  -- Escalation
  escalated_at TIMESTAMPTZ,
  escalated_to UUID REFERENCES auth.users(id),
  escalation_reason TEXT,

  -- Expiration
  expires_at TIMESTAMPTZ,

  -- Metadata
  dossier_id UUID, -- Parent dossier context if applicable
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMPLIANCE SIGN-OFFS TABLE
-- ============================================================================

CREATE TABLE compliance_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Violation reference
  violation_id UUID NOT NULL REFERENCES compliance_violations(id) ON DELETE CASCADE,

  -- Sign-off details
  action signoff_action NOT NULL,
  signed_by UUID NOT NULL REFERENCES auth.users(id),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Role context
  signer_role VARCHAR(50) NOT NULL,
  delegation_id UUID, -- If signing under delegated authority

  -- Justification
  justification TEXT,
  conditions TEXT[], -- Any conditions attached to approval

  -- Waiver details (if action = 'waive')
  waiver_valid_until TIMESTAMPTZ,
  waiver_scope TEXT, -- 'single' or 'ongoing'

  -- Digital signature (for audit trail)
  signature_hash VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMPLIANCE RULE TEMPLATES TABLE (Pre-defined common rules)
-- ============================================================================

CREATE TABLE compliance_rule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  template_code VARCHAR(50) UNIQUE NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  rule_type compliance_rule_type NOT NULL,
  default_severity compliance_severity NOT NULL DEFAULT 'warning',
  default_conditions JSONB NOT NULL DEFAULT '{}',

  category VARCHAR(100), -- e.g., 'lobbying', 'government_relations', 'gifts'
  regulatory_framework VARCHAR(255), -- e.g., 'US_FARA', 'UK_LOBBYING_ACT'

  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMPLIANCE CHECKS LOG (Audit trail for all compliance checks)
-- ============================================================================

CREATE TABLE compliance_checks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Check context
  entity_type compliance_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  action_type VARCHAR(100) NOT NULL, -- e.g., 'create_engagement', 'update_relationship'

  -- Check results
  rules_checked INT NOT NULL DEFAULT 0,
  violations_found INT NOT NULL DEFAULT 0,
  blocking_violations INT NOT NULL DEFAULT 0,

  -- Violations summary (quick reference)
  violation_ids UUID[] DEFAULT '{}',

  -- Outcome
  check_passed BOOLEAN NOT NULL DEFAULT true,
  blocked BOOLEAN NOT NULL DEFAULT false,

  -- User context
  checked_by UUID REFERENCES auth.users(id),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Performance tracking
  check_duration_ms INT,

  -- Raw results for debugging
  check_details JSONB DEFAULT '{}'
);

-- ============================================================================
-- COMPLIANCE EXEMPTIONS TABLE
-- ============================================================================

CREATE TABLE compliance_exemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Exemption scope
  rule_id UUID REFERENCES compliance_rules(id) ON DELETE CASCADE,
  rule_code VARCHAR(50), -- Can be null if rule_id is set

  -- Entity scope (null = organization-wide)
  entity_type compliance_entity_type,
  entity_id UUID,
  user_id UUID REFERENCES auth.users(id),

  -- Exemption details
  reason TEXT NOT NULL,
  justification TEXT,

  -- Validity
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,

  -- Review
  requires_renewal BOOLEAN NOT NULL DEFAULT true,
  renewal_reminder_days INT DEFAULT 30,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revocation_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Compliance rules indexes
CREATE INDEX idx_compliance_rules_type ON compliance_rules(rule_type);
CREATE INDEX idx_compliance_rules_severity ON compliance_rules(severity);
CREATE INDEX idx_compliance_rules_active ON compliance_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_compliance_rules_entity_types ON compliance_rules USING GIN(entity_types);

-- Compliance violations indexes
CREATE INDEX idx_compliance_violations_rule ON compliance_violations(rule_id);
CREATE INDEX idx_compliance_violations_entity ON compliance_violations(entity_type, entity_id);
CREATE INDEX idx_compliance_violations_status ON compliance_violations(status);
CREATE INDEX idx_compliance_violations_severity ON compliance_violations(severity);
CREATE INDEX idx_compliance_violations_pending ON compliance_violations(status, severity)
  WHERE status IN ('pending', 'acknowledged');
CREATE INDEX idx_compliance_violations_dossier ON compliance_violations(dossier_id)
  WHERE dossier_id IS NOT NULL;
CREATE INDEX idx_compliance_violations_detected ON compliance_violations(detected_at DESC);

-- Sign-offs indexes
CREATE INDEX idx_compliance_signoffs_violation ON compliance_signoffs(violation_id);
CREATE INDEX idx_compliance_signoffs_signer ON compliance_signoffs(signed_by);
CREATE INDEX idx_compliance_signoffs_action ON compliance_signoffs(action);

-- Checks log indexes
CREATE INDEX idx_compliance_checks_entity ON compliance_checks_log(entity_type, entity_id);
CREATE INDEX idx_compliance_checks_time ON compliance_checks_log(checked_at DESC);
CREATE INDEX idx_compliance_checks_blocked ON compliance_checks_log(blocked) WHERE blocked = true;

-- Exemptions indexes
CREATE INDEX idx_compliance_exemptions_rule ON compliance_exemptions(rule_id);
CREATE INDEX idx_compliance_exemptions_entity ON compliance_exemptions(entity_type, entity_id);
CREATE INDEX idx_compliance_exemptions_user ON compliance_exemptions(user_id);
CREATE INDEX idx_compliance_exemptions_active ON compliance_exemptions(is_active) WHERE is_active = true;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER update_compliance_rules_updated_at
  BEFORE UPDATE ON compliance_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_violations_updated_at
  BEFORE UPDATE ON compliance_violations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_exemptions_updated_at
  BEFORE UPDATE ON compliance_exemptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_signoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_exemptions ENABLE ROW LEVEL SECURITY;

-- Compliance rules - viewable by all authenticated, editable by admin/compliance officers
CREATE POLICY "compliance_rules_select" ON compliance_rules
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "compliance_rules_insert" ON compliance_rules
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('admin', 'compliance_officer')
    OR
    auth.uid() IN (
      SELECT user_id FROM users WHERE role IN ('admin', 'compliance_officer')
    )
  );

CREATE POLICY "compliance_rules_update" ON compliance_rules
  FOR UPDATE TO authenticated
  USING (
    (auth.jwt() ->> 'role') IN ('admin', 'compliance_officer')
    OR
    auth.uid() IN (
      SELECT user_id FROM users WHERE role IN ('admin', 'compliance_officer')
    )
  );

-- Violations - viewable by involved parties and compliance officers
CREATE POLICY "compliance_violations_select" ON compliance_violations
  FOR SELECT TO authenticated
  USING (
    detected_by = auth.uid()
    OR
    acknowledged_by = auth.uid()
    OR
    resolved_by = auth.uid()
    OR
    (auth.jwt() ->> 'role') IN ('admin', 'compliance_officer', 'supervisor')
  );

CREATE POLICY "compliance_violations_insert" ON compliance_violations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "compliance_violations_update" ON compliance_violations
  FOR UPDATE TO authenticated
  USING (
    detected_by = auth.uid()
    OR
    (auth.jwt() ->> 'role') IN ('admin', 'compliance_officer', 'supervisor')
  );

-- Sign-offs - viewable by all authenticated, insertable by authorized roles
CREATE POLICY "compliance_signoffs_select" ON compliance_signoffs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "compliance_signoffs_insert" ON compliance_signoffs
  FOR INSERT TO authenticated
  WITH CHECK (signed_by = auth.uid());

-- Templates - viewable by all
CREATE POLICY "compliance_templates_select" ON compliance_rule_templates
  FOR SELECT TO authenticated
  USING (true);

-- Checks log - viewable by involved users and compliance officers
CREATE POLICY "compliance_checks_select" ON compliance_checks_log
  FOR SELECT TO authenticated
  USING (
    checked_by = auth.uid()
    OR
    (auth.jwt() ->> 'role') IN ('admin', 'compliance_officer')
  );

CREATE POLICY "compliance_checks_insert" ON compliance_checks_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Exemptions - viewable by all authenticated, manageable by compliance officers
CREATE POLICY "compliance_exemptions_select" ON compliance_exemptions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "compliance_exemptions_insert" ON compliance_exemptions
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('admin', 'compliance_officer')
  );

CREATE POLICY "compliance_exemptions_update" ON compliance_exemptions
  FOR UPDATE TO authenticated
  USING (
    (auth.jwt() ->> 'role') IN ('admin', 'compliance_officer')
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check compliance for an entity
CREATE OR REPLACE FUNCTION check_entity_compliance(
  p_entity_type compliance_entity_type,
  p_entity_id UUID,
  p_action_type VARCHAR(100),
  p_context JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_rules RECORD;
  v_violations JSONB := '[]'::JSONB;
  v_violation_id UUID;
  v_rules_checked INT := 0;
  v_violations_found INT := 0;
  v_blocking_found INT := 0;
  v_violation_ids UUID[] := '{}';
  v_exemption_exists BOOLEAN;
  v_check_passed BOOLEAN := true;
BEGIN
  v_start_time := NOW();

  -- Get all active rules that apply to this entity type
  FOR v_rules IN
    SELECT * FROM compliance_rules
    WHERE is_active = true
      AND (effective_from IS NULL OR effective_from <= NOW())
      AND (effective_to IS NULL OR effective_to > NOW())
      AND (p_entity_type = ANY(entity_types) OR 'all' = ANY(entity_types))
    ORDER BY severity DESC, rule_code
  LOOP
    v_rules_checked := v_rules_checked + 1;

    -- Check for exemption
    SELECT EXISTS (
      SELECT 1 FROM compliance_exemptions
      WHERE (rule_id = v_rules.id OR rule_code = v_rules.rule_code)
        AND is_active = true
        AND (valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until > NOW())
        AND (entity_type IS NULL OR entity_type = p_entity_type)
        AND (entity_id IS NULL OR entity_id = p_entity_id)
    ) INTO v_exemption_exists;

    -- Skip if exempted
    IF v_exemption_exists THEN
      CONTINUE;
    END IF;

    -- Rule-specific checks would go here
    -- For now, we create a placeholder that returns the rule evaluation
    -- In practice, each rule type would have its own evaluation logic

    -- Example: Check if violation conditions are met based on rule type
    -- This is a simplified version - real implementation would have complex logic

    -- If violation found, create record
    IF p_context ? 'force_violation' AND (p_context->>'force_violation')::boolean THEN
      v_violations_found := v_violations_found + 1;

      IF v_rules.severity = 'blocking' THEN
        v_blocking_found := v_blocking_found + 1;
        v_check_passed := false;
      END IF;

      INSERT INTO compliance_violations (
        rule_id,
        rule_code,
        entity_type,
        entity_id,
        severity,
        status,
        violation_details,
        detected_by,
        detected_method
      ) VALUES (
        v_rules.id,
        v_rules.rule_code,
        p_entity_type,
        p_entity_id,
        v_rules.severity,
        'pending',
        jsonb_build_object(
          'rule_name', v_rules.name_en,
          'conditions', v_rules.conditions,
          'context', p_context
        ),
        auth.uid(),
        'automatic'
      )
      RETURNING id INTO v_violation_id;

      v_violation_ids := array_append(v_violation_ids, v_violation_id);

      v_violations := v_violations || jsonb_build_object(
        'violation_id', v_violation_id,
        'rule_code', v_rules.rule_code,
        'rule_name', v_rules.name_en,
        'severity', v_rules.severity,
        'requires_signoff', v_rules.requires_signoff
      );
    END IF;
  END LOOP;

  -- Log the check
  INSERT INTO compliance_checks_log (
    entity_type,
    entity_id,
    action_type,
    rules_checked,
    violations_found,
    blocking_violations,
    violation_ids,
    check_passed,
    blocked,
    checked_by,
    check_duration_ms,
    check_details
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_action_type,
    v_rules_checked,
    v_violations_found,
    v_blocking_found,
    v_violation_ids,
    v_check_passed,
    v_blocking_found > 0,
    auth.uid(),
    EXTRACT(MILLISECONDS FROM (NOW() - v_start_time))::INT,
    jsonb_build_object('context', p_context, 'violations', v_violations)
  );

  RETURN jsonb_build_object(
    'passed', v_check_passed,
    'blocked', v_blocking_found > 0,
    'rules_checked', v_rules_checked,
    'violations_found', v_violations_found,
    'blocking_violations', v_blocking_found,
    'violations', v_violations
  );
END;
$$;

-- Function to sign off on a violation
CREATE OR REPLACE FUNCTION signoff_violation(
  p_violation_id UUID,
  p_action signoff_action,
  p_justification TEXT,
  p_conditions TEXT[] DEFAULT '{}',
  p_waiver_valid_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_violation RECORD;
  v_signoff_id UUID;
  v_new_status violation_status;
BEGIN
  -- Get the violation
  SELECT * INTO v_violation
  FROM compliance_violations
  WHERE id = p_violation_id;

  IF v_violation IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Violation not found'
    );
  END IF;

  -- Determine new status based on action
  CASE p_action
    WHEN 'approve' THEN v_new_status := 'signed_off';
    WHEN 'reject' THEN v_new_status := 'pending';
    WHEN 'waive' THEN v_new_status := 'waived';
    WHEN 'escalate' THEN v_new_status := 'escalated';
    ELSE v_new_status := v_violation.status;
  END CASE;

  -- Create sign-off record
  INSERT INTO compliance_signoffs (
    violation_id,
    action,
    signed_by,
    signer_role,
    justification,
    conditions,
    waiver_valid_until,
    waiver_scope,
    ip_address
  ) VALUES (
    p_violation_id,
    p_action,
    auth.uid(),
    COALESCE((SELECT role FROM users WHERE user_id = auth.uid()), 'user'),
    p_justification,
    p_conditions,
    p_waiver_valid_until,
    CASE WHEN p_waiver_valid_until IS NOT NULL THEN 'temporary' ELSE 'single' END,
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  )
  RETURNING id INTO v_signoff_id;

  -- Update violation status
  UPDATE compliance_violations
  SET
    status = v_new_status,
    resolved_at = CASE WHEN p_action IN ('approve', 'waive') THEN NOW() ELSE resolved_at END,
    resolved_by = CASE WHEN p_action IN ('approve', 'waive') THEN auth.uid() ELSE resolved_by END,
    resolution_notes = CASE WHEN p_action IN ('approve', 'waive') THEN p_justification ELSE resolution_notes END,
    escalated_at = CASE WHEN p_action = 'escalate' THEN NOW() ELSE escalated_at END,
    escalation_reason = CASE WHEN p_action = 'escalate' THEN p_justification ELSE escalation_reason END,
    updated_at = NOW()
  WHERE id = p_violation_id;

  RETURN jsonb_build_object(
    'success', true,
    'signoff_id', v_signoff_id,
    'new_status', v_new_status
  );
END;
$$;

-- Function to get compliance summary for an entity
CREATE OR REPLACE FUNCTION get_entity_compliance_summary(
  p_entity_type compliance_entity_type,
  p_entity_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'entity_type', p_entity_type,
    'entity_id', p_entity_id,
    'total_violations', COUNT(*),
    'pending_violations', COUNT(*) FILTER (WHERE status = 'pending'),
    'critical_violations', COUNT(*) FILTER (WHERE severity = 'critical' AND status IN ('pending', 'acknowledged')),
    'blocking_violations', COUNT(*) FILTER (WHERE severity = 'blocking' AND status IN ('pending', 'acknowledged')),
    'requires_signoff', COUNT(*) FILTER (
      WHERE status IN ('pending', 'acknowledged')
      AND EXISTS (
        SELECT 1 FROM compliance_rules r WHERE r.id = compliance_violations.rule_id AND r.requires_signoff
      )
    ),
    'recent_violations', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'rule_code', rule_code,
          'severity', severity,
          'status', status,
          'detected_at', detected_at
        ) ORDER BY detected_at DESC
      ), '[]'::JSONB)
      FROM compliance_violations
      WHERE entity_type = p_entity_type
        AND entity_id = p_entity_id
        AND status IN ('pending', 'acknowledged')
      LIMIT 5
    )
  ) INTO v_result
  FROM compliance_violations
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- SEED DEFAULT RULE TEMPLATES
-- ============================================================================

INSERT INTO compliance_rule_templates (template_code, name_en, name_ar, description_en, description_ar, rule_type, default_severity, default_conditions, category, regulatory_framework) VALUES
-- Cooling-off periods
('COOL_OFF_30', 'Post-Employment Cooling-Off (30 Days)', 'فترة انتظار ما بعد التوظيف (30 يوم)',
 'Requires a 30-day waiting period after leaving a position before engaging with related entities',
 'يتطلب فترة انتظار 30 يومًا بعد ترك منصب قبل التعامل مع الجهات ذات الصلة',
 'cooling_off_period', 'warning', '{"days": 30, "applies_to": ["position_change", "contract_end"]}',
 'employment', 'GENERAL'),

('COOL_OFF_90', 'Post-Employment Cooling-Off (90 Days)', 'فترة انتظار ما بعد التوظيف (90 يوم)',
 'Requires a 90-day waiting period after leaving a senior position',
 'يتطلب فترة انتظار 90 يومًا بعد ترك منصب رفيع',
 'cooling_off_period', 'critical', '{"days": 90, "applies_to": ["senior_position_change"]}',
 'employment', 'GENERAL'),

-- Disclosure requirements
('DISC_FIN_INT', 'Financial Interest Disclosure', 'الإفصاح عن المصالح المالية',
 'Requires disclosure of any financial interests above threshold before engagement',
 'يتطلب الإفصاح عن أي مصالح مالية تتجاوز الحد قبل المشاركة',
 'disclosure_requirement', 'critical', '{"threshold": 1000, "currency": "USD", "fields": ["stock_holdings", "consulting_fees", "board_positions"]}',
 'disclosure', 'GENERAL'),

('DISC_PRIOR_REL', 'Prior Relationship Disclosure', 'الإفصاح عن العلاقات السابقة',
 'Requires disclosure of prior relationships with counterparties',
 'يتطلب الإفصاح عن العلاقات السابقة مع الأطراف المقابلة',
 'disclosure_requirement', 'warning', '{"check_years": 5, "relationship_types": ["employment", "consulting", "board_membership"]}',
 'disclosure', 'GENERAL'),

-- Conflict checks
('CONF_FAMILY', 'Family Conflict Check', 'فحص تضارب المصالح العائلية',
 'Checks for conflicts arising from family relationships',
 'يتحقق من التضاربات الناشئة عن العلاقات العائلية',
 'conflict_check', 'critical', '{"degrees_of_separation": 2, "check_spouse": true, "check_parents": true, "check_siblings": true, "check_children": true}',
 'conflict', 'GENERAL'),

('CONF_BUSINESS', 'Business Conflict Check', 'فحص تضارب المصالح التجارية',
 'Checks for conflicts arising from business relationships',
 'يتحقق من التضاربات الناشئة عن العلاقات التجارية',
 'conflict_check', 'critical', '{"check_current_employer": true, "check_clients": true, "check_investments": true}',
 'conflict', 'GENERAL'),

-- Gift limits
('GIFT_LIMIT_50', 'Gift Value Limit ($50)', 'حد قيمة الهدايا (50 دولار)',
 'Restricts acceptance of gifts exceeding $50 in value',
 'يقيد قبول الهدايا التي تتجاوز قيمتها 50 دولارًا',
 'gift_limit', 'warning', '{"max_value": 50, "currency": "USD", "period": "single", "cumulative_annual": 250}',
 'gifts', 'GENERAL'),

('GIFT_LIMIT_100', 'Gift Value Limit ($100)', 'حد قيمة الهدايا (100 دولار)',
 'Restricts acceptance of gifts exceeding $100 in value',
 'يقيد قبول الهدايا التي تتجاوز قيمتها 100 دولارًا',
 'gift_limit', 'critical', '{"max_value": 100, "currency": "USD", "period": "single", "cumulative_annual": 500}',
 'gifts', 'GENERAL'),

-- Frequency limits
('FREQ_CONTACT_10', 'Contact Frequency Limit (10/month)', 'حد تكرار الاتصال (10/شهر)',
 'Limits contact with a single entity to 10 times per month',
 'يحد من الاتصال بجهة واحدة إلى 10 مرات في الشهر',
 'frequency_limit', 'warning', '{"max_interactions": 10, "period_days": 30}',
 'frequency', 'GENERAL'),

-- Approval thresholds
('APPROVE_5000', 'Approval Required Above $5,000', 'موافقة مطلوبة فوق 5000 دولار',
 'Requires approval for commitments or expenditures above $5,000',
 'يتطلب الموافقة على الالتزامات أو النفقات التي تتجاوز 5000 دولار',
 'approval_threshold', 'critical', '{"amount": 5000, "currency": "USD", "approval_levels": ["supervisor"]}',
 'approval', 'GENERAL'),

('APPROVE_25000', 'Executive Approval Above $25,000', 'موافقة تنفيذية فوق 25000 دولار',
 'Requires executive approval for commitments above $25,000',
 'يتطلب موافقة تنفيذية للالتزامات التي تتجاوز 25000 دولار',
 'approval_threshold', 'blocking', '{"amount": 25000, "currency": "USD", "approval_levels": ["supervisor", "director"]}',
 'approval', 'GENERAL'),

-- Reporting requirements
('REPORT_LOBBY', 'Lobbying Activity Report', 'تقرير نشاط الضغط',
 'Requires reporting of lobbying activities with government officials',
 'يتطلب الإبلاغ عن أنشطة الضغط مع المسؤولين الحكوميين',
 'reporting_requirement', 'critical', '{"report_within_days": 5, "covered_officials": ["legislative", "executive"]}',
 'lobbying', 'US_LOBBYING_ACT'),

-- Recusal requirements
('RECUSE_PRIOR', 'Prior Employment Recusal', 'تنحي بسبب التوظيف السابق',
 'Requires recusal from matters involving former employers',
 'يتطلب التنحي عن الأمور التي تشمل أصحاب العمل السابقين',
 'recusal_requirement', 'critical', '{"recusal_period_years": 2, "scope": ["former_employer", "former_clients"]}',
 'recusal', 'GENERAL');

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on types
GRANT USAGE ON TYPE compliance_rule_type TO authenticated;
GRANT USAGE ON TYPE compliance_severity TO authenticated;
GRANT USAGE ON TYPE compliance_entity_type TO authenticated;
GRANT USAGE ON TYPE violation_status TO authenticated;
GRANT USAGE ON TYPE signoff_action TO authenticated;

-- Grant access to tables
GRANT SELECT ON compliance_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE ON compliance_violations TO authenticated;
GRANT SELECT, INSERT ON compliance_signoffs TO authenticated;
GRANT SELECT ON compliance_rule_templates TO authenticated;
GRANT SELECT, INSERT ON compliance_checks_log TO authenticated;
GRANT SELECT ON compliance_exemptions TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION check_entity_compliance(compliance_entity_type, UUID, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION signoff_violation(UUID, signoff_action, TEXT, TEXT[], TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_entity_compliance_summary(compliance_entity_type, UUID) TO authenticated;
