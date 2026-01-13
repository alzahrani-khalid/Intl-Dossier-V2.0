/**
 * Organization Benchmark Types
 * Types for anonymized aggregate statistics from similar organizations
 * Used for dashboard preview before customization
 */

export interface OrganizationBenchmark {
  /** Average number of active dossiers */
  avgDossiers: number
  /** Typical range for dossiers (min-max) */
  dossierRange: { min: number; max: number }
  /** Average number of tracked relationships */
  avgRelationships: number
  /** Typical range for relationships (min-max) */
  relationshipRange: { min: number; max: number }
  /** Average number of active briefs */
  avgActiveBriefs: number
  /** Typical range for briefs (min-max) */
  briefRange: { min: number; max: number }
  /** Average number of monthly engagements */
  avgMonthlyEngagements: number
  /** Typical range for monthly engagements */
  engagementRange: { min: number; max: number }
  /** Average number of tracked commitments */
  avgCommitments: number
  /** Typical range for commitments */
  commitmentRange: { min: number; max: number }
  /** Average number of active MOUs */
  avgMous: number
  /** Typical range for MOUs */
  mouRange: { min: number; max: number }
  /** Number of similar organizations sampled (anonymized) */
  sampleSize: number
  /** Organization type/category used for comparison */
  organizationType: OrganizationType
  /** Region used for comparison */
  region: string
  /** Last updated timestamp */
  lastUpdated: string
}

export type OrganizationType =
  | 'government_ministry'
  | 'statistical_office'
  | 'diplomatic_mission'
  | 'international_organization'
  | 'regulatory_body'
  | 'research_institution'
  | 'default'

export interface BenchmarkCategory {
  id: string
  label: string
  value: number
  range: { min: number; max: number }
  icon: string
  description: string
}

export interface BenchmarkPreviewData {
  /** Whether benchmark data is available */
  isAvailable: boolean
  /** The benchmark statistics */
  benchmarks: OrganizationBenchmark | null
  /** User's current statistics for comparison */
  currentStats: CurrentOrganizationStats | null
  /** Whether user has customized their dashboard */
  hasCustomizedDashboard: boolean
  /** Whether to show the preview */
  shouldShowPreview: boolean
}

export interface CurrentOrganizationStats {
  totalDossiers: number
  totalRelationships: number
  activeBriefs: number
  monthlyEngagements: number
  activeCommitments: number
  activeMous: number
}

export interface GetBenchmarksParams {
  organizationType?: OrganizationType
  region?: string
}

export interface GetBenchmarksResponse {
  success: boolean
  data: OrganizationBenchmark | null
  error?: {
    code: string
    message_en: string
    message_ar: string
  }
}
