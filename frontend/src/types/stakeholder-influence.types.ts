/**
 * Stakeholder Influence Visualization Types
 * Feature: stakeholder-influence-visualization
 *
 * Type definitions for stakeholder influence analysis, network visualization,
 * and strategic planning reports.
 */

// ============================================================================
// Influence Tier & Role Types
// ============================================================================

/**
 * Influence tier classification based on overall score percentile
 */
export type InfluenceTier =
  | 'key_influencer' // Top 10% - most influential stakeholders
  | 'high_influence' // 70-90th percentile
  | 'moderate_influence' // 40-70th percentile
  | 'low_influence' // 10-40th percentile
  | 'peripheral' // Bottom 10%

/**
 * Stakeholder role classification based on network position
 */
export type StakeholderRole =
  | 'hub' // High degree centrality - many direct connections
  | 'bridge' // High betweenness - connects different groups
  | 'gatekeeper' // Controls access to clusters
  | 'peripheral' // Few connections, edge of network
  | 'isolate' // No or minimal connections

/**
 * Report types for influence analysis
 */
export type InfluenceReportType =
  | 'full_network_analysis'
  | 'stakeholder_profile'
  | 'cluster_analysis'
  | 'strategic_planning'
  | 'comparison_report'
  | 'trend_analysis'

// ============================================================================
// Network Metrics Types
// ============================================================================

/**
 * Centrality metrics for network position analysis
 */
export interface CentralityMetrics {
  /** Number of direct connections (0-100 normalized) */
  degree_centrality: number
  /** Importance as a bridge between groups (0-100) */
  betweenness_centrality: number
  /** How quickly can reach all others (0-100) */
  closeness_centrality: number
  /** Connected to other influential nodes (0-100) */
  eigenvector_centrality: number
}

/**
 * Engagement metrics for influence assessment
 */
export interface EngagementMetrics {
  /** Frequency of engagements (0-100) */
  engagement_frequency: number
  /** Number of unique engagement partners (0-100) */
  engagement_reach: number
  /** Average health of relationships (0-100) */
  avg_relationship_health: number
  /** Count of strong relationships (health >= 70) */
  strong_relationships: number
  /** Count of weak relationships (health < 40) */
  weak_relationships: number
}

/**
 * Raw metrics from calculations
 */
export interface RawMetrics {
  direct_connections: number
  two_hop_connections: number
  total_engagements: number
  unique_engagement_partners: number
}

// ============================================================================
// Stakeholder Influence Types
// ============================================================================

/**
 * Stakeholder influence score summary (for lists)
 */
export interface StakeholderInfluenceSummary {
  dossier_id: string
  name_en: string
  name_ar: string
  dossier_type: string
  influence_score: number
  influence_tier: InfluenceTier
  influence_tier_label: { en: string; ar: string }
  stakeholder_role: StakeholderRole
  stakeholder_role_label: { en: string; ar: string }
  degree_centrality: number
  betweenness_centrality: number
  engagement_score: number
  avg_health: number
  strong_relationships: number
  cluster_id: number | null
  cluster_name_en: string
  cluster_name_ar: string
}

/**
 * Detailed stakeholder influence response
 */
export interface StakeholderInfluenceDetail {
  dossier_id: string
  name_en: string
  name_ar: string
  dossier_type: string
  influence_score: number
  influence_tier: InfluenceTier
  influence_tier_label: { en: string; ar: string }
  stakeholder_role: StakeholderRole
  stakeholder_role_label: { en: string; ar: string }
  metrics: CentralityMetrics & EngagementMetrics
  cluster: {
    id: number | null
    name_en: string
    name_ar: string
    role: string | null
  }
  raw_metrics: RawMetrics
  calculated_at: string
}

// ============================================================================
// Network Visualization Types
// ============================================================================

/**
 * Node in the influence network graph
 */
export interface NetworkNode {
  id: string
  name_en: string
  name_ar: string
  type: string
  influence_score: number
  influence_tier: InfluenceTier
  role: StakeholderRole
  cluster_id: number | null
  degree: number
}

/**
 * Edge in the influence network graph
 */
export interface NetworkEdge {
  source: string
  target: string
  relationship_type: string
  health_score: number | null
  weight: number
}

/**
 * Network statistics
 */
export interface NetworkStatistics {
  total_nodes: number
  total_edges: number
  avg_connections: number
  density: number
}

/**
 * Complete network visualization data
 */
export interface NetworkVisualizationData {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  statistics: NetworkStatistics
}

/**
 * Network-wide statistics
 */
export interface NetworkOverviewStatistics {
  total_stakeholders: number
  total_relationships: number
  avg_connections: number
  key_influencers: number
  clusters: number
  avg_influence_score: number
  network_density: number
}

// ============================================================================
// Cluster Types
// ============================================================================

/**
 * Network cluster/community
 */
export interface NetworkCluster {
  id: number
  name_en: string
  name_ar: string
  description_en: string | null
  description_ar: string | null
  cluster_type: 'geographic' | 'organizational' | 'thematic' | 'auto_detected'
  member_count: number
  avg_influence_score: number | null
  leader: {
    id: string
    name_en: string
    name_ar: string
  } | null
}

// ============================================================================
// Report Types
// ============================================================================

/**
 * Key finding in an influence report
 */
export interface ReportFinding {
  en: string
  ar: string
}

/**
 * Recommendation in an influence report
 */
export interface ReportRecommendation {
  en: string
  ar: string
}

/**
 * Influence report
 */
export interface InfluenceReport {
  id: string
  title_en: string
  title_ar: string
  description_en: string | null
  description_ar: string | null
  report_type: InfluenceReportType
  status: 'draft' | 'final' | 'archived'
  scope_dossier_ids: string[]
  scope_dossier_types: string[]
  report_data: {
    network_statistics: NetworkOverviewStatistics
    top_influencers: StakeholderInfluenceSummary[]
    key_connectors: KeyConnector[]
    generated_at: string
  }
  key_findings: ReportFinding[]
  recommendations: ReportRecommendation[]
  generated_at: string
  period_start: string | null
  period_end: string | null
}

/**
 * Key connector (bridge stakeholder)
 */
export interface KeyConnector {
  dossier_id: string
  name_en: string
  name_ar: string
  dossier_type: string
  groups_connected: number
  bridge_score: number
  influence_score: number
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Parameters for listing stakeholder influence scores
 */
export interface StakeholderInfluenceListParams {
  limit?: number
  offset?: number
  sort_by?:
    | 'influence_score'
    | 'degree_centrality'
    | 'betweenness_centrality'
    | 'engagement_score'
    | 'avg_health'
  sort_order?: 'asc' | 'desc'
  type?: string
  min_score?: number
}

/**
 * Parameters for getting top influencers
 */
export interface TopInfluencersParams {
  limit?: number
  type?: string
  tier?: InfluenceTier
}

/**
 * Parameters for network visualization
 */
export interface NetworkVisualizationParams {
  degrees?: number
}

/**
 * Parameters for creating a report
 */
export interface CreateReportParams {
  report_type: InfluenceReportType
  title_en: string
  title_ar: string
  description_en?: string
  description_ar?: string
  scope_dossier_ids?: string[]
  scope_dossier_types?: string[]
  period_start?: string
  period_end?: string
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    limit: number
    offset: number
    has_more: boolean
  }
}

/**
 * Calculation result response
 */
export interface CalculationResult {
  message_en: string
  message_ar: string
  stakeholders_updated: number
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get influence tier from score
 */
export function getInfluenceTierFromScore(score: number): InfluenceTier {
  if (score >= 80) return 'key_influencer'
  if (score >= 60) return 'high_influence'
  if (score >= 40) return 'moderate_influence'
  if (score >= 20) return 'low_influence'
  return 'peripheral'
}

/**
 * Get CSS color class for influence tier
 */
export function getInfluenceTierColor(tier: InfluenceTier): string {
  const colors: Record<InfluenceTier, string> = {
    key_influencer: 'text-purple-600 dark:text-purple-400',
    high_influence: 'text-blue-600 dark:text-blue-400',
    moderate_influence: 'text-teal-600 dark:text-teal-400',
    low_influence: 'text-gray-600 dark:text-gray-400',
    peripheral: 'text-gray-400 dark:text-gray-500',
  }
  return colors[tier]
}

/**
 * Get background color class for influence tier
 */
export function getInfluenceTierBgColor(tier: InfluenceTier): string {
  const colors: Record<InfluenceTier, string> = {
    key_influencer: 'bg-purple-100 dark:bg-purple-900/30',
    high_influence: 'bg-blue-100 dark:bg-blue-900/30',
    moderate_influence: 'bg-teal-100 dark:bg-teal-900/30',
    low_influence: 'bg-gray-100 dark:bg-gray-800',
    peripheral: 'bg-gray-50 dark:bg-gray-900',
  }
  return colors[tier]
}

/**
 * Get CSS color class for stakeholder role
 */
export function getStakeholderRoleColor(role: StakeholderRole): string {
  const colors: Record<StakeholderRole, string> = {
    hub: 'text-amber-600 dark:text-amber-400',
    bridge: 'text-indigo-600 dark:text-indigo-400',
    gatekeeper: 'text-rose-600 dark:text-rose-400',
    peripheral: 'text-gray-500 dark:text-gray-400',
    isolate: 'text-gray-400 dark:text-gray-500',
  }
  return colors[role]
}

/**
 * Get icon name for stakeholder role
 */
export function getStakeholderRoleIcon(role: StakeholderRole): string {
  const icons: Record<StakeholderRole, string> = {
    hub: 'Share2',
    bridge: 'GitBranch',
    gatekeeper: 'Shield',
    peripheral: 'Circle',
    isolate: 'CircleDot',
  }
  return icons[role]
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Influence tier labels
 */
export const INFLUENCE_TIER_LABELS: Record<InfluenceTier, { en: string; ar: string }> = {
  key_influencer: { en: 'Key Influencer', ar: 'مؤثر رئيسي' },
  high_influence: { en: 'High Influence', ar: 'تأثير عالي' },
  moderate_influence: { en: 'Moderate Influence', ar: 'تأثير متوسط' },
  low_influence: { en: 'Low Influence', ar: 'تأثير منخفض' },
  peripheral: { en: 'Peripheral', ar: 'هامشي' },
}

/**
 * Stakeholder role labels
 */
export const STAKEHOLDER_ROLE_LABELS: Record<StakeholderRole, { en: string; ar: string }> = {
  hub: { en: 'Hub', ar: 'محور' },
  bridge: { en: 'Bridge', ar: 'جسر' },
  gatekeeper: { en: 'Gatekeeper', ar: 'حارس بوابة' },
  peripheral: { en: 'Peripheral', ar: 'هامشي' },
  isolate: { en: 'Isolate', ar: 'معزول' },
}

/**
 * Report type labels
 */
export const REPORT_TYPE_LABELS: Record<InfluenceReportType, { en: string; ar: string }> = {
  full_network_analysis: { en: 'Full Network Analysis', ar: 'تحليل الشبكة الكامل' },
  stakeholder_profile: { en: 'Stakeholder Profile', ar: 'ملف صاحب المصلحة' },
  cluster_analysis: { en: 'Cluster Analysis', ar: 'تحليل المجموعات' },
  strategic_planning: { en: 'Strategic Planning', ar: 'التخطيط الاستراتيجي' },
  comparison_report: { en: 'Comparison Report', ar: 'تقرير المقارنة' },
  trend_analysis: { en: 'Trend Analysis', ar: 'تحليل الاتجاهات' },
}

/**
 * Metric labels
 */
export const METRIC_LABELS: Record<string, { en: string; ar: string }> = {
  degree_centrality: { en: 'Connections', ar: 'الاتصالات' },
  betweenness_centrality: { en: 'Bridge Position', ar: 'موقع الجسر' },
  closeness_centrality: { en: 'Network Reach', ar: 'الوصول للشبكة' },
  eigenvector_centrality: { en: 'Connected Influence', ar: 'التأثير المرتبط' },
  engagement_frequency: { en: 'Engagement Frequency', ar: 'تكرار التفاعل' },
  engagement_reach: { en: 'Engagement Reach', ar: 'نطاق التفاعل' },
  avg_relationship_health: { en: 'Relationship Health', ar: 'صحة العلاقة' },
  strong_relationships: { en: 'Strong Relations', ar: 'علاقات قوية' },
  weak_relationships: { en: 'Weak Relations', ar: 'علاقات ضعيفة' },
}

/**
 * Node colors for visualization based on influence tier
 */
export const NODE_COLORS: Record<InfluenceTier, string> = {
  key_influencer: '#9333ea', // purple-600
  high_influence: '#2563eb', // blue-600
  moderate_influence: '#0d9488', // teal-600
  low_influence: '#6b7280', // gray-500
  peripheral: '#9ca3af', // gray-400
}

/**
 * Edge colors for visualization based on relationship health
 */
export function getEdgeColor(healthScore: number | null): string {
  if (healthScore === null) return '#d1d5db' // gray-300
  if (healthScore >= 80) return '#22c55e' // green-500
  if (healthScore >= 60) return '#84cc16' // lime-500
  if (healthScore >= 40) return '#eab308' // yellow-500
  if (healthScore >= 20) return '#f97316' // orange-500
  return '#ef4444' // red-500
}

/**
 * Calculate node size based on influence score
 */
export function getNodeSize(influenceScore: number): number {
  const minSize = 20
  const maxSize = 60
  return minSize + (influenceScore / 100) * (maxSize - minSize)
}

/**
 * Calculate edge width based on health score
 */
export function getEdgeWidth(healthScore: number | null): number {
  const minWidth = 1
  const maxWidth = 4
  if (healthScore === null) return minWidth
  return minWidth + (healthScore / 100) * (maxWidth - minWidth)
}
