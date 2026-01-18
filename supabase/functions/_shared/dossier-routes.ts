/**
 * Dossier Route Helpers (Edge Functions)
 *
 * Generates type-specific dossier URLs for frontend navigation.
 * Mirrors frontend/src/lib/dossier-routes.ts for backend usage.
 */

export const DOSSIER_TYPE_TO_ROUTE: Record<string, string> = {
  country: 'countries',
  organization: 'organizations',
  person: 'persons',
  engagement: 'engagements',
  forum: 'forums',
  working_group: 'working_groups',
  topic: 'topics',
};

/**
 * Converts a dossier type to its plural route segment.
 * Handles both lowercase ('country') and PascalCase ('Country') formats.
 */
export function getDossierRouteSegment(type: string | undefined | null): string {
  if (!type) {
    return 'countries';
  }
  const normalizedType = type.toLowerCase().replace(/\s+/g, '_');
  return DOSSIER_TYPE_TO_ROUTE[normalizedType] ?? 'countries';
}

/**
 * Generates the full detail path for a dossier.
 */
export function getDossierDetailPath(dossierId: string, type: string | undefined | null): string {
  return `/dossiers/${getDossierRouteSegment(type)}/${dossierId}`;
}
