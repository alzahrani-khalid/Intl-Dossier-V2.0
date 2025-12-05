/**
 * Dossier Create Route
 *
 * Static route for creating new dossiers.
 * This route takes precedence over /$id.tsx when navigating to /dossiers/create
 */

import { createFileRoute } from '@tanstack/react-router'
import { DossierCreatePage } from '@/pages/dossiers/DossierCreatePage'

export const Route = createFileRoute('/_protected/dossiers/create')({
  component: DossierCreatePage,
})
