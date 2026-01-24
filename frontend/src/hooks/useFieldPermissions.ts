/**
 * Field Permissions Hooks
 * @module hooks/useFieldPermissions
 *
 * Custom hooks for managing granular field-level view/edit permissions with role-based
 * access control, entity-specific overrides, and audit logging.
 *
 * @description
 * This module provides comprehensive field-level permission management with:
 * - Role-based field visibility and editability (global or role-specific)
 * - Entity-specific permission overrides (per dossier, engagement, etc.)
 * - Resolved permission calculation (combining defaults, roles, and overrides)
 * - Bulk permission checking for multiple fields
 * - Field definition management (field metadata and defaults)
 * - Permission audit logging and history
 * - Utility hooks for filtering visible/editable fields
 *
 * @example
 * // Check permissions for a specific field
 * const { can_view, can_edit, isLoading } = useFieldPermission(
 *   'dossier',
 *   'sensitive_notes',
 *   'uuid-123'
 * );
 *
 * @example
 * // Get all resolved permissions for an entity
 * const { data: permissions } = useResolvedPermissions('engagement', 'uuid-456');
 * permissions.forEach(p => {
 *   console.log(`${p.field_name}: view=${p.can_view}, edit=${p.can_edit}`);
 * });
 *
 * @example
 * // Filter object to show only visible fields
 * const { visibleData, hiddenFields } = useVisibleFields(
 *   dossierData,
 *   'dossier',
 *   dossierId
 * );
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

// Query Keys Factory
/**
 * Query key factory for field permission queries
 *
 * @description
 * Provides hierarchical cache keys for TanStack Query to enable
 * granular cache invalidation and efficient permission query management.
 */
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
 * Hook to list field permissions with optional filtering
 *
 * @description
 * Fetches field permission rules with optional filtering by entity type,
 * scope type, scope value, and active status. Useful for permission management UI.
 *
 * @param params - Optional filters for entity type, scope, and active status
 * @returns TanStack Query result with field permission array
 *
 * @example
 * // Fetch all active permissions
 * const { data: permissions } = useFieldPermissions({ active_only: true });
 *
 * @example
 * // Fetch role-specific permissions
 * const { data: rolePerms } = useFieldPermissions({
 *   entity_type: 'dossier',
 *   scope_type: 'role',
 *   scope_value: 'analyst',
 * });
 */
export function useFieldPermissions(params: ListFieldPermissionsParams = {}) {
  return useQuery({
    queryKey: fieldPermissionKeys.list(params),
    queryFn: () => fetchFieldPermissions(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get field definitions for an entity type
 *
 * @description
 * Fetches field metadata including field names, labels, categories,
 * default visibility, and default editability. Cached for 30 minutes
 * since definitions rarely change.
 *
 * @param params - Optional entity type filter
 * @returns TanStack Query result with field definition array
 *
 * @example
 * const { data: fields } = useFieldDefinitions({ entity_type: 'dossier' });
 * fields.forEach(field => {
 *   console.log(`${field.field_name}: ${field.field_category}`);
 * });
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
 * Hook to get resolved field permissions for the current user
 *
 * @description
 * Fetches computed permissions combining defaults, role-based rules, and
 * entity-specific overrides. Returns the final can_view and can_edit flags
 * for each field on an entity.
 *
 * @param entityType - The type of entity (dossier, engagement, etc.)
 * @param entityId - Optional entity UUID for entity-specific overrides
 * @param enabled - Whether to enable the query (default: true)
 * @returns TanStack Query result with resolved permission array
 *
 * @example
 * const { data: permissions } = useResolvedPermissions('dossier', 'uuid-123');
 * const canEditTitle = permissions?.find(p => p.field_name === 'title')?.can_edit;
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
 * Hook to check permissions for multiple fields at once
 *
 * @description
 * Efficiently checks permissions for a list of field names in a single query.
 * Useful when you only need to check specific fields rather than all fields.
 *
 * @param entityType - The type of entity
 * @param fieldNames - Array of field names to check
 * @param entityId - Optional entity UUID for entity-specific overrides
 * @param enabled - Whether to enable the query (default: true)
 * @returns TanStack Query result with bulk permission check array
 *
 * @example
 * const { data: checks } = useBulkPermissionCheck(
 *   'engagement',
 *   ['title', 'description', 'confidential_notes'],
 *   engagementId
 * );
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
 * Hook to create a new field permission rule
 *
 * @description
 * Mutation hook for creating field permissions. Automatically invalidates
 * all permission queries on success to refresh the UI.
 *
 * @returns TanStack Mutation with mutate function accepting CreateFieldPermissionRequest
 *
 * @example
 * const { mutate: createPermission } = useCreateFieldPermission();
 *
 * createPermission({
 *   entity_type: 'dossier',
 *   field_name: 'classified_info',
 *   scope_type: 'role',
 *   scope_value: 'analyst',
 *   can_view: false,
 *   can_edit: false,
 * });
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
 * Hook to update an existing field permission rule
 *
 * @description
 * Mutation hook for updating field permissions. Automatically invalidates
 * all permission queries on success.
 *
 * @returns TanStack Mutation with mutate function accepting id and UpdateFieldPermissionRequest
 *
 * @example
 * const { mutate: updatePermission } = useUpdateFieldPermission();
 *
 * updatePermission({
 *   id: 'permission-uuid',
 *   request: { can_view: true, can_edit: false },
 * });
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
 * Hook to delete a field permission rule
 *
 * @description
 * Mutation hook for deleting field permissions. Automatically invalidates
 * all permission queries on success.
 *
 * @returns TanStack Mutation with mutate function accepting permission ID
 *
 * @example
 * const { mutate: deletePermission } = useDeleteFieldPermission();
 * deletePermission('permission-uuid');
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
 * Hook to fetch field permission audit logs
 *
 * @description
 * Retrieves audit trail of permission changes with pagination support.
 * Useful for compliance and tracking permission modifications.
 *
 * @param params - Optional filters for permission_id, limit, and offset
 * @returns TanStack Query result with audit log array and pagination metadata
 *
 * @example
 * const { data } = useFieldPermissionAudit({
 *   permission_id: 'perm-uuid',
 *   limit: 50,
 * });
 * console.log(`${data.pagination.total} total audit entries`);
 */
export function useFieldPermissionAudit(params: GetAuditLogsParams = {}) {
  return useQuery({
    queryKey: fieldPermissionKeys.auditList(params),
    queryFn: () => fetchAuditLogs(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to get field definitions merged with resolved permissions
 *
 * @description
 * Combines field definitions with resolved permissions to provide a complete
 * picture of each field's metadata and current permission state.
 *
 * @param entityType - The type of entity
 * @param entityId - Optional entity UUID for entity-specific permissions
 * @returns Object with merged field data array and loading state
 *
 * @example
 * const { data: fields, isLoading } = useFieldsWithPermissions('dossier', 'uuid-123');
 * fields.forEach(field => {
 *   console.log(`
 *     ${field.field_name}:
 *     Category: ${field.field_category}
 *     View: ${field.can_view}
 *     Edit: ${field.can_edit}
 *     Source: ${field.permission_source}
 *   `);
 * });
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
 * Hook to check permissions for a single field
 *
 * @description
 * Convenience hook to check view/edit permissions for a specific field.
 * Returns defaults (view=true, edit=true) if no permission rules exist.
 *
 * @param entityType - The type of entity
 * @param fieldName - The specific field name to check
 * @param entityId - Optional entity UUID for entity-specific permissions
 * @returns Object with can_view, can_edit flags and loading state
 *
 * @example
 * const { can_view, can_edit, isLoading } = useFieldPermission(
 *   'engagement',
 *   'confidential_notes',
 *   engagementId
 * );
 *
 * if (!can_view) return null; // Hide field
 * if (!can_edit) return <ReadOnlyField />; // Show as read-only
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
 *
 * @description
 * Filters an object to only include fields the current user can view,
 * returning both the filtered data and a list of hidden field names.
 *
 * @template T - Type of the data object
 * @param data - The data object to filter
 * @param entityType - The type of entity
 * @param entityId - Optional entity UUID for entity-specific permissions
 * @returns Object with visibleData, hiddenFields array, and loading state
 *
 * @example
 * const { visibleData, hiddenFields } = useVisibleFields(
 *   dossierData,
 *   'dossier',
 *   dossierId
 * );
 *
 * // Only render visible fields
 * Object.entries(visibleData).map(([key, value]) => (
 *   <Field key={key} name={key} value={value} />
 * ));
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
 * Hook to get a set of editable field names
 *
 * @description
 * Returns a Set of field names that the current user can edit.
 * Useful for enabling/disabling form fields based on permissions.
 *
 * @param entityType - The type of entity
 * @param entityId - Optional entity UUID for entity-specific permissions
 * @returns Object with Set of editable field names and loading state
 *
 * @example
 * const { editableFields, isLoading } = useEditableFields('dossier', dossierId);
 *
 * const isEditable = (fieldName: string) => editableFields.has(fieldName);
 *
 * <Input
 *   name="title"
 *   disabled={!isEditable('title')}
 * />
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
 * Synchronously check field permission (non-React utility)
 *
 * @description
 * Utility function to check permissions synchronously using pre-fetched permission data.
 * Useful in callbacks, event handlers, or other non-React contexts.
 *
 * @param permissions - Pre-fetched resolved permissions array (or undefined)
 * @param fieldName - The field name to check
 * @param action - The action to check ('view' or 'edit')
 * @returns True if action is allowed, false otherwise (defaults to true if no permissions)
 *
 * @example
 * const handleSubmit = (data: FormData) => {
 *   const canEditTitle = checkFieldPermission(permissions, 'title', 'edit');
 *   if (!canEditTitle) {
 *     delete data.title; // Don't include field user can't edit
 *   }
 *   submitForm(data);
 * };
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
