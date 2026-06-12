// OVRERR-02: server/DB-sourced navigation URLs must resolve to MOUNTED routes.
// Folds in the R-05/WR-01 URL-safety rules from ActivityList (relative-only,
// // and \ rejection). Static allowlist — see 66-RESEARCH A1 for why not matchRoute
// (arbitrary-string matchRoute API stability is unverified; the dead-link set is tiny
// and an allowlist is trivially testable).
// Source of truth: routeTree.gen.ts fullPath inventory, line-verified 2026-06-13.
const MOUNTED_DETAIL_PREFIXES: readonly RegExp[] = [
  /^\/tasks\/[^/]+$/,
  /^\/intake\/tickets\/[^/]+$/,
  /^\/positions\/[^/]+/,
  /^\/engagements\/[^/]+/,
  /^\/after-actions\/[^/]+/,
  /^\/dossiers\/(countries|organizations|forums|topics|working_groups|persons|elected-officials|engagements)\/[^/]+/,
  /^\/commitments(\?|$)/,
  /^\/mous$/,
  /^\/calendar$/,
  /^\/activity$/,
]

/**
 * Resolve a server/DB/localStorage-sourced navigation URL to a mounted in-app
 * route, or null when the target is unmounted or unsafe.
 *
 * Returns the input unchanged when it is a safe, relative path that matches a
 * mounted route prefix. Returns null for unmounted detail routes
 * (e.g. /mous/<id>, /documents/<id>, /calendar/<id>) and for any open-redirect
 * surface (absolute URLs, protocol-relative `//`, backslash variants, schemes,
 * empty/non-string input).
 */
export function resolveTimelineNavUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw === '') return null
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return null
  const pathOnly = raw.split('?')[0] ?? raw
  return MOUNTED_DETAIL_PREFIXES.some((re) => re.test(pathOnly) || re.test(raw)) ? raw : null
}
