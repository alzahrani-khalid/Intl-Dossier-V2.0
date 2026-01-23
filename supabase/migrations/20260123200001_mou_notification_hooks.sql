-- =====================================================================================
-- Migration: MoU Notification Hooks
-- Description: Wire up notifications for MoU deliverable due dates, commitment expiration
--              warnings, renewal reminders, milestone completions, and workflow state changes.
--              Includes notification preferences and batching support.
-- Feature: mou-notification-hooks
-- Date: 2026-01-23
-- =====================================================================================

-- ===========================================
-- ENUM TYPES FOR MoU NOTIFICATIONS
-- ===========================================

DO $$ BEGIN
    CREATE TYPE public.mou_notification_type AS ENUM (
        'deliverable_due_soon',      -- 7, 3, 1 days before due date
        'deliverable_overdue',       -- Deliverable past due date
        'deliverable_completed',     -- Deliverable marked complete
        'milestone_completed',       -- Milestone marked complete
        'expiration_warning',        -- MoU expiration 90/60/30/7 days
        'mou_expired',               -- MoU has expired
        'renewal_initiated',         -- Renewal process started
        'renewal_approved',          -- Renewal approved
        'renewal_completed',         -- Renewal finished
        'workflow_state_change',     -- MoU workflow state changed
        'health_score_drop',         -- MoU/deliverable health dropped significantly
        'assignment_change'          -- Responsible party changed
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================
-- MoU NOTIFICATION PREFERENCES TABLE
-- ===========================================
-- User-specific notification preferences for MoU events

CREATE TABLE IF NOT EXISTS public.mou_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User relationship
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Global MoU notification toggle
    mou_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Deliverable notifications
    deliverable_due_soon_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    deliverable_due_soon_days INTEGER[] NOT NULL DEFAULT ARRAY[7, 3, 1],
    deliverable_overdue_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    deliverable_completed_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Milestone notifications
    milestone_completed_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Expiration notifications
    expiration_warning_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    expiration_warning_days INTEGER[] NOT NULL DEFAULT ARRAY[90, 60, 30, 7],
    mou_expired_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Renewal notifications
    renewal_initiated_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    renewal_approved_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    renewal_completed_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Workflow notifications
    workflow_state_change_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Health notifications
    health_score_drop_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    health_score_drop_threshold INTEGER NOT NULL DEFAULT 20 CHECK (health_score_drop_threshold >= 5 AND health_score_drop_threshold <= 50),

    -- Assignment notifications
    assignment_change_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Channel preferences
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Batching preferences
    batch_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    batch_frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (batch_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
    batch_delivery_time TIME DEFAULT '09:00:00',
    batch_delivery_day INTEGER DEFAULT 1 CHECK (batch_delivery_day >= 0 AND batch_delivery_day <= 6), -- 0=Sunday

    -- Quiet hours (no notifications during these hours)
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '07:00:00',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint per user
    CONSTRAINT unique_user_mou_preferences UNIQUE (user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mou_notification_preferences_user ON public.mou_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_mou_notification_preferences_batch ON public.mou_notification_preferences(batch_notifications, batch_frequency)
    WHERE batch_notifications = TRUE;

-- ===========================================
-- MoU NOTIFICATION QUEUE TABLE
-- ===========================================
-- Queue for batched notifications

CREATE TABLE IF NOT EXISTS public.mou_notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User relationship
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Notification details
    notification_type public.mou_notification_type NOT NULL,
    mou_id UUID REFERENCES public.mous(id) ON DELETE CASCADE,
    deliverable_id UUID REFERENCES public.mou_deliverables(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES public.deliverable_milestones(id) ON DELETE CASCADE,
    renewal_id UUID REFERENCES public.mou_renewals(id) ON DELETE CASCADE,

    -- Content (bilingual)
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    message_en TEXT NOT NULL,
    message_ar TEXT NOT NULL,

    -- Additional data
    data JSONB NOT NULL DEFAULT '{}',
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    action_url TEXT,

    -- Processing status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'batched', 'sent', 'failed', 'cancelled')),
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mou_notification_queue_user ON public.mou_notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_mou_notification_queue_status ON public.mou_notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_mou_notification_queue_scheduled ON public.mou_notification_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_mou_notification_queue_type ON public.mou_notification_queue(notification_type);
CREATE INDEX IF NOT EXISTS idx_mou_notification_queue_mou ON public.mou_notification_queue(mou_id) WHERE mou_id IS NOT NULL;

-- ===========================================
-- MoU NOTIFICATION LOG TABLE
-- ===========================================
-- Track sent notifications for analytics and debugging

CREATE TABLE IF NOT EXISTS public.mou_notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Original queue entry
    queue_id UUID REFERENCES public.mou_notification_queue(id) ON DELETE SET NULL,

    -- User relationship
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Notification details
    notification_type public.mou_notification_type NOT NULL,
    mou_id UUID,
    deliverable_id UUID,

    -- Delivery channels used
    sent_via_email BOOLEAN NOT NULL DEFAULT FALSE,
    sent_via_push BOOLEAN NOT NULL DEFAULT FALSE,
    sent_via_in_app BOOLEAN NOT NULL DEFAULT FALSE,

    -- Response tracking
    email_opened BOOLEAN DEFAULT FALSE,
    email_clicked BOOLEAN DEFAULT FALSE,
    push_clicked BOOLEAN DEFAULT FALSE,
    in_app_read BOOLEAN DEFAULT FALSE,
    in_app_read_at TIMESTAMPTZ,

    -- Timestamps
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mou_notification_log_user ON public.mou_notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_mou_notification_log_type ON public.mou_notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_mou_notification_log_sent ON public.mou_notification_log(sent_at);

-- ===========================================
-- TRIGGERS FOR UPDATED_AT
-- ===========================================

CREATE TRIGGER trigger_update_mou_notification_preferences_updated_at
    BEFORE UPDATE ON public.mou_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_mou_notification_queue_updated_at
    BEFORE UPDATE ON public.mou_notification_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- FUNCTION: Create Default MoU Notification Preferences
-- ===========================================

CREATE OR REPLACE FUNCTION public.create_default_mou_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.mou_notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create preferences for new users
CREATE TRIGGER trigger_create_mou_notification_preferences
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_mou_notification_preferences();

-- ===========================================
-- FUNCTION: Queue MoU Notification
-- ===========================================

CREATE OR REPLACE FUNCTION public.queue_mou_notification(
    p_user_id UUID,
    p_notification_type public.mou_notification_type,
    p_title_en TEXT,
    p_title_ar TEXT,
    p_message_en TEXT,
    p_message_ar TEXT,
    p_mou_id UUID DEFAULT NULL,
    p_deliverable_id UUID DEFAULT NULL,
    p_milestone_id UUID DEFAULT NULL,
    p_renewal_id UUID DEFAULT NULL,
    p_data JSONB DEFAULT '{}',
    p_priority TEXT DEFAULT 'normal',
    p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_prefs RECORD;
    v_queue_id UUID;
    v_scheduled_for TIMESTAMPTZ;
    v_should_send BOOLEAN := TRUE;
    v_current_time TIME;
BEGIN
    -- Get user preferences
    SELECT * INTO v_prefs
    FROM public.mou_notification_preferences
    WHERE user_id = p_user_id;

    -- Create default preferences if not exists
    IF v_prefs IS NULL THEN
        INSERT INTO public.mou_notification_preferences (user_id)
        VALUES (p_user_id)
        RETURNING * INTO v_prefs;
    END IF;

    -- Check if MoU notifications are enabled globally
    IF NOT v_prefs.mou_notifications_enabled THEN
        RETURN NULL;
    END IF;

    -- Check specific notification type
    v_should_send := CASE p_notification_type
        WHEN 'deliverable_due_soon' THEN v_prefs.deliverable_due_soon_enabled
        WHEN 'deliverable_overdue' THEN v_prefs.deliverable_overdue_enabled
        WHEN 'deliverable_completed' THEN v_prefs.deliverable_completed_enabled
        WHEN 'milestone_completed' THEN v_prefs.milestone_completed_enabled
        WHEN 'expiration_warning' THEN v_prefs.expiration_warning_enabled
        WHEN 'mou_expired' THEN v_prefs.mou_expired_enabled
        WHEN 'renewal_initiated' THEN v_prefs.renewal_initiated_enabled
        WHEN 'renewal_approved' THEN v_prefs.renewal_approved_enabled
        WHEN 'renewal_completed' THEN v_prefs.renewal_completed_enabled
        WHEN 'workflow_state_change' THEN v_prefs.workflow_state_change_enabled
        WHEN 'health_score_drop' THEN v_prefs.health_score_drop_enabled
        WHEN 'assignment_change' THEN v_prefs.assignment_change_enabled
        ELSE TRUE
    END;

    IF NOT v_should_send THEN
        RETURN NULL;
    END IF;

    -- Calculate scheduled time based on batching preferences
    v_current_time := CURRENT_TIME;

    IF v_prefs.batch_notifications THEN
        CASE v_prefs.batch_frequency
            WHEN 'hourly' THEN
                v_scheduled_for := date_trunc('hour', NOW()) + INTERVAL '1 hour';
            WHEN 'daily' THEN
                v_scheduled_for := date_trunc('day', NOW()) + INTERVAL '1 day' + v_prefs.batch_delivery_time;
            WHEN 'weekly' THEN
                -- Calculate next occurrence of the specified day
                v_scheduled_for := date_trunc('week', NOW()) +
                    ((v_prefs.batch_delivery_day - EXTRACT(DOW FROM NOW())::INTEGER + 7) % 7) * INTERVAL '1 day' +
                    v_prefs.batch_delivery_time;
                IF v_scheduled_for <= NOW() THEN
                    v_scheduled_for := v_scheduled_for + INTERVAL '7 days';
                END IF;
            ELSE
                v_scheduled_for := NOW();
        END CASE;
    ELSE
        -- Check quiet hours
        IF v_prefs.quiet_hours_enabled THEN
            IF v_prefs.quiet_hours_start > v_prefs.quiet_hours_end THEN
                -- Quiet hours span midnight
                IF v_current_time >= v_prefs.quiet_hours_start OR v_current_time < v_prefs.quiet_hours_end THEN
                    v_scheduled_for := date_trunc('day', NOW()) + v_prefs.quiet_hours_end;
                    IF v_scheduled_for < NOW() THEN
                        v_scheduled_for := v_scheduled_for + INTERVAL '1 day';
                    END IF;
                ELSE
                    v_scheduled_for := NOW();
                END IF;
            ELSE
                -- Normal quiet hours
                IF v_current_time >= v_prefs.quiet_hours_start AND v_current_time < v_prefs.quiet_hours_end THEN
                    v_scheduled_for := date_trunc('day', NOW()) + v_prefs.quiet_hours_end;
                ELSE
                    v_scheduled_for := NOW();
                END IF;
            END IF;
        ELSE
            v_scheduled_for := NOW();
        END IF;
    END IF;

    -- Insert into queue
    INSERT INTO public.mou_notification_queue (
        user_id,
        notification_type,
        mou_id,
        deliverable_id,
        milestone_id,
        renewal_id,
        title_en,
        title_ar,
        message_en,
        message_ar,
        data,
        priority,
        action_url,
        status,
        scheduled_for
    ) VALUES (
        p_user_id,
        p_notification_type,
        p_mou_id,
        p_deliverable_id,
        p_milestone_id,
        p_renewal_id,
        p_title_en,
        p_title_ar,
        p_message_en,
        p_message_ar,
        p_data,
        p_priority,
        p_action_url,
        CASE WHEN v_prefs.batch_notifications AND v_prefs.batch_frequency != 'immediate'
             THEN 'batched' ELSE 'pending' END,
        v_scheduled_for
    )
    RETURNING id INTO v_queue_id;

    RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- FUNCTION: Process MoU Notification Queue
-- ===========================================

CREATE OR REPLACE FUNCTION public.process_mou_notification_queue(p_batch_size INTEGER DEFAULT 100)
RETURNS TABLE (
    processed_count INTEGER,
    success_count INTEGER,
    failure_count INTEGER
) AS $$
DECLARE
    v_processed INTEGER := 0;
    v_success INTEGER := 0;
    v_failure INTEGER := 0;
    v_queue_item RECORD;
    v_prefs RECORD;
    v_notification_id UUID;
BEGIN
    -- Get pending notifications that are due
    FOR v_queue_item IN
        SELECT q.*
        FROM public.mou_notification_queue q
        WHERE q.status IN ('pending', 'batched')
        AND q.scheduled_for <= NOW()
        ORDER BY
            CASE q.priority
                WHEN 'urgent' THEN 1
                WHEN 'high' THEN 2
                WHEN 'normal' THEN 3
                WHEN 'low' THEN 4
            END,
            q.scheduled_for
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    LOOP
        v_processed := v_processed + 1;

        BEGIN
            -- Get user preferences
            SELECT * INTO v_prefs
            FROM public.mou_notification_preferences
            WHERE user_id = v_queue_item.user_id;

            -- Create in-app notification if enabled
            IF v_prefs.in_app_enabled THEN
                INSERT INTO public.notifications (
                    user_id,
                    type,
                    title,
                    message,
                    category,
                    data,
                    priority,
                    action_url,
                    source_type,
                    source_id
                ) VALUES (
                    v_queue_item.user_id,
                    v_queue_item.notification_type::TEXT,
                    v_queue_item.title_en, -- TODO: Use user's language preference
                    v_queue_item.message_en,
                    'deadlines'::notification_category, -- MoU notifications go to deadlines category
                    v_queue_item.data,
                    v_queue_item.priority,
                    v_queue_item.action_url,
                    'mou',
                    v_queue_item.mou_id
                )
                RETURNING id INTO v_notification_id;
            END IF;

            -- Log the notification
            INSERT INTO public.mou_notification_log (
                queue_id,
                user_id,
                notification_type,
                mou_id,
                deliverable_id,
                sent_via_email,
                sent_via_push,
                sent_via_in_app
            ) VALUES (
                v_queue_item.id,
                v_queue_item.user_id,
                v_queue_item.notification_type,
                v_queue_item.mou_id,
                v_queue_item.deliverable_id,
                v_prefs.email_enabled,
                v_prefs.push_enabled,
                v_prefs.in_app_enabled
            );

            -- Mark as sent
            UPDATE public.mou_notification_queue
            SET status = 'sent',
                sent_at = NOW()
            WHERE id = v_queue_item.id;

            v_success := v_success + 1;

        EXCEPTION WHEN OTHERS THEN
            -- Mark as failed
            UPDATE public.mou_notification_queue
            SET status = CASE WHEN retry_count >= 3 THEN 'failed' ELSE 'pending' END,
                error_message = SQLERRM,
                retry_count = retry_count + 1,
                scheduled_for = NOW() + (POWER(2, retry_count) * INTERVAL '1 minute')
            WHERE id = v_queue_item.id;

            v_failure := v_failure + 1;
        END;
    END LOOP;

    RETURN QUERY SELECT v_processed, v_success, v_failure;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- TRIGGER: Deliverable Due Date Notifications
-- ===========================================

CREATE OR REPLACE FUNCTION public.trigger_deliverable_due_notifications()
RETURNS TRIGGER AS $$
DECLARE
    v_user RECORD;
    v_mou RECORD;
    v_days_until_due INTEGER;
    v_prefs RECORD;
BEGIN
    -- Only for pending/in_progress deliverables
    IF NEW.status NOT IN ('pending', 'in_progress') THEN
        RETURN NEW;
    END IF;

    -- Calculate days until due
    v_days_until_due := (NEW.due_date - CURRENT_DATE);

    -- Get MoU details
    SELECT * INTO v_mou
    FROM public.mous
    WHERE id = NEW.mou_id;

    -- Get responsible user if internal
    IF NEW.responsible_party_type = 'internal' AND NEW.responsible_user_id IS NOT NULL THEN
        -- Check user's notification preferences
        SELECT * INTO v_prefs
        FROM public.mou_notification_preferences
        WHERE user_id = NEW.responsible_user_id;

        -- Check if this day count matches user's preferences
        IF v_prefs IS NOT NULL AND v_prefs.deliverable_due_soon_enabled AND v_days_until_due = ANY(v_prefs.deliverable_due_soon_days) THEN
            PERFORM public.queue_mou_notification(
                NEW.responsible_user_id,
                'deliverable_due_soon'::public.mou_notification_type,
                format('Deliverable due in %s days: %s', v_days_until_due, NEW.title_en),
                format('تسليم مستحق خلال %s أيام: %s', v_days_until_due, NEW.title_ar),
                format('The deliverable "%s" for MoU "%s" is due on %s (%s days remaining).',
                    NEW.title_en, v_mou.title, NEW.due_date, v_days_until_due),
                format('التسليم "%s" لمذكرة التفاهم "%s" مستحق في %s (%s أيام متبقية).',
                    NEW.title_ar, COALESCE(v_mou.title_ar, v_mou.title), NEW.due_date, v_days_until_due),
                NEW.mou_id,
                NEW.id,
                NULL,
                NULL,
                jsonb_build_object(
                    'days_until_due', v_days_until_due,
                    'progress', NEW.progress,
                    'status', NEW.status
                ),
                CASE
                    WHEN v_days_until_due <= 1 THEN 'urgent'
                    WHEN v_days_until_due <= 3 THEN 'high'
                    ELSE 'normal'
                END,
                format('/mous/%s/deliverables/%s', NEW.mou_id, NEW.id)
            );
        END IF;
    END IF;

    -- Also notify MoU creator
    IF v_mou.created_by IS NOT NULL AND v_mou.created_by != COALESCE(NEW.responsible_user_id, v_mou.created_by) THEN
        SELECT * INTO v_prefs
        FROM public.mou_notification_preferences
        WHERE user_id = v_mou.created_by;

        IF v_prefs IS NOT NULL AND v_prefs.deliverable_due_soon_enabled AND v_days_until_due = ANY(v_prefs.deliverable_due_soon_days) THEN
            PERFORM public.queue_mou_notification(
                v_mou.created_by,
                'deliverable_due_soon'::public.mou_notification_type,
                format('Deliverable due in %s days: %s', v_days_until_due, NEW.title_en),
                format('تسليم مستحق خلال %s أيام: %s', v_days_until_due, NEW.title_ar),
                format('The deliverable "%s" for MoU "%s" is due on %s.',
                    NEW.title_en, v_mou.title, NEW.due_date),
                format('التسليم "%s" لمذكرة التفاهم "%s" مستحق في %s.',
                    NEW.title_ar, COALESCE(v_mou.title_ar, v_mou.title), NEW.due_date),
                NEW.mou_id,
                NEW.id,
                NULL,
                NULL,
                jsonb_build_object('days_until_due', v_days_until_due),
                'normal',
                format('/mous/%s/deliverables/%s', NEW.mou_id, NEW.id)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger would be called by a scheduled job, not on every update
-- The actual trigger for status changes is below

-- ===========================================
-- TRIGGER: Deliverable Status Change Notifications
-- ===========================================

CREATE OR REPLACE FUNCTION public.trigger_deliverable_status_change_notifications()
RETURNS TRIGGER AS $$
DECLARE
    v_mou RECORD;
    v_prefs RECORD;
BEGIN
    -- Skip if status didn't change
    IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Get MoU details
    SELECT * INTO v_mou
    FROM public.mous
    WHERE id = NEW.mou_id;

    -- Notify on completion
    IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status != 'completed') THEN
        -- Notify responsible user
        IF NEW.responsible_party_type = 'internal' AND NEW.responsible_user_id IS NOT NULL THEN
            SELECT * INTO v_prefs
            FROM public.mou_notification_preferences
            WHERE user_id = NEW.responsible_user_id;

            IF v_prefs IS NULL OR v_prefs.deliverable_completed_enabled THEN
                PERFORM public.queue_mou_notification(
                    NEW.responsible_user_id,
                    'deliverable_completed'::public.mou_notification_type,
                    format('Deliverable completed: %s', NEW.title_en),
                    format('تم إكمال التسليم: %s', NEW.title_ar),
                    format('The deliverable "%s" for MoU "%s" has been marked as completed.',
                        NEW.title_en, v_mou.title),
                    format('تم تحديد التسليم "%s" لمذكرة التفاهم "%s" كمكتمل.',
                        NEW.title_ar, COALESCE(v_mou.title_ar, v_mou.title)),
                    NEW.mou_id,
                    NEW.id,
                    NULL,
                    NULL,
                    jsonb_build_object('progress', 100, 'completed_at', NEW.completed_at),
                    'normal',
                    format('/mous/%s/deliverables/%s', NEW.mou_id, NEW.id)
                );
            END IF;
        END IF;

        -- Notify MoU creator
        IF v_mou.created_by IS NOT NULL AND v_mou.created_by != COALESCE(NEW.responsible_user_id, v_mou.created_by) THEN
            SELECT * INTO v_prefs
            FROM public.mou_notification_preferences
            WHERE user_id = v_mou.created_by;

            IF v_prefs IS NULL OR v_prefs.deliverable_completed_enabled THEN
                PERFORM public.queue_mou_notification(
                    v_mou.created_by,
                    'deliverable_completed'::public.mou_notification_type,
                    format('Deliverable completed: %s', NEW.title_en),
                    format('تم إكمال التسليم: %s', NEW.title_ar),
                    format('The deliverable "%s" for MoU "%s" has been marked as completed.',
                        NEW.title_en, v_mou.title),
                    format('تم تحديد التسليم "%s" لمذكرة التفاهم "%s" كمكتمل.',
                        NEW.title_ar, COALESCE(v_mou.title_ar, v_mou.title)),
                    NEW.mou_id,
                    NEW.id,
                    NULL,
                    NULL,
                    jsonb_build_object('progress', 100),
                    'normal',
                    format('/mous/%s/deliverables/%s', NEW.mou_id, NEW.id)
                );
            END IF;
        END IF;
    END IF;

    -- Notify on overdue
    IF NEW.status = 'delayed' AND (TG_OP = 'INSERT' OR OLD.status != 'delayed') THEN
        IF NEW.responsible_party_type = 'internal' AND NEW.responsible_user_id IS NOT NULL THEN
            SELECT * INTO v_prefs
            FROM public.mou_notification_preferences
            WHERE user_id = NEW.responsible_user_id;

            IF v_prefs IS NULL OR v_prefs.deliverable_overdue_enabled THEN
                PERFORM public.queue_mou_notification(
                    NEW.responsible_user_id,
                    'deliverable_overdue'::public.mou_notification_type,
                    format('Deliverable overdue: %s', NEW.title_en),
                    format('تسليم متأخر: %s', NEW.title_ar),
                    format('The deliverable "%s" for MoU "%s" is now overdue (was due %s).',
                        NEW.title_en, v_mou.title, NEW.due_date),
                    format('التسليم "%s" لمذكرة التفاهم "%s" متأخر الآن (كان مستحقاً في %s).',
                        NEW.title_ar, COALESCE(v_mou.title_ar, v_mou.title), NEW.due_date),
                    NEW.mou_id,
                    NEW.id,
                    NULL,
                    NULL,
                    jsonb_build_object('due_date', NEW.due_date, 'progress', NEW.progress),
                    'high',
                    format('/mous/%s/deliverables/%s', NEW.mou_id, NEW.id)
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deliverable_status_notifications
    AFTER INSERT OR UPDATE OF status ON public.mou_deliverables
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_deliverable_status_change_notifications();

-- ===========================================
-- TRIGGER: Milestone Completion Notifications
-- ===========================================

CREATE OR REPLACE FUNCTION public.trigger_milestone_completion_notifications()
RETURNS TRIGGER AS $$
DECLARE
    v_deliverable RECORD;
    v_mou RECORD;
    v_prefs RECORD;
BEGIN
    -- Only notify on completion
    IF NEW.status != 'completed' OR (TG_OP = 'UPDATE' AND OLD.status = 'completed') THEN
        RETURN NEW;
    END IF;

    -- Get deliverable and MoU details
    SELECT d.*, m.id as mou_id, m.title as mou_title, m.title_ar as mou_title_ar, m.created_by as mou_created_by
    INTO v_deliverable
    FROM public.mou_deliverables d
    JOIN public.mous m ON d.mou_id = m.id
    WHERE d.id = NEW.deliverable_id;

    -- Notify responsible user
    IF v_deliverable.responsible_party_type = 'internal' AND v_deliverable.responsible_user_id IS NOT NULL THEN
        SELECT * INTO v_prefs
        FROM public.mou_notification_preferences
        WHERE user_id = v_deliverable.responsible_user_id;

        IF v_prefs IS NULL OR v_prefs.milestone_completed_enabled THEN
            PERFORM public.queue_mou_notification(
                v_deliverable.responsible_user_id,
                'milestone_completed'::public.mou_notification_type,
                format('Milestone completed: %s', NEW.title_en),
                format('تم إكمال المعلم: %s', NEW.title_ar),
                format('Milestone "%s" for deliverable "%s" has been completed.',
                    NEW.title_en, v_deliverable.title_en),
                format('تم إكمال المعلم "%s" للتسليم "%s".',
                    NEW.title_ar, v_deliverable.title_ar),
                v_deliverable.mou_id,
                NEW.deliverable_id,
                NEW.id,
                NULL,
                jsonb_build_object('weight', NEW.weight),
                'normal',
                format('/mous/%s/deliverables/%s', v_deliverable.mou_id, NEW.deliverable_id)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_milestone_completion_notifications
    AFTER INSERT OR UPDATE OF status ON public.deliverable_milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_milestone_completion_notifications();

-- ===========================================
-- TRIGGER: MoU Workflow State Change Notifications
-- ===========================================

CREATE OR REPLACE FUNCTION public.trigger_mou_workflow_state_notifications()
RETURNS TRIGGER AS $$
DECLARE
    v_prefs RECORD;
    v_old_state TEXT;
    v_new_state TEXT;
BEGIN
    -- Skip if lifecycle_state didn't change
    IF TG_OP = 'UPDATE' AND OLD.lifecycle_state = NEW.lifecycle_state THEN
        RETURN NEW;
    END IF;

    v_old_state := COALESCE(OLD.lifecycle_state, 'new');
    v_new_state := NEW.lifecycle_state;

    -- Notify MoU creator
    IF NEW.created_by IS NOT NULL THEN
        SELECT * INTO v_prefs
        FROM public.mou_notification_preferences
        WHERE user_id = NEW.created_by;

        IF v_prefs IS NULL OR v_prefs.workflow_state_change_enabled THEN
            PERFORM public.queue_mou_notification(
                NEW.created_by,
                'workflow_state_change'::public.mou_notification_type,
                format('MoU status changed: %s', NEW.title),
                format('تغير حالة مذكرة التفاهم: %s', COALESCE(NEW.title_ar, NEW.title)),
                format('MoU "%s" status changed from %s to %s.',
                    NEW.title, v_old_state, v_new_state),
                format('تغيرت حالة مذكرة التفاهم "%s" من %s إلى %s.',
                    COALESCE(NEW.title_ar, NEW.title), v_old_state, v_new_state),
                NEW.id,
                NULL,
                NULL,
                NULL,
                jsonb_build_object('old_state', v_old_state, 'new_state', v_new_state),
                CASE
                    WHEN v_new_state IN ('expired', 'terminated') THEN 'high'
                    WHEN v_new_state = 'active' THEN 'normal'
                    ELSE 'normal'
                END,
                format('/mous/%s', NEW.id)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mou_workflow_state_notifications
    AFTER INSERT OR UPDATE OF lifecycle_state ON public.mous
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_mou_workflow_state_notifications();

-- ===========================================
-- TRIGGER: Renewal Status Notifications
-- ===========================================

CREATE OR REPLACE FUNCTION public.trigger_renewal_status_notifications()
RETURNS TRIGGER AS $$
DECLARE
    v_mou RECORD;
    v_prefs RECORD;
    v_notification_type public.mou_notification_type;
    v_title_en TEXT;
    v_title_ar TEXT;
    v_message_en TEXT;
    v_message_ar TEXT;
    v_priority TEXT := 'normal';
BEGIN
    -- Skip if status didn't change
    IF TG_OP = 'UPDATE' AND OLD.renewal_status = NEW.renewal_status THEN
        RETURN NEW;
    END IF;

    -- Get MoU details
    SELECT * INTO v_mou
    FROM public.mous
    WHERE id = NEW.original_mou_id;

    -- Determine notification type and content
    CASE NEW.renewal_status
        WHEN 'initiated' THEN
            v_notification_type := 'renewal_initiated';
            v_title_en := format('Renewal initiated: %s', v_mou.title);
            v_title_ar := format('بدأ التجديد: %s', COALESCE(v_mou.title_ar, v_mou.title));
            v_message_en := format('Renewal process has been initiated for MoU "%s". Original expiry: %s.',
                v_mou.title, NEW.original_expiry_date);
            v_message_ar := format('تم بدء عملية التجديد لمذكرة التفاهم "%s". تاريخ الانتهاء الأصلي: %s.',
                COALESCE(v_mou.title_ar, v_mou.title), NEW.original_expiry_date);
        WHEN 'approved' THEN
            v_notification_type := 'renewal_approved';
            v_title_en := format('Renewal approved: %s', v_mou.title);
            v_title_ar := format('تمت الموافقة على التجديد: %s', COALESCE(v_mou.title_ar, v_mou.title));
            v_message_en := format('Renewal for MoU "%s" has been approved. New expiry: %s.',
                v_mou.title, COALESCE(NEW.proposed_new_expiry_date, 'TBD'));
            v_message_ar := format('تمت الموافقة على تجديد مذكرة التفاهم "%s". تاريخ الانتهاء الجديد: %s.',
                COALESCE(v_mou.title_ar, v_mou.title), COALESCE(NEW.proposed_new_expiry_date::TEXT, 'سيتم تحديده'));
            v_priority := 'high';
        WHEN 'completed' THEN
            v_notification_type := 'renewal_completed';
            v_title_en := format('Renewal completed: %s', v_mou.title);
            v_title_ar := format('اكتمل التجديد: %s', COALESCE(v_mou.title_ar, v_mou.title));
            v_message_en := format('MoU "%s" has been successfully renewed. New expiry: %s.',
                v_mou.title, NEW.final_new_expiry_date);
            v_message_ar := format('تم تجديد مذكرة التفاهم "%s" بنجاح. تاريخ الانتهاء الجديد: %s.',
                COALESCE(v_mou.title_ar, v_mou.title), NEW.final_new_expiry_date);
            v_priority := 'high';
        ELSE
            RETURN NEW;
    END CASE;

    -- Notify MoU creator
    IF v_mou.created_by IS NOT NULL THEN
        SELECT * INTO v_prefs
        FROM public.mou_notification_preferences
        WHERE user_id = v_mou.created_by;

        IF v_prefs IS NULL OR (
            (v_notification_type = 'renewal_initiated' AND v_prefs.renewal_initiated_enabled) OR
            (v_notification_type = 'renewal_approved' AND v_prefs.renewal_approved_enabled) OR
            (v_notification_type = 'renewal_completed' AND v_prefs.renewal_completed_enabled)
        ) THEN
            PERFORM public.queue_mou_notification(
                v_mou.created_by,
                v_notification_type,
                v_title_en,
                v_title_ar,
                v_message_en,
                v_message_ar,
                NEW.original_mou_id,
                NULL,
                NULL,
                NEW.id,
                jsonb_build_object(
                    'renewal_status', NEW.renewal_status,
                    'original_expiry_date', NEW.original_expiry_date,
                    'proposed_new_expiry_date', NEW.proposed_new_expiry_date
                ),
                v_priority,
                format('/mous/%s/renewals/%s', NEW.original_mou_id, NEW.id)
            );
        END IF;
    END IF;

    -- Notify initiator if different
    IF NEW.initiated_by IS NOT NULL AND NEW.initiated_by != v_mou.created_by THEN
        SELECT * INTO v_prefs
        FROM public.mou_notification_preferences
        WHERE user_id = NEW.initiated_by;

        IF v_prefs IS NULL OR (
            (v_notification_type = 'renewal_approved' AND v_prefs.renewal_approved_enabled) OR
            (v_notification_type = 'renewal_completed' AND v_prefs.renewal_completed_enabled)
        ) THEN
            PERFORM public.queue_mou_notification(
                NEW.initiated_by,
                v_notification_type,
                v_title_en,
                v_title_ar,
                v_message_en,
                v_message_ar,
                NEW.original_mou_id,
                NULL,
                NULL,
                NEW.id,
                jsonb_build_object('renewal_status', NEW.renewal_status),
                v_priority,
                format('/mous/%s/renewals/%s', NEW.original_mou_id, NEW.id)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_renewal_status_notifications
    AFTER INSERT OR UPDATE OF renewal_status ON public.mou_renewals
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_renewal_status_notifications();

-- ===========================================
-- FUNCTION: Check and Create Due Notifications (Scheduled Job)
-- ===========================================

CREATE OR REPLACE FUNCTION public.check_mou_deliverable_due_dates()
RETURNS TABLE (
    notifications_queued INTEGER,
    deliverables_checked INTEGER
) AS $$
DECLARE
    v_queued INTEGER := 0;
    v_checked INTEGER := 0;
    v_deliverable RECORD;
    v_mou RECORD;
    v_prefs RECORD;
    v_days_until_due INTEGER;
BEGIN
    -- Check all pending/in_progress deliverables
    FOR v_deliverable IN
        SELECT d.*, m.id as mou_id, m.title as mou_title, m.title_ar as mou_title_ar, m.created_by as mou_created_by
        FROM public.mou_deliverables d
        JOIN public.mous m ON d.mou_id = m.id
        WHERE d.status IN ('pending', 'in_progress')
        AND d.due_date >= CURRENT_DATE
        AND d.due_date <= CURRENT_DATE + INTERVAL '90 days'
    LOOP
        v_checked := v_checked + 1;
        v_days_until_due := (v_deliverable.due_date - CURRENT_DATE);

        -- Check responsible user
        IF v_deliverable.responsible_party_type = 'internal' AND v_deliverable.responsible_user_id IS NOT NULL THEN
            SELECT * INTO v_prefs
            FROM public.mou_notification_preferences
            WHERE user_id = v_deliverable.responsible_user_id;

            IF v_prefs IS NOT NULL AND v_prefs.deliverable_due_soon_enabled AND v_days_until_due = ANY(v_prefs.deliverable_due_soon_days) THEN
                -- Check if we already sent this notification today
                IF NOT EXISTS (
                    SELECT 1 FROM public.mou_notification_queue
                    WHERE deliverable_id = v_deliverable.id
                    AND notification_type = 'deliverable_due_soon'
                    AND user_id = v_deliverable.responsible_user_id
                    AND created_at::date = CURRENT_DATE
                ) THEN
                    PERFORM public.queue_mou_notification(
                        v_deliverable.responsible_user_id,
                        'deliverable_due_soon'::public.mou_notification_type,
                        format('Deliverable due in %s days: %s', v_days_until_due, v_deliverable.title_en),
                        format('تسليم مستحق خلال %s أيام: %s', v_days_until_due, v_deliverable.title_ar),
                        format('The deliverable "%s" for MoU "%s" is due on %s.',
                            v_deliverable.title_en, v_deliverable.mou_title, v_deliverable.due_date),
                        format('التسليم "%s" لمذكرة التفاهم "%s" مستحق في %s.',
                            v_deliverable.title_ar, COALESCE(v_deliverable.mou_title_ar, v_deliverable.mou_title), v_deliverable.due_date),
                        v_deliverable.mou_id,
                        v_deliverable.id,
                        NULL,
                        NULL,
                        jsonb_build_object('days_until_due', v_days_until_due, 'progress', v_deliverable.progress),
                        CASE WHEN v_days_until_due <= 1 THEN 'urgent' WHEN v_days_until_due <= 3 THEN 'high' ELSE 'normal' END,
                        format('/mous/%s/deliverables/%s', v_deliverable.mou_id, v_deliverable.id)
                    );
                    v_queued := v_queued + 1;
                END IF;
            END IF;
        END IF;
    END LOOP;

    RETURN QUERY SELECT v_queued, v_checked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- FUNCTION: Get User MoU Notifications Summary
-- ===========================================

CREATE OR REPLACE FUNCTION public.get_user_mou_notification_summary(p_user_id UUID)
RETURNS TABLE (
    pending_notifications INTEGER,
    unread_notifications INTEGER,
    notifications_today INTEGER,
    notifications_this_week INTEGER,
    deliverables_due_soon INTEGER,
    overdue_deliverables INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INTEGER FROM public.mou_notification_queue
         WHERE user_id = p_user_id AND status = 'pending'),
        (SELECT COUNT(*)::INTEGER FROM public.mou_notification_log l
         JOIN public.notifications n ON l.queue_id::TEXT = n.source_id::TEXT
         WHERE l.user_id = p_user_id AND n.read = FALSE),
        (SELECT COUNT(*)::INTEGER FROM public.mou_notification_log
         WHERE user_id = p_user_id AND sent_at::date = CURRENT_DATE),
        (SELECT COUNT(*)::INTEGER FROM public.mou_notification_log
         WHERE user_id = p_user_id AND sent_at >= CURRENT_DATE - INTERVAL '7 days'),
        (SELECT COUNT(*)::INTEGER FROM public.mou_deliverables d
         JOIN public.mous m ON d.mou_id = m.id
         WHERE (d.responsible_user_id = p_user_id OR m.created_by = p_user_id)
         AND d.status IN ('pending', 'in_progress')
         AND d.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'),
        (SELECT COUNT(*)::INTEGER FROM public.mou_deliverables d
         JOIN public.mous m ON d.mou_id = m.id
         WHERE (d.responsible_user_id = p_user_id OR m.created_by = p_user_id)
         AND d.status = 'delayed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.mou_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mou_notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mou_notification_log ENABLE ROW LEVEL SECURITY;

-- Preferences: Users manage their own
CREATE POLICY "Users can view own MoU notification preferences"
    ON public.mou_notification_preferences FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own MoU notification preferences"
    ON public.mou_notification_preferences FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own MoU notification preferences"
    ON public.mou_notification_preferences FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Queue: Users see their own, system manages
CREATE POLICY "Users can view own notification queue"
    ON public.mou_notification_queue FOR SELECT
    USING (user_id = auth.uid());

-- Log: Users see their own
CREATE POLICY "Users can view own notification log"
    ON public.mou_notification_log FOR SELECT
    USING (user_id = auth.uid());

-- ===========================================
-- GRANTS
-- ===========================================

GRANT SELECT, INSERT, UPDATE ON public.mou_notification_preferences TO authenticated;
GRANT SELECT ON public.mou_notification_queue TO authenticated;
GRANT SELECT ON public.mou_notification_log TO authenticated;

GRANT ALL ON public.mou_notification_preferences TO service_role;
GRANT ALL ON public.mou_notification_queue TO service_role;
GRANT ALL ON public.mou_notification_log TO service_role;

GRANT EXECUTE ON FUNCTION public.queue_mou_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_mou_notification_queue TO service_role;
GRANT EXECUTE ON FUNCTION public.check_mou_deliverable_due_dates TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_mou_notification_summary TO authenticated;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE public.mou_notification_preferences IS 'User-specific notification preferences for MoU events including batching and quiet hours';
COMMENT ON TABLE public.mou_notification_queue IS 'Queue for MoU notifications with batching support';
COMMENT ON TABLE public.mou_notification_log IS 'Log of sent MoU notifications for analytics';

COMMENT ON FUNCTION public.queue_mou_notification IS 'Queues an MoU notification respecting user preferences and batching';
COMMENT ON FUNCTION public.process_mou_notification_queue IS 'Processes pending notifications from the queue (called by scheduled job)';
COMMENT ON FUNCTION public.check_mou_deliverable_due_dates IS 'Checks deliverable due dates and queues notifications (scheduled job)';
COMMENT ON FUNCTION public.get_user_mou_notification_summary IS 'Returns notification summary for a user';
