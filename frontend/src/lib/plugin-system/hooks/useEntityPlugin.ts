/**
 * Entity Plugin Hook
 *
 * Main hook that combines all plugin capabilities for an entity type.
 * Provides a unified API for working with plugin entities.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { pluginRegistry } from '../registry/plugin-registry'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/domains/shared'
import { usePluginValidation } from './usePluginValidation'
import { usePluginPermissions } from './usePluginPermissions'
import { usePluginUI } from './usePluginUI'
import type {
  BaseDossier,
  EntitySearchParams,
  EntityListResponse,
  EntityPlugin,
} from '../types/plugin.types'

// ============================================================================
// Types
// ============================================================================

export interface UseEntityPluginOptions {
  /** Entity type identifier */
  entityType: string
}

export interface UseEntityPluginReturn<T = Record<string, unknown>> {
  /** Plugin instance */
  plugin: EntityPlugin<T> | undefined
  /** Whether plugin is registered */
  isRegistered: boolean
  /** Validation utilities */
  validation: ReturnType<typeof usePluginValidation<T>>
  /** Permission utilities */
  permissions: ReturnType<typeof usePluginPermissions<T>>
  /** UI utilities */
  ui: ReturnType<typeof usePluginUI<T>>
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Combined hook for all plugin capabilities
 */
export function useEntityPlugin<T = Record<string, unknown>>(
  options: UseEntityPluginOptions,
): UseEntityPluginReturn<T> {
  const { entityType } = options

  const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)
  const isRegistered = Boolean(plugin)

  // Get all sub-hooks
  const validation = usePluginValidation<T>({ entityType })
  const permissions = usePluginPermissions<T>({ entityType })
  const ui = usePluginUI<T>({ entityType })

  return {
    plugin,
    isRegistered,
    validation,
    permissions,
    ui,
  }
}

// ============================================================================
// CRUD Hooks
// ============================================================================

/**
 * Query key factory for entity plugins
 */
export const entityPluginKeys = {
  all: (entityType: string) => ['plugin-entity', entityType] as const,
  lists: (entityType: string) => [...entityPluginKeys.all(entityType), 'list'] as const,
  list: (entityType: string, params?: EntitySearchParams) =>
    [...entityPluginKeys.lists(entityType), params] as const,
  details: (entityType: string) => [...entityPluginKeys.all(entityType), 'detail'] as const,
  detail: (entityType: string, id: string) =>
    [...entityPluginKeys.details(entityType), id] as const,
}

/**
 * Hook for listing plugin entities
 */
export function usePluginEntities<T = Record<string, unknown>>(
  entityType: string,
  params?: EntitySearchParams,
  options?: { enabled?: boolean },
) {
  const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)
  const endpoint = plugin?.data?.endpoint || `${entityType}s`
  const transformFromApi = plugin?.data?.transformFromApi

  return useQuery({
    queryKey: entityPluginKeys.list(entityType, params),
    queryFn: async (): Promise<EntityListResponse<T>> => {
      const response = await apiGet<EntityListResponse<T>>(
        endpoint,
        params as Record<string, string | number | boolean | undefined | null> | undefined,
      )

      // Transform if hook provided
      if (transformFromApi && response.data) {
        response.data = response.data.map((item) =>
          transformFromApi(item as unknown as Record<string, unknown>),
        )
      }

      return response
    },
    enabled: options?.enabled !== false && Boolean(plugin),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

/**
 * Hook for getting a single plugin entity
 */
export function usePluginEntity<T = Record<string, unknown>>(
  entityType: string,
  id: string,
  options?: { enabled?: boolean },
) {
  const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)
  const endpoint = plugin?.data?.endpoint || `${entityType}s`
  const transformFromApi = plugin?.data?.transformFromApi
  const afterLoad = plugin?.data?.afterLoad

  return useQuery({
    queryKey: entityPluginKeys.detail(entityType, id),
    queryFn: async (): Promise<BaseDossier & T> => {
      let entity = await apiGet<BaseDossier & T>(`${endpoint}/${id}`)

      // Transform if hook provided
      if (transformFromApi) {
        entity = transformFromApi(entity as unknown as Record<string, unknown>)
      }

      // After load hook
      if (afterLoad) {
        entity = await afterLoad(entity)
      }

      return entity
    },
    enabled: options?.enabled !== false && Boolean(plugin) && Boolean(id),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  })
}

/**
 * Hook for creating a plugin entity
 */
export function useCreatePluginEntity<T = Record<string, unknown>>(entityType: string) {
  const queryClient = useQueryClient()
  const { i18n } = useTranslation('common')
  const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)
  const endpoint = plugin?.data?.endpoint || `${entityType}s`
  const transformForApi = plugin?.data?.transformForApi
  const beforeSave = plugin?.data?.beforeSave

  return useMutation({
    mutationFn: async (data: Partial<BaseDossier & T>): Promise<BaseDossier & T> => {
      let processedData = data

      // Before save hook
      if (beforeSave) {
        processedData = await beforeSave(processedData)
      }

      // Transform if hook provided
      const apiData = transformForApi ? transformForApi(processedData) : processedData

      return apiPost<BaseDossier & T, Record<string, unknown>>(
        endpoint,
        apiData as Record<string, unknown>,
      )
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: entityPluginKeys.lists(entityType),
      })
      queryClient.setQueryData(entityPluginKeys.detail(entityType, data.id), data)

      const name = i18n.language === 'ar' ? data.name_ar : data.name_en
      toast.success(
        i18n.language === 'ar' ? `تم إنشاء ${name} بنجاح` : `${name} created successfully`,
      )
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

/**
 * Hook for updating a plugin entity
 */
export function useUpdatePluginEntity<T = Record<string, unknown>>(entityType: string) {
  const queryClient = useQueryClient()
  const { i18n } = useTranslation('common')
  const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)
  const endpoint = plugin?.data?.endpoint || `${entityType}s`
  const transformForApi = plugin?.data?.transformForApi
  const beforeSave = plugin?.data?.beforeSave

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<BaseDossier & T>
    }): Promise<BaseDossier & T> => {
      let processedData = updates

      // Before save hook
      if (beforeSave) {
        processedData = await beforeSave(processedData)
      }

      // Transform if hook provided
      const apiData = transformForApi ? transformForApi(processedData) : processedData

      return apiPatch<BaseDossier & T, Record<string, unknown>>(
        `${endpoint}/${id}`,
        apiData as Record<string, unknown>,
      )
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({
        queryKey: entityPluginKeys.detail(entityType, id),
      })
      const previous = queryClient.getQueryData<BaseDossier & T>(
        entityPluginKeys.detail(entityType, id),
      )
      return { previous }
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(entityPluginKeys.detail(entityType, id), data)
      queryClient.invalidateQueries({
        queryKey: entityPluginKeys.lists(entityType),
      })

      toast.success(i18n.language === 'ar' ? 'تم التحديث بنجاح' : 'Updated successfully')
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(entityPluginKeys.detail(entityType, id), context.previous)
      }
      toast.error(error.message)
    },
  })
}

/**
 * Hook for deleting/archiving a plugin entity
 */
export function useDeletePluginEntity<T = Record<string, unknown>>(entityType: string) {
  const queryClient = useQueryClient()
  const { i18n } = useTranslation('common')
  const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)
  const endpoint = plugin?.data?.endpoint || `${entityType}s`

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      return apiDelete<{ success: boolean }>(`${endpoint}/${id}`)
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({
        queryKey: entityPluginKeys.detail(entityType, id),
      })
      queryClient.invalidateQueries({
        queryKey: entityPluginKeys.lists(entityType),
      })

      toast.success(i18n.language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// ============================================================================
// Re-exports
// ============================================================================

export { usePluginValidation } from './usePluginValidation'
export { usePluginPermissions } from './usePluginPermissions'
export { usePluginRelationships } from './usePluginRelationships'
export { usePluginUI, useEntityDisplay } from './usePluginUI'
