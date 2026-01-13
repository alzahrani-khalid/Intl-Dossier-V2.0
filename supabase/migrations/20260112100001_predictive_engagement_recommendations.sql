-- Migration: Create predictive engagement recommendations system
-- Feature: predictive-engagement-recommendations
-- Date: 2026-01-12
-- Purpose: AI-driven recommendations for proactive engagement based on relationship health,
--          upcoming events, commitment deadlines, and strategic priorities

-- ============================================================================
-- Engagement Recommendations Table
-- ============================================================================

CREATE TABLE engagement_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The relationship this recommendation is for
  relationship_id UUID NOT NULL REFERENCES dossier_relationships(id) ON DELETE CASCADE,

  -- The dossier (country/organization) the recommendation is targeting
  target_dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Recommendation type
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'proactive_outreach',      -- Relationship needs attention, initiate contact
    'follow_up',               -- Follow up on previous engagement
    'commitment_reminder',     -- Upcoming commitment deadline
    'relationship_maintenance', -- Regular maintenance engagement
    'strategic_opportunity',   -- Strategic timing opportunity
    'risk_mitigation',         -- Prevent relationship degradation
    'reciprocity_balance'      -- Balance one-sided relationship
  )),

  -- Priority level (1-5, where 5 is highest)
  priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 5),

  -- Confidence score from the AI model (0.0 - 1.0)
  confidence_score DECIMAL(3, 2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Recommendation content (bilingual)
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,

  -- Suggested action and timing
  suggested_action_en TEXT NOT NULL,
  suggested_action_ar TEXT NOT NULL,
  suggested_engagement_type TEXT CHECK (suggested_engagement_type IN (
    'bilateral_meeting', 'mission', 'delegation', 'summit',
    'working_group', 'roundtable', 'official_visit', 'consultation', 'other'
  )),
  suggested_format TEXT CHECK (suggested_format IN (
    'in_person', 'virtual', 'hybrid', 'phone_call', 'email', 'formal_letter'
  )),

  -- Optimal timing window
  optimal_date_start DATE,
  optimal_date_end DATE,
  optimal_timing_reason_en TEXT,
  optimal_timing_reason_ar TEXT,

  -- Urgency indicator
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN (
    'low', 'normal', 'high', 'critical'
  )),

  -- Reasoning breakdown (for transparency)
  reasoning JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure: {
  --   "factors": [
  --     { "name": "relationship_health", "weight": 0.35, "value": 45, "contribution": 0.16 },
  --     { "name": "days_since_engagement", "weight": 0.25, "value": 75, "contribution": 0.19 },
  --     ...
  --   ],
  --   "triggers": ["engagement_gap", "declining_health"],
  --   "strategic_context": "Annual statistical cooperation review upcoming"
  -- }

  -- Related entities
  related_commitment_ids UUID[] DEFAULT '{}',
  related_calendar_event_ids UUID[] DEFAULT '{}',

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',     -- Newly generated, awaiting action
    'viewed',      -- User has seen the recommendation
    'accepted',    -- User accepted and acted on it
    'dismissed',   -- User dismissed the recommendation
    'expired',     -- Past optimal window
    'superseded'   -- Replaced by newer recommendation
  )),

  -- User action tracking
  viewed_at TIMESTAMPTZ,
  viewed_by UUID REFERENCES auth.users(id),
  actioned_at TIMESTAMPTZ,
  actioned_by UUID REFERENCES auth.users(id),
  action_notes TEXT,

  -- Engagement created from this recommendation (if any)
  resulting_engagement_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,

  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Recommendation Feedback Table (for ML improvement)
-- ============================================================================

CREATE TABLE engagement_recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES engagement_recommendations(id) ON DELETE CASCADE,

  -- Feedback type
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'helpful',        -- Recommendation was helpful
    'not_helpful',    -- Recommendation was not helpful
    'timing_wrong',   -- Timing suggestion was off
    'already_planned', -- Already had plans for this
    'not_relevant',   -- Not relevant to current priorities
    'too_early',      -- Recommendation came too early
    'too_late'        -- Recommendation came too late
  )),

  -- Optional detailed feedback
  feedback_text TEXT,

  -- User who provided feedback
  user_id UUID NOT NULL REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Recommendation Generation History (for audit)
-- ============================================================================

CREATE TABLE engagement_recommendation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Batch metadata
  batch_type TEXT NOT NULL CHECK (batch_type IN (
    'scheduled',   -- Regular scheduled generation
    'manual',      -- Manually triggered
    'event_based'  -- Triggered by specific event
  )),

  -- Statistics
  relationships_analyzed INTEGER NOT NULL,
  recommendations_generated INTEGER NOT NULL,
  high_priority_count INTEGER NOT NULL DEFAULT 0,

  -- Model metadata
  model_version TEXT NOT NULL DEFAULT '1.0',
  parameters JSONB DEFAULT '{}'::jsonb,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN (
    'running', 'completed', 'failed', 'partial'
  )),
  error_message TEXT
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX idx_engagement_recommendations_relationship_id
  ON engagement_recommendations(relationship_id);
CREATE INDEX idx_engagement_recommendations_target_dossier_id
  ON engagement_recommendations(target_dossier_id);
CREATE INDEX idx_engagement_recommendations_status
  ON engagement_recommendations(status);
CREATE INDEX idx_engagement_recommendations_type
  ON engagement_recommendations(recommendation_type);
CREATE INDEX idx_engagement_recommendations_priority
  ON engagement_recommendations(priority DESC);
CREATE INDEX idx_engagement_recommendations_urgency
  ON engagement_recommendations(urgency);

-- Active recommendations index
CREATE INDEX idx_engagement_recommendations_active
  ON engagement_recommendations(status, expires_at)
  WHERE status NOT IN ('expired', 'superseded', 'dismissed');

-- Date range index for optimal timing
CREATE INDEX idx_engagement_recommendations_optimal_dates
  ON engagement_recommendations(optimal_date_start, optimal_date_end)
  WHERE status = 'pending' OR status = 'viewed';

-- Confidence score index for filtering
CREATE INDEX idx_engagement_recommendations_confidence
  ON engagement_recommendations(confidence_score DESC);

-- Feedback indexes
CREATE INDEX idx_engagement_recommendation_feedback_recommendation_id
  ON engagement_recommendation_feedback(recommendation_id);
CREATE INDEX idx_engagement_recommendation_feedback_type
  ON engagement_recommendation_feedback(feedback_type);

-- Batch history index
CREATE INDEX idx_engagement_recommendation_batches_created_at
  ON engagement_recommendation_batches(started_at DESC);

-- ============================================================================
-- Row-Level Security
-- ============================================================================

ALTER TABLE engagement_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_recommendation_batches ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read recommendations
CREATE POLICY engagement_recommendations_read ON engagement_recommendations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only service role can insert recommendations (generated by system)
CREATE POLICY engagement_recommendations_insert ON engagement_recommendations
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Authenticated users can update recommendation status
CREATE POLICY engagement_recommendations_update ON engagement_recommendations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Feedback read/write policies
CREATE POLICY engagement_recommendation_feedback_read ON engagement_recommendation_feedback
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY engagement_recommendation_feedback_insert ON engagement_recommendation_feedback
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Batch history read-only for authenticated users
CREATE POLICY engagement_recommendation_batches_read ON engagement_recommendation_batches
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY engagement_recommendation_batches_write ON engagement_recommendation_batches
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_engagement_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER engagement_recommendations_updated_at
  BEFORE UPDATE ON engagement_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_recommendations_updated_at();

-- ============================================================================
-- View: Active Recommendations Summary
-- ============================================================================

CREATE OR REPLACE VIEW engagement_recommendations_summary AS
SELECT
  er.id,
  er.relationship_id,
  er.target_dossier_id,
  er.recommendation_type,
  er.priority,
  er.confidence_score,
  er.title_en,
  er.title_ar,
  er.description_en,
  er.description_ar,
  er.suggested_action_en,
  er.suggested_action_ar,
  er.suggested_engagement_type,
  er.suggested_format,
  er.optimal_date_start,
  er.optimal_date_end,
  er.optimal_timing_reason_en,
  er.optimal_timing_reason_ar,
  er.urgency,
  er.status,
  er.expires_at,
  er.created_at,
  -- Relationship info
  dr.relationship_type,
  dr.status AS relationship_status,
  -- Source dossier info
  sd.name_en AS source_dossier_name_en,
  sd.name_ar AS source_dossier_name_ar,
  sd.type AS source_dossier_type,
  -- Target dossier info
  td.name_en AS target_dossier_name_en,
  td.name_ar AS target_dossier_name_ar,
  td.type AS target_dossier_type,
  -- Health score if available
  rhs.overall_score AS relationship_health_score,
  rhs.trend AS relationship_health_trend
FROM engagement_recommendations er
JOIN dossier_relationships dr ON er.relationship_id = dr.id
JOIN dossiers sd ON dr.source_dossier_id = sd.id
JOIN dossiers td ON er.target_dossier_id = td.id
LEFT JOIN relationship_health_scores rhs ON er.relationship_id = rhs.relationship_id
WHERE er.status NOT IN ('expired', 'superseded');

-- ============================================================================
-- Function: Generate Engagement Recommendations
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_engagement_recommendations(
  p_relationship_ids UUID[] DEFAULT NULL,
  p_force_regenerate BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  recommendations_generated INTEGER,
  batch_id UUID
) AS $$
DECLARE
  v_batch_id UUID;
  v_relationships_count INTEGER;
  v_recommendations_count INTEGER := 0;
  v_high_priority_count INTEGER := 0;
  v_relationship RECORD;
  v_health_data RECORD;
  v_recommendation RECORD;
  v_priority INTEGER;
  v_confidence DECIMAL(3,2);
  v_urgency TEXT;
  v_type TEXT;
  v_expires_at TIMESTAMPTZ;
  v_optimal_start DATE;
  v_optimal_end DATE;
BEGIN
  -- Create batch record
  INSERT INTO engagement_recommendation_batches (
    batch_type,
    relationships_analyzed,
    recommendations_generated,
    model_version,
    parameters
  ) VALUES (
    CASE WHEN p_relationship_ids IS NULL THEN 'scheduled' ELSE 'manual' END,
    0,
    0,
    '1.0',
    jsonb_build_object(
      'force_regenerate', p_force_regenerate,
      'target_relationships', COALESCE(array_length(p_relationship_ids, 1), 0)
    )
  ) RETURNING id INTO v_batch_id;

  -- If force regenerate, expire existing pending recommendations
  IF p_force_regenerate THEN
    UPDATE engagement_recommendations
    SET status = 'superseded', updated_at = NOW()
    WHERE status IN ('pending', 'viewed')
    AND (p_relationship_ids IS NULL OR relationship_id = ANY(p_relationship_ids));
  END IF;

  -- Loop through relationships with health scores
  FOR v_relationship IN
    SELECT
      dr.id AS relationship_id,
      dr.source_dossier_id,
      dr.target_dossier_id,
      dr.relationship_type,
      rhs.overall_score,
      rhs.trend,
      rhs.engagement_frequency_score,
      rhs.commitment_compliance_score,
      rhs.reciprocity_score,
      rhs.recency_score,
      COALESCE(rhs.score_breakdown->>'days_since_engagement', '0')::INTEGER AS days_since_engagement,
      COALESCE(rhs.score_breakdown->>'commitments_overdue', '0')::INTEGER AS overdue_commitments,
      sd.name_en AS source_name_en,
      sd.name_ar AS source_name_ar,
      td.name_en AS target_name_en,
      td.name_ar AS target_name_ar
    FROM dossier_relationships dr
    JOIN dossiers sd ON dr.source_dossier_id = sd.id
    JOIN dossiers td ON dr.target_dossier_id = td.id
    LEFT JOIN relationship_health_scores rhs ON dr.id = rhs.relationship_id
    WHERE dr.status = 'active'
    AND dr.relationship_type = 'bilateral'
    AND (p_relationship_ids IS NULL OR dr.id = ANY(p_relationship_ids))
  LOOP
    v_relationships_count := v_relationships_count + 1;

    -- Skip if already has pending recommendation and not force regenerate
    IF NOT p_force_regenerate THEN
      IF EXISTS (
        SELECT 1 FROM engagement_recommendations
        WHERE relationship_id = v_relationship.relationship_id
        AND status IN ('pending', 'viewed')
        AND expires_at > NOW()
      ) THEN
        CONTINUE;
      END IF;
    END IF;

    -- Determine recommendation type and priority based on health indicators
    v_type := NULL;
    v_priority := 3; -- Default medium priority
    v_confidence := 0.70;
    v_urgency := 'normal';
    v_optimal_start := CURRENT_DATE + INTERVAL '3 days';
    v_optimal_end := CURRENT_DATE + INTERVAL '14 days';
    v_expires_at := NOW() + INTERVAL '30 days';

    -- Critical health: Risk mitigation needed
    IF v_relationship.overall_score IS NOT NULL AND v_relationship.overall_score < 30 THEN
      v_type := 'risk_mitigation';
      v_priority := 5;
      v_confidence := 0.90;
      v_urgency := 'critical';
      v_optimal_start := CURRENT_DATE;
      v_optimal_end := CURRENT_DATE + INTERVAL '7 days';
      v_expires_at := NOW() + INTERVAL '14 days';

    -- Declining trend with moderate score: Proactive outreach
    ELSIF v_relationship.trend = 'declining' AND v_relationship.overall_score IS NOT NULL AND v_relationship.overall_score < 60 THEN
      v_type := 'proactive_outreach';
      v_priority := 4;
      v_confidence := 0.85;
      v_urgency := 'high';
      v_optimal_start := CURRENT_DATE + INTERVAL '1 day';
      v_optimal_end := CURRENT_DATE + INTERVAL '10 days';
      v_expires_at := NOW() + INTERVAL '21 days';

    -- Reciprocity imbalance
    ELSIF v_relationship.reciprocity_score IS NOT NULL AND v_relationship.reciprocity_score < 40 THEN
      v_type := 'reciprocity_balance';
      v_priority := 3;
      v_confidence := 0.80;
      v_urgency := 'normal';
      v_optimal_start := CURRENT_DATE + INTERVAL '7 days';
      v_optimal_end := CURRENT_DATE + INTERVAL '21 days';

    -- Large engagement gap
    ELSIF v_relationship.days_since_engagement > 90 THEN
      v_type := 'relationship_maintenance';
      v_priority := CASE WHEN v_relationship.days_since_engagement > 180 THEN 4 ELSE 3 END;
      v_confidence := 0.85;
      v_urgency := CASE WHEN v_relationship.days_since_engagement > 180 THEN 'high' ELSE 'normal' END;
      v_optimal_start := CURRENT_DATE;
      v_optimal_end := CURRENT_DATE + INTERVAL '14 days';

    -- Overdue commitments
    ELSIF v_relationship.overdue_commitments > 0 THEN
      v_type := 'commitment_reminder';
      v_priority := CASE WHEN v_relationship.overdue_commitments > 2 THEN 4 ELSE 3 END;
      v_confidence := 0.90;
      v_urgency := CASE WHEN v_relationship.overdue_commitments > 2 THEN 'high' ELSE 'normal' END;
      v_optimal_start := CURRENT_DATE;
      v_optimal_end := CURRENT_DATE + INTERVAL '7 days';
      v_expires_at := NOW() + INTERVAL '14 days';

    -- Moderate engagement gap (60-90 days)
    ELSIF v_relationship.days_since_engagement > 60 THEN
      v_type := 'follow_up';
      v_priority := 2;
      v_confidence := 0.75;
      v_urgency := 'low';

    -- Strategic opportunity for healthy relationships
    ELSIF v_relationship.overall_score IS NOT NULL AND v_relationship.overall_score >= 70 AND v_relationship.trend = 'improving' THEN
      v_type := 'strategic_opportunity';
      v_priority := 2;
      v_confidence := 0.70;
      v_urgency := 'low';
      v_optimal_start := CURRENT_DATE + INTERVAL '14 days';
      v_optimal_end := CURRENT_DATE + INTERVAL '30 days';
    END IF;

    -- Only create recommendation if we identified a type
    IF v_type IS NOT NULL THEN
      INSERT INTO engagement_recommendations (
        relationship_id,
        target_dossier_id,
        recommendation_type,
        priority,
        confidence_score,
        title_en,
        title_ar,
        description_en,
        description_ar,
        suggested_action_en,
        suggested_action_ar,
        suggested_engagement_type,
        suggested_format,
        optimal_date_start,
        optimal_date_end,
        optimal_timing_reason_en,
        optimal_timing_reason_ar,
        urgency,
        reasoning,
        expires_at
      ) VALUES (
        v_relationship.relationship_id,
        v_relationship.target_dossier_id,
        v_type,
        v_priority,
        v_confidence,
        -- Title
        CASE v_type
          WHEN 'risk_mitigation' THEN 'Urgent: Relationship at Risk with ' || v_relationship.target_name_en
          WHEN 'proactive_outreach' THEN 'Proactive Outreach Recommended for ' || v_relationship.target_name_en
          WHEN 'reciprocity_balance' THEN 'Balance Engagement with ' || v_relationship.target_name_en
          WHEN 'relationship_maintenance' THEN 'Maintain Relationship with ' || v_relationship.target_name_en
          WHEN 'commitment_reminder' THEN 'Follow Up on Commitments with ' || v_relationship.target_name_en
          WHEN 'follow_up' THEN 'Follow Up Opportunity with ' || v_relationship.target_name_en
          WHEN 'strategic_opportunity' THEN 'Strategic Opportunity with ' || v_relationship.target_name_en
          ELSE 'Engagement Opportunity with ' || v_relationship.target_name_en
        END,
        -- Title AR
        CASE v_type
          WHEN 'risk_mitigation' THEN 'عاجل: العلاقة في خطر مع ' || v_relationship.target_name_ar
          WHEN 'proactive_outreach' THEN 'يُوصى بالتواصل الاستباقي مع ' || v_relationship.target_name_ar
          WHEN 'reciprocity_balance' THEN 'موازنة التفاعل مع ' || v_relationship.target_name_ar
          WHEN 'relationship_maintenance' THEN 'الحفاظ على العلاقة مع ' || v_relationship.target_name_ar
          WHEN 'commitment_reminder' THEN 'متابعة الالتزامات مع ' || v_relationship.target_name_ar
          WHEN 'follow_up' THEN 'فرصة متابعة مع ' || v_relationship.target_name_ar
          WHEN 'strategic_opportunity' THEN 'فرصة استراتيجية مع ' || v_relationship.target_name_ar
          ELSE 'فرصة تفاعل مع ' || v_relationship.target_name_ar
        END,
        -- Description EN
        CASE v_type
          WHEN 'risk_mitigation' THEN 'Relationship health has dropped to critical level (' || COALESCE(v_relationship.overall_score::TEXT, 'N/A') || '). Immediate engagement is recommended to prevent further degradation.'
          WHEN 'proactive_outreach' THEN 'Relationship health is declining. Proactive engagement can help reverse this trend and strengthen bilateral ties.'
          WHEN 'reciprocity_balance' THEN 'The engagement pattern shows an imbalance. Initiating contact can help establish a more balanced bilateral relationship.'
          WHEN 'relationship_maintenance' THEN 'It has been ' || v_relationship.days_since_engagement || ' days since the last engagement. Regular contact helps maintain strong relationships.'
          WHEN 'commitment_reminder' THEN 'There are ' || v_relationship.overdue_commitments || ' overdue commitment(s). Following up shows reliability and strengthens trust.'
          WHEN 'follow_up' THEN 'The last engagement was ' || v_relationship.days_since_engagement || ' days ago. A follow-up can reinforce the relationship.'
          WHEN 'strategic_opportunity' THEN 'The relationship is performing well. This is an optimal time to explore new collaboration opportunities.'
          ELSE 'An engagement opportunity has been identified based on current relationship metrics.'
        END,
        -- Description AR
        CASE v_type
          WHEN 'risk_mitigation' THEN 'انخفضت صحة العلاقة إلى مستوى حرج (' || COALESCE(v_relationship.overall_score::TEXT, 'غير متوفر') || '). يُوصى بالتفاعل الفوري لمنع المزيد من التدهور.'
          WHEN 'proactive_outreach' THEN 'صحة العلاقة في انخفاض. التفاعل الاستباقي يمكن أن يساعد في عكس هذا الاتجاه وتعزيز العلاقات الثنائية.'
          WHEN 'reciprocity_balance' THEN 'يُظهر نمط التفاعل عدم توازن. بدء الاتصال يمكن أن يساعد في إنشاء علاقة ثنائية أكثر توازناً.'
          WHEN 'relationship_maintenance' THEN 'مرت ' || v_relationship.days_since_engagement || ' يومًا منذ آخر تفاعل. التواصل المنتظم يساعد في الحفاظ على علاقات قوية.'
          WHEN 'commitment_reminder' THEN 'هناك ' || v_relationship.overdue_commitments || ' التزام(ات) متأخرة. المتابعة تُظهر الموثوقية وتعزز الثقة.'
          WHEN 'follow_up' THEN 'كان آخر تفاعل قبل ' || v_relationship.days_since_engagement || ' يومًا. المتابعة يمكن أن تعزز العلاقة.'
          WHEN 'strategic_opportunity' THEN 'العلاقة تسير بشكل جيد. هذا هو الوقت الأمثل لاستكشاف فرص تعاون جديدة.'
          ELSE 'تم تحديد فرصة تفاعل بناءً على مقاييس العلاقة الحالية.'
        END,
        -- Suggested action EN
        CASE v_type
          WHEN 'risk_mitigation' THEN 'Schedule an urgent meeting or call to address relationship concerns and identify areas for improvement.'
          WHEN 'proactive_outreach' THEN 'Initiate contact through an informal meeting or virtual call to discuss current status and future plans.'
          WHEN 'reciprocity_balance' THEN 'Send an invitation for a bilateral meeting or offer to host the next engagement.'
          WHEN 'relationship_maintenance' THEN 'Organize a routine check-in meeting or send a formal communication to maintain dialogue.'
          WHEN 'commitment_reminder' THEN 'Arrange a follow-up meeting to review pending commitments and establish clear timelines.'
          WHEN 'follow_up' THEN 'Send a follow-up communication referencing the last engagement and proposing next steps.'
          WHEN 'strategic_opportunity' THEN 'Propose a strategic planning session to explore new areas of collaboration.'
          ELSE 'Consider scheduling an appropriate engagement based on the current relationship context.'
        END,
        -- Suggested action AR
        CASE v_type
          WHEN 'risk_mitigation' THEN 'جدولة اجتماع عاجل أو مكالمة لمعالجة مخاوف العلاقة وتحديد مجالات التحسين.'
          WHEN 'proactive_outreach' THEN 'بدء الاتصال من خلال اجتماع غير رسمي أو مكالمة افتراضية لمناقشة الوضع الحالي والخطط المستقبلية.'
          WHEN 'reciprocity_balance' THEN 'إرسال دعوة لاجتماع ثنائي أو عرض استضافة التفاعل القادم.'
          WHEN 'relationship_maintenance' THEN 'تنظيم اجتماع متابعة روتيني أو إرسال مراسلة رسمية للحفاظ على الحوار.'
          WHEN 'commitment_reminder' THEN 'ترتيب اجتماع متابعة لمراجعة الالتزامات المعلقة وتحديد جداول زمنية واضحة.'
          WHEN 'follow_up' THEN 'إرسال مراسلة متابعة بالإشارة إلى آخر تفاعل واقتراح الخطوات التالية.'
          WHEN 'strategic_opportunity' THEN 'اقتراح جلسة تخطيط استراتيجي لاستكشاف مجالات جديدة للتعاون.'
          ELSE 'النظر في جدولة تفاعل مناسب بناءً على سياق العلاقة الحالي.'
        END,
        -- Suggested engagement type
        CASE v_type
          WHEN 'risk_mitigation' THEN 'bilateral_meeting'
          WHEN 'proactive_outreach' THEN 'consultation'
          WHEN 'reciprocity_balance' THEN 'bilateral_meeting'
          WHEN 'relationship_maintenance' THEN 'bilateral_meeting'
          WHEN 'commitment_reminder' THEN 'working_group'
          WHEN 'follow_up' THEN 'consultation'
          WHEN 'strategic_opportunity' THEN 'working_group'
          ELSE 'bilateral_meeting'
        END,
        -- Suggested format
        CASE
          WHEN v_urgency = 'critical' THEN 'in_person'
          WHEN v_urgency = 'high' THEN 'in_person'
          WHEN v_type = 'follow_up' THEN 'virtual'
          ELSE 'hybrid'
        END,
        v_optimal_start,
        v_optimal_end,
        -- Optimal timing reason EN
        CASE v_type
          WHEN 'risk_mitigation' THEN 'Immediate action needed to prevent further relationship degradation.'
          WHEN 'proactive_outreach' THEN 'Early intervention is most effective when a declining trend is detected.'
          WHEN 'commitment_reminder' THEN 'Addressing overdue commitments promptly demonstrates reliability.'
          ELSE 'This timeframe allows for proper preparation while maintaining engagement momentum.'
        END,
        -- Optimal timing reason AR
        CASE v_type
          WHEN 'risk_mitigation' THEN 'هناك حاجة إلى إجراء فوري لمنع المزيد من تدهور العلاقة.'
          WHEN 'proactive_outreach' THEN 'التدخل المبكر أكثر فعالية عند اكتشاف اتجاه تنازلي.'
          WHEN 'commitment_reminder' THEN 'معالجة الالتزامات المتأخرة على الفور تُظهر الموثوقية.'
          ELSE 'هذا الإطار الزمني يسمح بالتحضير المناسب مع الحفاظ على زخم التفاعل.'
        END,
        v_urgency,
        -- Reasoning
        jsonb_build_object(
          'factors', jsonb_build_array(
            jsonb_build_object('name', 'overall_health', 'value', v_relationship.overall_score, 'weight', 0.35),
            jsonb_build_object('name', 'engagement_frequency', 'value', v_relationship.engagement_frequency_score, 'weight', 0.25),
            jsonb_build_object('name', 'commitment_compliance', 'value', v_relationship.commitment_compliance_score, 'weight', 0.20),
            jsonb_build_object('name', 'reciprocity', 'value', v_relationship.reciprocity_score, 'weight', 0.10),
            jsonb_build_object('name', 'recency', 'value', v_relationship.recency_score, 'weight', 0.10)
          ),
          'triggers', ARRAY[v_type],
          'days_since_engagement', v_relationship.days_since_engagement,
          'overdue_commitments', v_relationship.overdue_commitments,
          'trend', v_relationship.trend
        ),
        v_expires_at
      );

      v_recommendations_count := v_recommendations_count + 1;
      IF v_priority >= 4 THEN
        v_high_priority_count := v_high_priority_count + 1;
      END IF;
    END IF;
  END LOOP;

  -- Update batch record
  UPDATE engagement_recommendation_batches
  SET
    relationships_analyzed = v_relationships_count,
    recommendations_generated = v_recommendations_count,
    high_priority_count = v_high_priority_count,
    status = 'completed',
    completed_at = NOW()
  WHERE id = v_batch_id;

  RETURN QUERY SELECT v_recommendations_count, v_batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Expire Old Recommendations
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_old_engagement_recommendations()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE engagement_recommendations
  SET status = 'expired', updated_at = NOW()
  WHERE status IN ('pending', 'viewed')
  AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE engagement_recommendations IS 'AI-generated recommendations for proactive engagement based on relationship health and other factors';
COMMENT ON COLUMN engagement_recommendations.recommendation_type IS 'Type of recommendation: proactive_outreach, follow_up, commitment_reminder, relationship_maintenance, strategic_opportunity, risk_mitigation, reciprocity_balance';
COMMENT ON COLUMN engagement_recommendations.priority IS 'Priority level from 1 (lowest) to 5 (highest)';
COMMENT ON COLUMN engagement_recommendations.confidence_score IS 'AI confidence in the recommendation (0.0 to 1.0)';
COMMENT ON COLUMN engagement_recommendations.reasoning IS 'JSON breakdown of factors that contributed to the recommendation';

COMMENT ON TABLE engagement_recommendation_feedback IS 'User feedback on recommendations for ML model improvement';
COMMENT ON TABLE engagement_recommendation_batches IS 'Audit trail of recommendation generation runs';

COMMENT ON FUNCTION generate_engagement_recommendations IS 'Generate new engagement recommendations based on relationship health and engagement patterns';
COMMENT ON FUNCTION expire_old_engagement_recommendations IS 'Mark expired recommendations as expired';
