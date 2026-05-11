import { createFileRoute } from '@tanstack/react-router'
import PersonsListPage from './-PersonsListPage'

interface DossierListSearch {
  page: number
  search?: string
}

export const Route = createFileRoute('/_protected/dossiers/persons/')({
  component: PersonsListPage,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
  }),
})
