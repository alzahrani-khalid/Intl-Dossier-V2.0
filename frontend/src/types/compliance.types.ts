/**
 * Compliance Rules Types
 * Feature: compliance-rules-management
 *
 * TypeScript interfaces for compliance rules, violations, sign-offs,
 * and automated compliance checking.
 */

// ============================================================================
// Enum Types
// ============================================================================

/**
 * Types of compliance rules
 */
export type ComplianceRuleType =
  | 'cooling_off_period'
  | 'disclosure_requirement'
  | 'conflict_check'
  | 'approval_threshold'
  | 'frequency_limit'
  | 'relationship_restriction'
  | 'documentation_requirement'
  | 'gift_limit'
  | 'recusal_requirement'
  | 'reporting_requirement'

/**
 * Severity levels for compliance rules
 */
export type ComplianceSeverity = 'info' | 'warning' | 'critical' | 'blocking'

/**
 * Entity types that compliance rules can apply to
 */
export type ComplianceEntityType =
  | 'engagement'
  | 'commitment'
  | 'relationship'
  | 'person'
  | 'organization'
  | 'country'
  | 'all'

/**
 * Status of a compliance violation
 */
export type ViolationStatus =
  | 'pending'
  | 'acknowledged'
  | 'signed_off'
  | 'waived'
  | 'resolved'
  | 'escalated'
  | 'expired'

/**
 * Actions that can be taken on a violation
 */
export type SignoffAction = 'approve' | 'reject' | 'request_info' | 'escalate' | 'waive'

// ============================================================================
// Condition Types
// ============================================================================

/**
 * Cooling-off period conditions
 */
export interface CoolingOffConditions {
  days: number
  applies_to: string[]
}

/**
 * Disclosure requirement conditions
 */
export interface DisclosureConditions {
  fields: string[]
  threshold?: number
  currency?: string
  check_years?: number
  relationship_types?: string[]
}

/**
 * Conflict check conditions
 */
export interface ConflictCheckConditions {
  check_relationships?: boolean
  check_family?: boolean
  degrees_of_separation?: number
  check_spouse?: boolean
  check_parents?: boolean
  check_siblings?: boolean
  check_children?: boolean
  check_current_employer?: boolean
  check_clients?: boolean
  check_investments?: boolean
}

/**
 * Approval threshold conditions
 */
export interface ApprovalThresholdConditions {
  amount: number
  currency: string
  approval_levels: string[]
}

/**
 * Frequency limit conditions
 */
export interface FrequencyLimitConditions {
  max_interactions: number
  period_days: number
}

/**
 * Gift limit conditions
 */
export interface GiftLimitConditions {
  max_value: number
  currency: string
  period: 'single' | 'monthly' | 'annual'
  cumulative_annual?: number
}

/**
 * Reporting requirement conditions
 */
export interface ReportingConditions {
  report_within_days: number
  covered_officials?: string[]
}

/**
 * Recusal requirement conditions
 */
export interface RecusalConditions {
  recusal_period_years: number
  scope: string[]
}

/**
 * Union type for all condition types
 */
export type RuleConditions =
  | CoolingOffConditions
  | DisclosureConditions
  | ConflictCheckConditions
  | ApprovalThresholdConditions
  | FrequencyLimitConditions
  | GiftLimitConditions
  | ReportingConditions
  | RecusalConditions
  | Record<string, unknown>

// ============================================================================
// Main Entity Types
// ============================================================================

/**
 * Compliance rule entity
 */
export interface ComplianceRule {
  id: string
  rule_code: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  rule_type: ComplianceRuleType
  severity: ComplianceSeverity
  entity_types: ComplianceEntityType[]
  conditions: RuleConditions
  notification_template_en?: string
  notification_template_ar?: string
  remediation_instructions_en?: string
  remediation_instructions_ar?: string
  requires_signoff: boolean
  signoff_roles: string[]
  signoff_deadline_hours?: number
  auto_escalate_hours?: number
  is_active: boolean
  effective_from?: string
  effective_to?: string
  applies_to_regions: string[]
  applies_to_categories: string[]
  external_reference?: string
  regulatory_source?: string
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * Violation details stored as JSONB
 */
export interface ViolationDetails {
  rule_name?: string
  conditions?: RuleConditions
  context?: Record<string, unknown>
  days_remaining?: number
  previous_activity?: string
  previous_date?: string
  relationship_type?: string
  conflicting_party?: string
  current_value?: number
  threshold?: number
  currency?: string
}

/**
 * Compliance violation entity
 */
export interface ComplianceViolation {
  id: string
  rule_id: string
  rule_code: string
  entity_type: ComplianceEntityType
  entity_id: string
  entity_name_en?: string
  entity_name_ar?: string
  related_entity_type?: ComplianceEntityType
  related_entity_id?: string
  related_entity_name_en?: string
  related_entity_name_ar?: string
  severity: ComplianceSeverity
  status: ViolationStatus
  violation_details: ViolationDetails
  detected_at: string
  detected_by?: string
  detected_method: string
  acknowledged_at?: string
  acknowledged_by?: string
  acknowledgement_notes?: string
  resolved_at?: string
  resolved_by?: string
  resolution_notes?: string
  escalated_at?: string
  escalated_to?: string
  escalation_reason?: string
  expires_at?: string
  dossier_id?: string
  created_at: string
  updated_at: string
  // Joined data
  rule?: ComplianceRule
}

/**
 * Sign-off record for a violation
 */
export interface ComplianceSignoff {
  id: string
  violation_id: string
  action: SignoffAction
  signed_by: string
  signed_at: string
  signer_role: string
  delegation_id?: string
  justification?: string
  conditions?: string[]
  waiver_valid_until?: string
  waiver_scope?: string
  signature_hash?: string
  ip_address?: string
  user_agent?: string
  created_at: string
  // Joined data
  signer_name?: string
}

/**
 * Rule template for predefined common rules
 */
export interface ComplianceRuleTemplate {
  id: string
  template_code: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  rule_type: ComplianceRuleType
  default_severity: ComplianceSeverity
  default_conditions: RuleConditions
  category?: string
  regulatory_framework?: string
  is_active: boolean
  created_at: string
}

/**
 * Compliance check log entry
 */
export interface ComplianceCheckLog {
  id: string
  entity_type: ComplianceEntityType
  entity_id: string
  action_type: string
  rules_checked: number
  violations_found: number
  blocking_violations: number
  violation_ids: string[]
  check_passed: boolean
  blocked: boolean
  checked_by?: string
  checked_at: string
  check_duration_ms?: number
  check_details: Record<string, unknown>
}

/**
 * Compliance exemption
 */
export interface ComplianceExemption {
  id: string
  rule_id?: string
  rule_code?: string
  entity_type?: ComplianceEntityType
  entity_id?: string
  user_id?: string
  reason: string
  justification?: string
  granted_at: string
  granted_by: string
  valid_from: string
  valid_until?: string
  requires_renewal: boolean
  renewal_reminder_days?: number
  is_active: boolean
  revoked_at?: string
  revoked_by?: string
  revocation_reason?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Input for creating a compliance rule
 */
export interface CreateComplianceRuleInput {
  rule_code: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  rule_type: ComplianceRuleType
  severity?: ComplianceSeverity
  entity_types?: ComplianceEntityType[]
  conditions: RuleConditions
  notification_template_en?: string
  notification_template_ar?: string
  remediation_instructions_en?: string
  remediation_instructions_ar?: string
  requires_signoff?: boolean
  signoff_roles?: string[]
  signoff_deadline_hours?: number
  auto_escalate_hours?: number
  effective_from?: string
  effective_to?: string
  applies_to_regions?: string[]
  applies_to_categories?: string[]
  external_reference?: string
  regulatory_source?: string
}

/**
 * Input for updating a compliance rule
 */
export interface UpdateComplianceRuleInput {
  name_en?: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  severity?: ComplianceSeverity
  entity_types?: ComplianceEntityType[]
  conditions?: RuleConditions
  notification_template_en?: string
  notification_template_ar?: string
  remediation_instructions_en?: string
  remediation_instructions_ar?: string
  requires_signoff?: boolean
  signoff_roles?: string[]
  signoff_deadline_hours?: number
  auto_escalate_hours?: number
  is_active?: boolean
  effective_from?: string
  effective_to?: string
  applies_to_regions?: string[]
  applies_to_categories?: string[]
  external_reference?: string
  regulatory_source?: string
}

/**
 * Input for checking compliance
 */
export interface CheckComplianceInput {
  entity_type: ComplianceEntityType
  entity_id: string
  action_type: string
  context?: Record<string, unknown>
}

/**
 * Result of a compliance check
 */
export interface ComplianceCheckResult {
  passed: boolean
  blocked: boolean
  rules_checked: number
  violations_found: number
  blocking_violations: number
  violations: Array<{
    violation_id: string
    rule_code: string
    rule_name: string
    severity: ComplianceSeverity
    requires_signoff: boolean
  }>
}

/**
 * Input for signing off a violation
 */
export interface SignoffViolationInput {
  violation_id: string
  action: SignoffAction
  justification: string
  conditions?: string[]
  waiver_valid_until?: string
}

/**
 * Result of sign-off action
 */
export interface SignoffResult {
  success: boolean
  signoff_id?: string
  new_status?: ViolationStatus
  error?: string
}

/**
 * Compliance summary for an entity
 */
export interface EntityComplianceSummary {
  entity_type: ComplianceEntityType
  entity_id: string
  total_violations: number
  pending_violations: number
  critical_violations: number
  blocking_violations: number
  requires_signoff: number
  recent_violations: Array<{
    id: string
    rule_code: string
    severity: ComplianceSeverity
    status: ViolationStatus
    detected_at: string
  }>
}

/**
 * Filter parameters for violations list
 */
export interface ViolationFilters {
  entity_type?: ComplianceEntityType
  entity_id?: string
  rule_type?: ComplianceRuleType
  severity?: ComplianceSeverity[]
  status?: ViolationStatus[]
  requires_signoff?: boolean
  detected_from?: string
  detected_to?: string
  dossier_id?: string
}

/**
 * Paginated violations response
 */
export interface ViolationsListResponse {
  violations: ComplianceViolation[]
  total_count: number
  page: number
  page_size: number
  has_more: boolean
}

/**
 * Input for creating an exemption
 */
export interface CreateExemptionInput {
  rule_id?: string
  rule_code?: string
  entity_type?: ComplianceEntityType
  entity_id?: string
  user_id?: string
  reason: string
  justification?: string
  valid_from?: string
  valid_until?: string
  requires_renewal?: boolean
  renewal_reminder_days?: number
}

// ============================================================================
// Helper Types and Constants
// ============================================================================

/**
 * TanStack Query key factory for compliance queries
 */
const COMPLIANCE_BASE_KEY = ['compliance'] as const

export const complianceKeys = {
  all: COMPLIANCE_BASE_KEY,
  rules: () => [...COMPLIANCE_BASE_KEY, 'rules'] as const,
  rule: (id: string) => [...COMPLIANCE_BASE_KEY, 'rules', id] as const,
  templates: () => [...COMPLIANCE_BASE_KEY, 'templates'] as const,
  violations: () => [...COMPLIANCE_BASE_KEY, 'violations'] as const,
  violation: (id: string) => [...COMPLIANCE_BASE_KEY, 'violations', id] as const,
  violationsByEntity: (type: ComplianceEntityType, id: string) =>
    [...COMPLIANCE_BASE_KEY, 'violations', 'entity', type, id] as const,
  summary: (type: ComplianceEntityType, id: string) =>
    [...COMPLIANCE_BASE_KEY, 'summary', type, id] as const,
  check: (type: ComplianceEntityType, id: string) =>
    [...COMPLIANCE_BASE_KEY, 'check', type, id] as const,
  exemptions: () => [...COMPLIANCE_BASE_KEY, 'exemptions'] as const,
  signoffs: (violationId: string) => [...COMPLIANCE_BASE_KEY, 'signoffs', violationId] as const,
}

/**
 * Labels for compliance rule types
 */
export const RULE_TYPE_LABELS: Record<ComplianceRuleType, { en: string; ar: string }> = {
  cooling_off_period: { en: 'Cooling-Off Period', ar: 'فترة الانتظار' },
  disclosure_requirement: { en: 'Disclosure Requirement', ar: 'متطلب الإفصاح' },
  conflict_check: { en: 'Conflict Check', ar: 'فحص التضارب' },
  approval_threshold: { en: 'Approval Threshold', ar: 'حد الموافقة' },
  frequency_limit: { en: 'Frequency Limit', ar: 'حد التكرار' },
  relationship_restriction: { en: 'Relationship Restriction', ar: 'قيود العلاقة' },
  documentation_requirement: { en: 'Documentation Requirement', ar: 'متطلب التوثيق' },
  gift_limit: { en: 'Gift Limit', ar: 'حد الهدايا' },
  recusal_requirement: { en: 'Recusal Requirement', ar: 'متطلب التنحي' },
  reporting_requirement: { en: 'Reporting Requirement', ar: 'متطلب الإبلاغ' },
}

/**
 * Labels for severity levels
 */
export const SEVERITY_LABELS: Record<ComplianceSeverity, { en: string; ar: string }> = {
  info: { en: 'Information', ar: 'معلومات' },
  warning: { en: 'Warning', ar: 'تحذير' },
  critical: { en: 'Critical', ar: 'حرج' },
  blocking: { en: 'Blocking', ar: 'حاجب' },
}

/**
 * Color mappings for severity levels
 */
export const SEVERITY_COLORS: Record<
  ComplianceSeverity,
  { bg: string; text: string; border: string; icon: string }
> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-500',
  },
  critical: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'text-orange-500',
  },
  blocking: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500',
  },
}

/**
 * Labels for violation status
 */
export const VIOLATION_STATUS_LABELS: Record<ViolationStatus, { en: string; ar: string }> = {
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  acknowledged: { en: 'Acknowledged', ar: 'تم الإقرار' },
  signed_off: { en: 'Signed Off', ar: 'تمت الموافقة' },
  waived: { en: 'Waived', ar: 'تم التنازل' },
  resolved: { en: 'Resolved', ar: 'تم الحل' },
  escalated: { en: 'Escalated', ar: 'تم التصعيد' },
  expired: { en: 'Expired', ar: 'منتهية الصلاحية' },
}

/**
 * Color mappings for violation status
 */
export const VIOLATION_STATUS_COLORS: Record<
  ViolationStatus,
  { bg: string; text: string; border: string }
> = {
  pending: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  acknowledged: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  signed_off: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  waived: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  resolved: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  escalated: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  expired: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-800',
  },
}

/**
 * Labels for sign-off actions
 */
export const SIGNOFF_ACTION_LABELS: Record<SignoffAction, { en: string; ar: string }> = {
  approve: { en: 'Approve', ar: 'موافقة' },
  reject: { en: 'Reject', ar: 'رفض' },
  request_info: { en: 'Request Information', ar: 'طلب معلومات' },
  escalate: { en: 'Escalate', ar: 'تصعيد' },
  waive: { en: 'Waive', ar: 'تنازل' },
}

/**
 * Labels for entity types
 */
export const ENTITY_TYPE_LABELS: Record<ComplianceEntityType, { en: string; ar: string }> = {
  engagement: { en: 'Engagement', ar: 'مشاركة' },
  commitment: { en: 'Commitment', ar: 'التزام' },
  relationship: { en: 'Relationship', ar: 'علاقة' },
  person: { en: 'Person', ar: 'شخص' },
  organization: { en: 'Organization', ar: 'منظمة' },
  country: { en: 'Country', ar: 'دولة' },
  all: { en: 'All Entities', ar: 'جميع الكيانات' },
}

/**
 * Helper to check if a severity requires immediate attention
 */
export function requiresImmediateAttention(severity: ComplianceSeverity): boolean {
  return severity === 'critical' || severity === 'blocking'
}

/**
 * Helper to check if a violation can be signed off
 */
export function canSignOff(violation: ComplianceViolation): boolean {
  return violation.status === 'pending' || violation.status === 'acknowledged'
}

/**
 * Helper to get severity rank for sorting
 */
export function getSeverityRank(severity: ComplianceSeverity): number {
  const ranks: Record<ComplianceSeverity, number> = {
    blocking: 4,
    critical: 3,
    warning: 2,
    info: 1,
  }
  return ranks[severity]
}

/**
 * Helper to check if an entity has blocking violations
 */
export function hasBlockingViolations(summary: EntityComplianceSummary): boolean {
  return summary.blocking_violations > 0
}
