/**
 * Dossier Route Utilities
 *
 * Centralized helpers for generating type-specific dossier routes.
 * All dossier navigation should use these utilities to ensure consistency.
 */

/**
 * Maps dossier types to their URL route segments (plural form).
 */
export const DOSSIER_TYPE_TO_ROUTE: Record<string, string> = {
  country: 'countries',
  organization: 'organizations',
  person: 'persons',
  engagement: 'engagements',
  forum: 'forums',
  working_group: 'working_groups',
  topic: 'topics',
  elected_official: 'elected_officials',
}

/**
 * Get the route segment for a dossier type.
 * Handles both lowercase ('country') and PascalCase ('Country') formats.
 *
 * @param type - The dossier type (e.g., 'country', 'Country', 'working_group')
 * @returns The pluralized route segment (e.g., 'countries', 'working_groups')
 */
export function getDossierRouteSegment(type: string | undefined | null): string {
  if (!type) {
    return 'countries'
  }
  const normalizedType = type.toLowerCase().replace(/\s+/g, '_')
  return DOSSIER_TYPE_TO_ROUTE[normalizedType] ?? 'countries'
}

/**
 * Get the full path for a dossier detail page.
 *
 * @param dossierId - The dossier UUID
 * @param type - The dossier type (e.g., 'country', 'organization')
 * @returns The full route path (e.g., '/dossiers/countries/uuid')
 */
export function getDossierDetailPath(dossierId: string, type: string | undefined | null): string {
  return `/dossiers/${getDossierRouteSegment(type)}/${dossierId}`
}

/**
 * Type guard to check if a type string is a valid dossier type.
 *
 * @param type - The type string to validate
 * @returns True if the type is a known dossier type
 */
export function isValidDossierType(type: string | undefined | null): boolean {
  if (!type) {
    return false
  }
  const normalizedType = type.toLowerCase().replace(/\s+/g, '_')
  return normalizedType in DOSSIER_TYPE_TO_ROUTE
}
