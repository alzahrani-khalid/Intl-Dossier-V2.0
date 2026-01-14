/**
 * Scenario Sandbox Types
 * Feature: Scenario Planning and What-If Analysis
 *
 * Type definitions for scenario sandbox modeling, what-if analysis,
 * and side-by-side scenario comparison.
 */

// ============================================================================
// Enums and Status Types
// ============================================================================

/**
 * Scenario status
 */
export type ScenarioStatus = 'draft' | 'active' | 'completed' | 'archived'

/**
 * Scenario type
 */
export type ScenarioType =
  | 'stakeholder_engagement'
  | 'policy_change'
  | 'relationship_impact'
  | 'resource_allocation'
  | 'strategic_planning'

/**
 * Variable change type
 */
export type VariableChangeType =
  | 'relationship_health'
  | 'stakeholder_influence'
  | 'engagement_frequency'
  | 'resource_level'
  | 'policy_status'
  | 'custom_metric'

/**
 * Impact level
 */
export type ImpactLevel = 'minimal' | 'low' | 'moderate' | 'high' | 'critical'

/**
 * Collaborator role
 */
export type CollaboratorRole = 'owner' | 'editor' | 'viewer'

// ============================================================================
// Core Entity Types
// ============================================================================

/**
 * Main scenario entity
 */
export interface Scenario {
  id: string
  title_en: string
  title_ar: string
  description_en: string | null
  description_ar: string | null
  type: ScenarioType
  status: ScenarioStatus
  base_date: string
  projection_period_days: number
  tags: string[]
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Scenario with computed fields
 */
export interface ScenarioWithStats extends Scenario {
  variable_count: number
  outcome_count: number
  positive_outcomes: number
  negative_outcomes: number
  avg_probability: number | null
  is_owner: boolean
  collaborator_count: number
}

/**
 * Scenario variable (what-if change)
 */
export interface ScenarioVariable {
  id: string
  scenario_id: string
  name_en: string
  name_ar: string
  change_type: VariableChangeType
  target_entity_type: string
  target_entity_id: string | null
  original_value: unknown
  modified_value: unknown
  sort_order: number
  created_at: string
  updated_at: string
}

/**
 * Scenario outcome (predicted result)
 */
export interface ScenarioOutcome {
  id: string
  scenario_id: string
  title_en: string
  title_ar: string
  description_en: string | null
  description_ar: string | null
  impact_level: ImpactLevel
  probability_score: number | null
  affected_entity_type: string | null
  affected_entity_id: string | null
  projected_metrics: Record<string, number> | null
  is_positive: boolean
  created_at: string
  updated_at: string
}

/**
 * Scenario comparison
 */
export interface ScenarioComparison {
  id: string
  title_en: string
  title_ar: string
  description_en: string | null
  description_ar: string | null
  scenario_ids: string[]
  comparison_metrics: string[]
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Scenario snapshot (for versioning)
 */
export interface ScenarioSnapshot {
  id: string
  scenario_id: string
  version: number
  title_en: string
  title_ar: string
  snapshot_data: unknown
  created_at: string
}

/**
 * Scenario collaborator
 */
export interface ScenarioCollaborator {
  id: string
  scenario_id: string
  user_id: string
  role: CollaboratorRole
  email?: string
  added_at: string
}

// ============================================================================
// Full Scenario Data
// ============================================================================

/**
 * Complete scenario with all related data
 */
export interface ScenarioFull {
  scenario: Scenario
  variables: ScenarioVariable[]
  outcomes: ScenarioOutcome[]
  collaborators: ScenarioCollaborator[]
}

// ============================================================================
// Comparison Types
// ============================================================================

/**
 * Scenario summary for comparison
 */
export interface ScenarioComparisonSummary {
  id: string
  title_en: string
  title_ar: string
  type: ScenarioType
  status: ScenarioStatus
  variable_count: number
  outcome_count: number
  positive_outcomes: number
  negative_outcomes: number
  avg_probability: number | null
}

/**
 * Full comparison data
 */
export interface ScenarioComparisonData {
  scenarios: ScenarioComparisonSummary[]
  total_scenarios: number
}

// ============================================================================
// API Request Types
// ============================================================================

/**
 * Create scenario request
 */
export interface CreateScenarioRequest {
  title_en: string
  title_ar: string
  description_en?: string
  description_ar?: string
  type: ScenarioType
  base_date?: string
  projection_period_days?: number
  tags?: string[]
}

/**
 * Update scenario request
 */
export interface UpdateScenarioRequest {
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  type?: ScenarioType
  status?: ScenarioStatus
  base_date?: string
  projection_period_days?: number
  tags?: string[]
}

/**
 * Create variable request
 */
export interface CreateVariableRequest {
  name_en: string
  name_ar: string
  change_type: VariableChangeType
  target_entity_type: string
  target_entity_id?: string
  original_value?: unknown
  modified_value: unknown
  sort_order?: number
}

/**
 * Update variable request
 */
export interface UpdateVariableRequest {
  name_en?: string
  name_ar?: string
  change_type?: VariableChangeType
  target_entity_type?: string
  target_entity_id?: string
  original_value?: unknown
  modified_value?: unknown
  sort_order?: number
}

/**
 * Create outcome request
 */
export interface CreateOutcomeRequest {
  title_en: string
  title_ar: string
  description_en?: string
  description_ar?: string
  impact_level?: ImpactLevel
  probability_score?: number
  affected_entity_type?: string
  affected_entity_id?: string
  projected_metrics?: Record<string, number>
  is_positive?: boolean
}

/**
 * Update outcome request
 */
export interface UpdateOutcomeRequest {
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  impact_level?: ImpactLevel
  probability_score?: number
  affected_entity_type?: string
  affected_entity_id?: string
  projected_metrics?: Record<string, number>
  is_positive?: boolean
}

/**
 * Create comparison request
 */
export interface CreateComparisonRequest {
  title_en: string
  title_ar: string
  description_en?: string
  description_ar?: string
  scenario_ids: string[]
  comparison_metrics?: string[]
}

/**
 * Clone scenario request
 */
export interface CloneScenarioRequest {
  new_title_en: string
  new_title_ar: string
}

/**
 * Add collaborator request
 */
export interface AddCollaboratorRequest {
  user_id: string
  role: CollaboratorRole
}

/**
 * List scenarios params
 */
export interface ListScenariosParams {
  limit?: number
  offset?: number
  status?: ScenarioStatus
  type?: ScenarioType
  search?: string
  sort_by?: 'created_at' | 'updated_at' | 'title_en'
  sort_order?: 'asc' | 'desc'
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    limit: number
    offset: number
    has_more: boolean
    total?: number
  }
}

/**
 * Success response
 */
export interface SuccessResponse {
  success: boolean
  message_en: string
  message_ar: string
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Variable form state
 */
export interface VariableFormState {
  name_en: string
  name_ar: string
  change_type: VariableChangeType
  target_entity_type: string
  target_entity_id: string
  original_value: string
  modified_value: string
}

/**
 * Outcome form state
 */
export interface OutcomeFormState {
  title_en: string
  title_ar: string
  description_en: string
  description_ar: string
  impact_level: ImpactLevel
  probability_score: number
  is_positive: boolean
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Scenario type labels
 */
export const SCENARIO_TYPE_LABELS: Record<ScenarioType, { en: string; ar: string }> = {
  stakeholder_engagement: { en: 'Stakeholder Engagement', ar: 'مشاركة أصحاب المصلحة' },
  policy_change: { en: 'Policy Change', ar: 'تغيير السياسة' },
  relationship_impact: { en: 'Relationship Impact', ar: 'تأثير العلاقة' },
  resource_allocation: { en: 'Resource Allocation', ar: 'تخصيص الموارد' },
  strategic_planning: { en: 'Strategic Planning', ar: 'التخطيط الاستراتيجي' },
}

/**
 * Scenario status labels
 */
export const SCENARIO_STATUS_LABELS: Record<ScenarioStatus, { en: string; ar: string }> = {
  draft: { en: 'Draft', ar: 'مسودة' },
  active: { en: 'Active', ar: 'نشط' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  archived: { en: 'Archived', ar: 'مؤرشف' },
}

/**
 * Variable change type labels
 */
export const VARIABLE_CHANGE_TYPE_LABELS: Record<VariableChangeType, { en: string; ar: string }> = {
  relationship_health: { en: 'Relationship Health', ar: 'صحة العلاقة' },
  stakeholder_influence: { en: 'Stakeholder Influence', ar: 'تأثير صاحب المصلحة' },
  engagement_frequency: { en: 'Engagement Frequency', ar: 'تكرار المشاركة' },
  resource_level: { en: 'Resource Level', ar: 'مستوى الموارد' },
  policy_status: { en: 'Policy Status', ar: 'حالة السياسة' },
  custom_metric: { en: 'Custom Metric', ar: 'مقياس مخصص' },
}

/**
 * Impact level labels
 */
export const IMPACT_LEVEL_LABELS: Record<ImpactLevel, { en: string; ar: string }> = {
  minimal: { en: 'Minimal', ar: 'الحد الأدنى' },
  low: { en: 'Low', ar: 'منخفض' },
  moderate: { en: 'Moderate', ar: 'متوسط' },
  high: { en: 'High', ar: 'عالي' },
  critical: { en: 'Critical', ar: 'حرج' },
}

/**
 * Collaborator role labels
 */
export const COLLABORATOR_ROLE_LABELS: Record<CollaboratorRole, { en: string; ar: string }> = {
  owner: { en: 'Owner', ar: 'المالك' },
  editor: { en: 'Editor', ar: 'المحرر' },
  viewer: { en: 'Viewer', ar: 'المشاهد' },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get status color class
 */
export function getStatusColor(status: ScenarioStatus): string {
  const colors: Record<ScenarioStatus, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    archived: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  }
  return colors[status]
}

/**
 * Get scenario type icon name
 */
export function getScenarioTypeIcon(type: ScenarioType): string {
  const icons: Record<ScenarioType, string> = {
    stakeholder_engagement: 'Users',
    policy_change: 'FileText',
    relationship_impact: 'GitBranch',
    resource_allocation: 'DollarSign',
    strategic_planning: 'Target',
  }
  return icons[type]
}

/**
 * Get impact level color
 */
export function getImpactLevelColor(level: ImpactLevel): string {
  const colors: Record<ImpactLevel, string> = {
    minimal: 'text-gray-500 dark:text-gray-400',
    low: 'text-blue-500 dark:text-blue-400',
    moderate: 'text-yellow-500 dark:text-yellow-400',
    high: 'text-orange-500 dark:text-orange-400',
    critical: 'text-red-500 dark:text-red-400',
  }
  return colors[level]
}

/**
 * Get impact level background color
 */
export function getImpactLevelBgColor(level: ImpactLevel): string {
  const colors: Record<ImpactLevel, string> = {
    minimal: 'bg-gray-100 dark:bg-gray-800',
    low: 'bg-blue-100 dark:bg-blue-900/30',
    moderate: 'bg-yellow-100 dark:bg-yellow-900/30',
    high: 'bg-orange-100 dark:bg-orange-900/30',
    critical: 'bg-red-100 dark:bg-red-900/30',
  }
  return colors[level]
}

/**
 * Get probability color based on score
 */
export function getProbabilityColor(score: number | null): string {
  if (score === null) return 'text-gray-400'
  if (score >= 80) return 'text-green-500 dark:text-green-400'
  if (score >= 60) return 'text-lime-500 dark:text-lime-400'
  if (score >= 40) return 'text-yellow-500 dark:text-yellow-400'
  if (score >= 20) return 'text-orange-500 dark:text-orange-400'
  return 'text-red-500 dark:text-red-400'
}

/**
 * Format probability score
 */
export function formatProbability(score: number | null): string {
  if (score === null) return 'N/A'
  return `${Math.round(score)}%`
}
