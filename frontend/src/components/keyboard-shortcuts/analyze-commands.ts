/**
 * Cmd+K "Analyze:" command derivation (GRAPH-02, D-02/D-03/D-04).
 *
 * Pure helper consumed by CommandPalette: given the current `location.pathname`,
 * derive the parameterized analytic-graph commands. On a dossier route it reads
 * the dossier id from the path (the `cmd-generate-briefing` pathname-regex idiom)
 * and produces a deep-link to the Network panel's Analyze mode at
 * `/relationships/graph?dossierId=<id>&mode=analyze&query=<type>` (entity pre-filled).
 *
 * Off a dossier route there is no entity to pre-fill, so no entries are produced
 * (the picker's manual-entry path lives in the panel itself).
 *
 * Labels here are the canonical English contract strings; CommandPalette overrides
 * them with the localized `keyboard-shortcuts:quickActions.analyze*` labels when it
 * builds the rendered `QuickActionItem`s. Keeping this helper i18n-free makes the
 * deep-link contract unit-testable without mounting the 1557-line palette.
 */

import { DOSSIER_TYPE_TO_ROUTE } from '@/lib/dossier-routes'

/** The four analytic query templates dispatched by the `query_graph` RPC. */
export type AnalyticQueryType =
  | 'forum_membership'
  | 'shared_committees'
  | 'engagement_chain'
  | 'shortest_path'

/** A pure, i18n-free description of a Cmd+K "Analyze:" command. */
export interface AnalyzeCommandAction {
  /** Stable command id, e.g. `cmd-analyze-forum-membership`. */
  id: string
  /** Canonical English label (CommandPalette swaps in the localized label). */
  label: string
  /** The query template this command launches. */
  queryType: AnalyticQueryType
  /** Deep-link into the Network panel Analyze mode with the entity pre-filled. */
  deepLink: string
}

interface AnalyzeTemplate {
  idSuffix: string
  queryType: AnalyticQueryType
  /** Canonical English label fragment (matches the UI-SPEC Copywriting Contract). */
  labelSuffix: string
}

/** Stable order of the analyze templates surfaced in Cmd+K. */
const ANALYZE_TEMPLATES: readonly AnalyzeTemplate[] = [
  {
    idSuffix: 'forum-membership',
    queryType: 'forum_membership',
    labelSuffix: 'Who sits on which forum',
  },
  {
    idSuffix: 'shared-committees',
    queryType: 'shared_committees',
    labelSuffix: 'Shared committees',
  },
  {
    idSuffix: 'engagement-chains',
    queryType: 'engagement_chain',
    labelSuffix: 'Engagement chains',
  },
  {
    idSuffix: 'shortest-path',
    queryType: 'shortest_path',
    labelSuffix: 'How are these connected',
  },
]

/**
 * Extract the current dossier id from a pathname of the shape
 * `/dossiers/{segment}/{id}` where `{segment}` is one of the known route
 * segments (countries, organizations, persons, …). Returns `null` when the
 * pathname is not a dossier detail route (no entity to pre-fill).
 */
export function extractDossierIdFromPathname(pathname: string): string | null {
  const segments = Object.values(DOSSIER_TYPE_TO_ROUTE).join('|')
  // /dossiers/<segment>/<id>[/...] — capture the id, allow trailing path/query.
  const match = new RegExp(`^/dossiers/(?:${segments})/([^/?#]+)`).exec(pathname)
  const id = match?.[1]
  return id != null && id.length > 0 ? id : null
}

/**
 * Build the Analyze-mode deep-link for a query type, pre-filling the dossier
 * entity. Only the (already-accessible) anchor id + query type travel in the
 * URL — never result content (threat T-71-05-INFO-DEEPLINK).
 */
export function buildAnalyzeDeepLink(dossierId: string, queryType: AnalyticQueryType): string {
  const params = new URLSearchParams({
    dossierId,
    mode: 'analyze',
    query: queryType,
  })
  return `/relationships/graph?${params.toString()}`
}

/**
 * Derive the Cmd+K "Analyze:" commands for the current route. Returns an empty
 * array off a dossier route (no entity to pre-fill).
 */
export function getAnalyzeCommandActions(pathname: string): AnalyzeCommandAction[] {
  const dossierId = extractDossierIdFromPathname(pathname)
  if (dossierId == null) {
    return []
  }

  return ANALYZE_TEMPLATES.map((template) => ({
    id: `cmd-analyze-${template.idSuffix}`,
    label: `Analyze: ${template.labelSuffix}`,
    queryType: template.queryType,
    deepLink: buildAnalyzeDeepLink(dossierId, template.queryType),
  }))
}
