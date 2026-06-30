/**
 * Persons route — redirects to the canonical dossier surface.
 *
 * Persons are managed as dossiers under `/dossiers/persons`. This alias keeps
 * the legacy `/persons` URL working by redirecting to the dossier list, mirroring
 * the countries / organizations / forums pattern.
 */

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/persons')({
  beforeLoad: () => {
    throw redirect({ to: '/dossiers/persons' })
  },
})
