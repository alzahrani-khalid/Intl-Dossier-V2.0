/**
 * Person Detail Route
 * Feature: persons-entity-management
 *
 * Route for viewing a person dossier's details.
 * Mobile-first, RTL-compatible.
 */

import { createFileRoute } from '@tanstack/react-router'
import PersonDetailPage from '@/pages/persons/PersonDetailPage'

export const Route = createFileRoute('/_protected/persons/$personId')({
  component: PersonDetailPage,
})
