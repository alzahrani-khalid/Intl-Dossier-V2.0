-- Phase 70: Intelligence digests and alerts database foundation.
-- Apply via Supabase MCP to project zkrcjzdemdmwhearhfgg.
-- Requirements: DIGEST-01..04, ALERT-01..04.
-- Decisions covered: D-01..D-14.
-- Critical profile-key rule: profiles keys on user_id, not id. Any clearance
-- lookup in this file must use profiles.user_id = auth.uid().

-- =============================================================================
-- 1. Extend intelligence_digest for per-subscriber published digests
-- =============================================================================
-- The existing dossier_type CHECK already mirrors the database dossier domain:
-- country, organization, forum, engagement, topic, working_group, person.
-- Do not widen it here; people variants persist as dossier_type = 'person'.

ALTER TABLE public.intelligence_digest
  ADD COLUMN IF NOT EXISTS subscriber_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'daily'
    CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clearance_level_at_generation INTEGER
    CHECK (
      clearance_level_at_generation IS NULL
      OR clearance_level_at_generation BETWEEN 1 AND 4
    ),
  ADD COLUMN IF NOT EXISTS period TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'intelligence_digest_subscriber_dossier_frequency_period_key'
      AND conrelid = 'public.intelligence_digest'::regclass
  ) THEN
    ALTER TABLE public.intelligence_digest
      ADD CONSTRAINT intelligence_digest_subscriber_dossier_frequency_period_key
      UNIQUE (subscriber_id, dossier_id, frequency, period);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_intelligence_digest_subscriber_published
  ON public.intelligence_digest (subscriber_id, published_at DESC)
  WHERE published_at IS NOT NULL;

-- =============================================================================
-- 2. Digest subscriptions
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.intelligence_digest_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dossier_type TEXT NOT NULL CHECK (
    dossier_type IN (
      'country',
      'organization',
      'forum',
      'engagement',
      'topic',
      'working_group',
      'person'
    )
  ),
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL DEFAULT 'daily'
    CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  frequency_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subscriber_id, dossier_id, frequency)
);

CREATE INDEX IF NOT EXISTS idx_intelligence_digest_subscriptions_active
  ON public.intelligence_digest_subscriptions (frequency, is_active, organization_id)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_intelligence_digest_subscriptions_owner
  ON public.intelligence_digest_subscriptions (subscriber_id, dossier_id);

ALTER TABLE public.intelligence_digest_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ids_select_owner ON public.intelligence_digest_subscriptions;
CREATE POLICY ids_select_owner
  ON public.intelligence_digest_subscriptions FOR SELECT
  TO authenticated
  USING (
    subscriber_id = auth.uid()
    AND tenant_isolation.rls_select_policy(organization_id)
  );

DROP POLICY IF EXISTS ids_insert_owner ON public.intelligence_digest_subscriptions;
CREATE POLICY ids_insert_owner
  ON public.intelligence_digest_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    subscriber_id = auth.uid()
    AND tenant_isolation.rls_insert_policy(organization_id)
  );

DROP POLICY IF EXISTS ids_update_owner ON public.intelligence_digest_subscriptions;
CREATE POLICY ids_update_owner
  ON public.intelligence_digest_subscriptions FOR UPDATE
  TO authenticated
  USING (subscriber_id = auth.uid())
  WITH CHECK (subscriber_id = auth.uid());

DROP POLICY IF EXISTS ids_delete_owner ON public.intelligence_digest_subscriptions;
CREATE POLICY ids_delete_owner
  ON public.intelligence_digest_subscriptions FOR DELETE
  TO authenticated
  USING (subscriber_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.intelligence_digest_subscriptions TO authenticated;

-- =============================================================================
-- 3. Alert rules
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.intelligence_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dossier_type TEXT NOT NULL CHECK (
    dossier_type IN (
      'country',
      'organization',
      'forum',
      'engagement',
      'topic',
      'working_group',
      'person'
    )
  ),
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL DEFAULT 'new_signal'
    CHECK (condition_type IN ('new_signal')),
  condition_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_alert_rules_active_dossier
  ON public.intelligence_alert_rules (dossier_id, is_active, organization_id)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_intelligence_alert_rules_owner
  ON public.intelligence_alert_rules (owner_id, dossier_id);

ALTER TABLE public.intelligence_alert_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS iar_select_owner ON public.intelligence_alert_rules;
CREATE POLICY iar_select_owner
  ON public.intelligence_alert_rules FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    AND tenant_isolation.rls_select_policy(organization_id)
  );

DROP POLICY IF EXISTS iar_insert_owner ON public.intelligence_alert_rules;
CREATE POLICY iar_insert_owner
  ON public.intelligence_alert_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND tenant_isolation.rls_insert_policy(organization_id)
  );

DROP POLICY IF EXISTS iar_update_owner ON public.intelligence_alert_rules;
CREATE POLICY iar_update_owner
  ON public.intelligence_alert_rules FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS iar_delete_owner ON public.intelligence_alert_rules;
CREATE POLICY iar_delete_owner
  ON public.intelligence_alert_rules FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.intelligence_alert_rules TO authenticated;

-- =============================================================================
-- 4. Digest item snapshots
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.intelligence_digest_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_id UUID NOT NULL REFERENCES public.intelligence_digest(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (
    item_type IN ('signal', 'engagement', 'commitment', 'status_change')
  ),
  item_id UUID NOT NULL,
  item_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  sensitivity_level INTEGER NOT NULL DEFAULT 1 CHECK (sensitivity_level BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_digest_items_digest
  ON public.intelligence_digest_items (digest_id, sensitivity_level);

ALTER TABLE public.intelligence_digest_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intelligence_digest_items_select_parent ON public.intelligence_digest_items;
CREATE POLICY intelligence_digest_items_select_parent
  ON public.intelligence_digest_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.intelligence_digest d
      WHERE d.id = intelligence_digest_items.digest_id
        AND d.subscriber_id = auth.uid()
        AND d.published_at IS NOT NULL
        AND tenant_isolation.rls_select_policy(d.organization_id)
        AND (
          d.clearance_level_at_generation IS NULL
          OR d.clearance_level_at_generation <= (
            SELECT p.clearance_level
            FROM public.profiles p
            WHERE p.user_id = auth.uid()
          )
        )
    )
  );

GRANT SELECT ON public.intelligence_digest_items TO authenticated;

-- =============================================================================
-- 5. Intelligence email queue
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.intelligence_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  deep_link TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_intelligence_email_queue_pending
  ON public.intelligence_email_queue (queued_at)
  WHERE sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_intelligence_email_queue_recipient
  ON public.intelligence_email_queue (recipient_id, queued_at DESC);

ALTER TABLE public.intelligence_email_queue ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.intelligence_email_queue TO service_role;

-- =============================================================================
-- 6. intelligence_digest RLS convergence
-- =============================================================================
DROP POLICY IF EXISTS intelligence_digest_select_org ON public.intelligence_digest;
DROP POLICY IF EXISTS intelligence_digest_insert_editor ON public.intelligence_digest;
DROP POLICY IF EXISTS intelligence_digest_update_editor ON public.intelligence_digest;
DROP POLICY IF EXISTS intelligence_digest_delete_admin ON public.intelligence_digest;
DROP POLICY IF EXISTS intelligence_digest_select_subscriber ON public.intelligence_digest;
DROP POLICY IF EXISTS intelligence_digest_insert_publisher ON public.intelligence_digest;

CREATE POLICY intelligence_digest_select_subscriber
  ON public.intelligence_digest FOR SELECT
  TO authenticated
  USING (
    tenant_isolation.rls_select_policy(organization_id)
    AND (subscriber_id = auth.uid() OR subscriber_id IS NULL)
    AND published_at IS NOT NULL
    AND (
      clearance_level_at_generation IS NULL
      OR clearance_level_at_generation <= (
        SELECT p.clearance_level
        FROM public.profiles p
        WHERE p.user_id = auth.uid()
      )
    )
  );

-- Service-role cron path uses supabaseAdmin. This policy is limited to the
-- manual HITL publish RPC, which runs as SECURITY INVOKER under the caller JWT.
CREATE POLICY intelligence_digest_insert_publisher
  ON public.intelligence_digest FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_isolation.rls_insert_policy(organization_id)
    AND subscriber_id = auth.uid()
    AND generated_by = auth.uid()
    AND published_at IS NOT NULL
    AND clearance_level_at_generation <= (
      SELECT p.clearance_level
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 7. Alert notification trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION public.notify_intelligence_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_notify(
    'intelligence_alert',
    json_build_object(
      'event_id', NEW.id,
      'organization_id', NEW.organization_id,
      'sensitivity_level', NEW.sensitivity_level,
      'severity', NEW.severity,
      'occurred_at', NEW.occurred_at
    )::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS intelligence_event_alert_notify ON public.intelligence_event;
CREATE TRIGGER intelligence_event_alert_notify
  AFTER INSERT ON public.intelligence_event
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_intelligence_alert();

-- =============================================================================
-- 8. On-demand digest preview RPC
-- =============================================================================
CREATE OR REPLACE FUNCTION public.generate_digest(
  p_dossier_id UUID,
  p_period TEXT DEFAULT 'daily'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
  v_clearance INTEGER := 0;
  v_since TIMESTAMPTZ;
  v_until TIMESTAMPTZ := NOW();
  v_period TEXT := COALESCE(NULLIF(p_period, ''), 'daily');
  v_period_key TEXT;
  v_result JSONB;
BEGIN
  SELECT COALESCE((
    SELECT p.clearance_level
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
  ), 0)
  INTO v_clearance
  ;

  v_since := CASE v_period
    WHEN 'daily' THEN v_until - INTERVAL '1 day'
    WHEN 'weekly' THEN v_until - INTERVAL '7 days'
    WHEN 'monthly' THEN v_until - INTERVAL '30 days'
    ELSE v_until - INTERVAL '1 day'
  END;

  v_period := CASE
    WHEN v_period IN ('daily', 'weekly', 'monthly') THEN v_period
    ELSE 'daily'
  END;

  v_period_key := CASE v_period
    WHEN 'weekly' THEN 'weekly-' || to_char(v_until AT TIME ZONE 'UTC', 'IYYY-"W"IW')
    WHEN 'monthly' THEN 'monthly-' || to_char(v_until AT TIME ZONE 'UTC', 'YYYY-MM')
    ELSE 'daily-' || to_char(v_until AT TIME ZONE 'UTC', 'YYYY-MM-DD')
  END;

  SELECT jsonb_build_object(
    'dossier_id', p_dossier_id,
    'period', v_period,
    'period_key', v_period_key,
    'period_start', v_since,
    'period_end', v_until,
    'clearance_level', v_clearance,
    'counts', jsonb_build_object(
      'signals', COALESCE(jsonb_array_length(signals.items), 0),
      'engagements', COALESCE(jsonb_array_length(engagements.items), 0),
      'commitments_due', COALESCE(jsonb_array_length(commitments.items), 0),
      'status_changes', COALESCE(jsonb_array_length(status_changes.items), 0)
    ),
    'signals', signals.items,
    'engagements', engagements.items,
    'commitments_due', commitments.items,
    'status_changes', status_changes.items
  )
  INTO v_result
  FROM (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ie.id,
          'title', ie.title,
          'body', ie.content,
          'severity', ie.severity,
          'category', ie.category,
          'sensitivity_level', ie.sensitivity_level,
          'occurred_at', ie.occurred_at
        )
        ORDER BY ie.occurred_at DESC
      ),
      '[]'::jsonb
    ) AS items
    FROM public.intelligence_event ie
    JOIN public.intelligence_event_dossiers ied ON ied.event_id = ie.id
    WHERE ied.dossier_id = p_dossier_id
      AND ie.occurred_at >= v_since
      AND ie.occurred_at <= v_until
      AND ie.sensitivity_level <= v_clearance
  ) signals
  CROSS JOIN (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ed.id,
          'name_en', d.name_en,
          'name_ar', d.name_ar,
          'engagement_type', ed.engagement_type,
          'engagement_category', ed.engagement_category,
          'engagement_status', ed.engagement_status,
          'lifecycle_stage', ed.lifecycle_stage,
          'start_date', ed.start_date,
          'end_date', ed.end_date,
          'sensitivity_level', d.sensitivity_level,
          'updated_at', ed.updated_at
        )
        ORDER BY ed.updated_at DESC
      ),
      '[]'::jsonb
    ) AS items
    FROM public.engagement_dossiers ed
    JOIN public.dossiers d ON d.id = ed.id
    WHERE (
        ed.id = p_dossier_id
        OR ed.host_country_id = p_dossier_id
        OR ed.host_organization_id = p_dossier_id
        OR ed.parent_forum_id = p_dossier_id
      )
      AND ed.updated_at >= v_since
      AND ed.updated_at <= v_until
      AND d.sensitivity_level <= v_clearance
  ) engagements
  CROSS JOIN (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ac.id,
          'title', ac.title,
          'title_ar', ac.title_ar,
          'description', ac.description,
          'priority', ac.priority,
          'status', ac.status,
          'due_date', ac.due_date,
          'owner_user_id', ac.owner_user_id,
          'sensitivity_level', d.sensitivity_level,
          'updated_at', ac.updated_at
        )
        ORDER BY ac.due_date ASC
      ),
      '[]'::jsonb
    ) AS items
    FROM public.aa_commitments ac
    JOIN public.dossiers d ON d.id = ac.dossier_id
    WHERE ac.dossier_id = p_dossier_id
      AND ac.is_deleted = false
      AND ac.due_date >= v_since::date
      AND ac.due_date <= v_until::date
      AND d.sensitivity_level <= v_clearance
  ) commitments
  CROSS JOIN (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'name_en', d.name_en,
          'name_ar', d.name_ar,
          'dossier_type', d.type,
          'status', d.status,
          'sensitivity_level', d.sensitivity_level,
          'updated_at', d.updated_at
        )
        ORDER BY d.updated_at DESC
      ),
      '[]'::jsonb
    ) AS items
    FROM public.dossiers d
    WHERE d.id = p_dossier_id
      AND d.updated_at >= v_since
      AND d.updated_at <= v_until
      AND d.sensitivity_level <= v_clearance
  ) status_changes;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_digest(UUID, TEXT) TO authenticated;

-- =============================================================================
-- 9. Approved digest publish RPC
-- =============================================================================
CREATE OR REPLACE FUNCTION public.publish_digest(
  p_dossier_id UUID,
  p_period TEXT,
  p_summary TEXT,
  p_clearance_level_at_generation INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_clearance INTEGER := 0;
  v_org_id UUID;
  v_dossier_type TEXT;
  v_digest_id UUID;
  v_until TIMESTAMPTZ := NOW();
  v_since TIMESTAMPTZ;
  v_frequency TEXT := COALESCE(NULLIF(p_period, ''), 'daily');
  v_period_key TEXT;
BEGIN
  SELECT COALESCE(p.clearance_level, 0), p.organization_id
  INTO v_clearance, v_org_id
  FROM public.profiles p
  WHERE p.user_id = auth.uid();

  v_frequency := CASE
    WHEN v_frequency IN ('daily', 'weekly', 'monthly') THEN v_frequency
    ELSE 'daily'
  END;

  v_since := CASE v_frequency
    WHEN 'daily' THEN v_until - INTERVAL '1 day'
    WHEN 'weekly' THEN v_until - INTERVAL '7 days'
    WHEN 'monthly' THEN v_until - INTERVAL '30 days'
    ELSE v_until - INTERVAL '1 day'
  END;

  v_period_key := CASE v_frequency
    WHEN 'weekly' THEN 'weekly-' || to_char(v_until AT TIME ZONE 'UTC', 'IYYY-"W"IW')
    WHEN 'monthly' THEN 'monthly-' || to_char(v_until AT TIME ZONE 'UTC', 'YYYY-MM')
    ELSE 'daily-' || to_char(v_until AT TIME ZONE 'UTC', 'YYYY-MM-DD')
  END;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No profile organization for current user'
      USING ERRCODE = '42501';
  END IF;

  SELECT d.type
  INTO v_dossier_type
  FROM public.dossiers d
  WHERE d.id = p_dossier_id
    AND d.sensitivity_level <= v_clearance;

  IF v_dossier_type IS NULL THEN
    RAISE EXCEPTION 'Dossier not found'
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.intelligence_digest (
    organization_id,
    dossier_type,
    dossier_id,
    period_start,
    period_end,
    summary,
    generated_by,
    generated_at,
    subscriber_id,
    frequency,
    published_at,
    clearance_level_at_generation,
    period
  ) VALUES (
    v_org_id,
    v_dossier_type,
    p_dossier_id,
    v_since,
    v_until,
    p_summary,
    auth.uid(),
    NOW(),
    auth.uid(),
    v_frequency,
    NOW(),
    LEAST(COALESCE(p_clearance_level_at_generation, v_clearance), v_clearance),
    v_period_key
  )
  ON CONFLICT ON CONSTRAINT intelligence_digest_subscriber_dossier_frequency_period_key
  DO NOTHING
  RETURNING id INTO v_digest_id;

  IF v_digest_id IS NULL THEN
    SELECT d.id
    INTO v_digest_id
    FROM public.intelligence_digest d
    WHERE d.subscriber_id = auth.uid()
      AND d.dossier_id = p_dossier_id
      AND d.frequency = v_frequency
      AND d.period = v_period_key
      AND d.published_at IS NOT NULL
    ORDER BY d.generated_at DESC
    LIMIT 1;
  END IF;

  RETURN v_digest_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_digest(UUID, TEXT, TEXT, INTEGER) TO authenticated;

-- =============================================================================
-- 10. Cron digest content RPC
-- =============================================================================
CREATE OR REPLACE FUNCTION public.generate_digest_content(
  p_dossier_id UUID,
  p_since TIMESTAMPTZ,
  p_until TIMESTAMPTZ,
  p_clearance_level INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'dossier_id', p_dossier_id,
    'period_start', p_since,
    'period_end', p_until,
    'counts', jsonb_build_object(
      'signals', COALESCE(jsonb_array_length(signals.items), 0),
      'engagements', COALESCE(jsonb_array_length(engagements.items), 0),
      'commitments_due', COALESCE(jsonb_array_length(commitments.items), 0),
      'status_changes', COALESCE(jsonb_array_length(status_changes.items), 0)
    ),
    'signals', signals.items,
    'engagements', engagements.items,
    'commitments_due', commitments.items,
    'status_changes', status_changes.items
  )
  INTO v_result
  FROM (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ie.id,
          'title', ie.title,
          'body', ie.content,
          'severity', ie.severity,
          'category', ie.category,
          'sensitivity_level', ie.sensitivity_level,
          'occurred_at', ie.occurred_at
        )
        ORDER BY ie.occurred_at DESC
      ),
      '[]'::jsonb
    ) AS items
    FROM public.intelligence_event ie
    JOIN public.intelligence_event_dossiers ied ON ied.event_id = ie.id
    WHERE ied.dossier_id = p_dossier_id
      AND ie.occurred_at >= p_since
      AND ie.occurred_at <= p_until
      AND ie.sensitivity_level <= p_clearance_level
  ) signals
  CROSS JOIN (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ed.id,
          'name_en', d.name_en,
          'name_ar', d.name_ar,
          'engagement_type', ed.engagement_type,
          'engagement_category', ed.engagement_category,
          'engagement_status', ed.engagement_status,
          'lifecycle_stage', ed.lifecycle_stage,
          'start_date', ed.start_date,
          'end_date', ed.end_date,
          'sensitivity_level', d.sensitivity_level,
          'updated_at', ed.updated_at
        )
        ORDER BY ed.updated_at DESC
      ),
      '[]'::jsonb
    ) AS items
    FROM public.engagement_dossiers ed
    JOIN public.dossiers d ON d.id = ed.id
    WHERE (
        ed.id = p_dossier_id
        OR ed.host_country_id = p_dossier_id
        OR ed.host_organization_id = p_dossier_id
        OR ed.parent_forum_id = p_dossier_id
      )
      AND ed.updated_at >= p_since
      AND ed.updated_at <= p_until
      AND d.sensitivity_level <= p_clearance_level
  ) engagements
  CROSS JOIN (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ac.id,
          'title', ac.title,
          'title_ar', ac.title_ar,
          'description', ac.description,
          'priority', ac.priority,
          'status', ac.status,
          'due_date', ac.due_date,
          'owner_user_id', ac.owner_user_id,
          'sensitivity_level', d.sensitivity_level,
          'updated_at', ac.updated_at
        )
        ORDER BY ac.due_date ASC
      ),
      '[]'::jsonb
    ) AS items
    FROM public.aa_commitments ac
    JOIN public.dossiers d ON d.id = ac.dossier_id
    WHERE ac.dossier_id = p_dossier_id
      AND ac.is_deleted = false
      AND ac.due_date >= p_since::date
      AND ac.due_date <= p_until::date
      AND d.sensitivity_level <= p_clearance_level
  ) commitments
  CROSS JOIN (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'name_en', d.name_en,
          'name_ar', d.name_ar,
          'dossier_type', d.type,
          'status', d.status,
          'sensitivity_level', d.sensitivity_level,
          'updated_at', d.updated_at
        )
        ORDER BY d.updated_at DESC
      ),
      '[]'::jsonb
    ) AS items
    FROM public.dossiers d
    WHERE d.id = p_dossier_id
      AND d.updated_at >= p_since
      AND d.updated_at <= p_until
      AND d.sensitivity_level <= p_clearance_level
  ) status_changes;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_digest_content(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_digest_content(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER)
  TO service_role;

-- =============================================================================
-- 11. Published digest read RPC
-- =============================================================================
CREATE OR REPLACE FUNCTION public.read_digests(
  p_dossier_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  dossier_id UUID,
  dossier_type TEXT,
  frequency TEXT,
  period TEXT,
  summary TEXT,
  generated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  clearance_level_at_generation INTEGER
)
LANGUAGE SQL
SECURITY INVOKER
STABLE
AS $$
  SELECT
    d.id,
    d.dossier_id,
    d.dossier_type::text,
    d.frequency::text,
    d.period::text,
    d.summary,
    d.generated_at,
    d.published_at,
    d.clearance_level_at_generation
  FROM public.intelligence_digest d
  WHERE d.subscriber_id = auth.uid()
    AND d.published_at IS NOT NULL
    AND (p_dossier_id IS NULL OR d.dossier_id = p_dossier_id)
  ORDER BY d.published_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.read_digests(UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.generate_digest(UUID, TEXT) IS
  'Phase 70: Caller-JWT digest preview. SECURITY INVOKER; RLS and explicit checks limit returned content.';
COMMENT ON FUNCTION public.publish_digest(UUID, TEXT, TEXT, INTEGER) IS
  'Phase 70: Manual HITL publish path for approved digest previews.';
COMMENT ON FUNCTION public.generate_digest_content(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) IS
  'Phase 70: Service-role cron content assembly with explicit numeric access limit.';
COMMENT ON FUNCTION public.read_digests(UUID, INTEGER) IS
  'Phase 70: Published digest reader for the authenticated subscriber.';
