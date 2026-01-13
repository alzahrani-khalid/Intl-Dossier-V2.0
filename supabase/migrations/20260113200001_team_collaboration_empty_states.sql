-- Migration: Team Collaboration for Empty States
-- Feature: Collaborative Empty States with Team Stats and Invitation Flow
-- Created: 2026-01-13

-- ============================================================================
-- INVITATION MESSAGE TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS invitation_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  subject_en VARCHAR(255) NOT NULL,
  subject_ar VARCHAR(255) NOT NULL,
  body_en TEXT NOT NULL,
  body_ar TEXT NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'dossier', 'document', 'engagement', etc.
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for entity_type lookups
CREATE INDEX idx_invitation_templates_entity_type ON invitation_message_templates(entity_type);
CREATE INDEX idx_invitation_templates_active ON invitation_message_templates(is_active) WHERE is_active = true;

-- ============================================================================
-- TEAM INVITATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES auth.users(id),
  invitee_email VARCHAR(255) NOT NULL,
  invitee_id UUID REFERENCES auth.users(id), -- Populated if user exists
  entity_type VARCHAR(50) NOT NULL, -- 'dossier', 'document', 'engagement', etc.
  entity_id UUID, -- Optional: specific entity to collaborate on
  template_id UUID REFERENCES invitation_message_templates(id),
  custom_message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for invitations
CREATE INDEX idx_team_invitations_inviter ON team_invitations(inviter_id);
CREATE INDEX idx_team_invitations_invitee ON team_invitations(invitee_id) WHERE invitee_id IS NOT NULL;
CREATE INDEX idx_team_invitations_email ON team_invitations(invitee_email);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);
CREATE INDEX idx_team_invitations_entity ON team_invitations(entity_type, entity_id);

-- ============================================================================
-- TEAM ACTIVITY STATS MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS team_entity_stats AS
WITH dossier_stats AS (
  SELECT
    'dossier' as entity_type,
    COUNT(*) as total_count,
    COUNT(DISTINCT created_by) as unique_creators,
    COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '30 days') as recent_count,
    MAX(created_at) as last_created_at
  FROM dossiers
  WHERE archived = false
),
document_stats AS (
  SELECT
    'document' as entity_type,
    COUNT(*) as total_count,
    COUNT(DISTINCT uploaded_by) as unique_creators,
    COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '30 days') as recent_count,
    MAX(created_at) as last_created_at
  FROM documents
),
engagement_stats AS (
  SELECT
    'engagement' as entity_type,
    COUNT(*) as total_count,
    COUNT(DISTINCT created_by) as unique_creators,
    COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '30 days') as recent_count,
    MAX(created_at) as last_created_at
  FROM engagements
),
commitment_stats AS (
  SELECT
    'commitment' as entity_type,
    COUNT(*) as total_count,
    COUNT(DISTINCT created_by) as unique_creators,
    COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '30 days') as recent_count,
    MAX(created_at) as last_created_at
  FROM commitments
),
position_stats AS (
  SELECT
    'position' as entity_type,
    COUNT(*) as total_count,
    COUNT(DISTINCT created_by) as unique_creators,
    COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '30 days') as recent_count,
    MAX(created_at) as last_created_at
  FROM positions
)
SELECT * FROM dossier_stats
UNION ALL SELECT * FROM document_stats
UNION ALL SELECT * FROM engagement_stats
UNION ALL SELECT * FROM commitment_stats
UNION ALL SELECT * FROM position_stats;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_team_entity_stats_type ON team_entity_stats(entity_type);

-- ============================================================================
-- TOP CONTRIBUTORS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW top_contributors AS
WITH user_contributions AS (
  SELECT
    u.id as user_id,
    u.full_name,
    u.avatar_url,
    u.email,
    COALESCE(d.dossier_count, 0) as dossier_count,
    COALESCE(doc.document_count, 0) as document_count,
    COALESCE(e.engagement_count, 0) as engagement_count,
    COALESCE(c.commitment_count, 0) as commitment_count,
    COALESCE(d.dossier_count, 0) + COALESCE(doc.document_count, 0) +
    COALESCE(e.engagement_count, 0) + COALESCE(c.commitment_count, 0) as total_contributions
  FROM users u
  LEFT JOIN (
    SELECT created_by, COUNT(*) as dossier_count
    FROM dossiers WHERE archived = false
    GROUP BY created_by
  ) d ON d.created_by = u.id
  LEFT JOIN (
    SELECT uploaded_by, COUNT(*) as document_count
    FROM documents
    GROUP BY uploaded_by
  ) doc ON doc.uploaded_by = u.id
  LEFT JOIN (
    SELECT created_by, COUNT(*) as engagement_count
    FROM engagements
    GROUP BY created_by
  ) e ON e.created_by = u.id
  LEFT JOIN (
    SELECT created_by, COUNT(*) as commitment_count
    FROM commitments
    GROUP BY created_by
  ) c ON c.created_by = u.id
  WHERE u.status = 'active'
)
SELECT
  user_id,
  full_name,
  avatar_url,
  email,
  dossier_count,
  document_count,
  engagement_count,
  commitment_count,
  total_contributions
FROM user_contributions
WHERE total_contributions > 0
ORDER BY total_contributions DESC;

-- ============================================================================
-- FUNCTION: Get Team Stats for Empty State
-- ============================================================================

CREATE OR REPLACE FUNCTION get_team_stats_for_entity(
  p_entity_type VARCHAR(50),
  p_current_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_total_count INTEGER;
  v_unique_creators INTEGER;
  v_recent_count INTEGER;
  v_top_contributors JSON;
  v_suggested_users JSON;
BEGIN
  -- Get stats from materialized view
  SELECT
    total_count,
    unique_creators,
    recent_count
  INTO v_total_count, v_unique_creators, v_recent_count
  FROM team_entity_stats
  WHERE entity_type = p_entity_type;

  -- Get top 3 contributors for this entity type (excluding current user)
  SELECT json_agg(tc)
  INTO v_top_contributors
  FROM (
    SELECT
      user_id,
      full_name,
      avatar_url,
      CASE p_entity_type
        WHEN 'dossier' THEN dossier_count
        WHEN 'document' THEN document_count
        WHEN 'engagement' THEN engagement_count
        WHEN 'commitment' THEN commitment_count
        ELSE total_contributions
      END as contribution_count
    FROM top_contributors
    WHERE user_id != p_current_user_id
    ORDER BY
      CASE p_entity_type
        WHEN 'dossier' THEN dossier_count
        WHEN 'document' THEN document_count
        WHEN 'engagement' THEN engagement_count
        WHEN 'commitment' THEN commitment_count
        ELSE total_contributions
      END DESC
    LIMIT 3
  ) tc;

  -- Get suggested users to invite (active users who haven't contributed to this entity type)
  SELECT json_agg(su)
  INTO v_suggested_users
  FROM (
    SELECT
      u.id as user_id,
      u.full_name,
      u.avatar_url,
      u.email,
      u.department
    FROM users u
    WHERE u.status = 'active'
      AND u.id != p_current_user_id
      AND NOT EXISTS (
        SELECT 1 FROM team_invitations ti
        WHERE ti.inviter_id = p_current_user_id
          AND ti.invitee_id = u.id
          AND ti.entity_type = p_entity_type
          AND ti.status = 'pending'
      )
    ORDER BY u.full_name
    LIMIT 5
  ) su;

  -- Build result JSON
  v_result := json_build_object(
    'entityType', p_entity_type,
    'stats', json_build_object(
      'totalCount', COALESCE(v_total_count, 0),
      'uniqueCreators', COALESCE(v_unique_creators, 0),
      'recentCount', COALESCE(v_recent_count, 0)
    ),
    'topContributors', COALESCE(v_top_contributors, '[]'::json),
    'suggestedUsers', COALESCE(v_suggested_users, '[]'::json),
    'hasTeamActivity', COALESCE(v_total_count, 0) > 0
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- FUNCTION: Send Team Invitation
-- ============================================================================

CREATE OR REPLACE FUNCTION send_team_invitation(
  p_inviter_id UUID,
  p_invitee_email VARCHAR(255),
  p_entity_type VARCHAR(50),
  p_entity_id UUID DEFAULT NULL,
  p_template_id UUID DEFAULT NULL,
  p_custom_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitee_id UUID;
  v_invitation_id UUID;
  v_template RECORD;
BEGIN
  -- Check if invitee already exists
  SELECT id INTO v_invitee_id
  FROM users
  WHERE email = p_invitee_email;

  -- Get template if provided
  IF p_template_id IS NOT NULL THEN
    SELECT * INTO v_template
    FROM invitation_message_templates
    WHERE id = p_template_id AND is_active = true;
  END IF;

  -- Create invitation
  INSERT INTO team_invitations (
    inviter_id,
    invitee_email,
    invitee_id,
    entity_type,
    entity_id,
    template_id,
    custom_message
  )
  VALUES (
    p_inviter_id,
    p_invitee_email,
    v_invitee_id,
    p_entity_type,
    p_entity_id,
    p_template_id,
    p_custom_message
  )
  RETURNING id INTO v_invitation_id;

  RETURN json_build_object(
    'success', true,
    'invitationId', v_invitation_id,
    'inviteeExists', v_invitee_id IS NOT NULL
  );
END;
$$;

-- ============================================================================
-- FUNCTION: Refresh Team Entity Stats
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_team_entity_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY team_entity_stats;
END;
$$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE invitation_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Templates: All authenticated users can read active templates
CREATE POLICY "Users can view active templates"
  ON invitation_message_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Templates: Only admins can create/update templates
CREATE POLICY "Admins can manage templates"
  ON invitation_message_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Invitations: Users can see invitations they sent or received
CREATE POLICY "Users can view their invitations"
  ON team_invitations
  FOR SELECT
  TO authenticated
  USING (
    inviter_id = auth.uid() OR
    invitee_id = auth.uid() OR
    invitee_email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- Invitations: Users can create invitations
CREATE POLICY "Users can create invitations"
  ON team_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (inviter_id = auth.uid());

-- Invitations: Invitees can update their invitation status
CREATE POLICY "Invitees can respond to invitations"
  ON team_invitations
  FOR UPDATE
  TO authenticated
  USING (
    invitee_id = auth.uid() OR
    invitee_email = (SELECT email FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    invitee_id = auth.uid() OR
    invitee_email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- ============================================================================
-- SEED DEFAULT INVITATION TEMPLATES
-- ============================================================================

INSERT INTO invitation_message_templates (
  name_en, name_ar,
  subject_en, subject_ar,
  body_en, body_ar,
  entity_type,
  is_default
) VALUES
-- Dossier template
(
  'Dossier Collaboration',
  'التعاون في الملفات',
  'Invitation to collaborate on dossiers',
  'دعوة للتعاون في الملفات',
  'Hi {{invitee_name}},

I''d like to invite you to collaborate on dossiers in our system. Your expertise would be valuable in building comprehensive information about countries, organizations, and topics.

{{#if custom_message}}
Personal note: {{custom_message}}
{{/if}}

Looking forward to working together!

Best regards,
{{inviter_name}}',
  'مرحباً {{invitee_name}}،

أود دعوتك للتعاون في الملفات في نظامنا. خبرتك ستكون قيمة في بناء معلومات شاملة عن الدول والمنظمات والمواضيع.

{{#if custom_message}}
ملاحظة شخصية: {{custom_message}}
{{/if}}

أتطلع للعمل معاً!

مع أطيب التحيات،
{{inviter_name}}',
  'dossier',
  true
),
-- Document template
(
  'Document Sharing',
  'مشاركة المستندات',
  'Invitation to share documents',
  'دعوة لمشاركة المستندات',
  'Hi {{invitee_name}},

I''m inviting you to contribute documents to our shared repository. Your input will help us maintain comprehensive records.

{{#if custom_message}}
Personal note: {{custom_message}}
{{/if}}

Best regards,
{{inviter_name}}',
  'مرحباً {{invitee_name}}،

أدعوك للمساهمة بالمستندات في مستودعنا المشترك. مساهمتك ستساعدنا في الحفاظ على سجلات شاملة.

{{#if custom_message}}
ملاحظة شخصية: {{custom_message}}
{{/if}}

مع أطيب التحيات،
{{inviter_name}}',
  'document',
  true
),
-- Engagement template
(
  'Engagement Tracking',
  'تتبع الارتباطات',
  'Invitation to track engagements together',
  'دعوة لتتبع الارتباطات معاً',
  'Hi {{invitee_name}},

I''d like to invite you to help track our international engagements. Together, we can ensure all meetings and events are properly documented.

{{#if custom_message}}
Personal note: {{custom_message}}
{{/if}}

Best regards,
{{inviter_name}}',
  'مرحباً {{invitee_name}}،

أود دعوتك للمساعدة في تتبع ارتباطاتنا الدولية. معاً، يمكننا ضمان توثيق جميع الاجتماعات والفعاليات بشكل صحيح.

{{#if custom_message}}
ملاحظة شخصية: {{custom_message}}
{{/if}}

مع أطيب التحيات،
{{inviter_name}}',
  'engagement',
  true
),
-- Commitment template
(
  'Commitment Tracking',
  'تتبع الالتزامات',
  'Invitation to track commitments',
  'دعوة لتتبع الالتزامات',
  'Hi {{invitee_name}},

Let''s work together to track commitments and deliverables. Your help will ensure we fulfill all our promises on time.

{{#if custom_message}}
Personal note: {{custom_message}}
{{/if}}

Best regards,
{{inviter_name}}',
  'مرحباً {{invitee_name}}،

لنعمل معاً لتتبع الالتزامات والمخرجات. مساعدتك ستضمن وفاءنا بجميع وعودنا في الوقت المحدد.

{{#if custom_message}}
ملاحظة شخصية: {{custom_message}}
{{/if}}

مع أطيب التحيات،
{{inviter_name}}',
  'commitment',
  true
),
-- Generic template
(
  'General Collaboration',
  'التعاون العام',
  'Invitation to collaborate',
  'دعوة للتعاون',
  'Hi {{invitee_name}},

I''d like to invite you to collaborate with our team. Your contributions would be valuable to our shared work.

{{#if custom_message}}
Personal note: {{custom_message}}
{{/if}}

Best regards,
{{inviter_name}}',
  'مرحباً {{invitee_name}}،

أود دعوتك للتعاون مع فريقنا. مساهماتك ستكون قيمة لعملنا المشترك.

{{#if custom_message}}
ملاحظة شخصية: {{custom_message}}
{{/if}}

مع أطيب التحيات،
{{inviter_name}}',
  'generic',
  true
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE invitation_message_templates IS 'Templates for team invitation messages with bilingual support';
COMMENT ON TABLE team_invitations IS 'Team collaboration invitations sent from empty states';
COMMENT ON MATERIALIZED VIEW team_entity_stats IS 'Aggregated statistics about team activity per entity type';
COMMENT ON VIEW top_contributors IS 'View of top contributing users across all entity types';
COMMENT ON FUNCTION get_team_stats_for_entity IS 'Returns team activity stats and suggestions for empty state collaborative prompts';
COMMENT ON FUNCTION send_team_invitation IS 'Creates a new team collaboration invitation';
