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
import {
  parseListControlsSearch,
  useListControls,
} from '@/components/list-controls/useListControls'
import { useDossierDrawer } from '@/hooks/useDossierDrawer'
import { usePeekStore, type PeekRegistration } from '@/store/peekStore'
import EngagementsListPage, {
  engagementsListConfig,
  validateEngagementsListSearch,
  type EngagementsListSearch,
} from '@/pages/engagements/EngagementsListPage'
import type { EngagementRow } from '@/components/list-page'

export const Route = createFileRoute('/_protected/dossiers/engagements/')({
  component: EngagementsListRoute,
  validateSearch: (raw: Record<string, unknown>): EngagementsListSearch => ({
    ...validateEngagementsListSearch(raw),
    ...parseListControlsSearch(raw, engagementsListConfig),
  }),
})

function EngagementsListRoute(): ReactElement {
  const routeSearch = Route.useSearch()
  const navigate = Route.useNavigate()
  const { openDossier } = useDossierDrawer()
  const { search, type } = routeSearch
  const filter: EngagementFilter = type ?? 'all'

  const setSearch = useCallback(
    (reducer: (prev: Record<string, unknown>) => Record<string, unknown>): void => {
      void navigate({
        search: (prev: Record<string, unknown>) => reducer(prev),
        replace: true,
      } as unknown as Parameters<typeof navigate>[0])
    },
    [navigate],
  )

  const controls = useListControls(
    engagementsListConfig,
    routeSearch as Record<string, unknown>,
    setSearch,
  )

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
      controls.setFilter('type', next === 'all' ? undefined : next)
    },
    [controls],
  )

  const onClearFilters = useCallback((): void => {
    void navigate({
      search: (prev: EngagementsListSearch) => ({
        ...prev,
        search: undefined,
        type: undefined,
      }),
      replace: true,
    })
  }, [navigate])

  const onCreate = useCallback((): void => {
    void navigate({ to: '/dossiers/engagements/create' })
  }, [navigate])

  const onEngagementOpen = useCallback(
    (row: EngagementRow, registration: PeekRegistration): void => {
      usePeekStore.getState().register(registration)
      openDossier({ id: row.id, type: 'engagement' })
    },
    [openDossier],
  )

  return (
    <EngagementsListPage
      search={search ?? ''}
      filter={filter}
      onSearchChange={onSearchChange}
      onFilterChange={onFilterChange}
      controls={controls}
      onClearFilters={onClearFilters}
      onCreate={onCreate}
      onEngagementOpen={onEngagementOpen}
    />
  )
}
