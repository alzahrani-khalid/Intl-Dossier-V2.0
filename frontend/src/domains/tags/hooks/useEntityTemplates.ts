/**
 * Entity Templates Hook
 * @module domains/tags/hooks/useEntityTemplates
 *
 * Hooks for entity template CRUD operations.
 * API calls delegated to tags.repository.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getEntityTemplates as getEntityTemplatesApi,
  getEntityTemplate,
  createEntityTemplate as createEntityTemplateApi,
  updateEntityTemplate as updateEntityTemplateApi,
  deleteEntityTemplate as deleteEntityTemplateApi,
  applyEntityTemplate as applyEntityTemplateApi,
} from '../repositories/tags.repository'

export const templateKeys = {
  all: ['entity-templates'] as const,
  list: (params?: Record<string, unknown>) => [...templateKeys.all, 'list', params] as const,
  detail: (id: string) => [...templateKeys.all, 'detail', id] as const,
}

export function useEntityTemplates(params?: {
  entityType?: string
  enabled?: boolean
}): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  if (params?.entityType) searchParams.set('entity_type', params.entityType)

  return useQuery({
    queryKey: templateKeys.list(params),
    queryFn: () => getEntityTemplatesApi(searchParams),
    enabled: params?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useEntityTemplate(id: string | null): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: id ? templateKeys.detail(id) : ['entity-templates', 'disabled'],
    queryFn: () => (id ? getEntityTemplate(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  })
}

export function useCreateEntityTemplate(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createEntityTemplateApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: templateKeys.all })
    },
  })
}

export function useUpdateEntityTemplate(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => updateEntityTemplateApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: templateKeys.all })
    },
  })
}

export function useDeleteEntityTemplate(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEntityTemplateApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: templateKeys.all })
    },
  })
}

export function useApplyEntityTemplate(): ReturnType<typeof useMutation> {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => applyEntityTemplateApi(data),
  })
}

/* Stub hooks – removed during refactoring, still imported by components */

export function useContextAwareTemplates(
  params?: Record<string, unknown>,
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: [...templateKeys.all, 'context-aware', params],
    queryFn: () => Promise.resolve([]),
    staleTime: 5 * 60 * 1000,
  })
}

export function useToggleFavorite(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (_params: { templateId: string }) => Promise.resolve({ success: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: templateKeys.all })
    },
  })
}

export function useApplyTemplate(): ReturnType<typeof useMutation> {
  return useMutation({
    mutationFn: (_params: Record<string, unknown>) => Promise.resolve({ success: true }),
  })
}
