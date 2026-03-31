/**
 * Elected Official Detail Layout Route
 * Uses DossierShell with extra Committees tab.
 *
 * IMPORTANT: dossierType="elected_official" is for ROUTING purposes.
 * getDossierRouteSegment maps elected_official -> 'elected-officials'.
 * The underlying dossier record has type='person' in the database.
 */

import type { ReactElement } from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DossierShell } from '@/components/dossier/DossierShell'
import type { DossierTabConfig } from '@/components/dossier/DossierTabNav'

const EO_EXTRA_TABS: DossierTabConfig[] = [
  { key: 'committees', labelKey: 'tabs.committees', path: 'committees' },
]

export const Route = createFileRoute('/_protected/dossiers/elected-officials/$id')({
  component: ElectedOfficialLayout,
})

function ElectedOfficialLayout(): ReactElement {
  const { id } = Route.useParams()
  return (
    <DossierShell dossierId={id} dossierType="elected_official" tabConfig={EO_EXTRA_TABS}>
      <Outlet />
    </DossierShell>
  )
}
