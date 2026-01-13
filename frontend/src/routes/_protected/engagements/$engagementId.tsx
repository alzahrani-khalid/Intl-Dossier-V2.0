/**
 * Engagement Detail Route
 * Feature: engagements-entity-management
 *
 * Route for viewing an engagement dossier's details.
 * Mobile-first, RTL-compatible.
 */

import { createFileRoute } from '@tanstack/react-router'
import EngagementDetailPage from '@/pages/engagements/EngagementDetailPage'

export const Route = createFileRoute('/_protected/engagements/$engagementId')({
  component: EngagementDetailPage,
})
