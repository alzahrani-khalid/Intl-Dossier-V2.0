import { createFileRoute } from '@tanstack/react-router'
import { DossierSearchPage } from '@/pages/DossierSearchPage'

interface SearchParams {
  q?: string
  type?: string
  status?: string
  myDossiers?: string
}

export const Route = createFileRoute('/_protected/search')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      q: search.q as string | undefined,
      type: search.type as string | undefined,
      status: search.status as string | undefined,
      myDossiers: search.myDossiers as string | undefined,
    }
  },
  component: DossierSearchPage,
})
