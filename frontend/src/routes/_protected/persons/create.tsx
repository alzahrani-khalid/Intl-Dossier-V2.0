/**
 * Person Create Route
 * Feature: persons-entity-management
 *
 * Route for creating a new person dossier.
 * Mobile-first, RTL-compatible.
 */

import { createFileRoute } from '@tanstack/react-router'
import PersonCreatePage from '@/pages/persons/PersonCreatePage'

export const Route = createFileRoute('/_protected/persons/create')({
  // Optional deep-link prefill: an org dossier's "Add key contact" action links
  // here with ?organization_id=<id> to pre-link the new person to that org.
  validateSearch: (search: Record<string, unknown>): { organization_id?: string } => ({
    organization_id:
      typeof search.organization_id === 'string' ? search.organization_id : undefined,
  }),
  component: PersonCreatePage,
})
