/**
 * MoU Renewal Types
 * Feature: commitment-renewal-workflow
 *
 * TypeScript interfaces for MoU renewal workflow with expiration alerts,
 * negotiation tracking, and version history.
 */

/**
 * Renewal status values for the renewal workflow
 */
export type RenewalStatus =
  | 'pending' // Awaiting renewal initiation
  | 'initiated' // Renewal process started
  | 'negotiation' // In renewal negotiations
  | 'approved' // Renewal approved
  | 'signed' // New MoU signed
  | 'completed' // Renewal completed
  | 'declined' // Renewal declined
  | 'expired' // Expired without renewal

/**
 * Alert type values for expiration notifications
 */
export type AlertType =
  | 'expiration_90_days'
  | 'expiration_60_days'
  | 'expiration_30_days'
  | 'expiration_7_days'
  | 'expired'
  | 'renewal_initiated'
  | 'renewal_approved'
  | 'renewal_completed'

/**
 * Alert status values
 */
export type AlertStatus = 'pending' | 'sent' | 'acknowledged' | 'dismissed'

/**
 * Negotiation outcome values
 */
export type NegotiationOutcome = 'positive' | 'negative' | 'pending' | 'follow_up_required'

/**
 * MoU Renewal entity from mou_renewals table
 */
export interface MouRenewal {
  id: string
  original_mou_id: string
  renewed_mou_id: string | null
  renewal_status: RenewalStatus
  renewal_reference_number: string | null

  // Dates
  initiated_at: string | null
  negotiation_started_at: string | null
  approved_at: string | null
  completed_at: string | null

  // Expiry tracking
  original_expiry_date: string
  proposed_new_expiry_date: string | null
  final_new_expiry_date: string | null

  // Renewal terms
  renewal_period_months: number | null
  terms_changed: boolean
  terms_change_summary_en: string | null
  terms_change_summary_ar: string | null

  // Notes
  notes_en: string | null
  notes_ar: string | null
  decline_reason_en: string | null
  decline_reason_ar: string | null

  // Responsible parties
  initiated_by: string | null
  approved_by: string | null

  // Audit
  created_at: string
  updated_at: string | null
}

/**
 * MoU Renewal with joined relations
 */
export interface MouRenewalWithRelations extends MouRenewal {
  original_mou?: {
    id: string
    reference_number: string
    title_en: string
    title_ar: string
    workflow_state: string
    expiry_date: string
    primary_party?: {
      name_en: string
      name_ar: string
    }
    secondary_party?: {
      name_en: string
      name_ar: string
    }
  }
  renewed_mou?: {
    id: string
    reference_number: string
    title_en: string
    title_ar: string
  }
  initiated_by_user?: {
    full_name: string
    email: string
  }
  approved_by_user?: {
    full_name: string
    email: string
  }
}

/**
 * MoU Expiration Alert entity
 */
export interface MouExpirationAlert {
  id: string
  mou_id: string
  alert_type: AlertType
  alert_status: AlertStatus

  // Dates
  scheduled_for: string
  sent_at: string | null
  acknowledged_at: string | null
  acknowledged_by: string | null

  // Notification tracking
  email_sent: boolean
  in_app_sent: boolean

  // Message content
  message_en: string | null
  message_ar: string | null

  // Recipients
  recipient_ids: string[]

  // Audit
  created_at: string
  updated_at: string | null
}

/**
 * Alert with MoU relation
 */
export interface MouExpirationAlertWithRelations extends MouExpirationAlert {
  mou?: {
    id: string
    reference_number: string
    title_en: string
    title_ar: string
    expiry_date: string
  }
}

/**
 * MoU Version History entry
 */
export interface MouVersionHistory {
  mou_id: string
  reference_number: string
  title_en: string
  title_ar: string
  version_number: number
  effective_from: string
  effective_to: string | null
  is_current: boolean
  renewal_reference: string | null
  changes_summary_en: string | null
  changes_summary_ar: string | null
}

/**
 * Renewal Negotiation entry
 */
export interface RenewalNegotiation {
  id: string
  renewal_id: string
  negotiation_date: string
  negotiated_by: string

  // Content
  summary_en: string
  summary_ar: string
  proposed_changes: Record<string, unknown>
  outcome: NegotiationOutcome | null

  // Next steps
  next_steps_en: string | null
  next_steps_ar: string | null
  next_meeting_date: string | null

  // Audit
  created_at: string
}

/**
 * Negotiation with user relation
 */
export interface RenewalNegotiationWithUser extends RenewalNegotiation {
  negotiated_by_user?: {
    full_name: string
    email: string
  }
}

/**
 * Expiring MoU summary from get_expiring_mous function
 */
export interface ExpiringMou {
  mou_id: string
  reference_number: string
  title_en: string
  title_ar: string
  expiry_date: string
  days_until_expiry: number
  workflow_state: string
  auto_renewal: boolean
  renewal_status: RenewalStatus | null
  renewal_id: string | null
  alert_count: number
  pending_alert_count: number
  primary_party_name: string | null
  secondary_party_name: string | null
}

/**
 * Input for initiating a renewal
 */
export interface InitiateRenewalInput {
  mou_id: string
  proposed_expiry_date?: string
  renewal_period_months?: number
  notes_en?: string
  notes_ar?: string
}

/**
 * Input for updating renewal status
 */
export interface UpdateRenewalStatusInput {
  renewal_id: string
  new_status: RenewalStatus
  notes_en?: string
  notes_ar?: string
  decline_reason_en?: string
  decline_reason_ar?: string
}

/**
 * Input for completing a renewal
 */
export interface CompleteRenewalInput {
  renewal_id: string
  new_mou_id: string
  terms_changed?: boolean
  terms_change_summary_en?: string
  terms_change_summary_ar?: string
}

/**
 * Input for adding a negotiation entry
 */
export interface AddNegotiationInput {
  renewal_id: string
  summary_en: string
  summary_ar: string
  proposed_changes?: Record<string, unknown>
  outcome?: NegotiationOutcome
  next_steps_en?: string
  next_steps_ar?: string
  next_meeting_date?: string
}

/**
 * Filter parameters for renewal queries
 */
export interface RenewalFilters {
  mou_id?: string
  status?: RenewalStatus
  page?: number
  limit?: number
}

/**
 * Filter parameters for alert queries
 */
export interface AlertFilters {
  mou_id?: string
  status?: AlertStatus
  type?: AlertType
  page?: number
  limit?: number
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Valid status transitions for renewals
 */
export const VALID_RENEWAL_STATUS_TRANSITIONS: Record<RenewalStatus, RenewalStatus[]> = {
  pending: ['initiated'],
  initiated: ['negotiation', 'declined'],
  negotiation: ['approved', 'declined'],
  approved: ['signed', 'declined'],
  signed: ['completed'],
  declined: [],
  expired: [],
  completed: [],
}

/**
 * Check if a renewal status transition is valid
 */
export function isValidRenewalStatusTransition(from: RenewalStatus, to: RenewalStatus): boolean {
  return VALID_RENEWAL_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Status color mapping for UI
 */
export const RENEWAL_STATUS_COLORS: Record<
  RenewalStatus,
  { bg: string; text: string; border: string }
> = {
  pending: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-800',
  },
  initiated: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  negotiation: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  approved: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  signed: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
  },
  completed: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  declined: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  expired: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
}

/**
 * Alert type color mapping for UI
 */
export const ALERT_TYPE_COLORS: Record<AlertType, { bg: string; text: string; icon: string }> = {
  expiration_90_days: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'info',
  },
  expiration_60_days: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: 'warning',
  },
  expiration_30_days: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-300',
    icon: 'alert-triangle',
  },
  expiration_7_days: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    icon: 'alert-circle',
  },
  expired: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-200',
    icon: 'x-circle',
  },
  renewal_initiated: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'play',
  },
  renewal_approved: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    icon: 'check-circle',
  },
  renewal_completed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-200',
    icon: 'check-circle-2',
  },
}

/**
 * Alert status color mapping
 */
export const ALERT_STATUS_COLORS: Record<AlertStatus, { bg: string; text: string }> = {
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  sent: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  acknowledged: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  dismissed: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-500 dark:text-gray-400',
  },
}

/**
 * Get urgency level based on days until expiry
 */
export function getExpiryUrgency(daysUntilExpiry: number): {
  level: 'low' | 'medium' | 'high' | 'critical' | 'expired'
  color: { bg: string; text: string }
} {
  if (daysUntilExpiry <= 0) {
    return {
      level: 'expired',
      color: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
    }
  }
  if (daysUntilExpiry <= 7) {
    return {
      level: 'critical',
      color: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300' },
    }
  }
  if (daysUntilExpiry <= 30) {
    return {
      level: 'high',
      color: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-700 dark:text-orange-300',
      },
    }
  }
  if (daysUntilExpiry <= 60) {
    return {
      level: 'medium',
      color: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        text: 'text-yellow-700 dark:text-yellow-300',
      },
    }
  }
  return {
    level: 'low',
    color: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300' },
  }
}

/**
 * TanStack Query key factory for renewal queries
 */
export const renewalKeys = {
  all: ['mou-renewals'] as const,
  lists: () => [...renewalKeys.all, 'list'] as const,
  list: (filters?: RenewalFilters) => [...renewalKeys.lists(), filters] as const,
  byMou: (mouId: string) => [...renewalKeys.all, 'mou', mouId] as const,
  details: () => [...renewalKeys.all, 'detail'] as const,
  detail: (id: string) => [...renewalKeys.details(), id] as const,
  negotiations: (renewalId: string) => [...renewalKeys.all, 'negotiations', renewalId] as const,
  versionChain: (mouId: string) => [...renewalKeys.all, 'version-chain', mouId] as const,
  expiring: (daysAhead?: number) => [...renewalKeys.all, 'expiring', daysAhead] as const,
  alerts: () => [...renewalKeys.all, 'alerts'] as const,
  alertsList: (filters?: AlertFilters) => [...renewalKeys.alerts(), 'list', filters] as const,
  alertsByMou: (mouId: string) => [...renewalKeys.alerts(), 'mou', mouId] as const,
}

/**
 * Default page size for pagination
 */
export const DEFAULT_PAGE_SIZE = 20

/**
 * Default days ahead for expiring MoU queries
 */
export const DEFAULT_EXPIRY_DAYS_AHEAD = 90
