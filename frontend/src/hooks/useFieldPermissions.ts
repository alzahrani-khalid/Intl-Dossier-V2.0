/**
 * Field Permissions Hooks
 * Custom hooks for managing granular field-level permissions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  FieldPermission,
  FieldDefinition,
  ResolvedFieldPermission,
  FieldPermissionAudit,
  FieldPermissionEntityType,
  CreateFieldPermissionRequest,
  UpdateFieldPermissionRequest,
  ListFieldPermissionsParams,
  ListFieldDefinitionsParams,
  GetAuditLogsParams,
} from '@/types/field-permission.types'

// Query Keys
export const fieldPermissionKeys = {
  all: ['field-permissions'] as const,
  lists: () => [...fieldPermissionKeys.all, 'list'] as const,
  list: (params: ListFieldPermissionsParams) => [...fieldPermissionKeys.lists(), params] as const,
  details: () => [...fieldPermissionKeys.all, 'detail'] as const,
  detail: (id: string) => [...fieldPermissionKeys.details(), id] as const,
  definitions: () => [...fieldPermissionKeys.all, 'definitions'] as const,
  definitionsByEntity: (entityType: FieldPermissionEntityType) =>
    [...fieldPermissionKeys.definitions(), entityType] as const,
  resolved: () => [...fieldPermissionKeys.all, 'resolved'] as const,
  resolvedForEntity: (entityType: FieldPermissionEntityType, entityId?: string) =>
    [...fieldPermissionKeys.resolved(), entityType, entityId] as const,
  audit: () => [...fieldPermissionKeys.all, 'audit'] as const,
  auditList: (params: GetAuditLogsParams) => [...fieldPermissionKeys.audit(), params] as const,
}

// API Functions
async function fetchFieldPermissions(
  params: ListFieldPermissionsParams,
): Promise<FieldPermission[]> {
  const searchParams = new URLSearchParams()
  if (params.entity_type) searchParams.set('entity_type', params.entity_type)
  if (params.scope_type) searchParams.set('scope_type', params.scope_type)
  if (params.scope_value) searchParams.set('scope_value', params.scope_value)
  if (params.active_only !== undefined) searchParams.set('active_only', String(params.active_only))

  const { data, error } = await supabase.functions.invoke('field-permissions', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (error) throw error
  return data.data
}

async function fetchFieldDefinitions(
  params: ListFieldDefinitionsParams,
): Promise<FieldDefinition[]> {
  const { data, error } = await supabase.functions.invoke('field-permissions/definitions', {
    method: 'GET',
    body: params,
  })

  if (error) throw error
  return data.data
}

async function fetchResolvedPermissions(
  entityType: FieldPermissionEntityType,
  entityId?: string,
): Promise<ResolvedFieldPermission[]> {
  const params = new URLSearchParams({ entity_type: entityType })
  if (entityId) params.set('entity_id', entityId)

  const { data, error } = await supabase.functions.invoke(
    `field-permissions/check?${params.toString()}`,
    {
      method: 'GET',
    },
  )

  if (error) throw error
  return data.data
}

async function createFieldPermission(
  request: CreateFieldPermissionRequest,
): Promise<FieldPermission> {
  const { data, error } = await supabase.functions.invoke('field-permissions', {
    method: 'POST',
    body: request,
  })

  if (error) throw error
  return data
}

async function updateFieldPermission(
  id: string,
  request: UpdateFieldPermissionRequest,
): Promise<FieldPermission> {
  const { data, error } = await supabase.functions.invoke(`field-permissions/${id}`, {
    method: 'PATCH',
    body: request,
  })

  if (error) throw error
  return data
}

async function deleteFieldPermission(id: string): Promise<void> {
  const { error } = await supabase.functions.invoke(`field-permissions/${id}`, {
    method: 'DELETE',
  })

  if (error) throw error
}

async function fetchAuditLogs(params: GetAuditLogsParams): Promise<{
  data: FieldPermissionAudit[]
  pagination: { limit: number; offset: number; total?: number }
}> {
  const searchParams = new URLSearchParams()
  if (params.permission_id) searchParams.set('permission_id', params.permission_id)
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.offset) searchParams.set('offset', String(params.offset))

  const { data, error } = await supabase.functions.invoke(
    `field-permissions/audit?${searchParams.toString()}`,
    {
      method: 'GET',
    },
  )

  if (error) throw error
  return data
}

// Hooks

/**
 * Hook to list field permissions
 */
export function useFieldPermissions(params: ListFieldPermissionsParams = {}) {
  return useQuery({
    queryKey: fieldPermissionKeys.list(params),
    queryFn: () => fetchFieldPermissions(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get field definitions
 */
export function useFieldDefinitions(params: ListFieldDefinitionsParams = {}) {
  return useQuery({
    queryKey: params.entity_type
      ? fieldPermissionKeys.definitionsByEntity(params.entity_type)
      : fieldPermissionKeys.definitions(),
    queryFn: () => fetchFieldDefinitions(params),
    staleTime: 30 * 60 * 1000, // 30 minutes (definitions rarely change)
  })
}

/**
 * Hook to get resolved permissions for the current user on an entity
 */
export function useResolvedPermissions(
  entityType: FieldPermissionEntityType,
  entityId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: fieldPermissionKeys.resolvedForEntity(entityType, entityId),
    queryFn: () => fetchResolvedPermissions(entityType, entityId),
    staleTime: 5 * 60 * 1000,
    enabled,
  })
}

/**
 * Hook to create a field permission
 */
export function useCreateFieldPermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFieldPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fieldPermissionKeys.all })
    },
  })
}

/**
 * Hook to update a field permission
 */
export function useUpdateFieldPermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateFieldPermissionRequest }) =>
      updateFieldPermission(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fieldPermissionKeys.all })
    },
  })
}

/**
 * Hook to delete a field permission
 */
export function useDeleteFieldPermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFieldPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fieldPermissionKeys.all })
    },
  })
}

/**
 * Hook to fetch audit logs
 */
export function useFieldPermissionAudit(params: GetAuditLogsParams = {}) {
  return useQuery({
    queryKey: fieldPermissionKeys.auditList(params),
    queryFn: () => fetchAuditLogs(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
