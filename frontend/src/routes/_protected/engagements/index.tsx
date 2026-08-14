/**
 * Engagements List Index Route
 * Feature: engagements-entity-management
 *
 * Route: /engagements
 * Displays the list of engagement dossiers. Shares the Phase 87-05 (AFF-02)
 * URL-state contract with /dossiers/engagements so search + type-filter survive
 * refresh/share on both mounts.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useCallback, type ReactElement } from 'react'
import type { EngagementFilter } from '@/components/list-page'
import EngagementsListPage, {
  validateEngagementsListSearch,
  type EngagementsListSearch,
} from '@/pages/engagements/EngagementsListPage'

export const Route = createFileRoute('/_protected/engagements/')({
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
