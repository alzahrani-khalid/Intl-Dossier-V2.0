/**
 * Country Dossier Layout Route
 *
 * Renders DossierShell with Outlet for nested tab routes.
 * Country has an extra "Positions" tab per D-03.
 */

import { createFileRoute, Outlet } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { DossierShell } from '@/components/dossier/DossierShell'
import type { DossierTabConfig } from '@/components/dossier/DossierTabNav'

const COUNTRY_EXTRA_TABS: DossierTabConfig[] = [
  { key: 'positions', labelKey: 'tabs.positions', path: 'positions' },
]

export const Route = createFileRoute('/_protected/dossiers/countries/$id')({
  component: CountryDossierLayout,
})

function CountryDossierLayout(): ReactElement {
  const { id } = Route.useParams()
  return (
    <DossierShell dossierId={id} dossierType="country" tabConfig={COUNTRY_EXTRA_TABS}>
      <Outlet />
    </DossierShell>
  )
}
