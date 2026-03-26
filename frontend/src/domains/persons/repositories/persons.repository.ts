/**
 * Persons Repository
 * @module domains/persons/repositories/persons.repository
 *
 * Plain function exports for person-related API operations.
 * Uses the shared apiClient for auth, base URL, and error handling.
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'
import type {
  PersonDossier,
  PersonFullProfile,
  PersonCreate,
  PersonUpdate,
  PersonSearchParams,
  PersonListResponse,
  PersonRole,
  PersonRoleCreate,
  PersonAffiliation,
  PersonAffiliationCreate,
  PersonRelationship,
  PersonRelationshipCreate,
  PersonNetwork,
} from '@/types/person.types'

// ============================================================================
// Person CRUD
// ============================================================================

export async function getPersons(params?: PersonSearchParams): Promise<PersonListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set('search', params.search)
  if (params?.organization_id) searchParams.set('organization_id', params.organization_id)
  if (params?.nationality_id) searchParams.set('nationality_id', params.nationality_id)
  if (params?.importance_level)
    searchParams.set('importance_level', String(params.importance_level))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))

  return apiGet<PersonListResponse>(`/persons?${searchParams}`)
}

export async function getPerson(id: string): Promise<PersonFullProfile> {
  return apiGet<PersonFullProfile>(`/persons/${id}`)
}

export async function createPerson(data: PersonCreate): Promise<PersonDossier> {
  return apiPost<PersonDossier>('/persons', data)
}

export async function updatePerson(
  id: string,
  updates: PersonUpdate,
): Promise<PersonFullProfile> {
  return apiPatch<PersonFullProfile>(`/persons/${id}`, updates)
}

export async function archivePerson(id: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/persons/${id}`)
}

// ============================================================================
// Person Network
// ============================================================================

export async function getPersonNetwork(id: string, depth: number = 1): Promise<PersonNetwork> {
  return apiGet<PersonNetwork>(`/persons/${id}/network?depth=${depth}`)
}

// ============================================================================
// Person Roles
// ============================================================================

export async function addPersonRole(
  personId: string,
  role: PersonRoleCreate,
): Promise<PersonRole> {
  return apiPost<PersonRole>(`/persons/${personId}/roles`, role)
}

export async function deletePersonRole(
  personId: string,
  roleId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/persons/${personId}/roles?role_id=${roleId}`)
}

// ============================================================================
// Person Affiliations
// ============================================================================

export async function addPersonAffiliation(
  personId: string,
  affiliation: PersonAffiliationCreate,
): Promise<PersonAffiliation> {
  return apiPost<PersonAffiliation>(`/persons/${personId}/affiliations`, affiliation)
}

export async function deletePersonAffiliation(
  personId: string,
  affiliationId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    `/persons/${personId}/affiliations?affiliation_id=${affiliationId}`,
  )
}

// ============================================================================
// Person Relationships
// ============================================================================

export async function addPersonRelationship(
  personId: string,
  relationship: PersonRelationshipCreate,
): Promise<PersonRelationship> {
  return apiPost<PersonRelationship>(`/persons/${personId}/relationships`, relationship)
}

export async function deletePersonRelationship(
  personId: string,
  relationshipId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    `/persons/${personId}/relationships?relationship_id=${relationshipId}`,
  )
}
