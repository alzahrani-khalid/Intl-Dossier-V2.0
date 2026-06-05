/**
 * Elected Official Tasks Tab Route
 * Lazy-loads the DossierWorkItemsTab component.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const DossierWorkItemsTab = lazy(() =>
  import('@/components/dossier/tabs/DossierWorkItemsTab').then((m) => ({
    default: m.DossierWorkItemsTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/elected-officials/$id/tasks')({
  component: ElectedOfficialTasksTab,
})

function ElectedOfficialTasksTab(): ReactElement {
  const { id } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierWorkItemsTab dossierId={id} />
    </Suspense>
  )
}
