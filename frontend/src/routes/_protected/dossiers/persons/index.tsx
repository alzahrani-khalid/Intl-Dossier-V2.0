import { createFileRoute } from '@tanstack/react-router'
import { useCallback, type ReactElement } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { PersonCard } from '@/components/list-page'
import {
  parseListControlsSearch,
  useListControls,
} from '@/components/list-controls/useListControls'
import { personKeys } from '@/domains/persons/hooks/usePersons'
import { getPersons } from '@/domains/persons/repositories/persons.repository'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDossierDrawer } from '@/hooks/useDossierDrawer'
import { usePeekStore, type PeekRegistration } from '@/store/peekStore'
import PersonsListPage, { PERSONS_PAGE_SIZE, personsListConfig } from './-PersonsListPage'
import type { ImportanceLevel } from '@/types/person.types'

interface DossierListSearch {
  page: number
  search?: string
  importance?: string
  cols?: string
}

export const Route = createFileRoute('/_protected/dossiers/persons/')({
  component: PersonsListRoute,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => {
    const controls = parseListControlsSearch(search, personsListConfig)
    return {
      page: Math.max(1, Number(search.page) || 1),
      search:
        typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
      importance: controls.importance,
      cols: controls.cols,
    }
  },
})

function PersonsListRoute(): ReactElement {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const { openDossier } = useDossierDrawer()

  const setSearch = useCallback(
    (reducer: (prev: Record<string, unknown>) => Record<string, unknown>): void => {
      void navigate({
        search: (prev: Record<string, unknown>) => reducer(prev),
        replace: true,
      } as unknown as Parameters<typeof navigate>[0])
    },
    [navigate],
  )

  const controls = useListControls(personsListConfig, search as Record<string, unknown>, setSearch)

  const onSearchChange = useCallback(
    (next: string): void => {
      void navigate({
        search: (prev: DossierListSearch) => ({
          ...prev,
          search: next.length > 0 ? next : undefined,
          page: 1,
        }),
        replace: true,
      })
    },
    [navigate],
  )

  const importance =
    controls.filters.importance !== undefined
      ? (Number(controls.filters.importance) as ImportanceLevel)
      : undefined

  // Same debounce as -PersonsListPage.tsx so neighbor-page fetches use the SAME
  // effective search term as the visible rows the peek window registered from.
  const debouncedSearch = useDebouncedValue(search.search ?? '', 250)

  const fetchPage = useCallback(
    async (page: number): Promise<string[]> => {
      const params = {
        search: debouncedSearch !== '' ? debouncedSearch : undefined,
        importance_level: importance,
        limit: PERSONS_PAGE_SIZE,
        offset: (page - 1) * PERSONS_PAGE_SIZE,
      }
      const res = await queryClient.fetchQuery({
        queryKey: personKeys.list(params),
        queryFn: () => getPersons(params),
        staleTime: 30_000,
      })
      return res.data.map((person) => person.id)
    },
    [queryClient, debouncedSearch, importance],
  )

  const onPersonOpen = useCallback(
    (person: PersonCard, registration: PeekRegistration): void => {
      usePeekStore.getState().register({ ...registration, fetchPage })
      openDossier({ id: person.id, type: 'person' })
    },
    [fetchPage, openDossier],
  )

  const onClearFilters = useCallback((): void => {
    void navigate({
      search: (prev: DossierListSearch) => ({
        ...prev,
        search: undefined,
        importance: undefined,
        page: 1,
      }),
      replace: true,
    })
  }, [navigate])

  const onCreate = useCallback((): void => {
    void navigate({ to: '/dossiers/persons/create' })
  }, [navigate])

  const onPersonClick = useCallback((_person: PersonCard): void => {
    // Route instances use onPersonOpen; this fallback keeps direct page harnesses stable.
  }, [])

  return (
    <PersonsListPage
      search={search.search}
      page={search.page}
      controls={controls}
      onSearchChange={onSearchChange}
      onClearFilters={onClearFilters}
      onCreate={onCreate}
      onPersonClick={onPersonClick}
      onPersonOpen={onPersonOpen}
    />
  )
}
