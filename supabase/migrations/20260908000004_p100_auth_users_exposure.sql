-- Remove client-reachable auth.users dependencies without breaking the
-- authenticated edge-function caller of entity_comments_with_details.

CREATE OR REPLACE VIEW public.entity_comments_with_details AS
SELECT
  ec.id,
  ec.entity_type,
  ec.entity_id,
  ec.parent_id,
  ec.thread_root_id,
  ec.thread_depth,
  ec.content,
  ec.content_html,
  ec.visibility,
  ec.is_edited,
  ec.edited_at,
  ec.edit_count,
  ec.created_at,
  ec.updated_at,
  ec.author_id,
  u.email::character varying(255) AS author_email,
  u.full_name AS author_name,
  u.avatar_url AS author_avatar,
  get_entity_comment_reply_count(ec.id) AS reply_count,
  get_entity_comment_reactions_summary(ec.id) AS reactions,
  (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', cm.id,
          'user_id', cm.mentioned_user_id,
          'username', um.username,
          'name', um.full_name,
          'start_position', cm.start_position,
          'end_position', cm.end_position
        )
      ),
      '[]'::jsonb
    )
    FROM public.entity_comment_mentions cm
    JOIN public.users um ON um.id = cm.mentioned_user_id
    WHERE cm.comment_id = ec.id
  ) AS mentions
FROM public.entity_comments ec
JOIN public.users u ON u.id = ec.author_id
WHERE ec.is_deleted = false;

ALTER VIEW public.entity_comments_with_details
  SET (security_invoker = true);

REVOKE ALL ON public.upcoming_milestones FROM anon, authenticated;
