-- Phase 70: fix create_categorized_notification enum casts.
--
-- The shared v4.0 notification RPC inserted p_type (text) into notifications.type
-- (notification_type enum) and p_priority (text) into notifications.priority
-- (notification_priority enum) without casts, so every call threw
-- "column type is of type notification_type but expression is of type text".
-- This blocked the intelligence in_app channel (in-app-adapter → enqueueNotification
-- → processNotificationJob → this RPC) and any other caller. Add schema-qualified
-- enum casts. Signature and SECURITY DEFINER preserved exactly.
CREATE OR REPLACE FUNCTION public.create_categorized_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_category notification_category DEFAULT 'system'::notification_category,
  p_data jsonb DEFAULT '{}'::jsonb,
  p_priority text DEFAULT 'normal'::text,
  p_action_url text DEFAULT NULL::text,
  p_source_type text DEFAULT NULL::text,
  p_source_id uuid DEFAULT NULL::uuid,
  p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id, type, title, message, category, data,
        priority, action_url, source_type, source_id, expires_at
    ) VALUES (
        p_user_id, p_type::public.notification_type, p_title, p_message, p_category, p_data,
        p_priority::public.notification_priority, p_action_url, p_source_type, p_source_id, p_expires_at
    ) RETURNING id INTO v_notification_id;
    RETURN v_notification_id;
END;
$function$;
