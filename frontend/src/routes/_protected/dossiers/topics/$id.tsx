/**
 * Topic Dossier Layout Route
 *
 * Renders DossierShell with Outlet for nested tab routes.
 * Topic has an extra "Positions" tab per D-03.
 */

import { createFileRoute, Outlet } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { DossierShell } from '@/components/dossier/DossierShell'
import type { DossierTabConfig } from '@/components/dossier/DossierTabNav'

const TOPIC_EXTRA_TABS: DossierTabConfig[] = [
  { key: 'positions', labelKey: 'tabs.positions', path: 'positions' },
]

export const Route = createFileRoute('/_protected/dossiers/topics/$id')({
  component: TopicDossierLayout,
})

function TopicDossierLayout(): ReactElement {
  const { id } = Route.useParams()
  return (
    <DossierShell dossierId={id} dossierType="topic" tabConfig={TOPIC_EXTRA_TABS}>
      <Outlet />
    </DossierShell>
  )
}
