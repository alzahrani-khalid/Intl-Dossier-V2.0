/**
 * Forum Dossier Layout Route
 *
 * Renders DossierShell with Outlet for nested tab routes.
 * Forum has no extra tabs (shared tabs only per D-03).
 */

import { createFileRoute, Outlet } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { DossierShell } from '@/components/dossier/DossierShell'

export const Route = createFileRoute('/_protected/dossiers/forums/$id')({
  component: ForumDossierLayout,
})

function ForumDossierLayout(): ReactElement {
  const { id } = Route.useParams()
  return (
    <DossierShell dossierId={id} dossierType="forum">
      <Outlet />
    </DossierShell>
  )
}
