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
    // D-58-06-A-04: blue (initial-review) → accent
    color: 'bg-accent/10 text-accent dark:bg-accent/30',
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
    // D-58-06-A-04: purple (draft-document) → secondary [D-07 collision]
    color: 'bg-secondary/10 text-secondary-foreground dark:bg-secondary/30',
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
    // D-58-06-A-04: green (stakeholder-meeting) → success
    color: 'bg-success/10 text-success dark:bg-success/30',
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
    // D-58-06-A-04: orange (final-review) → warning-step (deeper than amber follow-up)
    color: 'bg-warning/20 text-warning dark:bg-warning/40',
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
    // D-58-06-A-04: cyan (submission) → info
    color: 'bg-info/10 text-info dark:bg-info/30',
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
    // D-58-06-A-04: amber (follow-up) → warning (base, lighter than final-review)
    color: 'bg-warning/10 text-warning dark:bg-warning/30',
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
// D-58-06-A-04: STATUS palette → muted (not_started, cancelled) / accent
// (in_progress) / success (completed) / destructive (blocked). cancelled
// preserves softer text-muted-foreground/60 to indicate inactive vs other muted.
export const DELIVERABLE_STATUS_COLORS: Record<
  CommitmentDeliverableStatus,
  { bg: string; text: string; border: string }
> = {
  not_started: {
    bg: 'bg-muted/5 dark:bg-muted/20',
    text: 'text-muted-foreground',
    border: 'border-muted/20 dark:border-muted/80',
  },
  in_progress: {
    bg: 'bg-accent/5 dark:bg-accent/20',
    text: 'text-accent',
    border: 'border-accent/20 dark:border-accent/80',
  },
  completed: {
    bg: 'bg-success/5 dark:bg-success/20',
    text: 'text-success',
    border: 'border-success/20 dark:border-success/80',
  },
  blocked: {
    bg: 'bg-destructive/5 dark:bg-destructive/20',
    text: 'text-destructive',
    border: 'border-destructive/20 dark:border-destructive/80',
  },
  cancelled: {
    bg: 'bg-muted/5 dark:bg-muted/20',
    text: 'text-muted-foreground/60',
    border: 'border-muted/20 dark:border-muted/80',
  },
}

/**
 * Type color mapping for UI
 */
// D-58-06-A-04: TYPE palette — D-07 collision (blue + purple + indigo as siblings):
//   review (blue)         → accent
//   milestone (indigo)    → secondary (sibling step /20 to disambiguate from document)
//   document (purple)     → secondary (base /10)
//   meeting (green)       → success
//   follow_up (amber)     → warning
//   report (cyan)         → info
//   custom (gray)         → muted
export const DELIVERABLE_TYPE_COLORS: Record<
  CommitmentDeliverableType,
  { bg: string; text: string }
> = {
  milestone: {
    bg: 'bg-secondary/20 dark:bg-secondary/40',
    text: 'text-secondary-foreground',
  },
  document: {
    bg: 'bg-secondary/10 dark:bg-secondary/30',
    text: 'text-secondary-foreground',
  },
  meeting: {
    bg: 'bg-success/10 dark:bg-success/30',
    text: 'text-success',
  },
  review: {
    bg: 'bg-accent/10 dark:bg-accent/30',
    text: 'text-accent',
  },
  follow_up: {
    bg: 'bg-warning/10 dark:bg-warning/30',
    text: 'text-warning',
  },
  report: {
    bg: 'bg-info/10 dark:bg-info/30',
    text: 'text-info',
  },
  custom: {
    bg: 'bg-muted/10 dark:bg-muted/30',
    text: 'text-muted-foreground',
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
        due_date: dueDate.toISOString().split('T')[0]!,
        weight: template.default_weight,
        sort_order: index,
      }
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
}
