/**
 * Entity Comparison Route
 * @feature entity-comparison-view
 *
 * Route for the entity comparison page.
 * Supports URL parameters for direct linking to comparisons.
 */

import { createFileRoute } from '@tanstack/react-router'
import { EntityComparisonPage } from '@/pages/entity-comparison'
import type { ComparisonViewMode, ComparisonUrlState } from '@/types/entity-comparison.types'
import type { DossierType } from '@/lib/dossier-type-guards'

// Valid dossier types for validation
const VALID_DOSSIER_TYPES: DossierType[] = [
  'country',
  'organization',
  'person',
  'engagement',
  'forum',
  'working_group',
  'topic',
]

// Valid view modes
const VALID_VIEW_MODES: ComparisonViewMode[] = ['table', 'side_by_side', 'highlights_only']

// Search params interface
interface CompareSearchParams {
  type?: DossierType
  ids?: string
  view?: ComparisonViewMode
  diff?: boolean
}

export const Route = createFileRoute('/_protected/compare')({
  validateSearch: (search: Record<string, unknown>): CompareSearchParams => {
    const type = search.type as string | undefined
    const ids = search.ids as string | undefined
    const view = search.view as string | undefined
    const diff = search.diff

    return {
      type: VALID_DOSSIER_TYPES.includes(type as DossierType) ? (type as DossierType) : undefined,
      ids: typeof ids === 'string' && ids.length > 0 ? ids : undefined,
      view: VALID_VIEW_MODES.includes(view as ComparisonViewMode)
        ? (view as ComparisonViewMode)
        : undefined,
      diff: diff === 'true' || diff === true,
    }
  },
  component: CompareRoute,
})

function CompareRoute() {
  const { type, ids, view, diff } = Route.useSearch()

  const initialState: ComparisonUrlState = {
    type,
    ids,
    view: view || 'table',
    diff: diff || false,
  }

  return <EntityComparisonPage initialState={initialState} />
}
