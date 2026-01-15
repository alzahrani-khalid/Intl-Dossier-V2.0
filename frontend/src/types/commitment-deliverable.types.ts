/**
 * Commitment Deliverable Types
 * Feature: Interactive timeline for breaking commitments into trackable milestones
 *
 * TypeScript interfaces for commitment deliverables with CRUD operations,
 * progress tracking, and template support.
 */

/**
 * Deliverable type enum matching database
 */
export type CommitmentDeliverableType =
  | 'milestone'
  | 'document'
  | 'meeting'
  | 'review'
  | 'follow_up'
  | 'report'
  | 'custom'

/**
 * Deliverable status enum matching database
 */
export type CommitmentDeliverableStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'cancelled'

/**
 * Full commitment deliverable entity from commitment_deliverables table
 */
export interface CommitmentDeliverable {
  id: string
  commitment_id: string

  // Core fields (bilingual)
  title_en: string
  title_ar: string | null
  description_en: string | null
  description_ar: string | null

  // Type and status
  deliverable_type: CommitmentDeliverableType
  status: CommitmentDeliverableStatus

  // Timeline
  due_date: string
  completed_at: string | null

  // Progress tracking
  progress: number
  weight: number

  // Display order
  sort_order: number

  // Notes
  notes: string | null

  // Audit
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string | null
}

/**
 * Deliverable with computed properties for UI display
 */
export interface CommitmentDeliverableWithComputedProps extends CommitmentDeliverable {
  isOverdue: boolean
  daysUntilDue: number
  displayTitle: string // Based on current language
}

/**
 * Input for creating a new deliverable
 */
export interface CreateCommitmentDeliverableInput {
  commitment_id: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  deliverable_type: CommitmentDeliverableType
  due_date: string
  weight?: number
  sort_order?: number
  notes?: string
}

/**
 * Input for updating an existing deliverable
 */
export interface UpdateCommitmentDeliverableInput {
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  deliverable_type?: CommitmentDeliverableType
  status?: CommitmentDeliverableStatus
  due_date?: string
  progress?: number
  weight?: number
  sort_order?: number
  notes?: string
}

/**
 * Input for bulk creating deliverables from template
 */
export interface BulkCreateDeliverablesInput {
  commitment_id: string
  deliverables: Omit<CreateCommitmentDeliverableInput, 'commitment_id'>[]
}

/**
 * Deliverable template for quick creation
 */
export interface DeliverableTemplate {
  id: string
  type: CommitmentDeliverableType
  title_en: string
  title_ar: string
  description_en: string
  description_ar: string
  default_weight: number
  suggested_days_offset: number // Days from commitment due date
  icon: string // Lucide icon name
  color: string // Tailwind color class
}

/**
 * Predefined deliverable templates for common commitment types
 */
export const DELIVERABLE_TEMPLATES: DeliverableTemplate[] = [
  {
    id: 'initial-review',
    type: 'review',
    title_en: 'Initial Review',
    title_ar: 'المراجعة الأولية',
    description_en: 'Review and assess the commitment requirements',
    description_ar: 'مراجعة وتقييم متطلبات الالتزام',
    default_weight: 2,
    suggested_days_offset: -14, // 2 weeks before due date
    icon: 'ClipboardCheck',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    id: 'draft-document',
    type: 'document',
    title_en: 'Draft Document',
    title_ar: 'إعداد المسودة',
    description_en: 'Prepare the initial draft document',
    description_ar: 'إعداد المسودة الأولية للوثيقة',
    default_weight: 3,
    suggested_days_offset: -10, // 10 days before due date
    icon: 'FileText',
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    id: 'stakeholder-meeting',
    type: 'meeting',
    title_en: 'Stakeholder Meeting',
    title_ar: 'اجتماع أصحاب المصلحة',
    description_en: 'Meet with stakeholders to discuss progress',
    description_ar: 'الاجتماع مع أصحاب المصلحة لمناقشة التقدم',
    default_weight: 2,
    suggested_days_offset: -7, // 1 week before due date
    icon: 'Users',
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    id: 'final-review',
    type: 'review',
    title_en: 'Final Review',
    title_ar: 'المراجعة النهائية',
    description_en: 'Conduct final review and approval',
    description_ar: 'إجراء المراجعة النهائية والموافقة',
    default_weight: 2,
    suggested_days_offset: -3, // 3 days before due date
    icon: 'CheckCircle',
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    id: 'submission',
    type: 'report',
    title_en: 'Final Submission',
    title_ar: 'التسليم النهائي',
    description_en: 'Submit the final deliverable',
    description_ar: 'تسليم المخرج النهائي',
    default_weight: 3,
    suggested_days_offset: 0, // On due date
    icon: 'Send',
    color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  {
    id: 'follow-up',
    type: 'follow_up',
    title_en: 'Follow-up Action',
    title_ar: 'إجراء المتابعة',
    description_en: 'Follow up on the commitment outcome',
    description_ar: 'متابعة نتائج الالتزام',
    default_weight: 1,
    suggested_days_offset: 7, // 1 week after due date
    icon: 'ArrowRight',
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
]

/**
 * Predefined template sets for common commitment scenarios
 */
export interface DeliverableTemplateSet {
  id: string
  name_en: string
  name_ar: string
  description_en: string
  description_ar: string
  templates: string[] // Template IDs
}

export const TEMPLATE_SETS: DeliverableTemplateSet[] = [
  {
    id: 'standard-delivery',
    name_en: 'Standard Delivery',
    name_ar: 'التسليم القياسي',
    description_en: 'A typical workflow with review, draft, and submission milestones',
    description_ar: 'سير عمل نموذجي يتضمن المراجعة والمسودة والتسليم',
    templates: ['initial-review', 'draft-document', 'final-review', 'submission'],
  },
  {
    id: 'meeting-focused',
    name_en: 'Meeting & Engagement',
    name_ar: 'الاجتماعات والمشاركة',
    description_en: 'Focus on stakeholder meetings and follow-up actions',
    description_ar: 'التركيز على اجتماعات أصحاب المصلحة وإجراءات المتابعة',
    templates: ['initial-review', 'stakeholder-meeting', 'follow-up'],
  },
  {
    id: 'document-heavy',
    name_en: 'Document-Heavy',
    name_ar: 'مكثف الوثائق',
    description_en: 'For commitments requiring extensive documentation',
    description_ar: 'للالتزامات التي تتطلب توثيقاً مكثفاً',
    templates: ['initial-review', 'draft-document', 'final-review', 'submission', 'follow-up'],
  },
  {
    id: 'quick-task',
    name_en: 'Quick Task',
    name_ar: 'مهمة سريعة',
    description_en: 'Simple workflow for short-term commitments',
    description_ar: 'سير عمل بسيط للالتزامات قصيرة المدى',
    templates: ['initial-review', 'submission'],
  },
]

/**
 * Status color mapping for UI
 */
export const DELIVERABLE_STATUS_COLORS: Record<
  CommitmentDeliverableStatus,
  { bg: string; text: string; border: string }
> = {
  not_started: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-800',
  },
  in_progress: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  completed: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  blocked: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  cancelled: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-500 dark:text-gray-500',
    border: 'border-gray-200 dark:border-gray-800',
  },
}

/**
 * Type color mapping for UI
 */
export const DELIVERABLE_TYPE_COLORS: Record<
  CommitmentDeliverableType,
  { bg: string; text: string }
> = {
  milestone: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  document: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
  },
  meeting: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  review: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  follow_up: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
  },
  report: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-300',
  },
  custom: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-700 dark:text-gray-300',
  },
}

/**
 * TanStack Query key factory for deliverable queries
 */
export const commitmentDeliverableKeys = {
  all: ['commitment-deliverables'] as const,
  lists: () => [...commitmentDeliverableKeys.all, 'list'] as const,
  list: (commitmentId: string) => [...commitmentDeliverableKeys.lists(), commitmentId] as const,
  details: () => [...commitmentDeliverableKeys.all, 'detail'] as const,
  detail: (id: string) => [...commitmentDeliverableKeys.details(), id] as const,
  progress: (commitmentId: string) =>
    [...commitmentDeliverableKeys.all, 'progress', commitmentId] as const,
}

/**
 * Valid status transitions
 */
export const VALID_DELIVERABLE_STATUS_TRANSITIONS: Record<
  CommitmentDeliverableStatus,
  CommitmentDeliverableStatus[]
> = {
  not_started: ['in_progress', 'cancelled'],
  in_progress: ['not_started', 'completed', 'blocked', 'cancelled'],
  completed: [], // Cannot change from completed
  blocked: ['in_progress', 'cancelled'],
  cancelled: [], // Cannot change from cancelled
}

/**
 * Check if a status transition is valid
 */
export function isValidDeliverableStatusTransition(
  from: CommitmentDeliverableStatus,
  to: CommitmentDeliverableStatus,
): boolean {
  return VALID_DELIVERABLE_STATUS_TRANSITIONS[from].includes(to)
}

/**
 * Calculate days until due date
 */
export function getDeliverableDaysUntilDue(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Check if deliverable is overdue
 */
export function isDeliverableOverdue(
  dueDate: string,
  status: CommitmentDeliverableStatus,
): boolean {
  if (status === 'completed' || status === 'cancelled') return false
  return getDeliverableDaysUntilDue(dueDate) < 0
}

/**
 * Generate deliverables from template set
 */
export function generateDeliverablesFromTemplateSet(
  commitmentId: string,
  commitmentDueDate: string,
  templateSetId: string,
): CreateCommitmentDeliverableInput[] {
  const templateSet = TEMPLATE_SETS.find((ts) => ts.id === templateSetId)
  if (!templateSet) return []

  const commitmentDue = new Date(commitmentDueDate)

  return templateSet.templates
    .map((templateId, index) => {
      const template = DELIVERABLE_TEMPLATES.find((t) => t.id === templateId)
      if (!template) return null

      const dueDate = new Date(commitmentDue)
      dueDate.setDate(dueDate.getDate() + template.suggested_days_offset)

      return {
        commitment_id: commitmentId,
        title_en: template.title_en,
        title_ar: template.title_ar,
        description_en: template.description_en,
        description_ar: template.description_ar,
        deliverable_type: template.type,
        due_date: dueDate.toISOString().split('T')[0],
        weight: template.default_weight,
        sort_order: index,
      }
    })
    .filter((d): d is CreateCommitmentDeliverableInput => d !== null)
}
