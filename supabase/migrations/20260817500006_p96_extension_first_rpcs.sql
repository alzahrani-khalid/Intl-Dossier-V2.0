-- Phase 96 / COUNT-02 — the three extension-first list RPCs become dossier-first.
--
-- Authority: RULING-P96-03 (.tickmarkr/overseer/RULING-P96-03-SIXTH-MIGRATION.md), which
-- authorizes exactly this one migration carrying exactly the three CREATE OR REPLACE
-- statements specified by BLOCK-96-10-01 in 96-10-SUMMARY.md. Nothing else rides here.
--
-- Defect: each function read `FROM <extension> JOIN dossiers`, so a dossier with no extension
-- row was silently excluded from its own type list while the hub counted it
-- (persons: 15 rows above pagination.total 16; engagements: 3 of 5).
--
-- Change, per statement — FROM clause, id source, ORDER BY null placement, and the
-- correlated-subquery id re-points ONLY. Every signature, RETURNS TABLE column list, filter
-- and SECURITY/volatility marker is preserved verbatim from live prosrc.
--
-- Deliberate semantics: with a LEFT JOIN, an ACTIVE filter on an extension column
-- (p_organization_id, p_engagement_type, p_wg_type, …) still excludes extension-less rows —
-- correct: a filter on a fact the row does not have cannot match it.

-- 1. search_persons_advanced — FROM dossiers d LEFT JOIN persons p ON p.id = d.id
CREATE OR REPLACE FUNCTION public.search_persons_advanced(p_search_term text DEFAULT NULL::text, p_organization_id uuid DEFAULT NULL::uuid, p_nationality_id uuid DEFAULT NULL::uuid, p_importance_level integer DEFAULT NULL::integer, p_person_subtype text DEFAULT NULL::text, p_office_type text DEFAULT NULL::text, p_country_id uuid DEFAULT NULL::uuid, p_party text DEFAULT NULL::text, p_is_current_term boolean DEFAULT NULL::boolean, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, name_en text, name_ar text, title_en text, title_ar text, photo_url text, organization_id uuid, organization_name text, importance_level integer, email text, phone text, person_subtype text, office_name_en text, office_type text, party_en text, district_en text, country_name_en text, is_current_term boolean)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name_en,
    d.name_ar,
    p.title_en,
    p.title_ar,
    p.photo_url,
    p.organization_id,
    org_d.name_en as organization_name,
    p.importance_level,
    p.email,
    p.phone,
    p.person_subtype,
    p.office_name_en,
    p.office_type,
    p.party_en,
    p.district_en,
    c_d.name_en as country_name_en,
    p.is_current_term
  FROM dossiers d
  LEFT JOIN persons p ON p.id = d.id
  LEFT JOIN dossiers org_d ON org_d.id = p.organization_id
  LEFT JOIN countries c ON c.id = p.country_id
  LEFT JOIN dossiers c_d ON c_d.id = c.id
  WHERE d.status != 'archived'
    AND d.type = 'person'
    AND (p_search_term IS NULL OR (
      d.name_en ILIKE '%' || p_search_term || '%'
      OR d.name_ar ILIKE '%' || p_search_term || '%'
      OR p.title_en ILIKE '%' || p_search_term || '%'
      OR p.email ILIKE '%' || p_search_term || '%'
      OR p.office_name_en ILIKE '%' || p_search_term || '%'
      OR p.party_en ILIKE '%' || p_search_term || '%'
      OR p.district_en ILIKE '%' || p_search_term || '%'
    ))
    AND (p_organization_id IS NULL OR p.organization_id = p_organization_id)
    AND (p_nationality_id IS NULL OR p.nationality_country_id = p_nationality_id)
    AND (p_importance_level IS NULL OR p.importance_level >= p_importance_level)
    AND (p_person_subtype IS NULL OR p.person_subtype = p_person_subtype)
    AND (p_office_type IS NULL OR p.office_type = p_office_type)
    AND (p_country_id IS NULL OR p.country_id = p_country_id)
    AND (p_party IS NULL OR p.party_en ILIKE '%' || p_party || '%')
    AND (p_is_current_term IS NULL OR p.is_current_term = p_is_current_term)
  ORDER BY p.importance_level DESC NULLS LAST, d.name_en
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- 2. search_engagements_advanced — FROM dossiers d LEFT JOIN engagement_dossiers ed ON ed.id = d.id
CREATE OR REPLACE FUNCTION public.search_engagements_advanced(p_search_term text DEFAULT NULL::text, p_engagement_type text DEFAULT NULL::text, p_engagement_category text DEFAULT NULL::text, p_engagement_status text DEFAULT NULL::text, p_host_country_id uuid DEFAULT NULL::uuid, p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_engagement_types text[] DEFAULT NULL::text[])
 RETURNS TABLE(id uuid, name_en text, name_ar text, engagement_type text, engagement_category text, engagement_status text, start_date timestamp with time zone, end_date timestamp with time zone, location_en text, location_ar text, is_virtual boolean, host_country_id uuid, host_country_name_en text, host_country_name_ar text, participant_count bigint)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name_en,
    d.name_ar,
    ed.engagement_type,
    ed.engagement_category,
    ed.engagement_status,
    ed.start_date,
    ed.end_date,
    ed.location_en,
    ed.location_ar,
    ed.is_virtual,
    ed.host_country_id,
    hc.name_en as host_country_name_en,
    hc.name_ar as host_country_name_ar,
    (SELECT COUNT(*) FROM engagement_participants ep WHERE ep.engagement_id = d.id) as participant_count
  FROM dossiers d
  LEFT JOIN engagement_dossiers ed ON ed.id = d.id
  LEFT JOIN dossiers hc ON hc.id = ed.host_country_id
  WHERE d.status != 'archived'
    AND d.type = 'engagement'
    AND (p_search_term IS NULL OR (
      d.name_en ILIKE '%' || p_search_term || '%'
      OR d.name_ar ILIKE '%' || p_search_term || '%'
      OR ed.location_en ILIKE '%' || p_search_term || '%'
      OR ed.objectives_en ILIKE '%' || p_search_term || '%'
    ))
    AND (p_engagement_type IS NULL OR ed.engagement_type = p_engagement_type)
    AND (p_engagement_types IS NULL OR ed.engagement_type = ANY(p_engagement_types))
    AND (p_engagement_category IS NULL OR ed.engagement_category = p_engagement_category)
    AND (p_engagement_status IS NULL OR ed.engagement_status = p_engagement_status)
    AND (p_host_country_id IS NULL OR ed.host_country_id = p_host_country_id)
    AND (p_start_date IS NULL OR ed.start_date >= p_start_date)
    AND (p_end_date IS NULL OR ed.end_date <= p_end_date)
  ORDER BY ed.start_date DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- 3. search_working_groups — FROM dossiers d LEFT JOIN working_groups wg ON wg.id = d.id
CREATE OR REPLACE FUNCTION public.search_working_groups(p_search_term text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_wg_type text DEFAULT NULL::text, p_parent_forum_id uuid DEFAULT NULL::uuid, p_lead_org_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, name_en text, name_ar text, summary_en text, summary_ar text, status text, wg_status text, wg_type text, parent_forum_id uuid, lead_org_id uuid, lead_org_name_en text, lead_org_name_ar text, established_date date, meeting_frequency text, active_member_count bigint, total_deliverables bigint, next_meeting_date timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name_en,
    d.name_ar,
    d.description_en AS summary_en,
    d.description_ar AS summary_ar,
    d.status,
    wg.wg_status,
    wg.wg_type,
    wg.parent_forum_id,
    wg.lead_org_id,
    lead_org_d.name_en AS lead_org_name_en,
    lead_org_d.name_ar AS lead_org_name_ar,
    wg.established_date,
    wg.meeting_frequency,
    (SELECT COUNT(*) FROM working_group_members m WHERE m.working_group_id = d.id AND m.status = 'active') AS active_member_count,
    (SELECT COUNT(*) FROM working_group_deliverables del WHERE del.working_group_id = d.id) AS total_deliverables,
    (SELECT MIN(meeting_date) FROM working_group_meetings mtg WHERE mtg.working_group_id = d.id AND mtg.meeting_date > NOW() AND mtg.status = 'scheduled') AS next_meeting_date,
    d.created_at,
    d.updated_at
  FROM dossiers d
  LEFT JOIN working_groups wg ON wg.id = d.id
  LEFT JOIN organizations lead_org ON lead_org.id = wg.lead_org_id
  LEFT JOIN dossiers lead_org_d ON lead_org_d.id = lead_org.id
  WHERE d.type = 'working_group'
    AND d.status NOT IN ('archived', 'deleted')
    AND (p_search_term IS NULL OR (
      d.name_en ILIKE '%' || p_search_term || '%' OR
      d.name_ar ILIKE '%' || p_search_term || '%' OR
      d.description_en ILIKE '%' || p_search_term || '%' OR
      wg.mandate_en ILIKE '%' || p_search_term || '%'
    ))
    AND (p_status IS NULL OR d.status = p_status)
    AND (p_wg_type IS NULL OR wg.wg_type = p_wg_type)
    AND (p_parent_forum_id IS NULL OR wg.parent_forum_id = p_parent_forum_id)
    AND (p_lead_org_id IS NULL OR wg.lead_org_id = p_lead_org_id)
  ORDER BY d.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;
