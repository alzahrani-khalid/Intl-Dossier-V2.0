import { createFileRoute } from '@tanstack/react-router'
import { TopicsListPage } from './-TopicsListPage'

interface DossierListSearch {
  page: number
  search?: string
}

export const Route = createFileRoute('/_protected/dossiers/topics/')({
  component: TopicsListPage,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
  }),
})
