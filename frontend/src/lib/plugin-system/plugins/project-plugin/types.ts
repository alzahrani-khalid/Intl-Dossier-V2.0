/**
 * Project Plugin - Type Definitions
 *
 * Example entity plugin demonstrating the plugin system.
 * Projects represent initiatives, research activities, or collaborations.
 */

import type { BaseDossier } from '../../types/plugin.types'

// ============================================================================
// Enums
// ============================================================================

/**
 * Project status types
 */
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'

/**
 * Project priority levels
 */
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * Project category types
 */
export type ProjectCategory =
  | 'research'
  | 'development'
  | 'collaboration'
  | 'capacity_building'
  | 'technical_assistance'
  | 'other'

// ============================================================================
// Extension Type
// ============================================================================

/**
 * Project-specific extension fields
 */
export interface ProjectExtension {
  /** Unique project code */
  project_code: string
  /** Project status */
  project_status: ProjectStatus
  /** Priority level */
  priority: ProjectPriority
  /** Category */
  category: ProjectCategory
  /** Start date */
  start_date: string
  /** End date */
  end_date?: string
  /** Budget amount */
  budget?: number
  /** Budget currency */
  budget_currency?: string
  /** Objectives (English) */
  objectives_en?: string
  /** Objectives (Arabic) */
  objectives_ar?: string
  /** Deliverables (English) */
  deliverables_en?: string
  /** Deliverables (Arabic) */
  deliverables_ar?: string
  /** Lead organization ID */
  lead_organization_id?: string
  /** Project manager person ID */
  project_manager_id?: string
  /** Completion percentage */
  completion_percentage?: number
}

/**
 * Full project type (base + extension)
 */
export type Project = BaseDossier & ProjectExtension

// ============================================================================
// Labels
// ============================================================================

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, { en: string; ar: string }> = {
  planning: { en: 'Planning', ar: 'التخطيط' },
  active: { en: 'Active', ar: 'نشط' },
  on_hold: { en: 'On Hold', ar: 'معلق' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  cancelled: { en: 'Cancelled', ar: 'ملغى' },
}

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, { en: string; ar: string }> = {
  low: { en: 'Low', ar: 'منخفض' },
  medium: { en: 'Medium', ar: 'متوسط' },
  high: { en: 'High', ar: 'عالي' },
  critical: { en: 'Critical', ar: 'حرج' },
}

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, { en: string; ar: string }> = {
  research: { en: 'Research', ar: 'بحث' },
  development: { en: 'Development', ar: 'تطوير' },
  collaboration: { en: 'Collaboration', ar: 'تعاون' },
  capacity_building: { en: 'Capacity Building', ar: 'بناء القدرات' },
  technical_assistance: { en: 'Technical Assistance', ar: 'مساعدة فنية' },
  other: { en: 'Other', ar: 'أخرى' },
}
