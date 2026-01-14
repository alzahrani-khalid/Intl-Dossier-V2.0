/**
 * useEntityTemplates Hook
 * Feature: Entity Creation Templates
 *
 * Provides template fetching, creation, and management functionality.
 * Includes context-aware filtering, keyboard shortcut support, and
 * usage tracking for analytics.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCreationContext } from '@/components/work-creation/hooks/useCreationContext'
import type {
  EntityTemplate,
  TemplateEntityType,
  TemplateContext,
  GetTemplatesResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  ToggleFavoriteResponse,
} from '@/types/entity-template.types'

// ============================================
// Query Keys
// ============================================

export const templateQueryKeys = {
  all: ['entity-templates'] as const,
  lists: () => [...templateQueryKeys.all, 'list'] as const,
  list: (entityType: TemplateEntityType, context?: TemplateContext) =>
    [...templateQueryKeys.lists(), entityType, context] as const,
  favorites: () => [...templateQueryKeys.all, 'favorites'] as const,
  recent: () => [...templateQueryKeys.all, 'recent'] as const,
}

// ============================================
// API Functions
// ============================================

async function fetchTemplates(
  entityType: TemplateEntityType,
  context?: TemplateContext,
  includeRecent = true,
  limit = 20,
): Promise<GetTemplatesResponse> {
  const { data: sessionData } = await supabase.auth.getSession()

  if (!sessionData.session) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({
    entity_type: entityType,
    include_recent: String(includeRecent),
    limit: String(limit),
  })

  if (context && Object.keys(context).length > 0) {
    params.set('context', JSON.stringify(context))
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/entity-templates?${params}`,
    {
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch templates')
  }

  return response.json()
}

async function createTemplate(template: CreateTemplateRequest): Promise<EntityTemplate> {
  const { data: sessionData } = await supabase.auth.getSession()

  if (!sessionData.session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/entity-templates`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to create template')
  }

  return response.json()
}

async function updateTemplate(template: UpdateTemplateRequest): Promise<EntityTemplate> {
  const { data: sessionData } = await supabase.auth.getSession()

  if (!sessionData.session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/entity-templates`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to update template')
  }

  return response.json()
}

async function deleteTemplate(templateId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession()

  if (!sessionData.session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/entity-templates?id=${templateId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to delete template')
  }
}

async function trackTemplateUsage(templateId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession()

  if (!sessionData.session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/entity-templates`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'track-usage',
        template_id: templateId,
      }),
    },
  )

  if (!response.ok) {
    console.warn('Failed to track template usage')
  }
}

async function toggleFavoriteTemplate(templateId: string): Promise<ToggleFavoriteResponse> {
  const { data: sessionData } = await supabase.auth.getSession()

  if (!sessionData.session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/entity-templates`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'toggle-favorite',
        template_id: templateId,
      }),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to toggle favorite')
  }

  return response.json()
}

// ============================================
// Hooks
// ============================================

/**
 * Fetch templates for an entity type
 */
export function useEntityTemplates(
  entityType: TemplateEntityType,
  options?: {
    context?: TemplateContext
    includeRecent?: boolean
    limit?: number
    enabled?: boolean
  },
) {
  const { context, includeRecent = true, limit = 20, enabled = true } = options || {}

  return useQuery({
    queryKey: templateQueryKeys.list(entityType, context),
    queryFn: () => fetchTemplates(entityType, context, includeRecent, limit),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch templates with automatic context detection
 */
export function useContextAwareTemplates(
  entityType: TemplateEntityType,
  options?: { enabled?: boolean; limit?: number },
) {
  const creationContext = useCreationContext()

  // Build context from current route
  const context: TemplateContext = {}

  if (creationContext.entityType === 'dossier') {
    context.dossier_id = creationContext.entityId
  }

  if (creationContext.entityType === 'engagement') {
    context.engagement_id = creationContext.entityId
  }

  if (creationContext.route) {
    context.route_contains = creationContext.route
  }

  return useEntityTemplates(entityType, {
    context,
    enabled: options?.enabled ?? true,
    limit: options?.limit,
  })
}

/**
 * Create a new template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: (newTemplate) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: templateQueryKeys.list(newTemplate.entity_type),
      })
    },
  })
}

/**
 * Update an existing template
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({
        queryKey: templateQueryKeys.list(updatedTemplate.entity_type),
      })
    },
  })
}

/**
 * Delete a template
 */
export function useDeleteTemplate(entityType: TemplateEntityType) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: templateQueryKeys.list(entityType),
      })
    },
  })
}

/**
 * Track template usage (fire and forget)
 */
export function useTrackTemplateUsage() {
  return useMutation({
    mutationFn: trackTemplateUsage,
    // Silent failure - usage tracking is non-critical
    onError: () => {
      console.warn('Failed to track template usage')
    },
  })
}

/**
 * Toggle favorite status
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleFavoriteTemplate,
    onSuccess: () => {
      // Invalidate all template lists to reflect favorite changes
      queryClient.invalidateQueries({
        queryKey: templateQueryKeys.lists(),
      })
    },
  })
}

/**
 * Apply template values to form
 */
export function useApplyTemplate() {
  const trackUsage = useTrackTemplateUsage()

  return {
    applyTemplate: (
      template: EntityTemplate,
      currentValues: Record<string, unknown> = {},
    ): Record<string, unknown> => {
      // Track usage
      trackUsage.mutate(template.id)

      // Merge template defaults with current values
      // Current values take precedence (don't overwrite user input)
      return {
        ...template.default_values,
        ...currentValues,
      }
    },
  }
}

export default useEntityTemplates
