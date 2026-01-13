-- =====================================================================================
-- Migration: Webhook Integration
-- Description: Configurable webhooks for real-time event notifications to external systems
--              Supports retry logic, signature verification, and payload customization
-- Author: Claude Code
-- Date: 2026-01-11
-- Feature: webhook-integration
-- =====================================================================================

-- ===========================================
-- ENUM TYPES
-- ===========================================

-- Webhook event types
CREATE TYPE webhook_event_type AS ENUM (
    'dossier.created',
    'dossier.updated',
    'dossier.deleted',
    'engagement.created',
    'engagement.updated',
    'engagement.completed',
    'commitment.created',
    'commitment.updated',
    'commitment.fulfilled',
    'commitment.overdue',
    'intake.created',
    'intake.updated',
    'intake.resolved',
    'document.uploaded',
    'document.deleted',
    'calendar.event_created',
    'calendar.event_updated',
    'calendar.event_reminder',
    'relationship.created',
    'relationship.updated',
    'sla.warning',
    'sla.breach'
);

-- Webhook delivery status
CREATE TYPE webhook_delivery_status AS ENUM (
    'pending',
    'delivered',
    'failed',
    'retrying'
);

-- Webhook authentication type
CREATE TYPE webhook_auth_type AS ENUM (
    'none',
    'hmac_sha256',
    'bearer_token',
    'basic_auth'
);

-- ===========================================
-- TABLES
-- ===========================================

-- Main webhooks configuration table
CREATE TABLE IF NOT EXISTS public.webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Owner and organization context
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID, -- Optional: for org-level webhooks

    -- Webhook configuration
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,

    -- Endpoint configuration
    url TEXT NOT NULL,
    http_method TEXT DEFAULT 'POST' CHECK (http_method IN ('POST', 'PUT', 'PATCH')),

    -- Authentication
    auth_type webhook_auth_type DEFAULT 'hmac_sha256',
    auth_secret TEXT, -- Encrypted secret for HMAC or bearer token
    auth_username TEXT, -- For basic auth
    auth_password TEXT, -- For basic auth (encrypted)

    -- Event subscriptions (array of event types)
    subscribed_events webhook_event_type[] NOT NULL DEFAULT '{}',

    -- Payload customization
    payload_template JSONB, -- Custom payload template (optional)
    include_full_payload BOOLEAN DEFAULT true, -- Include full entity data
    custom_headers JSONB DEFAULT '{}', -- Additional HTTP headers

    -- Retry configuration
    max_retries INTEGER DEFAULT 3 CHECK (max_retries >= 0 AND max_retries <= 10),
    retry_delay_seconds INTEGER DEFAULT 60 CHECK (retry_delay_seconds >= 10 AND retry_delay_seconds <= 3600),
    timeout_seconds INTEGER DEFAULT 30 CHECK (timeout_seconds >= 5 AND timeout_seconds <= 120),

    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,

    -- Auto-disable after consecutive failures
    auto_disable_threshold INTEGER DEFAULT 10,
    auto_disabled_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT valid_url CHECK (url ~ '^https?://'),
    CONSTRAINT valid_subscribed_events CHECK (array_length(subscribed_events, 1) > 0)
);

-- Webhook delivery log (audit trail)
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Reference to webhook
    webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,

    -- Event information
    event_type webhook_event_type NOT NULL,
    event_id UUID, -- Reference to the entity that triggered the event
    event_entity_type TEXT, -- e.g., 'dossier', 'engagement', 'commitment'

    -- Delivery details
    status webhook_delivery_status DEFAULT 'pending',
    attempt_count INTEGER DEFAULT 0,

    -- Request details
    request_url TEXT NOT NULL,
    request_method TEXT NOT NULL,
    request_headers JSONB,
    request_payload JSONB NOT NULL,

    -- Response details
    response_status_code INTEGER,
    response_headers JSONB,
    response_body TEXT,
    response_time_ms INTEGER,

    -- Error tracking
    error_message TEXT,
    error_code TEXT,

    -- Retry scheduling
    next_retry_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    delivered_at TIMESTAMPTZ,

    -- Signature verification (for audit)
    signature_header TEXT -- The signature sent in the request
);

-- Webhook event queue (for async processing)
CREATE TABLE IF NOT EXISTS public.webhook_event_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Event details
    event_type webhook_event_type NOT NULL,
    event_id UUID NOT NULL,
    event_entity_type TEXT NOT NULL,
    event_payload JSONB NOT NULL,
    event_metadata JSONB DEFAULT '{}',

    -- Processing status
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,

    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Auto-cleanup after processing
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Webhook templates (pre-configured integrations for Slack, Teams, etc.)
CREATE TABLE IF NOT EXISTS public.webhook_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Template identification
    slug TEXT NOT NULL UNIQUE, -- e.g., 'slack', 'teams', 'discord'
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,

    -- Template configuration
    default_payload_template JSONB NOT NULL,
    default_headers JSONB DEFAULT '{}',
    documentation_url TEXT,
    icon_url TEXT,

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===========================================
-- INDEXES
-- ===========================================

-- Webhooks indexes
CREATE INDEX idx_webhooks_created_by ON public.webhooks(created_by);
CREATE INDEX idx_webhooks_is_active ON public.webhooks(is_active) WHERE is_active = true;
CREATE INDEX idx_webhooks_subscribed_events ON public.webhooks USING GIN (subscribed_events);
CREATE INDEX idx_webhooks_organization_id ON public.webhooks(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_webhooks_last_triggered ON public.webhooks(last_triggered_at DESC);

-- Webhook deliveries indexes
CREATE INDEX idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_event_type ON public.webhook_deliveries(event_type);
CREATE INDEX idx_webhook_deliveries_created_at ON public.webhook_deliveries(created_at DESC);
CREATE INDEX idx_webhook_deliveries_next_retry ON public.webhook_deliveries(next_retry_at)
    WHERE status = 'retrying' AND next_retry_at IS NOT NULL;

-- Event queue indexes
CREATE INDEX idx_webhook_event_queue_unprocessed ON public.webhook_event_queue(created_at)
    WHERE is_processed = false;
CREATE INDEX idx_webhook_event_queue_expires ON public.webhook_event_queue(expires_at)
    WHERE is_processed = true;

-- ===========================================
-- ROW-LEVEL SECURITY (RLS)
-- ===========================================

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_event_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_templates ENABLE ROW LEVEL SECURITY;

-- Webhooks policies: users can manage their own webhooks
CREATE POLICY "Users can view own webhooks"
  ON public.webhooks
  FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create webhooks"
  ON public.webhooks
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own webhooks"
  ON public.webhooks
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own webhooks"
  ON public.webhooks
  FOR DELETE
  USING (created_by = auth.uid());

-- Webhook deliveries policies: users can view deliveries for their webhooks
CREATE POLICY "Users can view deliveries for own webhooks"
  ON public.webhook_deliveries
  FOR SELECT
  USING (
    webhook_id IN (
      SELECT id FROM public.webhooks WHERE created_by = auth.uid()
    )
  );

-- Event queue: service role only (no user access)
CREATE POLICY "Service role can manage event queue"
  ON public.webhook_event_queue
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Templates: anyone can read, only admins can modify
CREATE POLICY "Anyone can view webhook templates"
  ON public.webhook_templates
  FOR SELECT
  USING (is_active = true);

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Update timestamp trigger for webhooks
CREATE OR REPLACE FUNCTION public.update_webhooks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_webhooks_timestamp
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_webhooks_timestamp();

-- Auto-disable webhook after consecutive failures
CREATE OR REPLACE FUNCTION public.auto_disable_webhook_on_failure()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.failure_count >= (
    SELECT auto_disable_threshold FROM public.webhooks WHERE id = NEW.webhook_id
  ) THEN
    UPDATE public.webhooks
    SET is_active = false, auto_disabled_at = NOW()
    WHERE id = NEW.webhook_id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_disable_webhook
  AFTER UPDATE ON public.webhook_deliveries
  FOR EACH ROW
  WHEN (NEW.status = 'failed')
  EXECUTE FUNCTION public.auto_disable_webhook_on_failure();

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to get active webhooks for a specific event type
CREATE OR REPLACE FUNCTION public.get_webhooks_for_event(
  p_event_type webhook_event_type
)
RETURNS SETOF public.webhooks
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.webhooks
  WHERE is_active = true
    AND p_event_type = ANY(subscribed_events)
    AND (auto_disabled_at IS NULL OR auto_disabled_at < NOW() - INTERVAL '1 hour')
  ORDER BY created_at;
$$;

-- Function to queue a webhook event
CREATE OR REPLACE FUNCTION public.queue_webhook_event(
  p_event_type webhook_event_type,
  p_event_id UUID,
  p_entity_type TEXT,
  p_payload JSONB,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.webhook_event_queue (
    event_type,
    event_id,
    event_entity_type,
    event_payload,
    event_metadata
  ) VALUES (
    p_event_type,
    p_event_id,
    p_entity_type,
    p_payload,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- Function to get webhook delivery statistics
CREATE OR REPLACE FUNCTION public.get_webhook_stats(
  p_webhook_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_deliveries BIGINT,
  successful_deliveries BIGINT,
  failed_deliveries BIGINT,
  pending_deliveries BIGINT,
  avg_response_time_ms NUMERIC,
  success_rate NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*)::BIGINT as total_deliveries,
    COUNT(*) FILTER (WHERE status = 'delivered')::BIGINT as successful_deliveries,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_deliveries,
    COUNT(*) FILTER (WHERE status IN ('pending', 'retrying'))::BIGINT as pending_deliveries,
    AVG(response_time_ms)::NUMERIC as avg_response_time_ms,
    CASE
      WHEN COUNT(*) > 0 THEN
        (COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC / COUNT(*)::NUMERIC * 100)
      ELSE 0
    END as success_rate
  FROM public.webhook_deliveries
  WHERE webhook_id = p_webhook_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
$$;

-- Function to clean up old processed events
CREATE OR REPLACE FUNCTION public.cleanup_webhook_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.webhook_event_queue
  WHERE is_processed = true AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ===========================================
-- SEED DATA: Webhook Templates
-- ===========================================

INSERT INTO public.webhook_templates (slug, name_en, name_ar, description_en, description_ar, default_payload_template, default_headers, documentation_url, icon_url)
VALUES
  (
    'slack',
    'Slack',
    'سلاك',
    'Send notifications to Slack channels using incoming webhooks',
    'إرسال الإشعارات إلى قنوات سلاك باستخدام الويب هوك الواردة',
    '{
      "text": "{{event_type}}: {{entity_name}}",
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*{{event_type}}*\n{{description}}"
          }
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": "Triggered at: {{timestamp}}"
            }
          ]
        }
      ]
    }'::jsonb,
    '{"Content-Type": "application/json"}'::jsonb,
    'https://api.slack.com/messaging/webhooks',
    'https://a.slack-edge.com/80588/img/services/outgoing-webhook_512.png'
  ),
  (
    'teams',
    'Microsoft Teams',
    'مايكروسوفت تيمز',
    'Send notifications to Microsoft Teams channels using connectors',
    'إرسال الإشعارات إلى قنوات مايكروسوفت تيمز باستخدام الموصلات',
    '{
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "0076D7",
      "summary": "{{event_type}}",
      "sections": [{
        "activityTitle": "{{event_type}}",
        "activitySubtitle": "{{entity_name}}",
        "facts": [{
          "name": "Triggered",
          "value": "{{timestamp}}"
        }],
        "markdown": true
      }]
    }'::jsonb,
    '{"Content-Type": "application/json"}'::jsonb,
    'https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook',
    'https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg'
  ),
  (
    'discord',
    'Discord',
    'ديسكورد',
    'Send notifications to Discord channels using webhooks',
    'إرسال الإشعارات إلى قنوات ديسكورد باستخدام الويب هوك',
    '{
      "content": "**{{event_type}}**",
      "embeds": [{
        "title": "{{entity_name}}",
        "description": "{{description}}",
        "color": 5814783,
        "timestamp": "{{timestamp}}"
      }]
    }'::jsonb,
    '{"Content-Type": "application/json"}'::jsonb,
    'https://discord.com/developers/docs/resources/webhook',
    'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png'
  ),
  (
    'generic',
    'Generic Webhook',
    'ويب هوك عام',
    'Send raw JSON payload to any HTTP endpoint',
    'إرسال حمولة JSON خام إلى أي نقطة نهاية HTTP',
    '{
      "event": "{{event_type}}",
      "entity_type": "{{entity_type}}",
      "entity_id": "{{entity_id}}",
      "data": "{{payload}}",
      "timestamp": "{{timestamp}}",
      "signature": "{{signature}}"
    }'::jsonb,
    '{"Content-Type": "application/json"}'::jsonb,
    NULL,
    NULL
  )
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar,
  description_en = EXCLUDED.description_en,
  description_ar = EXCLUDED.description_ar,
  default_payload_template = EXCLUDED.default_payload_template,
  updated_at = NOW();

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE public.webhooks IS 'User-configured webhooks for real-time event notifications';
COMMENT ON TABLE public.webhook_deliveries IS 'Audit log of all webhook delivery attempts';
COMMENT ON TABLE public.webhook_event_queue IS 'Queue for async webhook event processing';
COMMENT ON TABLE public.webhook_templates IS 'Pre-configured templates for popular integrations';
COMMENT ON FUNCTION public.get_webhooks_for_event IS 'Get all active webhooks subscribed to a specific event type';
COMMENT ON FUNCTION public.queue_webhook_event IS 'Queue an event for webhook delivery processing';
COMMENT ON FUNCTION public.get_webhook_stats IS 'Get delivery statistics for a specific webhook';
