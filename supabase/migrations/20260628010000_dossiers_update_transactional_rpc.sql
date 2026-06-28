-- Dossier update — transactional base + extension write (A-1/A-2 follow-up).
--
-- The dossiers-update edge function previously issued TWO separate writes:
-- UPDATE dossiers (base), then UPSERT the type extension row. A failure on the
-- second write left the base row updated while the function returned a 500 —
-- a torn write. This RPC folds both into ONE statement-group inside the single
-- implicit transaction of a function call, so either both land or neither does.
--
-- SECURITY INVOKER (the default, stated explicitly): the function runs as the
-- CALLER, so the existing RLS on `dossiers` and on every extension table still
-- gates the writes. It must NOT be SECURITY DEFINER (that would bypass RLS).
--
-- Errors are raised with SQLSTATEs the edge function already maps:
--   23505 unique_violation        -> 409 (duplicate name+type)
--   42501 insufficient_privilege  -> 403 (RLS denied the write)
--   P0002 no_data_found           -> 404 (dossier not visible / missing)

CREATE OR REPLACE FUNCTION public.update_dossier_with_extension(
  p_id uuid,
  p_base jsonb,
  p_extension jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_type text;
  v_ext_table text;
  v_cols text;
  v_select_cols text;
  v_set_cols text;
  v_dossier jsonb;
  v_extension jsonb;
BEGIN
  -- Resolve type under the caller's RLS. A NULL here means the row is missing
  -- or not visible to the caller -> surface as not-found (404).
  SELECT d.type INTO v_type FROM public.dossiers d WHERE d.id = p_id;
  IF v_type IS NULL THEN
    RAISE EXCEPTION 'Dossier not found' USING ERRCODE = 'P0002';
  END IF;

  -- Patch the base row from the JSONB the edge function already builds (only the
  -- keys the caller actually sent are present; jsonb null clears nullable cols).
  UPDATE public.dossiers d
  SET
    name_en          = CASE WHEN p_base ? 'name_en' THEN p_base->>'name_en' ELSE d.name_en END,
    name_ar          = CASE WHEN p_base ? 'name_ar' THEN p_base->>'name_ar' ELSE d.name_ar END,
    abbreviation     = CASE WHEN p_base ? 'abbreviation' THEN p_base->>'abbreviation' ELSE d.abbreviation END,
    description_en   = CASE WHEN p_base ? 'description_en' THEN p_base->>'description_en' ELSE d.description_en END,
    description_ar   = CASE WHEN p_base ? 'description_ar' THEN p_base->>'description_ar' ELSE d.description_ar END,
    status           = CASE WHEN p_base ? 'status' THEN p_base->>'status' ELSE d.status END,
    sensitivity_level = CASE WHEN p_base ? 'sensitivity_level' THEN (p_base->>'sensitivity_level')::int ELSE d.sensitivity_level END,
    tags             = CASE WHEN p_base ? 'tags' THEN ARRAY(SELECT jsonb_array_elements_text(p_base->'tags')) ELSE d.tags END,
    metadata         = CASE WHEN p_base ? 'metadata' THEN p_base->'metadata' ELSE d.metadata END,
    updated_by       = CASE WHEN p_base ? 'updated_by' THEN (p_base->>'updated_by')::uuid ELSE d.updated_by END
  WHERE d.id = p_id
  RETURNING to_jsonb(d) INTO v_dossier;

  -- RLS USING filtered the row out (visible to SELECT but not UPDATE) -> 0 rows
  -- updated, no native error. Treat as an authorization denial (403).
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not permitted to update this dossier' USING ERRCODE = '42501';
  END IF;

  -- Patch the type-specific extension row (Class Table Inheritance). Same upsert
  -- semantics the edge function had: insert id + provided columns, and on
  -- conflict update only those columns (others are left untouched).
  IF p_extension IS NOT NULL
     AND jsonb_typeof(p_extension) = 'object'
     AND p_extension <> '{}'::jsonb THEN
    v_ext_table := CASE v_type
      WHEN 'country' THEN 'countries'
      WHEN 'organization' THEN 'organizations'
      WHEN 'forum' THEN 'forums'
      WHEN 'engagement' THEN 'engagement_dossiers'
      WHEN 'topic' THEN 'topics'
      WHEN 'working_group' THEN 'working_groups'
      WHEN 'person' THEN 'persons'
      ELSE NULL
    END;

    IF v_ext_table IS NOT NULL THEN
      -- Build the column lists from the provided keys (never the id column —
      -- that is bound to p_id explicitly).
      SELECT
        string_agg(quote_ident(k), ', '),
        string_agg('r.' || quote_ident(k), ', '),
        string_agg(quote_ident(k) || ' = EXCLUDED.' || quote_ident(k), ', ')
      INTO v_cols, v_select_cols, v_set_cols
      FROM jsonb_object_keys(p_extension) AS k
      WHERE k <> 'id';

      IF v_cols IS NOT NULL THEN
        -- jsonb_populate_record casts each value to the table's real column type
        -- (timestamptz / int / bool / text), so no per-column casting is needed.
        EXECUTE format(
          'INSERT INTO public.%1$I AS t (id, %2$s) '
          || 'SELECT $2, %3$s FROM jsonb_populate_record(NULL::public.%1$I, $1) AS r '
          || 'ON CONFLICT (id) DO UPDATE SET %4$s '
          || 'RETURNING to_jsonb(t.*)',
          v_ext_table, v_cols, v_select_cols, v_set_cols
        )
        USING p_extension, p_id
        INTO v_extension;
      END IF;
    END IF;
  END IF;

  RETURN CASE
    WHEN v_extension IS NOT NULL THEN v_dossier || jsonb_build_object('extension', v_extension)
    ELSE v_dossier
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_dossier_with_extension(uuid, jsonb, jsonb) TO authenticated;
