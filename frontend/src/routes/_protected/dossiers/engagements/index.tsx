/**
 * Engagements List Index Route — Phase 40 (G11 closure)
 *
 * Route: /dossiers/engagements
 * Renders the unified Phase 40 EngagementsListPage (ListPageShell + EngagementsList).
 * Replaces the legacy Feature 028 Table layout so the dossiers section shares the
 * same shell, search, filter pills, week-list, and load-more aesthetic as the rest
 * of Phase 40 list pages.
 */

import { createFileRoute } from '@tanstack/react-router'
import EngagementsListPage from '@/pages/engagements/EngagementsListPage'

export const Route = createFileRoute('/_protected/dossiers/engagements/')({
  component: EngagementsListPage,
})
