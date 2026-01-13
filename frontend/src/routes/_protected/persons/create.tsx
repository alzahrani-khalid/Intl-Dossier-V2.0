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
  component: PersonCreatePage,
})
