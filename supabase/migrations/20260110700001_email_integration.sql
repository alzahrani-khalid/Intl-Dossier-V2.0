-- =====================================================================================
-- Migration: Email Integration for Bidirectional Ticket Communication
-- Description: Creates tables for email threads, messages, templates, and preferences
--              Supports email-to-ticket conversion, thread tracking, and notifications
-- Author: Claude Code
-- Date: 2026-01-10
-- Feature: email-integration
-- =====================================================================================

-- ===========================================
-- ENUM TYPES
-- ===========================================

-- Email message direction
CREATE TYPE email_direction AS ENUM ('inbound', 'outbound');

-- Email message status
CREATE TYPE email_status AS ENUM ('pending', 'queued', 'sent', 'delivered', 'bounced', 'failed', 'opened', 'clicked');

-- Email template types
CREATE TYPE email_template_type AS ENUM (
    'ticket_created',
    'ticket_updated',
    'ticket_assigned',
    'ticket_resolved',
    'ticket_closed',
    'comment_added',
    'comment_mention',
    'status_change',
    'priority_change',
    'sla_warning',
    'sla_breach',
    'digest_daily',
    'digest_weekly'
);

-- Notification channel types
CREATE TYPE notification_channel AS ENUM ('email', 'in_app', 'push', 'sms');

-- ===========================================
-- EMAIL THREADS TABLE
-- ===========================================
-- Links external email conversations to intake tickets

CREATE TABLE IF NOT EXISTS public.email_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Thread identification
    thread_id TEXT UNIQUE NOT NULL, -- External email thread ID (Message-ID header chain)
    subject TEXT NOT NULL,

    -- Ticket relationship
    ticket_id UUID REFERENCES public.intake_tickets(id) ON DELETE SET NULL,

    -- Contact information
    from_email TEXT NOT NULL,
    from_name TEXT,
    to_emails TEXT[] NOT NULL DEFAULT '{}',
    cc_emails TEXT[] DEFAULT '{}',

    -- Thread metadata
    message_count INTEGER DEFAULT 1,
    last_message_at TIMESTAMPTZ,
    last_message_direction email_direction,

    -- Auto-reply tracking (to prevent loops)
    auto_reply_sent BOOLEAN DEFAULT FALSE,
    auto_reply_sent_at TIMESTAMPTZ,

    -- Processing flags
    is_processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT email_threads_from_email_valid CHECK (from_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes
CREATE INDEX idx_email_threads_ticket_id ON public.email_threads(ticket_id);
CREATE INDEX idx_email_threads_from_email ON public.email_threads(from_email);
CREATE INDEX idx_email_threads_created_at ON public.email_threads(created_at DESC);
CREATE INDEX idx_email_threads_last_message ON public.email_threads(last_message_at DESC);
CREATE INDEX idx_email_threads_unprocessed ON public.email_threads(is_processed) WHERE is_processed = FALSE;

-- ===========================================
-- EMAIL MESSAGES TABLE
-- ===========================================
-- Stores individual email messages in a thread

CREATE TABLE IF NOT EXISTS public.email_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Thread relationship
    thread_id UUID NOT NULL REFERENCES public.email_threads(id) ON DELETE CASCADE,

    -- Message identification
    message_id TEXT UNIQUE NOT NULL, -- Email Message-ID header
    in_reply_to TEXT, -- In-Reply-To header
    references_ids TEXT[], -- References header (array of message IDs)

    -- Message direction and status
    direction email_direction NOT NULL,
    status email_status DEFAULT 'pending' NOT NULL,

    -- Content
    subject TEXT NOT NULL,
    body_text TEXT,
    body_html TEXT,

    -- Participants
    from_email TEXT NOT NULL,
    from_name TEXT,
    to_emails TEXT[] NOT NULL DEFAULT '{}',
    cc_emails TEXT[] DEFAULT '{}',
    bcc_emails TEXT[] DEFAULT '{}',
    reply_to TEXT,

    -- Attachments (references to intake_attachments)
    attachment_ids UUID[] DEFAULT '{}',

    -- Delivery tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    bounce_reason TEXT,

    -- Retry logic for failed sends
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    last_error TEXT,

    -- Metadata
    headers JSONB DEFAULT '{}',
    raw_email TEXT, -- Store raw email for debugging

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_email_messages_thread_id ON public.email_messages(thread_id);
CREATE INDEX idx_email_messages_direction ON public.email_messages(direction);
CREATE INDEX idx_email_messages_status ON public.email_messages(status);
CREATE INDEX idx_email_messages_from_email ON public.email_messages(from_email);
CREATE INDEX idx_email_messages_created_at ON public.email_messages(created_at DESC);
CREATE INDEX idx_email_messages_pending ON public.email_messages(status, next_retry_at) WHERE status IN ('pending', 'failed');

-- ===========================================
-- EMAIL TEMPLATES TABLE
-- ===========================================
-- Bilingual email templates for notifications

CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Template identification
    template_type email_template_type UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- English content
    subject_en TEXT NOT NULL,
    body_html_en TEXT NOT NULL,
    body_text_en TEXT,

    -- Arabic content
    subject_ar TEXT NOT NULL,
    body_html_ar TEXT NOT NULL,
    body_text_ar TEXT,

    -- Template variables (for documentation)
    available_variables JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN DEFAULT TRUE NOT NULL,

    -- Metadata
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===========================================
-- EMAIL NOTIFICATION PREFERENCES TABLE
-- ===========================================
-- User preferences for email notifications

CREATE TABLE IF NOT EXISTS public.email_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- User relationship
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- General preferences
    email_notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar')),

    -- Notification type preferences
    ticket_created BOOLEAN DEFAULT TRUE,
    ticket_updated BOOLEAN DEFAULT TRUE,
    ticket_assigned BOOLEAN DEFAULT TRUE,
    ticket_resolved BOOLEAN DEFAULT TRUE,
    ticket_closed BOOLEAN DEFAULT TRUE,
    comment_added BOOLEAN DEFAULT TRUE,
    comment_mention BOOLEAN DEFAULT TRUE,
    status_change BOOLEAN DEFAULT TRUE,
    priority_change BOOLEAN DEFAULT FALSE,
    sla_warning BOOLEAN DEFAULT TRUE,
    sla_breach BOOLEAN DEFAULT TRUE,

    -- Digest preferences
    daily_digest_enabled BOOLEAN DEFAULT FALSE,
    daily_digest_time TIME DEFAULT '08:00:00',
    weekly_digest_enabled BOOLEAN DEFAULT FALSE,
    weekly_digest_day INTEGER DEFAULT 1 CHECK (weekly_digest_day BETWEEN 0 AND 6), -- 0=Sunday

    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    quiet_hours_timezone TEXT DEFAULT 'Asia/Riyadh',

    -- Channel preferences per notification type
    channel_preferences JSONB DEFAULT '{
        "ticket_created": ["email", "in_app"],
        "ticket_updated": ["email", "in_app"],
        "ticket_assigned": ["email", "in_app", "push"],
        "ticket_resolved": ["email", "in_app"],
        "comment_added": ["email", "in_app"],
        "comment_mention": ["email", "in_app", "push"],
        "status_change": ["in_app"],
        "sla_warning": ["email", "in_app", "push"],
        "sla_breach": ["email", "in_app", "push"]
    }'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Unique constraint
    CONSTRAINT email_notification_preferences_user_unique UNIQUE (user_id)
);

-- Create indexes
CREATE INDEX idx_email_notification_preferences_user_id ON public.email_notification_preferences(user_id);
CREATE INDEX idx_email_notification_preferences_enabled ON public.email_notification_preferences(email_notifications_enabled) WHERE email_notifications_enabled = TRUE;

-- ===========================================
-- EMAIL QUEUE TABLE
-- ===========================================
-- Queue for outgoing emails with retry support

CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Email content
    to_email TEXT NOT NULL,
    to_name TEXT,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,

    -- Template reference (optional)
    template_type email_template_type,
    template_data JSONB DEFAULT '{}',

    -- Language
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar')),

    -- Status tracking
    status email_status DEFAULT 'pending' NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1=highest

    -- Related entities
    ticket_id UUID REFERENCES public.intake_tickets(id) ON DELETE SET NULL,
    thread_id UUID REFERENCES public.email_threads(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Retry logic
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    last_error TEXT,

    -- Tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    external_id TEXT, -- ID from email provider (SendGrid, etc.)

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT email_queue_to_email_valid CHECK (to_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes
CREATE INDEX idx_email_queue_status ON public.email_queue(status);
CREATE INDEX idx_email_queue_priority_next_attempt ON public.email_queue(priority, next_attempt_at) WHERE status IN ('pending', 'failed');
CREATE INDEX idx_email_queue_ticket_id ON public.email_queue(ticket_id);
CREATE INDEX idx_email_queue_user_id ON public.email_queue(user_id);
CREATE INDEX idx_email_queue_created_at ON public.email_queue(created_at DESC);

-- ===========================================
-- UNSUBSCRIBE TOKENS TABLE
-- ===========================================
-- One-click unsubscribe support

CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- User relationship
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Token
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),

    -- Unsubscribe type
    unsubscribe_type TEXT DEFAULT 'all' CHECK (unsubscribe_type IN ('all', 'ticket_created', 'ticket_updated', 'ticket_assigned', 'ticket_resolved', 'comment_added', 'comment_mention', 'digest')),

    -- Status
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,

    -- Expiry (tokens valid for 30 days)
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_email_unsubscribe_tokens_user_id ON public.email_unsubscribe_tokens(user_id);
CREATE INDEX idx_email_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);
CREATE INDEX idx_email_unsubscribe_tokens_expires ON public.email_unsubscribe_tokens(expires_at) WHERE is_used = FALSE;

-- ===========================================
-- TICKET COMMENTS TABLE (for email replies)
-- ===========================================
-- Links ticket comments to users and supports email integration

CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Ticket relationship
    ticket_id UUID NOT NULL REFERENCES public.intake_tickets(id) ON DELETE CASCADE,

    -- Author
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    external_email TEXT, -- For comments from external emails
    external_name TEXT,

    -- Content (bilingual support)
    content TEXT NOT NULL,
    content_ar TEXT,

    -- Source tracking
    source TEXT DEFAULT 'web' CHECK (source IN ('web', 'email', 'api', 'system')),
    email_message_id UUID REFERENCES public.email_messages(id) ON DELETE SET NULL,

    -- Visibility
    is_internal BOOLEAN DEFAULT FALSE, -- Internal comments not visible to external users
    is_system BOOLEAN DEFAULT FALSE, -- System-generated comments (status changes, etc.)

    -- Mentions
    mentioned_user_ids UUID[] DEFAULT '{}',

    -- Attachments
    attachment_ids UUID[] DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraint: either user_id or external_email must be set
    CONSTRAINT ticket_comments_author_check CHECK (
        user_id IS NOT NULL OR external_email IS NOT NULL
    )
);

-- Create indexes
CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_user_id ON public.ticket_comments(user_id);
CREATE INDEX idx_ticket_comments_created_at ON public.ticket_comments(created_at DESC);
CREATE INDEX idx_ticket_comments_source ON public.ticket_comments(source);
CREATE INDEX idx_ticket_comments_external ON public.ticket_comments(is_internal) WHERE is_internal = FALSE;

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update email thread stats
CREATE OR REPLACE FUNCTION update_email_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.email_threads
    SET
        message_count = (
            SELECT COUNT(*) FROM public.email_messages WHERE thread_id = NEW.thread_id
        ),
        last_message_at = NEW.created_at,
        last_message_direction = NEW.direction,
        updated_at = NOW()
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create default email preferences for new users
CREATE OR REPLACE FUNCTION create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.email_notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unsubscribe token for a user
CREATE OR REPLACE FUNCTION generate_unsubscribe_token(
    p_user_id UUID,
    p_type TEXT DEFAULT 'all'
)
RETURNS TEXT AS $$
DECLARE
    v_token TEXT;
BEGIN
    -- Generate new token
    v_token := encode(gen_random_bytes(32), 'hex');

    -- Insert token record
    INSERT INTO public.email_unsubscribe_tokens (user_id, token, unsubscribe_type)
    VALUES (p_user_id, v_token, p_type);

    RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process unsubscribe action
CREATE OR REPLACE FUNCTION process_unsubscribe(
    p_token TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_record RECORD;
BEGIN
    -- Find and validate token
    SELECT * INTO v_record
    FROM public.email_unsubscribe_tokens
    WHERE token = p_token
      AND is_used = FALSE
      AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Mark token as used
    UPDATE public.email_unsubscribe_tokens
    SET is_used = TRUE, used_at = NOW()
    WHERE id = v_record.id;

    -- Update user preferences based on unsubscribe type
    IF v_record.unsubscribe_type = 'all' THEN
        UPDATE public.email_notification_preferences
        SET email_notifications_enabled = FALSE,
            updated_at = NOW()
        WHERE user_id = v_record.user_id;
    ELSIF v_record.unsubscribe_type = 'digest' THEN
        UPDATE public.email_notification_preferences
        SET daily_digest_enabled = FALSE,
            weekly_digest_enabled = FALSE,
            updated_at = NOW()
        WHERE user_id = v_record.user_id;
    ELSE
        -- Update specific notification type
        EXECUTE format(
            'UPDATE public.email_notification_preferences SET %I = FALSE, updated_at = NOW() WHERE user_id = $1',
            v_record.unsubscribe_type
        ) USING v_record.user_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to queue email notification
CREATE OR REPLACE FUNCTION queue_email_notification(
    p_user_id UUID,
    p_template_type email_template_type,
    p_template_data JSONB,
    p_ticket_id UUID DEFAULT NULL,
    p_priority INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
    v_prefs RECORD;
    v_user RECORD;
    v_template RECORD;
    v_queue_id UUID;
    v_subject TEXT;
    v_body_html TEXT;
    v_body_text TEXT;
BEGIN
    -- Get user preferences
    SELECT * INTO v_prefs
    FROM public.email_notification_preferences
    WHERE user_id = p_user_id;

    -- Check if notifications are enabled
    IF NOT FOUND OR NOT v_prefs.email_notifications_enabled THEN
        RETURN NULL;
    END IF;

    -- Check specific notification type preference
    EXECUTE format('SELECT ($1).%I', p_template_type::text)
    INTO STRICT v_prefs
    USING v_prefs;

    IF NOT v_prefs THEN
        RETURN NULL;
    END IF;

    -- Get user email
    SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email) as name
    INTO v_user
    FROM auth.users
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Get template
    SELECT * INTO v_template
    FROM public.email_templates
    WHERE template_type = p_template_type AND is_active = TRUE;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Select language-specific content
    IF v_prefs.preferred_language = 'ar' THEN
        v_subject := v_template.subject_ar;
        v_body_html := v_template.body_html_ar;
        v_body_text := v_template.body_text_ar;
    ELSE
        v_subject := v_template.subject_en;
        v_body_html := v_template.body_html_en;
        v_body_text := v_template.body_text_en;
    END IF;

    -- Insert into queue
    INSERT INTO public.email_queue (
        to_email, to_name, subject, body_html, body_text,
        template_type, template_data, language,
        ticket_id, user_id, priority
    ) VALUES (
        v_user.email, v_user.name, v_subject, v_body_html, v_body_text,
        p_template_type, p_template_data, v_prefs.preferred_language,
        p_ticket_id, p_user_id, p_priority
    )
    RETURNING id INTO v_queue_id;

    RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Updated at triggers
CREATE TRIGGER update_email_threads_updated_at
    BEFORE UPDATE ON public.email_threads
    FOR EACH ROW EXECUTE FUNCTION update_email_tables_updated_at();

CREATE TRIGGER update_email_messages_updated_at
    BEFORE UPDATE ON public.email_messages
    FOR EACH ROW EXECUTE FUNCTION update_email_tables_updated_at();

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW EXECUTE FUNCTION update_email_tables_updated_at();

CREATE TRIGGER update_email_notification_preferences_updated_at
    BEFORE UPDATE ON public.email_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_email_tables_updated_at();

CREATE TRIGGER update_email_queue_updated_at
    BEFORE UPDATE ON public.email_queue
    FOR EACH ROW EXECUTE FUNCTION update_email_tables_updated_at();

CREATE TRIGGER update_ticket_comments_updated_at
    BEFORE UPDATE ON public.ticket_comments
    FOR EACH ROW EXECUTE FUNCTION update_email_tables_updated_at();

-- Thread stats trigger
CREATE TRIGGER update_thread_stats_on_message
    AFTER INSERT ON public.email_messages
    FOR EACH ROW EXECUTE FUNCTION update_email_thread_stats();

-- Default preferences trigger
CREATE TRIGGER create_email_preferences_for_new_user
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION create_default_email_preferences();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Email threads: Accessible by ticket owner/assignee or admins
CREATE POLICY "Users can view email threads for their tickets"
    ON public.email_threads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.intake_tickets t
            WHERE t.id = email_threads.ticket_id
            AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Email messages: Accessible by ticket owner/assignee or admins
CREATE POLICY "Users can view email messages for their tickets"
    ON public.email_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.email_threads t
            JOIN public.intake_tickets it ON it.id = t.ticket_id
            WHERE t.id = email_messages.thread_id
            AND (it.created_by = auth.uid() OR it.assigned_to = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Email templates: Read by all authenticated, write by admins only
CREATE POLICY "Users can view active email templates"
    ON public.email_templates FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Admins can manage email templates"
    ON public.email_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Email notification preferences: Users manage their own
CREATE POLICY "Users can view own notification preferences"
    ON public.email_notification_preferences FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own notification preferences"
    ON public.email_notification_preferences FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own notification preferences"
    ON public.email_notification_preferences FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Email queue: Admins only (system managed)
CREATE POLICY "Admins can manage email queue"
    ON public.email_queue FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Unsubscribe tokens: Users manage their own
CREATE POLICY "Users can view own unsubscribe tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (user_id = auth.uid());

-- Ticket comments: Accessible by ticket owner/assignee or admins
CREATE POLICY "Users can view ticket comments"
    ON public.ticket_comments FOR SELECT
    USING (
        (NOT is_internal OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin', 'manager', 'analyst')
        ))
        AND EXISTS (
            SELECT 1 FROM public.intake_tickets t
            WHERE t.id = ticket_comments.ticket_id
            AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid())
        )
    );

CREATE POLICY "Users can add comments to their tickets"
    ON public.ticket_comments FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.intake_tickets t
            WHERE t.id = ticket_comments.ticket_id
            AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid())
        )
    );

CREATE POLICY "Admins can manage all ticket comments"
    ON public.ticket_comments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- ===========================================
-- GRANTS
-- ===========================================

GRANT SELECT, INSERT, UPDATE ON public.email_threads TO authenticated;
GRANT SELECT, INSERT ON public.email_messages TO authenticated;
GRANT SELECT ON public.email_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.email_notification_preferences TO authenticated;
GRANT SELECT ON public.email_queue TO authenticated;
GRANT SELECT ON public.email_unsubscribe_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ticket_comments TO authenticated;

-- Service role needs full access for Edge Functions
GRANT ALL ON public.email_threads TO service_role;
GRANT ALL ON public.email_messages TO service_role;
GRANT ALL ON public.email_templates TO service_role;
GRANT ALL ON public.email_notification_preferences TO service_role;
GRANT ALL ON public.email_queue TO service_role;
GRANT ALL ON public.email_unsubscribe_tokens TO service_role;
GRANT ALL ON public.ticket_comments TO service_role;

-- ===========================================
-- SEED DATA: Default Email Templates
-- ===========================================

INSERT INTO public.email_templates (template_type, name, description, subject_en, body_html_en, body_text_en, subject_ar, body_html_ar, body_text_ar, available_variables) VALUES

-- Ticket Created Template
('ticket_created', 'Ticket Created Confirmation', 'Sent when a new ticket is created',
'[{{ticket_number}}] Your Request Has Been Received',
'<div style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Your Request Has Been Received</h2>
  <p>Hello {{user_name}},</p>
  <p>Thank you for submitting your request. We have received it and assigned it ticket number <strong>{{ticket_number}}</strong>.</p>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>Ticket:</strong> {{ticket_number}}</p>
    <p style="margin: 5px 0;"><strong>Subject:</strong> {{ticket_title}}</p>
    <p style="margin: 5px 0;"><strong>Type:</strong> {{request_type}}</p>
    <p style="margin: 5px 0;"><strong>Priority:</strong> {{priority}}</p>
  </div>
  <p>You can track the status of your request by clicking the button below:</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{ticket_url}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Ticket</a>
  </p>
  <p>To reply to this ticket, simply respond to this email.</p>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">General Authority for Statistics<br>International Dossier System</p>
</div>',
'Your Request Has Been Received

Hello {{user_name}},

Thank you for submitting your request. We have received it and assigned it ticket number {{ticket_number}}.

Ticket: {{ticket_number}}
Subject: {{ticket_title}}
Type: {{request_type}}
Priority: {{priority}}

You can track the status of your request at: {{ticket_url}}

To reply to this ticket, simply respond to this email.

--
General Authority for Statistics
International Dossier System',
'[{{ticket_number}}] تم استلام طلبك',
'<div dir="rtl" style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>تم استلام طلبك</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>شكراً لتقديم طلبك. لقد تم استلامه وتم تعيين رقم التذكرة <strong>{{ticket_number}}</strong>.</p>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>التذكرة:</strong> {{ticket_number}}</p>
    <p style="margin: 5px 0;"><strong>الموضوع:</strong> {{ticket_title_ar}}</p>
    <p style="margin: 5px 0;"><strong>النوع:</strong> {{request_type_ar}}</p>
    <p style="margin: 5px 0;"><strong>الأولوية:</strong> {{priority_ar}}</p>
  </div>
  <p>يمكنك متابعة حالة طلبك بالنقر على الزر أدناه:</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{ticket_url}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">عرض التذكرة</a>
  </p>
  <p>للرد على هذه التذكرة، يمكنك الرد مباشرة على هذا البريد الإلكتروني.</p>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">الهيئة العامة للإحصاء<br>نظام الملف الدولي</p>
</div>',
'تم استلام طلبك

مرحباً {{user_name}}،

شكراً لتقديم طلبك. لقد تم استلامه وتم تعيين رقم التذكرة {{ticket_number}}.

التذكرة: {{ticket_number}}
الموضوع: {{ticket_title_ar}}
النوع: {{request_type_ar}}
الأولوية: {{priority_ar}}

يمكنك متابعة حالة طلبك على: {{ticket_url}}

للرد على هذه التذكرة، يمكنك الرد مباشرة على هذا البريد الإلكتروني.

--
الهيئة العامة للإحصاء
نظام الملف الدولي',
'["ticket_number", "ticket_title", "ticket_title_ar", "request_type", "request_type_ar", "priority", "priority_ar", "user_name", "ticket_url"]'::jsonb),

-- Ticket Assigned Template
('ticket_assigned', 'Ticket Assigned Notification', 'Sent when a ticket is assigned to someone',
'[{{ticket_number}}] You Have Been Assigned a Ticket',
'<div style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>You Have Been Assigned a New Ticket</h2>
  <p>Hello {{assignee_name}},</p>
  <p>A ticket has been assigned to you for action.</p>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>Ticket:</strong> {{ticket_number}}</p>
    <p style="margin: 5px 0;"><strong>Subject:</strong> {{ticket_title}}</p>
    <p style="margin: 5px 0;"><strong>Priority:</strong> <span style="color: {{priority_color}};">{{priority}}</span></p>
    <p style="margin: 5px 0;"><strong>SLA Target:</strong> {{sla_target}}</p>
    <p style="margin: 5px 0;"><strong>Submitted by:</strong> {{submitter_name}}</p>
  </div>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{ticket_url}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Ticket</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">General Authority for Statistics<br>International Dossier System</p>
</div>',
'You Have Been Assigned a New Ticket

Hello {{assignee_name}},

A ticket has been assigned to you for action.

Ticket: {{ticket_number}}
Subject: {{ticket_title}}
Priority: {{priority}}
SLA Target: {{sla_target}}
Submitted by: {{submitter_name}}

View ticket at: {{ticket_url}}

--
General Authority for Statistics
International Dossier System',
'[{{ticket_number}}] تم تعيين تذكرة لك',
'<div dir="rtl" style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>تم تعيين تذكرة جديدة لك</h2>
  <p>مرحباً {{assignee_name}}،</p>
  <p>تم تعيين تذكرة لك للمتابعة.</p>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>التذكرة:</strong> {{ticket_number}}</p>
    <p style="margin: 5px 0;"><strong>الموضوع:</strong> {{ticket_title_ar}}</p>
    <p style="margin: 5px 0;"><strong>الأولوية:</strong> <span style="color: {{priority_color}};">{{priority_ar}}</span></p>
    <p style="margin: 5px 0;"><strong>هدف SLA:</strong> {{sla_target}}</p>
    <p style="margin: 5px 0;"><strong>مقدم الطلب:</strong> {{submitter_name}}</p>
  </div>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{ticket_url}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">عرض التذكرة</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">الهيئة العامة للإحصاء<br>نظام الملف الدولي</p>
</div>',
'تم تعيين تذكرة جديدة لك

مرحباً {{assignee_name}}،

تم تعيين تذكرة لك للمتابعة.

التذكرة: {{ticket_number}}
الموضوع: {{ticket_title_ar}}
الأولوية: {{priority_ar}}
هدف SLA: {{sla_target}}
مقدم الطلب: {{submitter_name}}

عرض التذكرة على: {{ticket_url}}

--
الهيئة العامة للإحصاء
نظام الملف الدولي',
'["ticket_number", "ticket_title", "ticket_title_ar", "priority", "priority_ar", "priority_color", "sla_target", "assignee_name", "submitter_name", "ticket_url"]'::jsonb),

-- Comment Added Template
('comment_added', 'New Comment Notification', 'Sent when a comment is added to a ticket',
'[{{ticket_number}}] New Comment on Your Ticket',
'<div style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>New Comment on Your Ticket</h2>
  <p>Hello {{user_name}},</p>
  <p>A new comment has been added to ticket <strong>{{ticket_number}}</strong>:</p>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0066cc;">
    <p style="margin: 0 0 10px 0;"><strong>{{commenter_name}}</strong> wrote:</p>
    <p style="margin: 0;">{{comment_preview}}</p>
  </div>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{ticket_url}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Full Conversation</a>
  </p>
  <p>To reply, simply respond to this email or click the button above.</p>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">General Authority for Statistics<br>International Dossier System</p>
</div>',
'New Comment on Your Ticket

Hello {{user_name}},

A new comment has been added to ticket {{ticket_number}}:

{{commenter_name}} wrote:
{{comment_preview}}

View full conversation at: {{ticket_url}}

To reply, simply respond to this email.

--
General Authority for Statistics
International Dossier System',
'[{{ticket_number}}] تعليق جديد على تذكرتك',
'<div dir="rtl" style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>تعليق جديد على تذكرتك</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>تمت إضافة تعليق جديد على التذكرة <strong>{{ticket_number}}</strong>:</p>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-right: 4px solid #0066cc;">
    <p style="margin: 0 0 10px 0;"><strong>{{commenter_name}}</strong> كتب:</p>
    <p style="margin: 0;">{{comment_preview_ar}}</p>
  </div>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{ticket_url}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">عرض المحادثة كاملة</a>
  </p>
  <p>للرد، يمكنك الرد مباشرة على هذا البريد الإلكتروني أو النقر على الزر أعلاه.</p>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">الهيئة العامة للإحصاء<br>نظام الملف الدولي</p>
</div>',
'تعليق جديد على تذكرتك

مرحباً {{user_name}}،

تمت إضافة تعليق جديد على التذكرة {{ticket_number}}:

{{commenter_name}} كتب:
{{comment_preview_ar}}

عرض المحادثة كاملة على: {{ticket_url}}

للرد، يمكنك الرد مباشرة على هذا البريد الإلكتروني.

--
الهيئة العامة للإحصاء
نظام الملف الدولي',
'["ticket_number", "user_name", "commenter_name", "comment_preview", "comment_preview_ar", "ticket_url"]'::jsonb),

-- Status Change Template
('status_change', 'Ticket Status Update', 'Sent when ticket status changes',
'[{{ticket_number}}] Status Updated: {{new_status}}',
'<div style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Ticket Status Updated</h2>
  <p>Hello {{user_name}},</p>
  <p>The status of your ticket <strong>{{ticket_number}}</strong> has been updated.</p>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>Previous Status:</strong> {{old_status}}</p>
    <p style="margin: 5px 0;"><strong>New Status:</strong> <span style="color: {{status_color}}; font-weight: bold;">{{new_status}}</span></p>
    {{#if status_note}}<p style="margin: 15px 0 5px 0;"><strong>Note:</strong> {{status_note}}</p>{{/if}}
  </div>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{ticket_url}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Ticket</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">General Authority for Statistics<br>International Dossier System</p>
</div>',
'Ticket Status Updated

Hello {{user_name}},

The status of your ticket {{ticket_number}} has been updated.

Previous Status: {{old_status}}
New Status: {{new_status}}
{{#if status_note}}Note: {{status_note}}{{/if}}

View ticket at: {{ticket_url}}

--
General Authority for Statistics
International Dossier System',
'[{{ticket_number}}] تحديث الحالة: {{new_status_ar}}',
'<div dir="rtl" style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>تم تحديث حالة التذكرة</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>تم تحديث حالة تذكرتك <strong>{{ticket_number}}</strong>.</p>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>الحالة السابقة:</strong> {{old_status_ar}}</p>
    <p style="margin: 5px 0;"><strong>الحالة الجديدة:</strong> <span style="color: {{status_color}}; font-weight: bold;">{{new_status_ar}}</span></p>
    {{#if status_note_ar}}<p style="margin: 15px 0 5px 0;"><strong>ملاحظة:</strong> {{status_note_ar}}</p>{{/if}}
  </div>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{ticket_url}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">عرض التذكرة</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">الهيئة العامة للإحصاء<br>نظام الملف الدولي</p>
</div>',
'تم تحديث حالة التذكرة

مرحباً {{user_name}}،

تم تحديث حالة تذكرتك {{ticket_number}}.

الحالة السابقة: {{old_status_ar}}
الحالة الجديدة: {{new_status_ar}}
{{#if status_note_ar}}ملاحظة: {{status_note_ar}}{{/if}}

عرض التذكرة على: {{ticket_url}}

--
الهيئة العامة للإحصاء
نظام الملف الدولي',
'["ticket_number", "user_name", "old_status", "old_status_ar", "new_status", "new_status_ar", "status_color", "status_note", "status_note_ar", "ticket_url"]'::jsonb),

-- SLA Warning Template
('sla_warning', 'SLA Breach Warning', 'Sent when SLA is about to breach',
'[{{ticket_number}}] SLA Warning: Action Required',
'<div style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
    <strong>⚠️ SLA Warning</strong>
  </div>
  <h2>SLA Breach Warning</h2>
  <p>Hello {{assignee_name}},</p>
  <p>The following ticket is at risk of breaching its SLA target:</p>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>Ticket:</strong> {{ticket_number}}</p>
    <p style="margin: 5px 0;"><strong>Subject:</strong> {{ticket_title}}</p>
    <p style="margin: 5px 0;"><strong>Time Remaining:</strong> <span style="color: #d32f2f; font-weight: bold;">{{time_remaining}}</span></p>
    <p style="margin: 5px 0;"><strong>SLA Target:</strong> {{sla_target}}</p>
  </div>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{ticket_url}}" style="background-color: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Take Action Now</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">General Authority for Statistics<br>International Dossier System</p>
</div>',
'SLA BREACH WARNING

Hello {{assignee_name}},

The following ticket is at risk of breaching its SLA target:

Ticket: {{ticket_number}}
Subject: {{ticket_title}}
Time Remaining: {{time_remaining}}
SLA Target: {{sla_target}}

Take action at: {{ticket_url}}

--
General Authority for Statistics
International Dossier System',
'[{{ticket_number}}] تحذير SLA: يتطلب إجراء',
'<div dir="rtl" style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
    <strong>⚠️ تحذير SLA</strong>
  </div>
  <h2>تحذير اقتراب انتهاء مهلة SLA</h2>
  <p>مرحباً {{assignee_name}}،</p>
  <p>التذكرة التالية معرضة لخطر تجاوز مهلة SLA:</p>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>التذكرة:</strong> {{ticket_number}}</p>
    <p style="margin: 5px 0;"><strong>الموضوع:</strong> {{ticket_title_ar}}</p>
    <p style="margin: 5px 0;"><strong>الوقت المتبقي:</strong> <span style="color: #d32f2f; font-weight: bold;">{{time_remaining_ar}}</span></p>
    <p style="margin: 5px 0;"><strong>هدف SLA:</strong> {{sla_target}}</p>
  </div>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{ticket_url}}" style="background-color: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">اتخذ إجراء الآن</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">الهيئة العامة للإحصاء<br>نظام الملف الدولي</p>
</div>',
'تحذير انتهاء مهلة SLA

مرحباً {{assignee_name}}،

التذكرة التالية معرضة لخطر تجاوز مهلة SLA:

التذكرة: {{ticket_number}}
الموضوع: {{ticket_title_ar}}
الوقت المتبقي: {{time_remaining_ar}}
هدف SLA: {{sla_target}}

اتخذ إجراء على: {{ticket_url}}

--
الهيئة العامة للإحصاء
نظام الملف الدولي',
'["ticket_number", "ticket_title", "ticket_title_ar", "time_remaining", "time_remaining_ar", "sla_target", "assignee_name", "ticket_url"]'::jsonb);

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE public.email_threads IS 'Tracks email conversation threads linked to intake tickets';
COMMENT ON TABLE public.email_messages IS 'Stores individual email messages within threads';
COMMENT ON TABLE public.email_templates IS 'Bilingual email templates for notifications';
COMMENT ON TABLE public.email_notification_preferences IS 'User preferences for email notifications';
COMMENT ON TABLE public.email_queue IS 'Queue for outgoing emails with retry support';
COMMENT ON TABLE public.email_unsubscribe_tokens IS 'One-click unsubscribe tokens';
COMMENT ON TABLE public.ticket_comments IS 'Comments on intake tickets from users and emails';

COMMENT ON FUNCTION generate_unsubscribe_token IS 'Generates a one-click unsubscribe token for a user';
COMMENT ON FUNCTION process_unsubscribe IS 'Processes an unsubscribe action using a token';
COMMENT ON FUNCTION queue_email_notification IS 'Queues an email notification based on user preferences';
