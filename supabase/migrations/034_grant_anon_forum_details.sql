-- 034_grant_anon_forum_details.sql
-- Allow unauthenticated reads of forum_details view (subject to base table RLS)

BEGIN;
GRANT SELECT ON public.forum_details TO anon;
COMMIT;

