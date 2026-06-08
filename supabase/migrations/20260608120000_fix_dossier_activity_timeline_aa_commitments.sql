-- Migration: Fix dossier_activity_timeline commitment join + add Arabic title
-- Date: 2026-06-08
-- Quick task: 260608-c9b (country-dossier workflow inspection fixes)
--
-- Problem: the view LEFT JOINed the LEGACY `commitments` table (0 rows) for
-- commitment work items. work_item_dossiers links commitments to `aa_commitments`
-- (the canonical work-item commitments table), so commitment activities resolved
-- to NULL title/status/priority/assignee — the Recent Activity card rendered rows
-- with a timestamp but a blank title.
--
-- Fix: re-point the commitment join to `aa_commitments`, sourcing assignee from
-- its `owner_user_id` (the legacy table used a `responsible` JSONB blob). Append
-- `activity_title_ar` (commitment/intake Arabic titles; tasks have none) so the
-- card can render the Arabic title in RTL mode.
--
-- CREATE OR REPLACE preserves the existing column list/order/types and grants;
-- activity_title_ar is appended as the final column (the only permitted change).

CREATE OR REPLACE VIEW public.dossier_activity_timeline AS
SELECT
  wid.id AS link_id,
  wid.work_item_id,
  wid.work_item_type,
  wid.dossier_id,
  wid.inheritance_source,
  wid.inheritance_path,
  wid.created_at AS activity_timestamp,
  COALESCE(t.title, c.title, it.title::character varying) AS activity_title,
  CASE wid.work_item_type
    WHEN 'task'::text THEN t.status::text
    WHEN 'commitment'::text THEN c.status::text
    WHEN 'intake'::text THEN it.status::text
    ELSE NULL::text
  END AS status,
  CASE wid.work_item_type
    WHEN 'task'::text THEN t.priority::text
    WHEN 'commitment'::text THEN c.priority::text
    WHEN 'intake'::text THEN it.priority::text
    ELSE NULL::text
  END AS priority,
  CASE wid.work_item_type
    WHEN 'task'::text THEN t.assignee_id
    WHEN 'commitment'::text THEN c.owner_user_id
    WHEN 'intake'::text THEN it.assigned_to
    ELSE NULL::uuid
  END AS assignee_id,
  CASE wid.work_item_type
    WHEN 'task'::text THEN 'checklist'::text
    WHEN 'commitment'::text THEN 'handshake'::text
    WHEN 'intake'::text THEN 'inbox'::text
    ELSE NULL::text
  END AS icon_type,
  CASE wid.inheritance_source
    WHEN 'direct'::text THEN NULL::text
    WHEN 'engagement'::text THEN 'via Engagement'::text
    WHEN 'after_action'::text THEN 'via After-Action'::text
    WHEN 'position'::text THEN 'via Position'::text
    WHEN 'mou'::text THEN 'via MOU'::text
    ELSE NULL::text
  END AS inheritance_label,
  CASE wid.work_item_type
    WHEN 'commitment'::text THEN c.title_ar
    WHEN 'intake'::text THEN it.title_ar
    ELSE NULL::text
  END AS activity_title_ar
FROM work_item_dossiers wid
  LEFT JOIN tasks t
    ON wid.work_item_type = 'task'::text AND t.id = wid.work_item_id AND t.is_deleted = false
  LEFT JOIN aa_commitments c
    ON wid.work_item_type = 'commitment'::text AND c.id = wid.work_item_id
  LEFT JOIN intake_tickets it
    ON wid.work_item_type = 'intake'::text AND it.id = wid.work_item_id
WHERE wid.deleted_at IS NULL;
