/**
 * Entity Templates Hooks
 * @module hooks/useEntityTemplates
 * @feature entity-creation-templates
 *
 * TanStack Query hooks for managing entity creation templates with context-aware
 * filtering, favorites, usage tracking, and keyboard shortcut support.
 *
 * @description
 * This module provides a comprehensive set of React hooks for template management:
 * - Query hooks for fetching templates with context-aware filtering
 * - Mutation hooks for creating, updating, and deleting templates
 * - Favorite template management with toggle functionality
 * - Usage tracking for analytics and recommendations
 * - Template application with value merging
 * - Recent template history
 * - Automatic cache invalidation on mutations
 *
 * @example
 * // Fetch templates for entity type
 * const { data: templates } = useEntityTemplates('task', {
 *   context: { dossier_id: 'uuid' },
 * });
 *
 * @example
 * // Context-aware templates (auto-detects from route)
 * const { data: templates } = useContextAwareTemplates('commitment');
 * // Automatically filters based on current dossier/engagement context
 *
 * @example
 * // Apply template to form
 * const { applyTemplate } = useApplyTemplate();
 * const values = applyTemplate(template, currentFormValues);
 * form.reset(values);
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

/**
 * Query Keys Factory for entity template queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation for template lists,
 * favorites, and recent templates with context-based filtering.
 *
 * @example
 * // Invalidate all template queries
 * queryClient.invalidateQueries({ queryKey: templateQueryKeys.all });
 *
 * @example
 * // Invalidate templates for specific entity type
 * queryClient.invalidateQueries({
 *   queryKey: templateQueryKeys.list('task')
 * });
 *
 * @example
 * // Invalidate context-specific templates
 * queryClient.invalidateQueries({
 *   queryKey: templateQueryKeys.list('commitment', { dossier_id: 'uuid' })
 * });
 */
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
 * Hook to fetch templates for a specific entity type
 *
 * @description
 * Fetches available templates for an entity type with optional context-based filtering.
 * Context filtering enables showing relevant templates based on current dossier, engagement,
 * or route. Includes recent template history and supports pagination.
 *
 * @param entityType - Type of entity ('task', 'commitment', 'intake', 'position', etc.)
 * @param options - Optional configuration object
 * @param options.context - Context filters (dossier_id, engagement_id, route_contains)
 * @param options.includeRecent - Include recent template usage (default: true)
 * @param options.limit - Maximum templates to fetch (default: 20)
 * @param options.enabled - Enable/disable query (default: true)
 * @returns TanStack Query result with templates array and metadata
 *
 * @example
 * // Fetch all task templates
 * const { data } = useEntityTemplates('task');
 * console.log(data?.templates); // Array of template objects
 *
 * @example
 * // Fetch templates with context filtering
 * const { data } = useEntityTemplates('commitment', {
 *   context: {
 *     dossier_id: 'country-uuid',
 *     engagement_id: 'meeting-uuid',
 *   },
 * });
 * // Returns templates relevant to this country and meeting
 *
 * @example
 * // Conditional fetching
 * const { data, isLoading } = useEntityTemplates('intake', {
 *   enabled: !!currentDossierId,
 *   context: { dossier_id: currentDossierId },
 * });
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
 * Hook to fetch templates with automatic context detection from route
 *
 * @description
 * Convenience hook that automatically detects the current context from the route
 * (via useCreationContext) and fetches relevant templates. Useful for creation
 * dialogs/forms where context should be inherited from the current page.
 *
 * @param entityType - Type of entity ('task', 'commitment', 'intake', etc.)
 * @param options - Optional configuration
 * @param options.enabled - Enable/disable query (default: true)
 * @param options.limit - Maximum templates to fetch
 * @returns TanStack Query result with context-filtered templates
 *
 * @example
 * // In a task creation dialog within a dossier page
 * const { data: templates } = useContextAwareTemplates('task');
 * // Automatically filters to templates relevant to current dossier
 *
 * @example
 * // In a commitment creation form within an engagement
 * const { data: templates } = useContextAwareTemplates('commitment');
 * // Automatically filters to templates for current engagement/dossier
 *
 * @example
 * // Template selector in quick-create menu
 * const { data: templates, isLoading } = useContextAwareTemplates('task');
 * <Select>
 *   {templates?.templates.map(t => (
 *     <SelectItem key={t.id} value={t.id}>{t.name_en}</SelectItem>
 *   ))}
 * </Select>
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
 * Hook to create a new entity template
 *
 * @description
 * Creates a mutation for saving a new template with default values, context rules,
 * and metadata. Automatically invalidates template cache on success.
 *
 * @returns TanStack Mutation result for creating templates
 *
 * @example
 * // Create task template from current form values
 * const { mutateAsync: createTemplate } = useCreateTemplate();
 * await createTemplate({
 *   entity_type: 'task',
 *   name_en: 'Standard Meeting Task',
 *   name_ar: 'مهمة اجتماع قياسية',
 *   default_values: {
 *     priority: 'medium',
 *     tracking_type: 'delivery',
 *     deadline_days_from_now: 7,
 *   },
 *   context_rules: { dossier_type: 'country' },
 *   is_public: true,
 * });
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
 * Hook to update an existing template
 *
 * @description
 * Creates a mutation for updating template properties including default values,
 * context rules, and visibility. Automatically invalidates cache on success.
 *
 * @returns TanStack Mutation result for updating templates
 *
 * @example
 * // Update template default values
 * const { mutateAsync: updateTemplate } = useUpdateTemplate();
 * await updateTemplate({
 *   id: 'template-uuid',
 *   default_values: {
 *     ...existingValues,
 *     priority: 'high',
 *   },
 *   updated_by: currentUserId,
 * });
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
 * Hook to delete a template
 *
 * @description
 * Creates a mutation for deleting a template. Requires entity type for proper
 * cache invalidation. Automatically invalidates template cache on success.
 *
 * @param entityType - Type of entity for the template
 * @returns TanStack Mutation result for deleting templates
 *
 * @example
 * // Delete task template
 * const { mutateAsync: deleteTemplate } = useDeleteTemplate('task');
 * await deleteTemplate('template-uuid');
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
 * Hook to track template usage for analytics
 *
 * @description
 * Fire-and-forget mutation for tracking when templates are used.
 * Increments usage counters for recommendations and analytics.
 * Silently fails if tracking request fails (non-critical operation).
 *
 * @returns TanStack Mutation result for tracking usage
 *
 * @example
 * // Track template usage when applied
 * const { mutate: trackUsage } = useTrackTemplateUsage();
 * trackUsage(template.id); // Silent tracking, no await needed
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
 * Hook to toggle template favorite status
 *
 * @description
 * Creates a mutation for adding/removing templates from user's favorites.
 * Automatically invalidates all template lists to reflect favorite changes.
 *
 * @returns TanStack Mutation result for toggling favorites
 *
 * @example
 * // Toggle favorite status
 * const { mutateAsync: toggleFavorite } = useToggleFavorite();
 * const result = await toggleFavorite('template-uuid');
 * console.log(result.is_favorite); // true or false
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
 * Hook to apply template values to form data
 *
 * @description
 * Provides a function to merge template default values with current form values.
 * Current values take precedence (won't overwrite existing user input).
 * Automatically tracks template usage for analytics.
 *
 * @returns Object with applyTemplate function
 *
 * @example
 * // Apply template to form
 * const { applyTemplate } = useApplyTemplate();
 * const mergedValues = applyTemplate(selectedTemplate, form.values);
 * form.reset(mergedValues);
 *
 * @example
 * // Apply template with partial values
 * const { applyTemplate } = useApplyTemplate();
 * const values = applyTemplate(template, {
 *   title: 'Custom Title', // Preserved
 *   // Other fields from template applied
 * });
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
