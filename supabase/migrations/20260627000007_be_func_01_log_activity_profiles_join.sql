-- BE-FUNC-01 (HIGH) — log_activity() joins a non-existent profiles.id.
--
-- 20260110100000_activity_feed_enhanced.sql:250 resolves the actor with
--   LEFT JOIN profiles p ON p.id = u.id ... COALESCE(p.full_name, u.email), p.avatar_url
-- but `profiles` is keyed by `user_id` and has NO `id`, `full_name`, or
-- `avatar_url` column (verified live: profiles = user_id, clearance_level,
-- organization_id, created_at, updated_at). So `p.id` / `p.full_name` /
-- `p.avatar_url` raise "column does not exist" at runtime, failing every
-- log_activity() call.
--
-- Fix: source the display fields from `public.users` (which has id, full_name,
-- avatar_url, email), joined on id = auth.users.id. The signature, SECURITY
-- DEFINER, and all other logic are preserved exactly (CREATE OR REPLACE keeps the
-- same overload).

CREATE OR REPLACE FUNCTION public.log_activity(
    p_action_type text,
    p_entity_type text,
    p_entity_id uuid,
    p_entity_name_en text,
    p_entity_name_ar text DEFAULT NULL::text,
    p_description_en text DEFAULT NULL::text,
    p_description_ar text DEFAULT NULL::text,
    p_related_entity_type text DEFAULT NULL::text,
    p_related_entity_id uuid DEFAULT NULL::uuid,
    p_related_entity_name_en text DEFAULT NULL::text,
    p_related_entity_name_ar text DEFAULT NULL::text,
    p_target_user_id uuid DEFAULT NULL::uuid,
    p_target_user_name text DEFAULT NULL::text,
    p_metadata jsonb DEFAULT '{}'::jsonb,
    p_is_public boolean DEFAULT true,
    p_visibility_scope text DEFAULT 'all'::text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_activity_id UUID;
    v_actor_id UUID;
    v_actor_name TEXT;
    v_actor_email TEXT;
    v_actor_avatar TEXT;
BEGIN
    -- Get current user info
    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to log activity';
    END IF;

    -- Get actor details from public.users (display name + avatar) and auth.users
    -- (authoritative email). profiles holds neither full_name nor avatar_url.
    SELECT
        COALESCE(pu.full_name, u.email) AS name,
        u.email,
        pu.avatar_url
    INTO v_actor_name, v_actor_email, v_actor_avatar
    FROM auth.users u
    LEFT JOIN public.users pu ON pu.id = u.id
    WHERE u.id = v_actor_id;

    -- Generate description if not provided
    IF p_description_en IS NULL THEN
        p_description_en := p_action_type || ' ' || p_entity_type;
    END IF;

    -- Insert activity
    INSERT INTO activity_stream (
        action_type,
        entity_type,
        entity_id,
        entity_name_en,
        entity_name_ar,
        actor_id,
        actor_name,
        actor_email,
        actor_avatar_url,
        description_en,
        description_ar,
        related_entity_type,
        related_entity_id,
        related_entity_name_en,
        related_entity_name_ar,
        target_user_id,
        target_user_name,
        metadata,
        is_public,
        visibility_scope
    ) VALUES (
        p_action_type,
        p_entity_type,
        p_entity_id,
        p_entity_name_en,
        p_entity_name_ar,
        v_actor_id,
        v_actor_name,
        v_actor_email,
        v_actor_avatar,
        p_description_en,
        p_description_ar,
        p_related_entity_type,
        p_related_entity_id,
        p_related_entity_name_en,
        p_related_entity_name_ar,
        p_target_user_id,
        p_target_user_name,
        p_metadata,
        p_is_public,
        p_visibility_scope
    )
    RETURNING id INTO v_activity_id;

    RETURN v_activity_id;
END;
$function$;
