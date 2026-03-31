/**
 * Organization Dossier Layout Route
 *
 * Renders DossierShell with Outlet for nested tab routes.
 * Organization has an extra "MoUs" tab per D-03.
 */

import { createFileRoute, Outlet } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { DossierShell } from '@/components/dossier/DossierShell'
import type { DossierTabConfig } from '@/components/dossier/DossierTabNav'

const ORGANIZATION_EXTRA_TABS: DossierTabConfig[] = [
  { key: 'mous', labelKey: 'tabs.mous', path: 'mous' },
]

export const Route = createFileRoute('/_protected/dossiers/organizations/$id')({
  component: OrganizationDossierLayout,
})

function OrganizationDossierLayout(): ReactElement {
  const { id } = Route.useParams()
  return (
    <DossierShell dossierId={id} dossierType="organization" tabConfig={ORGANIZATION_EXTRA_TABS}>
      <Outlet />
    </DossierShell>
  )
}
