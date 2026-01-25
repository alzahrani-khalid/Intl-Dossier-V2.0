/**
 * SLA Monitoring Types
 * Feature: sla-monitoring
 *
 * TypeScript types for SLA policies, compliance metrics, and escalations
 */

// ============================================
// Enum Types
// ============================================

export const SLA_TARGET_TYPES = [
  'acknowledgment',
  'resolution',
  'first_update',
  'escalation',
] as const
export type SLATargetType = (typeof SLA_TARGET_TYPES)[number]

export const SLA_ESCALATION_STATUSES = [
  'pending',
  'triggered',
  'acknowledged',
  'resolved',
  'dismissed',
] as const
export type SLAEscalationStatus = (typeof SLA_ESCALATION_STATUSES)[number]

export const SLA_ENTITY_TYPES = ['ticket', 'commitment', 'task'] as const
export type SLAEntityType = (typeof SLA_ENTITY_TYPES)[number]

export const SLA_EVENT_TYPES = [
  'started',
  'paused',
  'resumed',
  'met',
  'breached',
  'cancelled',
] as const
export type SLAEventType = (typeof SLA_EVENT_TYPES)[number]

// ============================================
// SLA Policy Types
// ============================================

export interface EscalationLevel {
  level: number
  after_minutes: number
  notify_role: string
  notify_user_id?: string
}

export interface SLAPolicy {
  id: string
  name: string
  name_ar?: string
  description?: string
  description_ar?: string

  // Matching criteria
  request_type?: string
  sensitivity?: string
  urgency?: string
  priority?: string
  entity_type: SLAEntityType

  // SLA targets (in minutes)
  acknowledgment_target: number
  resolution_target: number

  // Business hours configuration
  business_hours_only: boolean
  timezone: string

  // Warning & escalation
  warning_threshold_pct: number
  escalation_enabled: boolean
  escalation_levels: EscalationLevel[]
  notification_channels: string[]

  // Scope
  applies_to_units?: string[]
  excluded_assignees?: string[]

  // Status
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SLAPolicyInput {
  name: string
  name_ar?: string
  description?: string
  description_ar?: string
  request_type?: string
  sensitivity?: string
  urgency?: string
  priority?: string
  acknowledgment_target: number
  resolution_target: number
  business_hours_only?: boolean
  timezone?: string
  warning_threshold_pct?: number
  escalation_enabled?: boolean
  escalation_levels?: EscalationLevel[]
  notification_channels?: string[]
  is_active?: boolean
}

// ============================================
// SLA Event Types
// ============================================

export interface SLAEvent {
  id: string
  ticket_id: string
  policy_id: string
  event_type: SLAEventType
  event_timestamp: string
  elapsed_minutes: number
  remaining_minutes: number
  is_breached: boolean
  created_by: string
  reason?: string
}

// ============================================
// SLA Escalation Types
// ============================================

export interface SLAEscalation {
  id: string
  entity_type: SLAEntityType
  entity_id: string
  policy_id?: string
  sla_event_id?: string
  target_type: SLATargetType
  escalation_level: number
  status: SLAEscalationStatus
  escalated_from_id?: string
  escalated_to_id?: string
  escalated_to_role?: string
  triggered_at: string
  acknowledged_at?: string
  resolved_at?: string
  reason?: string
  notes?: string
  auto_triggered: boolean
  created_at: string
  updated_at: string
  policy?: SLAPolicy
}

// ============================================
// Dashboard & Metrics Types
// ============================================

export interface SLADashboardOverview {
  total_items: number
  met_count: number
  breached_count: number
  at_risk_count: number
  compliance_rate: number
  avg_resolution_minutes: number
  trend_data: SLATrendDataPoint[]
}

export interface SLATrendDataPoint {
  date: string
  compliance_pct: number
  total: number
  met: number
  breached: number
}

export interface SLAComplianceByType {
  request_type: string
  total_items: number
  met_count: number
  breached_count: number
  compliance_rate: number
  avg_resolution_minutes: number
}

export interface SLAComplianceByAssignee {
  assignee_id: string
  assignee_name: string
  assignee_name_ar?: string
  total_items: number
  met_count: number
  breached_count: number
  compliance_rate: number
  avg_resolution_minutes: number
  currently_at_risk: number
}

export interface SLAAtRiskItem {
  entity_id: string
  entity_type: SLAEntityType
  title: string
  priority: string
  status: string
  assigned_to?: string
  assignee_name?: string
  sla_target_minutes: number
  elapsed_minutes: number
  remaining_minutes: number
  progress_pct: number
  deadline_at: string
}

export interface SLABreachedItem {
  ticket_id: string
  ticket_number: string
  title: string
  priority: string
  status: string
  sla_type: 'acknowledgment' | 'resolution'
  breach_time: string
  minutes_overdue: number
}

// ============================================
// Compliance Snapshot Types
// ============================================

export interface SLAComplianceSnapshot {
  id: string
  snapshot_date: string
  entity_type: SLAEntityType
  total_items: number
  met_count: number
  breached_count: number
  warning_count: number
  avg_resolution_time?: number
  p50_resolution_time?: number
  p90_resolution_time?: number
  p99_resolution_time?: number
  overall_compliance_pct?: number
  acknowledgment_compliance_pct?: number
  resolution_compliance_pct?: number
  metrics_by_priority: Record<
    string,
    {
      total: number
      met: number
      breached: number
    }
  >
  metrics_by_assignee: Array<{
    assignee_id: string
    assignee_name: string
    total: number
    met: number
    breached: number
    compliance_rate: number
  }>
  created_at: string
}

// ============================================
// API Request/Response Types
// ============================================

export interface SLADashboardRequest {
  entity_type?: SLAEntityType
  start_date?: string
  end_date?: string
}

export interface SLAComplianceRequest {
  entity_type?: SLAEntityType
  start_date?: string
  end_date?: string
  limit?: number
}

export interface SLAAtRiskRequest {
  entity_type?: SLAEntityType
  threshold?: number
  limit?: number
}

export interface SLAEscalationsRequest {
  status?: SLAEscalationStatus
  entity_type?: SLAEntityType
  limit?: number
}

// ============================================
// Status Configuration Types
// ============================================

export interface SLAStatusConfig {
  status: SLAEscalationStatus
  label: string
  labelAr: string
  color: string
  bgColor: string
  icon: string
}

export const SLA_STATUS_CONFIG: Record<SLAEscalationStatus, SLAStatusConfig> = {
  pending: {
    status: 'pending',
    label: 'Pending',
    labelAr: 'معلق',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'clock',
  },
  triggered: {
    status: 'triggered',
    label: 'Triggered',
    labelAr: 'مُفعّل',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'alert-triangle',
  },
  acknowledged: {
    status: 'acknowledged',
    label: 'Acknowledged',
    labelAr: 'تم الإقرار',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: 'eye',
  },
  resolved: {
    status: 'resolved',
    label: 'Resolved',
    labelAr: 'تم الحل',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'check-circle',
  },
  dismissed: {
    status: 'dismissed',
    label: 'Dismissed',
    labelAr: 'مرفوض',
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    icon: 'x-circle',
  },
}

// ============================================
// Compliance Rate Thresholds
// ============================================

export interface ComplianceThreshold {
  min: number
  max: number
  label: string
  labelAr: string
  color: string
  bgColor: string
}

export const COMPLIANCE_THRESHOLDS: ComplianceThreshold[] = [
  {
    min: 95,
    max: 100,
    label: 'Excellent',
    labelAr: 'ممتاز',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  {
    min: 85,
    max: 94.99,
    label: 'Good',
    labelAr: 'جيد',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  {
    min: 70,
    max: 84.99,
    label: 'Fair',
    labelAr: 'مقبول',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  {
    min: 50,
    max: 69.99,
    label: 'Poor',
    labelAr: 'ضعيف',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
  {
    min: 0,
    max: 49.99,
    label: 'Critical',
    labelAr: 'حرج',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
]

export function getComplianceThreshold(rate: number): ComplianceThreshold {
  const found = COMPLIANCE_THRESHOLDS.find((t) => rate >= t.min && rate <= t.max)
  return found ?? COMPLIANCE_THRESHOLDS[COMPLIANCE_THRESHOLDS.length - 1]!
}

// ============================================
// Utility Functions
// ============================================

export function formatSLADuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
}

export function formatSLADurationAr(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} دقيقة`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours < 24) {
    return mins > 0 ? `${hours} ساعة ${mins} دقيقة` : `${hours} ساعة`
  }
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return remainingHours > 0 ? `${days} يوم ${remainingHours} ساعة` : `${days} يوم`
}

export function getSLAProgressColor(progressPct: number): string {
  if (progressPct >= 100) return 'bg-red-500'
  if (progressPct >= 90) return 'bg-red-400'
  if (progressPct >= 75) return 'bg-yellow-500'
  if (progressPct >= 50) return 'bg-yellow-400'
  return 'bg-green-500'
}
