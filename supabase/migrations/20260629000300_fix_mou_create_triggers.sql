-- MoU create-flow rebuild (1/3): fix the two AFTER-INSERT trigger functions.
--
-- 1) `trigger_mou_workflow_state_notifications` crashed on every INSERT:
--    `COALESCE(OLD.lifecycle_state, 'new')` makes COALESCE cast the text 'new' to the
--    `mou_state` enum (OLD.lifecycle_state is the enum), which is not a valid label → 22P02.
--    Cast the enum to ::text first so 'new' stays text.
--
-- 2) Both this trigger (→ queue_mou_notification → notification queue) and
--    `create_mou_expiration_alerts` (→ mou_expiration_alerts) ran SECURITY INVOKER and
--    insert into RLS-gated infra tables, so the JWT-scoped edge-fn create path is denied.
--    Recreate both SECURITY DEFINER with a pinned search_path (mirrors the dossiers fix).

CREATE OR REPLACE FUNCTION public.trigger_mou_workflow_state_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
    v_prefs RECORD;
    v_old_state TEXT;
    v_new_state TEXT;
BEGIN
    -- Skip if lifecycle_state didn't change
    IF TG_OP = 'UPDATE' AND OLD.lifecycle_state = NEW.lifecycle_state THEN
        RETURN NEW;
    END IF;

    v_old_state := COALESCE(OLD.lifecycle_state::text, 'new');
    v_new_state := NEW.lifecycle_state::text;

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
$function$;

CREATE OR REPLACE FUNCTION public.create_mou_expiration_alerts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
    v_expiry_date DATE;
    v_created_by UUID;
    v_days_arr INTEGER[] := ARRAY[90, 60, 30, 7];
    v_day INTEGER;
    v_alert_type public.alert_type;
    v_scheduled_date DATE;
    v_message_en TEXT;
    v_message_ar TEXT;
    v_mou_title_en TEXT;
    v_mou_title_ar TEXT;
BEGIN
    -- Only create alerts when MoU becomes active or signed
    IF NEW.lifecycle_state IN ('active', 'signed') AND (OLD.lifecycle_state IS NULL OR OLD.lifecycle_state NOT IN ('active', 'signed')) THEN
        v_expiry_date := NEW.expiry_date;
        v_created_by := NEW.created_by;
        v_mou_title_en := NEW.title;
        v_mou_title_ar := COALESCE(NEW.title_ar, NEW.title);

        IF v_expiry_date IS NULL THEN
            RETURN NEW;
        END IF;

        FOREACH v_day IN ARRAY v_days_arr
        LOOP
            v_scheduled_date := v_expiry_date - (v_day || ' days')::INTERVAL;

            IF v_scheduled_date <= CURRENT_DATE THEN
                CONTINUE;
            END IF;

            v_alert_type := CASE v_day
                WHEN 90 THEN 'expiration_90_days'::public.alert_type
                WHEN 60 THEN 'expiration_60_days'::public.alert_type
                WHEN 30 THEN 'expiration_30_days'::public.alert_type
                WHEN 7 THEN 'expiration_7_days'::public.alert_type
            END;

            v_message_en := format('MoU "%s" will expire in %s days on %s. Please initiate renewal process if required.',
                v_mou_title_en, v_day, to_char(v_expiry_date, 'YYYY-MM-DD'));
            v_message_ar := format('مذكرة التفاهم "%s" ستنتهي خلال %s يوم في %s. يرجى بدء عملية التجديد إذا لزم الأمر.',
                v_mou_title_ar, v_day, to_char(v_expiry_date, 'YYYY-MM-DD'));

            INSERT INTO public.mou_expiration_alerts (
                mou_id, alert_type, scheduled_for, message_en, message_ar, recipient_ids
            ) VALUES (
                NEW.id, v_alert_type, v_scheduled_date, v_message_en, v_message_ar, ARRAY[v_created_by]
            )
            ON CONFLICT (mou_id, alert_type) DO UPDATE SET
                scheduled_for = EXCLUDED.scheduled_for,
                message_en = EXCLUDED.message_en,
                message_ar = EXCLUDED.message_ar,
                alert_status = 'pending',
                sent_at = NULL,
                updated_at = now();
        END LOOP;
    END IF;

    RETURN NEW;
END;
$function$;
