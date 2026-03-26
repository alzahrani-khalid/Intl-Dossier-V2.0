/**
 * Tags Repository
 * @module domains/tags/repositories/tags.repository
 *
 * Tag hierarchy, entity template, and contextual suggestion API operations.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'

// ============================================================================
// Tag Hierarchy
// ============================================================================

export async function getTagHierarchy(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/tag-hierarchy${query ? `?${query}` : ''}`)
}

export async function createTag(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/tag-hierarchy', data)
}

export async function updateTag(id: string, data: Record<string, unknown>): Promise<unknown> {
  return apiPut(`/tag-hierarchy/${id}`, data)
}

export async function deleteTag(id: string): Promise<unknown> {
  return apiDelete(`/tag-hierarchy/${id}`)
}

// ============================================================================
// Entity Templates
// ============================================================================

export async function getEntityTemplates(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/entity-templates${query ? `?${query}` : ''}`)
}

export async function getEntityTemplate(id: string): Promise<unknown> {
  return apiGet(`/entity-templates?id=${id}`)
}

export async function createEntityTemplate(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/entity-templates', data)
}

export async function updateEntityTemplate(data: Record<string, unknown>): Promise<unknown> {
  return apiPut('/entity-templates', data)
}

export async function deleteEntityTemplate(templateId: string): Promise<unknown> {
  return apiDelete(`/entity-templates?id=${templateId}`)
}

export async function applyEntityTemplate(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/entity-templates', { ...data, action: 'apply' })
}

// ============================================================================
// Contextual Suggestions
// ============================================================================

export async function getContextualSuggestions(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/contextual-suggestions?${params.toString()}`)
}
