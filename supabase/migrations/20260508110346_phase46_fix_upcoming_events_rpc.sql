-- =============================================================================
-- Phase 46: Fix dashboard upcoming-events RPC against live staging schema
--
-- Phase 45 added VIP person metadata to get_upcoming_events, but the function
-- still referenced obsolete dossier_members and calendar_entries columns.
-- The dashboard widgets depend on this RPC for WeekAhead and VipVisits.
-- =============================================================================

DROP FUNCTION IF EXISTS get_upcoming_events(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_upcoming_events(
  p_user_id UUID DEFAULT NULL,
  p_days_ahead INTEGER DEFAULT 14
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  title_ar TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  event_type TEXT,
  engagement_id UUID,
  engagement_name TEXT,
  engagement_name_ar TEXT,
  lifecycle_stage TEXT,
  person_id UUID,
  person_name TEXT,
  person_name_ar TEXT,
  person_role TEXT,
  person_iso TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Engagement dossiers with upcoming start dates.
  RETURN QUERY
  SELECT
    ed.id,
    d.name_en AS title,
    d.name_ar AS title_ar,
    ed.start_date,
    ed.end_date,
    ed.engagement_type::TEXT AS event_type,
    ed.id AS engagement_id,
    d.name_en AS engagement_name,
    d.name_ar AS engagement_name_ar,
    ed.lifecycle_stage::TEXT,
    vip_person.person_id,
    vip_person.person_name,
    vip_person.person_name_ar,
    vip_person.person_role,
    vip_person.person_iso
  FROM engagement_dossiers ed
  JOIN dossiers d ON d.id = ed.id
  LEFT JOIN LATERAL (
    SELECT
      p.id AS person_id,
      pd.name_en AS person_name,
      pd.name_ar AS person_name_ar,
      COALESCE(NULLIF(p.title_en, ''), NULLIF(ep.external_title_en, ''), ep.role) AS person_role,
      COALESCE(nationality.iso_code_2::TEXT, represented.iso_code_2::TEXT) AS person_iso
    FROM engagement_participants ep
    JOIN persons p ON p.id = ep.participant_dossier_id
    JOIN dossiers pd ON pd.id = p.id
    LEFT JOIN countries nationality ON nationality.id = p.nationality_country_id
    LEFT JOIN countries represented ON represented.id = p.country_id
    WHERE ep.engagement_id = ed.id
      AND ep.participant_type = 'person'
      AND ep.role IN ('head_of_delegation', 'guest', 'delegate', 'speaker')
    ORDER BY
      CASE ep.role
        WHEN 'head_of_delegation' THEN 1
        WHEN 'guest' THEN 2
        WHEN 'delegate' THEN 3
        WHEN 'speaker' THEN 4
        ELSE 5
      END,
      ep.created_at ASC
    LIMIT 1
  ) vip_person ON TRUE
  WHERE ed.start_date IS NOT NULL
    AND ed.start_date >= NOW()
    AND ed.start_date <= NOW() + (p_days_ahead || ' days')::INTERVAL
    AND d.status = 'active'
    AND (
      p_user_id IS NULL
      OR d.created_by = p_user_id
      OR EXISTS (
        SELECT 1
        FROM dossier_owners dos
        WHERE dos.dossier_id = ed.id
          AND dos.user_id = p_user_id
      )
    )
  ORDER BY ed.start_date ASC;

  -- Calendar entries within the window. The live schema stores date/time as
  -- separate columns, so normalize them into the RPC's TIMESTAMPTZ contract.
  RETURN QUERY
  SELECT
    ce.id,
    ce.title_en AS title,
    ce.title_ar,
    ((ce.event_date::TIMESTAMP + COALESCE(ce.event_time, TIME '00:00')) AT TIME ZONE 'UTC')
      AS start_date,
    CASE
      WHEN ce.duration_minutes IS NULL THEN NULL::TIMESTAMPTZ
      ELSE (
        ((ce.event_date::TIMESTAMP + COALESCE(ce.event_time, TIME '00:00')) AT TIME ZONE 'UTC')
        + (ce.duration_minutes || ' minutes')::INTERVAL
      )
    END AS end_date,
    ce.entry_type::TEXT AS event_type,
    ce.dossier_id AS engagement_id,
    linked.name_en AS engagement_name,
    linked.name_ar AS engagement_name_ar,
    NULL::TEXT AS lifecycle_stage,
    NULL::UUID AS person_id,
    NULL::TEXT AS person_name,
    NULL::TEXT AS person_name_ar,
    NULL::TEXT AS person_role,
    NULL::TEXT AS person_iso
  FROM calendar_entries ce
  LEFT JOIN dossiers linked ON linked.id = ce.dossier_id
  WHERE ce.event_date IS NOT NULL
    AND ce.event_date >= CURRENT_DATE
    AND ce.event_date <= (NOW() + (p_days_ahead || ' days')::INTERVAL)::DATE
    AND (
      p_user_id IS NULL
      OR ce.organizer_id = p_user_id
      OR ce.created_by = p_user_id
      OR p_user_id = ANY(COALESCE(ce.attendee_ids, ARRAY[]::UUID[]))
    )
  ORDER BY ce.event_date ASC, ce.event_time ASC NULLS FIRST;
END;
$$;

GRANT EXECUTE ON FUNCTION get_upcoming_events(UUID, INTEGER) TO authenticated;
