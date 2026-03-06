import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

const DossierSearchPage = lazy(() =>
  import('../../pages/DossierSearchPage').then((m) => ({
    default: m.DossierSearchPage,
  })),
)

export const Route = createFileRoute('/_protected/search')({
  component: SearchRoute,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || '',
      type: search.type as string | undefined,
      status: search.status as string | undefined,
      myDossiers: search.myDossiers as string | undefined,
    }
  },
})

function SearchRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <DossierSearchPage />
    </Suspense>
  )
}
