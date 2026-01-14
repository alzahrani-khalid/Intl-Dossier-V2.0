/**
 * useFieldHistory Hook
 *
 * React Query hooks for field-level history tracking with:
 * - List and grouped history views
 * - Pagination and filtering
 * - Field rollback mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  FieldHistoryEntry,
  FieldHistoryGrouped,
  FieldHistoryFilters,
  FieldHistoryPagination,
  FieldHistoryListResponse,
  FieldHistoryGroupedResponse,
  RollbackResponse,
  UseFieldHistoryReturn,
  UseFieldHistoryGroupedReturn,
  UseFieldRollbackReturn,
  TrackableEntityType,
} from '@/types/field-history.types'

// =============================================
// API FUNCTIONS
// =============================================

async function fetchFieldHistory(
  filters: FieldHistoryFilters,
  pagination: FieldHistoryPagination,
): Promise<FieldHistoryListResponse> {
  const params = new URLSearchParams({
    entity_type: filters.entity_type,
    entity_id: filters.entity_id,
    limit: pagination.limit.toString(),
    offset: pagination.offset.toString(),
  })

  if (filters.field_name) {
    params.append('field_name', filters.field_name)
  }

  const { data, error } = await supabase.functions.invoke('field-history', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: null,
  })

  // Use direct RPC call as a fallback since invoke with GET doesn't work well
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_field_history', {
    p_entity_type: filters.entity_type,
    p_entity_id: filters.entity_id,
    p_field_name: filters.field_name || null,
    p_limit: pagination.limit,
    p_offset: pagination.offset,
  })

  if (rpcError) {
    throw new Error(rpcError.message)
  }

  // Get count for pagination
  const { count } = await supabase
    .from('field_history')
    .select('*', { count: 'exact', head: true })
    .eq('entity_type', filters.entity_type)
    .eq('entity_id', filters.entity_id)

  // Transform RPC response to expected format
  const entries: FieldHistoryEntry[] = (rpcData || []).map((entry: Record<string, unknown>) => ({
    id: entry.id,
    entity_type: filters.entity_type,
    entity_id: filters.entity_id,
    field_name: entry.field_name,
    field_label: {
      en: entry.field_label_en,
      ar: entry.field_label_ar,
    },
    field_category: entry.field_category,
    old_value: entry.old_value,
    new_value: entry.new_value,
    change_type: entry.change_type,
    changed_by: {
      id: entry.changed_by,
      email: entry.changed_by_email,
      role: entry.changed_by_role,
    },
    created_at: entry.created_at,
    is_rollback: entry.is_rollback,
    rollback_of_id: entry.rollback_of_id,
    rolled_back_at: entry.rolled_back_at,
    rolled_back_by: entry.rolled_back_by,
    can_rollback: !entry.is_rollback && !entry.rolled_back_at && entry.change_type !== 'create',
  }))

  return {
    data: entries,
    metadata: {
      entity_type: filters.entity_type,
      entity_id: filters.entity_id,
      total: count || 0,
      limit: pagination.limit,
      offset: pagination.offset,
      has_more: pagination.offset + pagination.limit < (count || 0),
    },
  }
}

async function fetchFieldHistoryGrouped(
  entityType: TrackableEntityType,
  entityId: string,
): Promise<FieldHistoryGroupedResponse> {
  const { data, error } = await supabase.rpc('get_field_history_grouped', {
    p_entity_type: entityType,
    p_entity_id: entityId,
  })

  if (error) {
    throw new Error(error.message)
  }

  const fields: FieldHistoryGrouped[] = (data || []).map((field: Record<string, unknown>) => ({
    field_name: field.field_name,
    field_label: {
      en: field.field_label_en,
      ar: field.field_label_ar,
    },
    field_category: field.field_category,
    current_value: field.current_value,
    statistics: {
      change_count: field.change_count,
      first_change_at: field.first_change_at,
      last_change_at: field.last_change_at,
      last_changed_by_email: field.last_changed_by_email,
    },
  }))

  return {
    data: fields,
    metadata: {
      entity_type: entityType,
      entity_id: entityId,
      total_fields: fields.length,
    },
  }
}

async function rollbackFieldChange(fieldHistoryId: string): Promise<RollbackResponse> {
  const { data, error } = await supabase.rpc('rollback_field_change', {
    p_field_history_id: fieldHistoryId,
  })

  if (error) {
    throw new Error(error.message)
  }

  return {
    success: data?.success ?? false,
    message: data?.message ?? 'Unknown error',
    data: data?.success
      ? {
          rollback_history_id: data.rollback_history_id,
          rolled_back_field: data.rolled_back_field,
          restored_value: data.restored_value,
        }
      : undefined,
  }
}

// =============================================
// QUERY KEYS
// =============================================

export const fieldHistoryKeys = {
  all: ['field-history'] as const,
  lists: () => [...fieldHistoryKeys.all, 'list'] as const,
  list: (entityType: string, entityId: string, filters?: FieldHistoryFilters) =>
    [...fieldHistoryKeys.lists(), entityType, entityId, filters] as const,
  grouped: () => [...fieldHistoryKeys.all, 'grouped'] as const,
  groupedEntity: (entityType: string, entityId: string) =>
    [...fieldHistoryKeys.grouped(), entityType, entityId] as const,
}

// =============================================
// HOOKS
// =============================================

/**
 * Hook for fetching paginated field history
 */
export function useFieldHistory(
  entityType: TrackableEntityType,
  entityId: string,
  initialFilters?: Partial<FieldHistoryFilters>,
): UseFieldHistoryReturn {
  const [filters, setFiltersState] = useState<FieldHistoryFilters>({
    entity_type: entityType,
    entity_id: entityId,
    ...initialFilters,
  })

  const [pagination, setPagination] = useState<FieldHistoryPagination>({
    limit: 20,
    offset: 0,
  })

  const queryKey = useMemo(
    () => fieldHistoryKeys.list(entityType, entityId, filters),
    [entityType, entityId, filters],
  )

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...queryKey, pagination],
    queryFn: () => fetchFieldHistory(filters, pagination),
    enabled: Boolean(entityType && entityId),
    staleTime: 30 * 1000, // 30 seconds
  })

  const setFilters = useCallback((newFilters: Partial<FieldHistoryFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
    setPagination((prev) => ({ ...prev, offset: 0 })) // Reset to first page
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState({
      entity_type: entityType,
      entity_id: entityId,
    })
    setPagination({ limit: 20, offset: 0 })
  }, [entityType, entityId])

  const nextPage = useCallback(() => {
    if (data?.metadata.has_more) {
      setPagination((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }))
    }
  }, [data?.metadata.has_more])

  const prevPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }))
  }, [])

  return {
    entries: data?.data ?? [],
    isLoading,
    isFetchingNextPage: isFetching && !isLoading,
    error: error as Error | null,
    metadata: data?.metadata ?? null,
    filters,
    pagination,
    setFilters,
    clearFilters,
    nextPage,
    prevPage,
    refetch,
  }
}

/**
 * Hook for fetching grouped field history (by field name)
 */
export function useFieldHistoryGrouped(
  entityType: TrackableEntityType,
  entityId: string,
): UseFieldHistoryGroupedReturn {
  const queryKey = fieldHistoryKeys.groupedEntity(entityType, entityId)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchFieldHistoryGrouped(entityType, entityId),
    enabled: Boolean(entityType && entityId),
    staleTime: 60 * 1000, // 1 minute
  })

  return {
    fields: data?.data ?? [],
    isLoading,
    error: error as Error | null,
    metadata: data?.metadata ?? null,
    refetch,
  }
}

/**
 * Hook for rolling back field changes
 */
export function useFieldRollback(): UseFieldRollbackReturn {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: rollbackFieldChange,
    onSuccess: () => {
      // Invalidate all field history queries to refetch
      queryClient.invalidateQueries({ queryKey: fieldHistoryKeys.all })
    },
  })

  return {
    rollback: mutation.mutateAsync,
    isRollingBack: mutation.isPending,
    error: mutation.error as Error | null,
  }
}

// Default export
export default useFieldHistory
