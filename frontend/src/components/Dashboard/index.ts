/**
 * Dashboard Components Index
 * Feature: Dossier-Centric Dashboard Redesign
 *
 * Exports all dashboard-related components.
 */

// Dossier-Centric Dashboard Components
export { DossierQuickStatsCard } from './DossierQuickStatsCard'
export { MyDossiersSection } from './MyDossiersSection'
export { RecentDossierActivity } from './RecentDossierActivity'
export { PendingWorkByDossier } from './PendingWorkByDossier'

// Re-export types for convenience
export type {
  MyDossier,
  DossierQuickStats,
  DossierActivityItem,
  PendingWorkByDossierItem,
  MyDossiersFilters,
  RecentActivityFilters,
  PendingWorkFilters,
  DossierDashboardSummary,
} from '@/types/dossier-dashboard.types'
