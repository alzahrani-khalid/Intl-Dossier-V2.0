/**
 * Legislation Tracking Types
 * For tracking legislation, regulatory proposals, and policy issues
 */

// =============================================
// ENUMS
// =============================================

export type LegislationType =
  | 'law'
  | 'regulation'
  | 'directive'
  | 'policy'
  | 'resolution'
  | 'treaty'
  | 'amendment'
  | 'proposal'
  | 'executive_order'
  | 'decree'
  | 'other'

export type LegislationStatus =
  | 'draft'
  | 'proposed'
  | 'under_review'
  | 'in_committee'
  | 'pending_vote'
  | 'passed'
  | 'enacted'
  | 'implemented'
  | 'superseded'
  | 'repealed'
  | 'expired'
  | 'withdrawn'

export type CommentPeriodStatus = 'not_started' | 'open' | 'closed' | 'extended'

export type SponsorType = 'primary' | 'co_sponsor' | 'supporter' | 'opponent'

export type AmendmentStatus =
  | 'proposed'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'incorporated'
  | 'withdrawn'

export type LegislationDeadlineType =
  | 'comment_period_start'
  | 'comment_period_end'
  | 'review_deadline'
  | 'vote_date'
  | 'effective_date'
  | 'implementation_deadline'
  | 'reporting_deadline'
  | 'compliance_deadline'
  | 'expiration_date'
  | 'other'

export type DeadlineAlertStatus = 'pending' | 'sent' | 'acknowledged' | 'snoozed' | 'dismissed'

export type LegislationPriority = 'low' | 'medium' | 'high' | 'critical'

export type LegislationImpactLevel = 'minimal' | 'low' | 'medium' | 'high' | 'transformational'

export type LegislationRelationshipType =
  | 'related'
  | 'supersedes'
  | 'superseded_by'
  | 'implements'
  | 'implemented_by'
  | 'amends'
  | 'amended_by'
  | 'replaces'
  | 'replaced_by'
  | 'references'
  | 'referenced_by'

// =============================================
// STATUS CONFIGURATION
// =============================================

export const LEGISLATION_STATUS_ORDER: LegislationStatus[] = [
  'draft',
  'proposed',
  'under_review',
  'in_committee',
  'pending_vote',
  'passed',
  'enacted',
  'implemented',
  'superseded',
  'repealed',
  'expired',
  'withdrawn',
]

export const VALID_STATUS_TRANSITIONS: Record<LegislationStatus, LegislationStatus[]> = {
  draft: ['proposed', 'withdrawn'],
  proposed: ['under_review', 'in_committee', 'withdrawn'],
  under_review: ['in_committee', 'pending_vote', 'withdrawn'],
  in_committee: ['pending_vote', 'under_review', 'withdrawn'],
  pending_vote: ['passed', 'under_review', 'withdrawn'],
  passed: ['enacted', 'superseded'],
  enacted: ['implemented', 'superseded', 'repealed', 'expired'],
  implemented: ['superseded', 'repealed', 'expired'],
  superseded: [],
  repealed: [],
  expired: [],
  withdrawn: [],
}

export const STATUS_COLORS: Record<
  LegislationStatus,
  { bg: string; text: string; border: string }
> = {
  draft: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
  },
  proposed: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-700',
  },
  under_review: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-700',
  },
  in_committee: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-700',
  },
  pending_vote: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-700',
  },
  passed: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-700',
  },
  enacted: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-700',
  },
  implemented: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-700',
  },
  superseded: {
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
  },
  repealed: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-700',
  },
  expired: {
    bg: 'bg-stone-50 dark:bg-stone-900/20',
    text: 'text-stone-700 dark:text-stone-300',
    border: 'border-stone-200 dark:border-stone-700',
  },
  withdrawn: {
    bg: 'bg-neutral-50 dark:bg-neutral-900/20',
    text: 'text-neutral-700 dark:text-neutral-300',
    border: 'border-neutral-200 dark:border-neutral-700',
  },
}

export const PRIORITY_COLORS: Record<
  LegislationPriority,
  { bg: string; text: string; border: string }
> = {
  low: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-700',
  },
  medium: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-700',
  },
  high: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-700',
  },
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-700',
  },
}

export const IMPACT_COLORS: Record<
  LegislationImpactLevel,
  { bg: string; text: string; border: string }
> = {
  minimal: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
  },
  low: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-700',
  },
  medium: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-700',
  },
  high: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-700',
  },
  transformational: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-700',
  },
}

// =============================================
// CORE ENTITY INTERFACES
// =============================================

export interface Legislation {
  id: string
  title_en: string
  title_ar: string | null
  short_title_en: string | null
  short_title_ar: string | null
  summary_en: string | null
  summary_ar: string | null
  description_en: string | null
  description_ar: string | null
  type: LegislationType
  status: LegislationStatus
  reference_number: string | null
  jurisdiction: string | null
  issuing_body: string | null
  issuing_body_ar: string | null
  priority: LegislationPriority
  impact_level: LegislationImpactLevel
  impact_summary_en: string | null
  impact_summary_ar: string | null
  introduced_date: string | null
  last_action_date: string | null
  effective_date: string | null
  expiration_date: string | null
  comment_period_status: CommentPeriodStatus
  comment_period_start: string | null
  comment_period_end: string | null
  comment_instructions_en: string | null
  comment_instructions_ar: string | null
  comment_submission_url: string | null
  source_url: string | null
  official_text_url: string | null
  tags: string[]
  sectors: string[]
  keywords: string[]
  dossier_id: string | null
  parent_legislation_id: string | null
  version: number
  latest_version_notes: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  deleted_by: string | null
}

export interface LegislationSponsor {
  id: string
  legislation_id: string
  person_dossier_id: string | null
  organization_dossier_id: string | null
  name_en: string | null
  name_ar: string | null
  title_en: string | null
  title_ar: string | null
  affiliation_en: string | null
  affiliation_ar: string | null
  sponsor_type: SponsorType
  joined_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface LegislationAmendment {
  id: string
  legislation_id: string
  amendment_number: string | null
  title_en: string
  title_ar: string | null
  description_en: string | null
  description_ar: string | null
  status: AmendmentStatus
  proposed_date: string | null
  review_date: string | null
  decision_date: string | null
  affected_sections: string[]
  original_text: string | null
  proposed_text: string | null
  final_text: string | null
  decision_notes_en: string | null
  decision_notes_ar: string | null
  decision_by: string | null
  proposed_by_dossier_id: string | null
  proposed_by_name: string | null
  legislation_version: number | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface LegislationStatusHistory {
  id: string
  legislation_id: string
  from_status: LegislationStatus | null
  to_status: LegislationStatus
  change_reason: string | null
  change_notes_en: string | null
  change_notes_ar: string | null
  legislation_snapshot: Record<string, unknown> | null
  changed_by: string | null
  changed_at: string
}

export interface LegislationDeadline {
  id: string
  legislation_id: string
  title_en: string
  title_ar: string | null
  description_en: string | null
  description_ar: string | null
  deadline_type: LegislationDeadlineType
  deadline_date: string
  deadline_time: string | null
  timezone: string
  is_completed: boolean
  completed_at: string | null
  completed_by: string | null
  alert_days_before: number[]
  alert_enabled: boolean
  priority: LegislationPriority
  linked_commitment_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface LegislationDeadlineAlert {
  id: string
  deadline_id: string
  legislation_id: string
  alert_date: string
  days_before: number
  recipient_user_id: string
  status: DeadlineAlertStatus
  sent_at: string | null
  acknowledged_at: string | null
  snoozed_until: string | null
  dismissed_at: string | null
  notification_type: 'email' | 'in_app' | 'both'
  delivery_error: string | null
  created_at: string
  updated_at: string
}

export interface LegislationWatcher {
  id: string
  legislation_id: string
  user_id: string
  notify_on_status_change: boolean
  notify_on_amendment: boolean
  notify_on_deadline: boolean
  notify_on_comment_period: boolean
  notification_type: 'email' | 'in_app' | 'both'
  created_at: string
}

export interface RelatedLegislation {
  id: string
  legislation_id: string
  related_legislation_id: string
  relationship_type: LegislationRelationshipType
  notes: string | null
  created_at: string
}

// =============================================
// EXTENDED TYPES WITH RELATIONS
// =============================================

export interface LegislationWithDetails extends Legislation {
  sponsors?: LegislationSponsor[]
  amendments?: LegislationAmendment[]
  deadlines?: LegislationDeadline[]
  status_history?: LegislationStatusHistory[]
  related_legislations?: RelatedLegislationWithDetails[]
  watchers_count?: number
  is_watching?: boolean
  dossier?: {
    id: string
    name_en: string
    name_ar: string | null
    type: string
  } | null
  parent_legislation?: {
    id: string
    title_en: string
    title_ar: string | null
    reference_number: string | null
  } | null
}

export interface RelatedLegislationWithDetails extends RelatedLegislation {
  related_legislation: {
    id: string
    title_en: string
    title_ar: string | null
    reference_number: string | null
    status: LegislationStatus
    type: LegislationType
  }
}

// =============================================
// INPUT TYPES
// =============================================

export interface LegislationCreateInput {
  title_en: string
  title_ar?: string
  short_title_en?: string
  short_title_ar?: string
  summary_en?: string
  summary_ar?: string
  description_en?: string
  description_ar?: string
  type: LegislationType
  reference_number?: string
  jurisdiction?: string
  issuing_body?: string
  issuing_body_ar?: string
  priority?: LegislationPriority
  impact_level?: LegislationImpactLevel
  impact_summary_en?: string
  impact_summary_ar?: string
  introduced_date?: string
  effective_date?: string
  expiration_date?: string
  comment_period_status?: CommentPeriodStatus
  comment_period_start?: string
  comment_period_end?: string
  comment_instructions_en?: string
  comment_instructions_ar?: string
  comment_submission_url?: string
  source_url?: string
  official_text_url?: string
  tags?: string[]
  sectors?: string[]
  keywords?: string[]
  dossier_id?: string
  parent_legislation_id?: string
}

export interface LegislationUpdateInput extends Partial<LegislationCreateInput> {
  version: number // Required for optimistic locking
  status?: LegislationStatus
  last_action_date?: string
  latest_version_notes?: string
}

export interface LegislationStatusUpdateInput {
  id: string
  status: LegislationStatus
  change_reason?: string
  change_notes_en?: string
  change_notes_ar?: string
}

export interface LegislationSponsorInput {
  legislation_id: string
  person_dossier_id?: string
  organization_dossier_id?: string
  name_en?: string
  name_ar?: string
  title_en?: string
  title_ar?: string
  affiliation_en?: string
  affiliation_ar?: string
  sponsor_type: SponsorType
  joined_date?: string
  notes?: string
}

export interface LegislationAmendmentInput {
  legislation_id: string
  amendment_number?: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  status?: AmendmentStatus
  proposed_date?: string
  affected_sections?: string[]
  original_text?: string
  proposed_text?: string
  proposed_by_dossier_id?: string
  proposed_by_name?: string
}

export interface LegislationDeadlineInput {
  legislation_id: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  deadline_type: LegislationDeadlineType
  deadline_date: string
  deadline_time?: string
  timezone?: string
  alert_days_before?: number[]
  alert_enabled?: boolean
  priority?: LegislationPriority
  linked_commitment_id?: string
}

export interface LegislationWatcherInput {
  legislation_id: string
  notify_on_status_change?: boolean
  notify_on_amendment?: boolean
  notify_on_deadline?: boolean
  notify_on_comment_period?: boolean
  notification_type?: 'email' | 'in_app' | 'both'
}

export interface RelatedLegislationInput {
  legislation_id: string
  related_legislation_id: string
  relationship_type: LegislationRelationshipType
  notes?: string
}

// =============================================
// FILTER & PAGINATION TYPES
// =============================================

export interface LegislationFilters {
  search?: string
  type?: LegislationType[]
  status?: LegislationStatus[]
  priority?: LegislationPriority[]
  impact_level?: LegislationImpactLevel[]
  jurisdiction?: string
  dossier_id?: string
  tags?: string[]
  sectors?: string[]
  comment_period_status?: CommentPeriodStatus[]
  introduced_date_from?: string
  introduced_date_to?: string
  effective_date_from?: string
  effective_date_to?: string
  has_open_comment_period?: boolean
  has_upcoming_deadlines?: boolean
  is_watching?: boolean
  cursor?: string
  limit?: number
}

export interface LegislationListResponse {
  legislations: LegislationWithDetails[]
  totalCount: number
  nextCursor: string | null
  hasMore: boolean
}

export interface LegislationDeadlineFilters {
  legislation_id?: string
  deadline_type?: LegislationDeadlineType[]
  priority?: LegislationPriority[]
  is_completed?: boolean
  date_from?: string
  date_to?: string
  days_ahead?: number
}

export interface UpcomingDeadline {
  deadline_id: string
  legislation_id: string
  legislation_title: string
  deadline_title: string
  deadline_type: LegislationDeadlineType
  deadline_date: string
  priority: LegislationPriority
  days_remaining: number
}

export interface OpenCommentPeriod {
  legislation_id: string
  title_en: string
  title_ar: string | null
  reference_number: string | null
  comment_period_start: string
  comment_period_end: string
  days_remaining: number
  jurisdiction: string | null
}

// =============================================
// QUERY KEY FACTORY
// =============================================

export const legislationKeys = {
  all: ['legislations'] as const,
  lists: () => [...legislationKeys.all, 'list'] as const,
  list: (filters?: LegislationFilters) => [...legislationKeys.lists(), filters] as const,
  details: () => [...legislationKeys.all, 'detail'] as const,
  detail: (id: string) => [...legislationKeys.details(), id] as const,
  sponsors: (legislationId: string) => [...legislationKeys.all, 'sponsors', legislationId] as const,
  amendments: (legislationId: string) =>
    [...legislationKeys.all, 'amendments', legislationId] as const,
  deadlines: (legislationId: string) =>
    [...legislationKeys.all, 'deadlines', legislationId] as const,
  statusHistory: (legislationId: string) =>
    [...legislationKeys.all, 'status-history', legislationId] as const,
  relatedLegislations: (legislationId: string) =>
    [...legislationKeys.all, 'related', legislationId] as const,
  upcomingDeadlines: (filters?: LegislationDeadlineFilters) =>
    [...legislationKeys.all, 'upcoming-deadlines', filters] as const,
  openCommentPeriods: () => [...legislationKeys.all, 'open-comment-periods'] as const,
  watchers: (legislationId: string) => [...legislationKeys.all, 'watchers', legislationId] as const,
  myWatches: () => [...legislationKeys.all, 'my-watches'] as const,
} as const
