-- get_engagement_briefs RETURNS TABLE(... title text, summary text ...) but the
-- engagement_briefs VIEW exposes title/summary as character varying (briefs.title
-- is varchar). The mismatch raised 42804 ("structure of query does not match
-- function result type") and made every engagement-briefs list call return 500.
-- Cast the varchar columns to text to match the declared return type.
CREATE OR REPLACE FUNCTION public.get_engagement_briefs(p_engagement_id uuid)
 RETURNS TABLE(
   id uuid, brief_type text, title text, summary text, status text, source text,
   created_at timestamp with time zone, completed_at timestamp with time zone,
   created_by uuid, has_citations boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    eb.id,
    eb.brief_type::text,
    COALESCE(eb.title_en, eb.title_ar)::text AS title,
    COALESCE(eb.summary_en, eb.summary_ar)::text AS summary,
    eb.status::text,
    eb.source::text,
    eb.created_at,
    eb.completed_at,
    eb.created_by,
    (eb.citations IS NOT NULL AND eb.citations != '[]'::JSONB) AS has_citations
  FROM engagement_briefs eb
  WHERE eb.engagement_dossier_id = p_engagement_id
  ORDER BY eb.created_at DESC;
END;
$function$;
