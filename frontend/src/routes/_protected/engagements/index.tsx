/**
 * Engagements List Index Route
 * Feature: engagements-entity-management
 *
 * Route: /engagements
 * Displays the list of engagement dossiers.
 */

import { createFileRoute } from '@tanstack/react-router'
import EngagementsListPage from '@/pages/engagements/EngagementsListPage'

export const Route = createFileRoute('/_protected/engagements/')({
  component: EngagementsListPage,
})
