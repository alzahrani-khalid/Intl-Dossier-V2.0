/**
 * Preview Layouts Hook
 * Feature: Custom Preview Card Layouts
 *
 * Hook for fetching and managing preview layout configurations.
 * Provides caching, admin mutations, and user preferences.
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
 * Fetch all layouts for an entity type
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
 * Fetch a single layout with all fields
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
 * Hook to get the effective preview layout for an entity type
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
 * Hook to get all layouts for an entity type (admin)
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
 * Hook to get a single layout with all fields (admin)
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
 * Hook to create a new layout
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
 * Hook to update a layout
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
 * Hook to delete a layout
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
 * Hook to set a layout as default
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
 * Hook to add a field to a layout
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
 * Hook to update a field
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
 * Hook to delete a field
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
 * Hook to reorder fields
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
 * Get display label based on language
 */
export function getLayoutLabel(
  layout: { name_en: string; name_ar: string } | null,
  isRTL: boolean,
): string {
  if (!layout) return ''
  return isRTL ? layout.name_ar : layout.name_en
}

/**
 * Get field label based on language
 */
export function getFieldLabel(
  field: { label_en: string; label_ar: string },
  isRTL: boolean,
): string {
  return isRTL ? field.label_ar : field.label_en
}

/**
 * Apply default config for missing properties
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
