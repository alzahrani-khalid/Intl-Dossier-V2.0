/**
 * Persons List Index Route
 * Feature: persons-entity-management
 *
 * Route: /persons
 * Displays the list of person dossiers.
 */

import { createFileRoute } from '@tanstack/react-router'
import PersonsListPage from '@/pages/persons/PersonsListPage'

export const Route = createFileRoute('/_protected/persons/')({
  component: PersonsListPage,
})
