/**
 * Dossiers List Page (Feature 028 - Enhanced)
 *
 * Enhanced dossier list view with:
 * - Header statistics cards with click-to-filter functionality
 * - Expandable dossier cards combining map/flag with an expandable-card interaction pattern
 * - Mobile-first, RTL-compatible, WCAG AA compliant
 */

import { createFileRoute } from '@tanstack/react-router'
import { DossierListPage } from '@/pages/dossiers/DossierListPage'

export const Route = createFileRoute('/_protected/dossiers/')({
  component: DossierListPage,
})
