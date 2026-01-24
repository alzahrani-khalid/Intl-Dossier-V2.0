/**
 * Preview Layouts Hooks
 * @module hooks/usePreviewLayouts
 * @feature Custom Preview Card Layouts
 *
 * TanStack Query hooks for fetching and managing preview layout configurations
 * for entity hover cards and preview modals.
 *
 * @description
 * This module provides comprehensive preview layout management:
 * - Query hooks for fetching effective layouts (with default fallback)
 * - Admin mutation hooks for creating/updating/deleting layouts
 * - Field management hooks for configuring layout fields
 * - Query key factory for cache management
 * - Utility functions for label resolution and config merging
 * - Support for multiple entity types and contexts (hover, modal, inline)
 * - Bilingual layout support (English/Arabic labels)
 *
 * @example
 * // Fetch effective layout for hover cards
 * const { data: layout } = usePreviewLayout('dossier', 'hover');
 *
 * @example
 * // Admin: Get all layouts for an entity type
 * const { data: layouts } = useEntityLayouts('dossier');
 *
 * @example
 * // Admin: Create new layout
 * const { mutate } = useCreateLayout();
 * mutate({
 *   entity_type: 'dossier',
 *   context: 'hover',
 *   name_en: 'Compact View',
 *   name_ar: 'عرض مضغوط',
 *   is_default: true
 * });
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  PreviewEntityType,
  PreviewContext,
  PreviewLayout,
  PreviewLayoutSummary,
  PreviewLayoutConfig,
  PreviewLayoutField,
  PreviewLayoutFormValues,
  PreviewLayoutFieldFormValues,
  GetPreviewLayoutResponse,
  GetEntityLayoutsResponse,
  DEFAULT_LAYOUT_CONFIG,
} from '@/types/preview-layout.types'

// =============================================================================
// QUERY KEYS
// =============================================================================

export const previewLayoutKeys = {
  all: ['preview-layouts'] as const,
  lists: () => [...previewLayoutKeys.all, 'list'] as const,
  list: (entityType: PreviewEntityType) => [...previewLayoutKeys.lists(), entityType] as const,
  details: () => [...previewLayoutKeys.all, 'detail'] as const,
  detail: (entityType: PreviewEntityType, context: PreviewContext) =>
    [...previewLayoutKeys.details(), entityType, context] as const,
  fields: (layoutId: string) => [...previewLayoutKeys.all, 'fields', layoutId] as const,
}

// =============================================================================
// FETCH FUNCTIONS
// =============================================================================

/**
 * Fetch the effective layout for an entity type and context
 *
 * @description
 * Calls the get_preview_layout RPC function to retrieve the effective layout
 * for a given entity type and context. Returns the default layout if user
 * hasn't customized, or null if no layout exists.
 *
 * @param entityType - Entity type ('dossier', 'engagement', etc.)
 * @param context - Preview context ('hover', 'modal', 'inline')
 * @returns Promise with layout data or null
 * @throws Error if RPC call fails
 */
async function fetchPreviewLayout(
  entityType: PreviewEntityType,
  context: PreviewContext = 'hover',
): Promise<GetPreviewLayoutResponse | null> {
  const { data, error } = await supabase.rpc('get_preview_layout', {
    p_entity_type: entityType,
    p_context: context,
  })

  if (error) {
    console.error('Error fetching preview layout:', error)
    throw error
  }

  return data?.[0] || null
}

/**
 * Fetch all layouts for an entity type (admin use)
 *
 * @description
 * Calls the get_entity_layouts RPC function to retrieve all layouts for a given
 * entity type across all contexts. Used in admin UI for layout management.
 *
 * @param entityType - Entity type to fetch layouts for
 * @returns Promise with array of layout summaries
 * @throws Error if RPC call fails
 */
async function fetchEntityLayouts(
  entityType: PreviewEntityType,
): Promise<GetEntityLayoutsResponse[]> {
  const { data, error } = await supabase.rpc('get_entity_layouts', {
    p_entity_type: entityType,
  })

  if (error) {
    console.error('Error fetching entity layouts:', error)
    throw error
  }

  return data || []
}

/**
 * Fetch a single layout with all fields (admin use)
 *
 * @description
 * Retrieves a complete layout including all field configurations. Joins
 * entity_preview_layouts with preview_layout_fields tables. Used in admin
 * UI for editing layout details.
 *
 * @param layoutId - UUID of layout to fetch
 * @returns Promise with complete layout and fields, or null
 * @throws Error if database query fails
 */
async function fetchLayoutWithFields(layoutId: string): Promise<PreviewLayout | null> {
  const { data: layout, error: layoutError } = await supabase
    .from('entity_preview_layouts')
    .select('*')
    .eq('id', layoutId)
    .single()

  if (layoutError) {
    console.error('Error fetching layout:', layoutError)
    throw layoutError
  }

  if (!layout) return null

  const { data: fields, error: fieldsError } = await supabase
    .from('preview_layout_fields')
    .select('*')
    .eq('layout_id', layoutId)
    .order('sort_order')

  if (fieldsError) {
    console.error('Error fetching layout fields:', fieldsError)
    throw fieldsError
  }

  return {
    ...layout,
    fields: fields || [],
  } as PreviewLayout
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to get the effective preview layout for an entity type and context
 *
 * @description
 * Fetches the preview layout that should be used for rendering entity previews
 * (hover cards, modals, inline previews). Returns the user's selected layout
 * or falls back to the default layout for the entity type.
 *
 * Results are cached for 10 minutes (staleTime) and retained for 30 minutes (gcTime).
 *
 * @param entityType - Entity type to fetch layout for ('dossier', 'engagement', etc.)
 * @param context - Preview context ('hover', 'modal', 'inline'), defaults to 'hover'
 * @param options - TanStack Query options
 *   - enabled: Whether to run query (defaults to true)
 * @returns TanStack Query result with layout data
 *
 * @example
 * // Fetch hover card layout for dossiers
 * const { data: layout, isLoading } = usePreviewLayout('dossier', 'hover');
 *
 * @example
 * // Conditionally enable query
 * const { data } = usePreviewLayout('engagement', 'modal', {
 *   enabled: isModalOpen
 * });
 */
export function usePreviewLayout(
  entityType: PreviewEntityType,
  context: PreviewContext = 'hover',
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: previewLayoutKeys.detail(entityType, context),
    queryFn: () => fetchPreviewLayout(entityType, context),
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}

/**
 * Hook to get all layouts for an entity type (admin use)
 *
 * @description
 * Fetches all layouts configured for a specific entity type across all contexts.
 * Used in admin UI for layout management dashboard. Cached for 5 minutes.
 *
 * @param entityType - Entity type to fetch layouts for
 * @param options - TanStack Query options
 *   - enabled: Whether to run query (defaults to true)
 * @returns TanStack Query result with array of layout summaries
 *
 * @example
 * // Admin: List all dossier layouts
 * const { data: layouts } = useEntityLayouts('dossier');
 * layouts.forEach(layout => {
 *   console.log(`${layout.name_en} (${layout.context})`);
 * });
 */
export function useEntityLayouts(
  entityType: PreviewEntityType,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: previewLayoutKeys.list(entityType),
    queryFn: () => fetchEntityLayouts(entityType),
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to get a single layout with all fields (admin use)
 *
 * @description
 * Fetches complete layout details including all field configurations. Used in
 * admin UI for editing layout settings and field order. Cached for 5 minutes.
 *
 * @param layoutId - UUID of layout to fetch, or null to disable query
 * @param options - TanStack Query options
 *   - enabled: Whether to run query (defaults to true if layoutId provided)
 * @returns TanStack Query result with complete layout and fields
 *
 * @example
 * // Admin: Edit layout form
 * const [selectedId, setSelectedId] = useState<string | null>(null);
 * const { data: layout } = useLayoutDetails(selectedId);
 *
 * if (layout) {
 *   return <LayoutEditForm layout={layout} />;
 * }
 */
export function useLayoutDetails(layoutId: string | null, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: previewLayoutKeys.fields(layoutId || ''),
    queryFn: () => (layoutId ? fetchLayoutWithFields(layoutId) : null),
    enabled: options.enabled !== false && !!layoutId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// =============================================================================
// ADMIN MUTATIONS
// =============================================================================

/**
 * Hook to create a new preview layout (admin use)
 *
 * @description
 * Creates a new preview layout configuration. Automatically invalidates relevant
 * queries on success to refresh layout lists and effective layouts.
 *
 * @returns TanStack Mutation result with mutate function accepting PreviewLayoutFormValues
 *
 * @example
 * // Admin: Create new layout
 * const { mutate, isPending } = useCreateLayout();
 *
 * mutate({
 *   entity_type: 'dossier',
 *   context: 'hover',
 *   name_en: 'Compact View',
 *   name_ar: 'عرض مضغوط',
 *   description_en: 'Minimal hover card',
 *   description_ar: 'بطاقة عرض مصغرة',
 *   is_default: true,
 *   layout_config: { showAvatar: true, maxKeyDetails: 2 }
 * });
 */
export function useCreateLayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: PreviewLayoutFormValues) => {
      const { data, error } = await supabase
        .from('entity_preview_layouts')
        .insert({
          entity_type: values.entity_type,
          context: values.context,
          name_en: values.name_en,
          name_ar: values.name_ar,
          description_en: values.description_en,
          description_ar: values.description_ar,
          is_default: values.is_default,
          layout_config: values.layout_config,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.list(data.entity_type),
      })
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.detail(data.entity_type, data.context),
      })
    },
  })
}

/**
 * Hook to update an existing preview layout (admin use)
 *
 * @description
 * Updates layout properties (name, description, config, default status, etc.).
 * Automatically invalidates affected queries on success.
 *
 * @returns TanStack Mutation result with mutate function
 *
 * @example
 * // Admin: Update layout settings
 * const { mutate } = useUpdateLayout();
 *
 * mutate({
 *   id: layoutId,
 *   values: { is_default: true, layout_config: { maxKeyDetails: 3 } }
 * });
 */
export function useUpdateLayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: Partial<PreviewLayoutFormValues>
    }) => {
      const { data, error } = await supabase
        .from('entity_preview_layouts')
        .update({
          ...values,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.list(data.entity_type),
      })
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.detail(data.entity_type, data.context),
      })
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.fields(data.id),
      })
    },
  })
}

/**
 * Hook to delete a preview layout (admin use)
 *
 * @description
 * Deletes a layout and all associated fields (cascade delete). Invalidates
 * all layout queries for the entity type.
 *
 * @returns TanStack Mutation result with mutate function
 *
 * @example
 * // Admin: Delete layout with confirmation
 * const { mutate } = useDeleteLayout();
 *
 * if (confirm('Delete this layout?')) {
 *   mutate({ id: layoutId, entityType: 'dossier' });
 * }
 */
export function useDeleteLayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, entityType }: { id: string; entityType: PreviewEntityType }) => {
      const { error } = await supabase.from('entity_preview_layouts').delete().eq('id', id)

      if (error) throw error
      return { id, entityType }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.list(variables.entityType),
      })
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.details(),
      })
    },
  })
}

/**
 * Hook to set a layout as default (admin use)
 *
 * @description
 * Marks a layout as the default for its entity type and context. Automatically
 * unsets the previous default layout via RPC function.
 *
 * @returns TanStack Mutation result with mutate function
 *
 * @example
 * // Admin: Set as default
 * const { mutate } = useSetDefaultLayout();
 * mutate({ layoutId, entityType: 'dossier' });
 */
export function useSetDefaultLayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      layoutId,
      entityType,
    }: {
      layoutId: string
      entityType: PreviewEntityType
    }) => {
      const { data, error } = await supabase.rpc('set_default_layout', {
        p_layout_id: layoutId,
      })

      if (error) throw error
      return { success: data, entityType }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.list(variables.entityType),
      })
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.details(),
      })
    },
  })
}

// =============================================================================
// FIELD MUTATIONS
// =============================================================================

/**
 * Hook to add a field to a layout (admin use)
 *
 * @description
 * Adds a new field configuration to a layout. Fields control which data points
 * are displayed in preview cards and their formatting.
 *
 * @returns TanStack Mutation result with mutate function
 *
 * @example
 * // Admin: Add field to layout
 * const { mutate } = useAddLayoutField();
 *
 * mutate({
 *   layoutId,
 *   values: {
 *     field_key: 'status',
 *     label_en: 'Status',
 *     label_ar: 'الحالة',
 *     field_type: 'badge',
 *     sort_order: 1,
 *     is_visible: true
 *   }
 * });
 */
export function useAddLayoutField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      layoutId,
      values,
    }: {
      layoutId: string
      values: PreviewLayoutFieldFormValues
    }) => {
      const { data, error } = await supabase
        .from('preview_layout_fields')
        .insert({
          layout_id: layoutId,
          ...values,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.fields(variables.layoutId),
      })
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.details(),
      })
    },
  })
}

/**
 * Hook to update a layout field (admin use)
 *
 * @description
 * Updates field properties (label, visibility, formatting, etc.). Invalidates
 * field cache and effective layout cache.
 *
 * @returns TanStack Mutation result with mutate function
 *
 * @example
 * // Admin: Toggle field visibility
 * const { mutate } = useUpdateLayoutField();
 * mutate({ id: fieldId, layoutId, values: { is_visible: false } });
 */
export function useUpdateLayoutField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      layoutId,
      values,
    }: {
      id: string
      layoutId: string
      values: Partial<PreviewLayoutFieldFormValues>
    }) => {
      const { data, error } = await supabase
        .from('preview_layout_fields')
        .update({
          ...values,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { ...data, layoutId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.fields(variables.layoutId),
      })
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.details(),
      })
    },
  })
}

/**
 * Hook to delete a layout field (admin use)
 *
 * @description
 * Removes a field from a layout. Invalidates field cache and effective layout cache.
 *
 * @returns TanStack Mutation result with mutate function
 *
 * @example
 * // Admin: Remove field from layout
 * const { mutate } = useDeleteLayoutField();
 * mutate({ id: fieldId, layoutId });
 */
export function useDeleteLayoutField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, layoutId }: { id: string; layoutId: string }) => {
      const { error } = await supabase.from('preview_layout_fields').delete().eq('id', id)

      if (error) throw error
      return { id, layoutId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.fields(variables.layoutId),
      })
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.details(),
      })
    },
  })
}

/**
 * Hook to reorder layout fields (admin use)
 *
 * @description
 * Updates the sort_order of multiple fields in a single transaction. Used for
 * drag-and-drop field reordering in admin UI.
 *
 * @returns TanStack Mutation result with mutate function
 *
 * @example
 * // Admin: Reorder fields after drag-and-drop
 * const { mutate } = useReorderLayoutFields();
 *
 * mutate({
 *   layoutId,
 *   fieldOrders: [
 *     { id: 'field-1', sort_order: 0 },
 *     { id: 'field-2', sort_order: 1 },
 *     { id: 'field-3', sort_order: 2 }
 *   ]
 * });
 */
export function useReorderLayoutFields() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      layoutId,
      fieldOrders,
    }: {
      layoutId: string
      fieldOrders: { id: string; sort_order: number }[]
    }) => {
      // Update all field orders in a transaction
      const updates = fieldOrders.map(({ id, sort_order }) =>
        supabase
          .from('preview_layout_fields')
          .update({ sort_order, updated_at: new Date().toISOString() })
          .eq('id', id),
      )

      const results = await Promise.all(updates)
      const errors = results.filter((r) => r.error)

      if (errors.length > 0) {
        throw new Error('Failed to reorder some fields')
      }

      return { layoutId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.fields(variables.layoutId),
      })
      queryClient.invalidateQueries({
        queryKey: previewLayoutKeys.details(),
      })
    },
  })
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get display label for a layout based on current language
 *
 * @description
 * Utility function to resolve the correct label (English or Arabic) based on
 * the current language/RTL direction.
 *
 * @param layout - Layout object with name_en and name_ar, or null
 * @param isRTL - Whether the current language is RTL (Arabic)
 * @returns Localized label string, or empty string if layout is null
 *
 * @example
 * const label = getLayoutLabel(layout, i18n.language === 'ar');
 */
export function getLayoutLabel(
  layout: { name_en: string; name_ar: string } | null,
  isRTL: boolean,
): string {
  if (!layout) return ''
  return isRTL ? layout.name_ar : layout.name_en
}

/**
 * Get display label for a field based on current language
 *
 * @description
 * Utility function to resolve the correct field label (English or Arabic) based on
 * the current language/RTL direction.
 *
 * @param field - Field object with label_en and label_ar
 * @param isRTL - Whether the current language is RTL (Arabic)
 * @returns Localized label string
 *
 * @example
 * const label = getFieldLabel(field, i18n.language === 'ar');
 */
export function getFieldLabel(
  field: { label_en: string; label_ar: string },
  isRTL: boolean,
): string {
  return isRTL ? field.label_ar : field.label_en
}

/**
 * Apply default config for missing properties
 *
 * @description
 * Merges a partial layout config with default values to ensure all required
 * properties are present. Used when rendering layouts that may have incomplete
 * configuration.
 *
 * Default values:
 * - showAvatar: true
 * - showStatus: true
 * - showEntityType: true
 * - showLastUpdated: true
 * - maxKeyDetails: 3
 * - maxTags: 3
 * - showRecentActivity: true
 * - showMatchScore: false
 *
 * @param config - Partial config from database (may be null or incomplete)
 * @returns Complete PreviewLayoutConfig with all properties
 *
 * @example
 * const fullConfig = applyDefaultConfig(layout.layout_config);
 * // fullConfig.showAvatar guaranteed to exist
 */
export function applyDefaultConfig(
  config: Partial<PreviewLayoutConfig> | null,
): PreviewLayoutConfig {
  const defaults: PreviewLayoutConfig = {
    showAvatar: true,
    showStatus: true,
    showEntityType: true,
    showLastUpdated: true,
    maxKeyDetails: 3,
    maxTags: 3,
    showRecentActivity: true,
    showMatchScore: false,
  }

  return {
    ...defaults,
    ...(config || {}),
  }
}
