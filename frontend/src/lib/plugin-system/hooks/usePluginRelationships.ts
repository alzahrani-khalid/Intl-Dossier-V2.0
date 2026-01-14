/**
 * Plugin Relationships Hook
 *
 * Provides relationship management capabilities for entity plugins.
 * Allows plugins to define and manage relationships between entities.
 */

import { useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { pluginRegistry } from '../registry/plugin-registry'
import { apiGet, apiPost, apiDelete } from '@/domains/shared'
import type { BaseDossier, RelationshipDefinition, ValidationResult } from '../types/plugin.types'

// ============================================================================
// Types
// ============================================================================

export interface PluginRelationship {
  id: string
  source_id: string
  source_type: string
  target_id: string
  target_type: string
  relationship_type: string
  metadata?: Record<string, unknown>
  created_at: string
  created_by?: string
}

export interface RelationshipWithTarget extends PluginRelationship {
  target: {
    id: string
    name_en: string
    name_ar: string
    type: string
    status: string
  }
}

export interface CreateRelationshipInput {
  target_id: string
  target_type: string
  relationship_type: string
  metadata?: Record<string, unknown>
}

export interface UsePluginRelationshipsOptions {
  /** Entity type for source entity */
  entityType: string
  /** Source entity ID */
  entityId: string
}

export interface UsePluginRelationshipsReturn<T = Record<string, unknown>> {
  /** All relationship definitions for this entity type */
  definitions: RelationshipDefinition[]
  /** Get relationships by type */
  getRelationshipsByType: (type: string) => RelationshipWithTarget[]
  /** All relationships for this entity */
  relationships: RelationshipWithTarget[]
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Create a new relationship */
  createRelationship: (input: CreateRelationshipInput) => Promise<PluginRelationship>
  /** Remove a relationship */
  removeRelationship: (relationshipId: string) => Promise<void>
  /** Check if relationship type allows more relationships */
  canAddRelationship: (type: string) => boolean
  /** Get allowed target entity types for a relationship type */
  getTargetTypes: (relationshipType: string) => string[]
  /** Validate a relationship before creation */
  validateRelationship: (target: BaseDossier, relationshipType: string) => Promise<ValidationResult>
  /** Refresh relationships */
  refresh: () => void
  /** Type marker for extension type (used for type inference) */
  _extensionType?: T
}

// ============================================================================
// Query Keys
// ============================================================================

const relationshipKeys = {
  all: ['plugin-relationships'] as const,
  entity: (entityType: string, entityId: string) =>
    [...relationshipKeys.all, entityType, entityId] as const,
  byType: (entityType: string, entityId: string, relType: string) =>
    [...relationshipKeys.entity(entityType, entityId), relType] as const,
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for managing entity relationships
 */
export function usePluginRelationships<T = Record<string, unknown>>(
  options: UsePluginRelationshipsOptions,
): UsePluginRelationshipsReturn<T> {
  const { entityType, entityId } = options
  const { i18n } = useTranslation('common')
  const queryClient = useQueryClient()

  const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)
  const relationshipHooks = plugin?.relationships

  // Get relationship definitions
  const definitions = useMemo(() => {
    return relationshipHooks?.definitions || []
  }, [relationshipHooks])

  // Fetch relationships
  const {
    data: relationships = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: relationshipKeys.entity(entityType, entityId),
    queryFn: async () => {
      // Call the relationships API endpoint
      const response = await apiGet<{ data: RelationshipWithTarget[] }>(
        `entity-relationships/${entityId}`,
        { source_type: entityType },
      )
      return response.data || []
    },
    enabled: !!entityId && definitions.length > 0,
    staleTime: 30_000,
  })

  // Get relationships by type
  const getRelationshipsByType = useCallback(
    (type: string): RelationshipWithTarget[] => {
      return relationships.filter((r) => r.relationship_type === type)
    },
    [relationships],
  )

  // Check if can add more relationships of type
  const canAddRelationship = useCallback(
    (type: string): boolean => {
      const definition = definitions.find((d) => d.type === type)
      if (!definition) return false

      if (definition.cardinality === 'one-to-one') {
        return getRelationshipsByType(type).length === 0
      }

      if (definition.maxCount) {
        return getRelationshipsByType(type).length < definition.maxCount
      }

      return true
    },
    [definitions, getRelationshipsByType],
  )

  // Get target types for relationship type
  const getTargetTypes = useCallback(
    (relationshipType: string): string[] => {
      const definition = definitions.find((d) => d.type === relationshipType)
      return definition?.targetEntityTypes || []
    },
    [definitions],
  )

  // Validate relationship
  const validateRelationship = useCallback(
    async (target: BaseDossier, relationshipType: string): Promise<ValidationResult> => {
      const definition = definitions.find((d) => d.type === relationshipType)

      if (!definition) {
        return {
          valid: false,
          errors: [
            {
              field: 'relationship_type',
              code: 'INVALID_TYPE',
              message: {
                en: 'Invalid relationship type',
                ar: 'نوع علاقة غير صالح',
              },
            },
          ],
        }
      }

      // Check target type is allowed
      if (!definition.targetEntityTypes.includes(target.type)) {
        return {
          valid: false,
          errors: [
            {
              field: 'target_type',
              code: 'INVALID_TARGET',
              message: {
                en: `Cannot create ${definition.label.en} relationship with ${target.type}`,
                ar: `لا يمكن إنشاء علاقة ${definition.label.ar} مع ${target.type}`,
              },
            },
          ],
        }
      }

      // Check cardinality
      if (!canAddRelationship(relationshipType)) {
        return {
          valid: false,
          errors: [
            {
              field: 'relationship_type',
              code: 'MAX_REACHED',
              message: {
                en: 'Maximum number of relationships reached',
                ar: 'تم الوصول إلى الحد الأقصى للعلاقات',
              },
            },
          ],
        }
      }

      // Check for duplicate
      const existing = relationships.find(
        (r) => r.target_id === target.id && r.relationship_type === relationshipType,
      )
      if (existing) {
        return {
          valid: false,
          errors: [
            {
              field: 'target_id',
              code: 'DUPLICATE',
              message: {
                en: 'This relationship already exists',
                ar: 'هذه العلاقة موجودة بالفعل',
              },
            },
          ],
        }
      }

      // Plugin validation hook
      if (relationshipHooks?.beforeCreateRelationship) {
        // We need the source entity for this - simplified for now
        const sourceEntity = { id: entityId, type: entityType } as BaseDossier & T
        return relationshipHooks.beforeCreateRelationship(sourceEntity, target, relationshipType)
      }

      return { valid: true, errors: [] }
    },
    [definitions, canAddRelationship, relationships, relationshipHooks, entityId, entityType],
  )

  // Create relationship mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateRelationshipInput): Promise<PluginRelationship> => {
      const response = await apiPost<
        PluginRelationship,
        CreateRelationshipInput & { source_id: string; source_type: string }
      >('entity-relationships', {
        ...input,
        source_id: entityId,
        source_type: entityType,
      })
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.entity(entityType, entityId),
      })

      // Call after hook
      if (relationshipHooks?.afterCreateRelationship) {
        const sourceEntity = { id: entityId, type: entityType } as BaseDossier & T
        const targetEntity = { id: data.target_id, type: data.target_type } as BaseDossier
        relationshipHooks.afterCreateRelationship(
          sourceEntity,
          targetEntity,
          data.relationship_type,
          data.id,
        )
      }

      toast.success(
        i18n.language === 'ar' ? 'تم إنشاء العلاقة بنجاح' : 'Relationship created successfully',
      )
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Remove relationship mutation
  const removeMutation = useMutation({
    mutationFn: async (relationshipId: string): Promise<void> => {
      // Validate before removal if hook exists
      if (relationshipHooks?.beforeRemoveRelationship) {
        const relationship = relationships.find((r) => r.id === relationshipId)
        if (relationship) {
          const sourceEntity = { id: entityId, type: entityType } as BaseDossier & T
          const targetEntity = relationship.target as unknown as BaseDossier
          const result = await relationshipHooks.beforeRemoveRelationship(
            sourceEntity,
            targetEntity,
            relationship.relationship_type,
          )
          if (!result.valid) {
            throw new Error(result.errors[0]?.message.en || 'Cannot remove relationship')
          }
        }
      }

      await apiDelete<{ success: boolean }>(`entity-relationships/${relationshipId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.entity(entityType, entityId),
      })
      toast.success(
        i18n.language === 'ar' ? 'تم حذف العلاقة بنجاح' : 'Relationship removed successfully',
      )
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    definitions,
    getRelationshipsByType,
    relationships,
    isLoading,
    error: error as Error | null,
    createRelationship: createMutation.mutateAsync,
    removeRelationship: removeMutation.mutateAsync,
    canAddRelationship,
    getTargetTypes,
    validateRelationship,
    refresh: refetch,
  }
}
