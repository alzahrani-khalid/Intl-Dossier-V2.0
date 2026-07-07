import { createFileRoute } from '@tanstack/react-router'
import { useCallback, type ReactElement } from 'react'
import type { PersonCard } from '@/components/list-page'
import PersonsListPage from './-PersonsListPage'

interface DossierListSearch {
  page: number
  search?: string
}

export const Route = createFileRoute('/_protected/dossiers/persons/')({
  component: PersonsListRoute,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
  }),
})

function PersonsListRoute(): ReactElement {
  const { search } = Route.useSearch()
  const navigate = Route.useNavigate()

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

  const onPersonClick = useCallback(
    (person: PersonCard): void => {
      void navigate({ to: '/dossiers/persons/$id', params: { id: person.id } })
    },
    [navigate],
  )

  return (
    <PersonsListPage
      search={search}
      onSearchChange={onSearchChange}
      onPersonClick={onPersonClick}
    />
  )
}
