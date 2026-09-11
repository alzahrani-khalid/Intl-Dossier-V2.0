-- Remove the unreachable preview-layout configuration feature.
-- Guard relation-owned objects so this migration remains safe to apply twice.

-- Triggers (4)
DO $$
BEGIN
  IF to_regclass('public.entity_preview_layouts') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS tr_entity_preview_layouts_updated ON public.entity_preview_layouts;
    DROP TRIGGER IF EXISTS tr_enforce_single_default_layout ON public.entity_preview_layouts;
  END IF;

  IF to_regclass('public.preview_layout_fields') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS tr_preview_layout_fields_updated ON public.preview_layout_fields;
  END IF;

  IF to_regclass('public.user_preview_preferences') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS tr_user_preview_preferences_updated ON public.user_preview_preferences;
  END IF;
END
$$;

-- Policies (8): the four preview_layouts policies, then the four org-isolation policies.
DO $$
BEGIN
  IF to_regclass('public.entity_preview_layouts') IS NOT NULL THEN
    DROP POLICY IF EXISTS preview_layouts_select ON public.entity_preview_layouts;
    DROP POLICY IF EXISTS preview_layouts_admin_insert ON public.entity_preview_layouts;
    DROP POLICY IF EXISTS preview_layouts_admin_update ON public.entity_preview_layouts;
    DROP POLICY IF EXISTS preview_layouts_admin_delete ON public.entity_preview_layouts;

    DROP POLICY IF EXISTS entity_preview_layouts_org_isolation_select ON public.entity_preview_layouts;
    DROP POLICY IF EXISTS entity_preview_layouts_org_isolation_insert ON public.entity_preview_layouts;
    DROP POLICY IF EXISTS entity_preview_layouts_org_isolation_update ON public.entity_preview_layouts;
    DROP POLICY IF EXISTS entity_preview_layouts_org_isolation_delete ON public.entity_preview_layouts;
  END IF;
END
$$;

-- Functions (5)
DROP FUNCTION IF EXISTS public.get_preview_layout(public.preview_entity_type, public.preview_context);
DROP FUNCTION IF EXISTS public.get_entity_layouts(public.preview_entity_type);
DROP FUNCTION IF EXISTS public.set_default_layout(uuid);
DROP FUNCTION IF EXISTS public.enforce_single_default_layout();
DROP FUNCTION IF EXISTS public.update_preview_layout_timestamp();

-- Tables (3), children before parents
DROP TABLE IF EXISTS public.user_preview_preferences;
DROP TABLE IF EXISTS public.preview_layout_fields;
DROP TABLE IF EXISTS public.entity_preview_layouts;

-- Enum types (3)
DROP TYPE IF EXISTS public.preview_field_type;
DROP TYPE IF EXISTS public.preview_context;
DROP TYPE IF EXISTS public.preview_entity_type;
