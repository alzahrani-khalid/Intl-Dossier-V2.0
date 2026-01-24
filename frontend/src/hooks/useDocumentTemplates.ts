/**
 * Document Templates Hooks
 * @module hooks/useDocumentTemplates
 * @feature document-management
 *
 * TanStack Query hooks for document template operations with validation,
 * section management, and templated document creation.
 *
 * @description
 * This module provides hooks for working with document templates:
 * - Query hooks for listing templates by category/entity type
 * - Fetch template details with sections and field definitions
 * - Create templated documents from templates
 * - Update field values with validation
 * - Complete and finalize templated documents
 * - Validate field values against template rules
 * - Manage user's templated documents
 * - Toast notifications for mutations
 *
 * @example
 * // List available templates
 * const { data: templates } = useListTemplates({
 *   category: 'diplomatic',
 *   entity_type: 'dossier',
 * });
 *
 * @example
 * // Create document from template
 * const { mutate: createDoc } = useCreateTemplatedDocument();
 * createDoc({
 *   template_id: 'template-uuid',
 *   entity_type: 'dossier',
 *   entity_id: 'dossier-uuid',
 *   initial_values: { title: 'Meeting Notes' },
 * });
 *
 * @example
 * // Validate and complete document
 * const { mutate: complete } = useCompleteTemplatedDocument();
 * complete({
 *   document_id: 'doc-uuid',
 *   final_values: { approved_by: 'John Doe' },
 * });
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  DocumentTemplate,
  DocumentTemplateWithSections,
  TemplatedDocument,
  ListTemplatesRequest,
  ListTemplatesResponse,
  GetTemplateResponse,
  CreateTemplatedDocumentRequest,
  CreateTemplatedDocumentResponse,
  UpdateTemplatedDocumentRequest,
  UpdateTemplatedDocumentResponse,
  CompleteTemplatedDocumentRequest,
  CompleteTemplatedDocumentResponse,
  TemplateValidationResult,
  DocumentTemplateCategory,
} from '@/types/document-template.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/document-templates`

/**
 * Query Keys Factory for document template queries
 *
 * @description
 * Provides hierarchical key structure for TanStack Query cache management.
 * Enables granular cache invalidation for templates and user documents.
 *
 * @example
 * // Invalidate all template queries
 * queryClient.invalidateQueries({ queryKey: documentTemplateKeys.all });
 *
 * @example
 * // Invalidate specific template
 * queryClient.invalidateQueries({ queryKey: documentTemplateKeys.detail('uuid') });
 *
 * @example
 * // Invalidate user's templated documents
 * queryClient.invalidateQueries({ queryKey: documentTemplateKeys.userDocuments() });
 */
export const documentTemplateKeys = {
  all: ['document-templates'] as const,
  lists: () => [...documentTemplateKeys.all, 'list'] as const,
  list: (params: ListTemplatesRequest) => [...documentTemplateKeys.lists(), params] as const,
  details: () => [...documentTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentTemplateKeys.details(), id] as const,
  userDocuments: () => [...documentTemplateKeys.all, 'user-documents'] as const,
  userDocument: (id: string) => [...documentTemplateKeys.userDocuments(), id] as const,
}

// API functions
async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

async function listTemplates(params: ListTemplatesRequest = {}): Promise<ListTemplatesResponse> {
  const headers = await getAuthHeaders()
  const searchParams = new URLSearchParams()

  if (params.category) searchParams.set('category', params.category)
  if (params.entity_type) searchParams.set('entity_type', params.entity_type)
  if (params.status) searchParams.set('status', params.status)
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.offset) searchParams.set('offset', String(params.offset))

  const response = await fetch(`${EDGE_FUNCTION_URL}/list?${searchParams}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch templates')
  }

  return response.json()
}

async function getTemplate(templateId: string): Promise<GetTemplateResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${EDGE_FUNCTION_URL}/${templateId}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch template')
  }

  return response.json()
}

async function getUserDocuments(
  params: {
    entity_type?: string
    entity_id?: string
    is_complete?: boolean
    limit?: number
    offset?: number
  } = {},
): Promise<{ documents: TemplatedDocument[]; total: number }> {
  const headers = await getAuthHeaders()
  const searchParams = new URLSearchParams()

  if (params.entity_type) searchParams.set('entity_type', params.entity_type)
  if (params.entity_id) searchParams.set('entity_id', params.entity_id)
  if (params.is_complete !== undefined) searchParams.set('is_complete', String(params.is_complete))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.offset) searchParams.set('offset', String(params.offset))

  const response = await fetch(`${EDGE_FUNCTION_URL}/my-documents?${searchParams}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch documents')
  }

  return response.json()
}

async function createTemplatedDocument(
  params: CreateTemplatedDocumentRequest,
): Promise<CreateTemplatedDocumentResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${EDGE_FUNCTION_URL}/create-document`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create document')
  }

  return response.json()
}

async function updateTemplatedDocument(
  params: UpdateTemplatedDocumentRequest,
): Promise<UpdateTemplatedDocumentResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${EDGE_FUNCTION_URL}/update-document`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update document')
  }

  return response.json()
}

async function completeDocument(
  params: CompleteTemplatedDocumentRequest,
): Promise<CompleteTemplatedDocumentResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${EDGE_FUNCTION_URL}/complete-document`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to complete document')
  }

  return response.json()
}

async function validateDocument(
  templateId: string,
  fieldValues: Record<string, unknown>,
): Promise<TemplateValidationResult> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${EDGE_FUNCTION_URL}/validate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ template_id: templateId, field_values: fieldValues }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to validate document')
  }

  return response.json()
}

async function deleteTemplatedDocument(documentId: string): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${EDGE_FUNCTION_URL}/delete-document`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ id: documentId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete document')
  }
}

// React Query Hooks

/**
 * Hook to list available document templates with filtering
 *
 * @description
 * Fetches a list of document templates with optional filters for category,
 * entity type, and status. Results are cached for 5 minutes.
 *
 * @param params - Optional filters for category, entity_type, status, pagination
 * @returns TanStack Query result with templates array and total count
 *
 * @example
 * // List all templates
 * const { data } = useDocumentTemplates();
 *
 * @example
 * // Filter by category and entity type
 * const { data } = useDocumentTemplates({
 *   category: 'diplomatic',
 *   entity_type: 'dossier',
 *   status: 'active',
 * });
 */
export function useDocumentTemplates(params: ListTemplatesRequest = {}) {
  return useQuery({
    queryKey: documentTemplateKeys.list(params),
    queryFn: () => listTemplates(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get templates filtered by entity type
 *
 * @description
 * Convenience hook for fetching templates available for a specific entity type.
 * Useful for showing template options when creating documents for dossiers, briefs, etc.
 *
 * @param entityType - Entity type to filter by (e.g., 'dossier', 'brief')
 * @returns TanStack Query result with filtered templates
 *
 * @example
 * const { data: dossierTemplates } = useTemplatesForEntity('dossier');
 */
export function useTemplatesForEntity(entityType: string) {
  return useQuery({
    queryKey: documentTemplateKeys.list({ entity_type: entityType }),
    queryFn: () => listTemplates({ entity_type: entityType }),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to get templates by category
 *
 * @description
 * Fetches templates filtered by category (diplomatic, legal, administrative, etc.).
 * Cached for 5 minutes.
 *
 * @param category - Template category to filter by
 * @returns TanStack Query result with categorized templates
 *
 * @example
 * const { data: diplomaticTemplates } = useTemplatesByCategory('diplomatic');
 */
export function useTemplatesByCategory(category: DocumentTemplateCategory) {
  return useQuery({
    queryKey: documentTemplateKeys.list({ category }),
    queryFn: () => listTemplates({ category }),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to get a specific template with sections and fields
 *
 * @description
 * Fetches complete template details including all sections and field definitions.
 * Query is disabled if templateId is undefined. Cached for 10 minutes.
 *
 * @param templateId - Template UUID to fetch
 * @returns TanStack Query result with template details including sections
 *
 * @example
 * const { data: template, isLoading } = useDocumentTemplate(templateId);
 * if (template) {
 *   template.sections.forEach(section => {
 *     console.log(section.title_en, section.fields);
 *   });
 * }
 */
export function useDocumentTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: documentTemplateKeys.detail(templateId || ''),
    queryFn: () => getTemplate(templateId!),
    enabled: !!templateId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get user's templated documents
 */
export function useUserTemplatedDocuments(
  params: {
    entity_type?: string
    entity_id?: string
    is_complete?: boolean
    limit?: number
    offset?: number
  } = {},
) {
  return useQuery({
    queryKey: [...documentTemplateKeys.userDocuments(), params],
    queryFn: () => getUserDocuments(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Hook to get drafts for a specific entity
 */
export function useEntityDrafts(entityType: string, entityId: string) {
  return useQuery({
    queryKey: [
      ...documentTemplateKeys.userDocuments(),
      { entity_type: entityType, entity_id: entityId, is_complete: false },
    ],
    queryFn: () =>
      getUserDocuments({ entity_type: entityType, entity_id: entityId, is_complete: false }),
    enabled: !!entityType && !!entityId,
    staleTime: 1 * 60 * 1000,
  })
}

/**
 * Hook to create a new templated document
 */
export function useCreateTemplatedDocument() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('document-templates')

  return useMutation({
    mutationFn: createTemplatedDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.userDocuments() })
      toast.success(t('success.documentCreated'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('errors.createFailed'))
    },
  })
}

/**
 * Hook to update a templated document (save progress)
 */
export function useUpdateTemplatedDocument() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('document-templates')

  return useMutation({
    mutationFn: updateTemplatedDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.userDocuments() })
      queryClient.setQueryData(documentTemplateKeys.userDocument(data.document.id), data.document)
      toast.success(t('success.documentSaved'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('errors.saveFailed'))
    },
  })
}

/**
 * Hook to update document without showing toast (for auto-save)
 */
export function useAutoSaveDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTemplatedDocument,
    onSuccess: (data) => {
      queryClient.setQueryData(documentTemplateKeys.userDocument(data.document.id), data.document)
    },
  })
}

/**
 * Hook to complete a templated document
 */
export function useCompleteDocument() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('document-templates')

  return useMutation({
    mutationFn: completeDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.userDocuments() })
      toast.success(t('success.documentCompleted'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('errors.saveFailed'))
    },
  })
}

/**
 * Hook to validate document fields
 */
export function useValidateDocument() {
  return useMutation({
    mutationFn: ({
      templateId,
      fieldValues,
    }: {
      templateId: string
      fieldValues: Record<string, unknown>
    }) => validateDocument(templateId, fieldValues),
  })
}

/**
 * Hook to delete a templated document
 */
export function useDeleteTemplatedDocument() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('document-templates')

  return useMutation({
    mutationFn: deleteTemplatedDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.userDocuments() })
      toast.success(t('success.documentDeleted'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('errors.deleteFailed'))
    },
  })
}

/**
 * Custom hook for wizard state management
 */
export function useDocumentWizard(templateId: string, entityType: string, entityId: string) {
  const { t } = useTranslation('document-templates')
  const queryClient = useQueryClient()

  // Get template
  const templateQuery = useDocumentTemplate(templateId)

  // Create document mutation
  const createMutation = useCreateTemplatedDocument()

  // Update mutation (for auto-save)
  const autoSaveMutation = useAutoSaveDocument()

  // Complete mutation
  const completeMutation = useCompleteDocument()

  // Start wizard - create new templated document
  const startWizard = async (title_en: string, title_ar: string) => {
    const result = await createMutation.mutateAsync({
      template_id: templateId,
      entity_type: entityType,
      entity_id: entityId,
      title_en,
      title_ar,
    })
    return result
  }

  // Save progress
  const saveProgress = async (
    documentId: string,
    fieldValues: Record<string, unknown>,
    currentSection: number,
  ) => {
    return autoSaveMutation.mutateAsync({
      id: documentId,
      field_values: fieldValues,
      current_section_order: currentSection,
    })
  }

  // Complete document
  const finish = async (documentId: string, generateDocument = true) => {
    return completeMutation.mutateAsync({
      id: documentId,
      generate_document: generateDocument,
    })
  }

  return {
    template: templateQuery.data,
    isLoading: templateQuery.isLoading,
    error: templateQuery.error,
    startWizard,
    saveProgress,
    finish,
    isStarting: createMutation.isPending,
    isSaving: autoSaveMutation.isPending,
    isCompleting: completeMutation.isPending,
  }
}
