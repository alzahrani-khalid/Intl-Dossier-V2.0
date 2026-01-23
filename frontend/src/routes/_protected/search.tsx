import { createFileRoute } from '@tanstack/react-router'
import { DossierSearchPage } from '../../pages/DossierSearchPage'

export const Route = createFileRoute('/_protected/search')({
  component: DossierSearchPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || '',
      type: search.type as string | undefined,
      status: search.status as string | undefined,
      myDossiers: search.myDossiers as string | undefined,
    }
  },
})
