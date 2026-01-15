/**
 * Field Permissions Hooks
 * Custom hooks for managing granular field-level permissions
 */

import { useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  FieldPermission,
  FieldDefinition,
  ResolvedFieldPermission,
  BulkPermissionCheck,
  FieldPermissionAudit,
  FieldPermissionEntityType,
  FieldPermissionScope,
  CreateFieldPermissionRequest,
  UpdateFieldPermissionRequest,
  ListFieldPermissionsParams,
  ListFieldDefinitionsParams,
  GetAuditLogsParams,
  FieldWithPermission,
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

async function checkFieldPermissionsBulk(
  entityType: FieldPermissionEntityType,
  fieldNames: string[],
  entityId?: string,
): Promise<BulkPermissionCheck[]> {
  const params = new URLSearchParams({
    entity_type: entityType,
    field_names: fieldNames.join(','),
  })
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
 * Hook to check bulk field permissions
 */
export function useBulkPermissionCheck(
  entityType: FieldPermissionEntityType,
  fieldNames: string[],
  entityId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [...fieldPermissionKeys.resolvedForEntity(entityType, entityId), fieldNames],
    queryFn: () => checkFieldPermissionsBulk(entityType, fieldNames, entityId),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && fieldNames.length > 0,
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

/**
 * Hook to get fields with permissions merged (definitions + resolved permissions)
 */
export function useFieldsWithPermissions(entityType: FieldPermissionEntityType, entityId?: string) {
  const { data: definitions, isLoading: definitionsLoading } = useFieldDefinitions({
    entity_type: entityType,
  })

  const { data: resolvedPermissions, isLoading: permissionsLoading } = useResolvedPermissions(
    entityType,
    entityId,
  )

  const fieldsWithPermissions = useMemo<FieldWithPermission[]>(() => {
    if (!definitions) return []

    const permissionMap = new Map(resolvedPermissions?.map((p) => [p.field_name, p]) ?? [])

    return definitions.map((def) => {
      const resolved = permissionMap.get(def.field_name)
      return {
        ...def,
        can_view: resolved?.can_view ?? def.default_visible,
        can_edit: resolved?.can_edit ?? def.default_editable,
        permission_source: resolved ? 'role' : 'default',
      }
    })
  }, [definitions, resolvedPermissions])

  return {
    data: fieldsWithPermissions,
    isLoading: definitionsLoading || permissionsLoading,
  }
}

/**
 * Hook to check if user can view/edit a specific field
 */
export function useFieldPermission(
  entityType: FieldPermissionEntityType,
  fieldName: string,
  entityId?: string,
) {
  const { data: permissions, isLoading } = useResolvedPermissions(entityType, entityId)

  const permission = useMemo(() => {
    if (!permissions) {
      return { can_view: true, can_edit: true }
    }

    const found = permissions.find((p) => p.field_name === fieldName)
    return found
      ? { can_view: found.can_view, can_edit: found.can_edit }
      : { can_view: true, can_edit: true }
  }, [permissions, fieldName])

  return {
    ...permission,
    isLoading,
  }
}

/**
 * Hook to filter visible fields from a data object
 */
export function useVisibleFields<T extends Record<string, unknown>>(
  data: T | null | undefined,
  entityType: FieldPermissionEntityType,
  entityId?: string,
): { visibleData: Partial<T>; hiddenFields: string[]; isLoading: boolean } {
  const { data: permissions, isLoading } = useResolvedPermissions(entityType, entityId)

  return useMemo(() => {
    if (!data || !permissions) {
      return {
        visibleData: data ?? {},
        hiddenFields: [],
        isLoading,
      }
    }

    const permissionMap = new Map(permissions.map((p) => [p.field_name, p.can_view]))

    const visibleData: Partial<T> = {}
    const hiddenFields: string[] = []

    for (const key of Object.keys(data)) {
      const canView = permissionMap.get(key) ?? true
      if (canView) {
        visibleData[key as keyof T] = data[key as keyof T]
      } else {
        hiddenFields.push(key)
      }
    }

    return { visibleData, hiddenFields, isLoading }
  }, [data, permissions, isLoading])
}

/**
 * Hook to get editable fields from a data object
 */
export function useEditableFields(
  entityType: FieldPermissionEntityType,
  entityId?: string,
): { editableFields: Set<string>; isLoading: boolean } {
  const { data: permissions, isLoading } = useResolvedPermissions(entityType, entityId)

  const editableFields = useMemo(() => {
    if (!permissions) return new Set<string>()

    return new Set(permissions.filter((p) => p.can_edit).map((p) => p.field_name))
  }, [permissions])

  return { editableFields, isLoading }
}

/**
 * Utility function to check field permission synchronously (for use in non-React contexts)
 * This requires the permissions to be pre-fetched
 */
export function checkFieldPermission(
  permissions: ResolvedFieldPermission[] | undefined,
  fieldName: string,
  action: 'view' | 'edit',
): boolean {
  if (!permissions) return true

  const permission = permissions.find((p) => p.field_name === fieldName)
  if (!permission) return true

  return action === 'view' ? permission.can_view : permission.can_edit
}
