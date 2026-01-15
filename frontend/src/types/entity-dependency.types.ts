/**
 * Entity Dependency and Impact Assessment Types
 * Feature: entity-dependency-impact
 *
 * Types for dependency visualization and impact assessment system
 */

// ============================================================================
// Dependency Types
// ============================================================================

export type DependencyType =
  | 'direct'
  | 'transitive'
  | 'commitment'
  | 'working_group'
  | 'document'
  | 'position'
  | 'event'

export type ImpactSeverity = 'critical' | 'high' | 'medium' | 'low' | 'none'

export type ImpactCategory =
  | 'stakeholder'
  | 'commitment'
  | 'working_group'
  | 'relationship'
  | 'document'
  | 'event'
  | 'policy'
  | 'operational'

export type ChangeType =
  | 'create'
  | 'update'
  | 'delete'
  | 'archive'
  | 'relationship_add'
  | 'relationship_remove'
  | 'status_change'
  | 'ownership_change'

export type AssessmentStatus = 'pending' | 'reviewed' | 'acknowledged' | 'actioned'

// ============================================================================
// Dependency Graph Types
// ============================================================================

export interface DependencyNode {
  id: string
  name_en: string
  name_ar: string
  type: string
  status?: string
  depth: number
  dependency_type: DependencyType
  is_source?: boolean
}

export interface DependencyEdge {
  id: string
  source: string
  target: string
  relationship_type: string
  depth: number
}

export interface DependencyStats {
  direct_dependencies: number
  transitive_dependencies: number
  commitment_dependencies: number
  by_type: Record<string, number>
}

export interface DependencyGraph {
  source_entity_id: string
  source_entity_type: string
  computed_at: string
  max_depth_searched: number
  actual_depth: number
  total_nodes: number
  total_edges: number
  nodes: DependencyNode[]
  edges: DependencyEdge[]
  stats: DependencyStats
}

// ============================================================================
// Impact Assessment Types
// ============================================================================

export interface AffectedEntity {
  id: string
  affected_entity_id: string
  affected_entity_type: string
  affected_entity_name_en: string
  affected_entity_name_ar: string
  dependency_type: DependencyType
  dependency_path: string[]
  depth: number
  impact_category: ImpactCategory
  impact_severity: ImpactSeverity
  impact_description_en: string
  impact_description_ar: string
  action_required: boolean
  suggested_action_en?: string
  suggested_action_ar?: string
  created_at: string
}

export interface ImpactAssessment {
  id: string
  source_entity_id: string
  source_entity_type: string
  change_type: ChangeType
  change_description_en: string
  change_description_ar: string
  changed_fields: string[]
  overall_severity: ImpactSeverity
  total_affected_entities: number
  assessment_summary_en: string
  assessment_summary_ar: string
  impacts: DependencyGraph
  recommendations_en: string[]
  recommendations_ar: string[]
  assessed_at: string
  created_by?: string
  status: AssessmentStatus
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  affected_entities?: AffectedEntity[]
}

export interface ImpactSummary {
  entity_id: string
  total_dependencies: number
  recent_assessments: {
    id: string
    change_type: ChangeType
    overall_severity: ImpactSeverity
    total_affected: number
    assessed_at: string
    status: AssessmentStatus
  }[]
  pending_reviews: number
  critical_impacts: number
}

// ============================================================================
// Dependency Rule Types
// ============================================================================

export interface DependencyRule {
  id: string
  name_en: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  source_entity_types: string[]
  target_entity_types: string[]
  relationship_types: string[]
  dependency_type: DependencyType
  base_severity: ImpactSeverity
  severity_multiplier: number
  impact_categories: ImpactCategory[]
  conditions: Record<string, unknown>
  is_active: boolean
  priority: number
  created_at: string
  updated_at: string
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateAssessmentRequest {
  entity_id: string
  change_type: ChangeType
  changed_fields?: string[]
}

export interface UpdateAssessmentRequest {
  status?: AssessmentStatus
  review_notes?: string
}

export interface AssessmentListParams {
  entity_id?: string
  status?: AssessmentStatus
  severity?: ImpactSeverity
  limit?: number
  offset?: number
}

export interface AssessmentListResponse {
  data: ImpactAssessment[]
  pagination: {
    total: number | null
    limit: number
    offset: number
    has_more: boolean
  }
}

// ============================================================================
// UI Helper Types
// ============================================================================

export interface SeverityConfig {
  label: { en: string; ar: string }
  color: string
  bgColor: string
  icon: string
}

export const SEVERITY_CONFIGS: Record<ImpactSeverity, SeverityConfig> = {
  critical: {
    label: { en: 'Critical', ar: 'حرج' },
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: 'AlertTriangle',
  },
  high: {
    label: { en: 'High', ar: 'عالي' },
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'AlertCircle',
  },
  medium: {
    label: { en: 'Medium', ar: 'متوسط' },
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: 'Info',
  },
  low: {
    label: { en: 'Low', ar: 'منخفض' },
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'CheckCircle',
  },
  none: {
    label: { en: 'None', ar: 'لا يوجد' },
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    icon: 'Minus',
  },
}

export const CATEGORY_LABELS: Record<ImpactCategory, { en: string; ar: string }> = {
  stakeholder: { en: 'Stakeholder', ar: 'أصحاب المصلحة' },
  commitment: { en: 'Commitment', ar: 'الالتزام' },
  working_group: { en: 'Working Group', ar: 'مجموعة العمل' },
  relationship: { en: 'Relationship', ar: 'العلاقة' },
  document: { en: 'Document', ar: 'المستند' },
  event: { en: 'Event', ar: 'الفعالية' },
  policy: { en: 'Policy', ar: 'السياسة' },
  operational: { en: 'Operational', ar: 'التشغيلي' },
}

export const DEPENDENCY_TYPE_LABELS: Record<DependencyType, { en: string; ar: string }> = {
  direct: { en: 'Direct', ar: 'مباشر' },
  transitive: { en: 'Transitive', ar: 'غير مباشر' },
  commitment: { en: 'Commitment', ar: 'التزام' },
  working_group: { en: 'Working Group', ar: 'مجموعة عمل' },
  document: { en: 'Document', ar: 'مستند' },
  position: { en: 'Position', ar: 'منصب' },
  event: { en: 'Event', ar: 'فعالية' },
}

export const CHANGE_TYPE_LABELS: Record<ChangeType, { en: string; ar: string }> = {
  create: { en: 'Create', ar: 'إنشاء' },
  update: { en: 'Update', ar: 'تحديث' },
  delete: { en: 'Delete', ar: 'حذف' },
  archive: { en: 'Archive', ar: 'أرشفة' },
  relationship_add: { en: 'Add Relationship', ar: 'إضافة علاقة' },
  relationship_remove: { en: 'Remove Relationship', ar: 'إزالة علاقة' },
  status_change: { en: 'Status Change', ar: 'تغيير الحالة' },
  ownership_change: { en: 'Ownership Change', ar: 'تغيير الملكية' },
}

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, { en: string; ar: string }> = {
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  reviewed: { en: 'Reviewed', ar: 'تمت المراجعة' },
  acknowledged: { en: 'Acknowledged', ar: 'تم الإقرار' },
  actioned: { en: 'Actioned', ar: 'تم التنفيذ' },
}
