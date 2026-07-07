/**
 * Engagements List Index Route — Phase 40 (G11 closure) + Phase 87-05 (AFF-02)
 *
 * Route: /dossiers/engagements
 * Owns the list's search + type-filter state as validated URL params (shared
 * validateEngagementsListSearch) and threads them into the unified
 * EngagementsListPage (ListPageShell + EngagementsList). Replaces the page's
 * former local useState so the FilterPill selection and search survive
 * refresh/share — 87-08 wires the Filter popover on top of this seam.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useCallback, type ReactElement } from 'react'
import type { EngagementFilter } from '@/components/list-page'
import EngagementsListPage, {
  validateEngagementsListSearch,
  type EngagementsListSearch,
} from '@/pages/engagements/EngagementsListPage'

export const Route = createFileRoute('/_protected/dossiers/engagements/')({
  component: EngagementsListRoute,
  validateSearch: validateEngagementsListSearch,
})

function EngagementsListRoute(): ReactElement {
  const { search, type } = Route.useSearch()
  const navigate = Route.useNavigate()
  const filter: EngagementFilter = type ?? 'all'

  const onSearchChange = useCallback(
    (next: string): void => {
      void navigate({
        search: (prev: EngagementsListSearch) => ({
          ...prev,
          search: next.length > 0 ? next : undefined,
        }),
        replace: true,
      })
    },
    [navigate],
  )

  const onFilterChange = useCallback(
    (next: EngagementFilter): void => {
      void navigate({
        search: (prev: EngagementsListSearch) => ({
          ...prev,
          type: next === 'all' ? undefined : next,
        }),
        replace: true,
      })
    },
    [navigate],
  )

  return (
    <EngagementsListPage
      search={search ?? ''}
      filter={filter}
      onSearchChange={onSearchChange}
      onFilterChange={onFilterChange}
    />
  )
}
