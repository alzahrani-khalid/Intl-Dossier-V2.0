/**
 * Dossier Route Helpers (Edge Functions)
 *
 * Generates type-specific dossier URLs for frontend navigation.
 * Mirrors frontend/src/lib/dossier-routes.ts for backend usage.
 */

/**
 * Maps dossier types to their URL route segments.
 * Covers all 8 dossier types; segments match the frontend routeTree mounts
 * (working_groups underscore, elected-officials hyphen).
 */
export const DOSSIER_TYPE_TO_ROUTE: Record<string, string> = {
  country: 'countries',
  organization: 'organizations',
  person: 'persons',
  engagement: 'engagements',
  forum: 'forums',
  working_group: 'working_groups',
  topic: 'topics',
  elected_official: 'elected-officials',
};

/**
 * Converts a dossier type to its plural route segment, or null when the type
 * is unknown. Handles lowercase ('country'), PascalCase ('Country'), camelCase
 * humps ('WorkingGroup' → 'working_group'), and space variants.
 *
 * Returns null instead of guessing: a fabricated wrong-type segment produces a
 * link the client mounted-route guard ACCEPTS (it matches a mounted prefix) but
 * lands the user on the wrong detail page with a foreign id. null lets callers
 * suppress the affordance instead (navigation_url: null → client drops it).
 */
export function getDossierRouteSegment(type: string | undefined | null): string | null {
  if (!type) {
    return null;
  }
  const normalizedType = type
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/\s+/g, '_');
  return DOSSIER_TYPE_TO_ROUTE[normalizedType] ?? null;
}

/**
 * Generates the full detail path for a dossier, or null when the type cannot
 * be resolved (caller emits navigation_url: null → client suppresses).
 */
export function getDossierDetailPath(
  dossierId: string,
  type: string | undefined | null,
): string | null {
  const segment = getDossierRouteSegment(type);
  return segment === null ? null : `/dossiers/${segment}/${dossierId}`;
}
