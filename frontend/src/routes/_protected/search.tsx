import { createFileRoute } from '@tanstack/react-router'
import { SearchPage } from '../../pages/SearchPage'

export const Route = createFileRoute('/_protected/search')({
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || '',
      type: search.type as string | undefined,
      includeArchived: search.includeArchived as string | undefined,
    }
  },
})
