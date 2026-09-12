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
import { DOSSIER_CARD_TYPES, type DossierCardType } from '@/lib/dossier-type-guards'

// This surface DISPLAYS dossier kinds, so its whitelist is the CARD set (the DB-7 plus
// elected_official), derived from @/lib/dossier-type-guards rather than restated here —
// a restated copy is what left /compare one type short of the other three surfaces.
// `?type=` is attacker-controllable, so this stays a WHITELIST: membership is tested on
// the raw value and the guard narrows it, so nothing is cast through the test.
function isValidCompareType(value: unknown): value is DossierCardType {
  return typeof value === 'string' && (DOSSIER_CARD_TYPES as readonly string[]).includes(value)
}

// Valid view modes
const VALID_VIEW_MODES: ComparisonViewMode[] = ['table', 'side_by_side', 'highlights_only']

// Search params interface
interface CompareSearchParams {
  type?: DossierCardType
  ids?: string
  view?: ComparisonViewMode
  diff?: boolean
}

export const Route = createFileRoute('/_protected/compare')({
  validateSearch: (search: Record<string, unknown>): CompareSearchParams => {
    const ids = search.ids as string | undefined
    const view = search.view as string | undefined
    const diff = search.diff

    return {
      type: isValidCompareType(search.type) ? search.type : undefined,
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
