/**
 * Engagement Context - Label Constants
 *
 * Bilingual label constants for engagement types, categories,
 * statuses, and other enumerated values.
 */

import type {
  EngagementType,
  EngagementCategory,
  EngagementStatus,
  DelegationLevel,
} from './engagement'
import type { ParticipantRole, AttendanceStatus } from './participant'
import type { AgendaItemStatus } from './agenda'

/**
 * Labels for engagement types
 */
export const ENGAGEMENT_TYPE_LABELS: Record<EngagementType, { en: string; ar: string }> = {
  bilateral_meeting: { en: 'Bilateral Meeting', ar: 'اجتماع ثنائي' },
  mission: { en: 'Mission', ar: 'بعثة' },
  delegation: { en: 'Delegation', ar: 'وفد' },
  summit: { en: 'Summit', ar: 'قمة' },
  working_group: { en: 'Working Group', ar: 'مجموعة عمل' },
  roundtable: { en: 'Roundtable', ar: 'طاولة مستديرة' },
  official_visit: { en: 'Official Visit', ar: 'زيارة رسمية' },
  consultation: { en: 'Consultation', ar: 'استشارة' },
  other: { en: 'Other', ar: 'أخرى' },
}

/**
 * Labels for engagement categories
 */
export const ENGAGEMENT_CATEGORY_LABELS: Record<EngagementCategory, { en: string; ar: string }> = {
  diplomatic: { en: 'Diplomatic', ar: 'دبلوماسي' },
  statistical: { en: 'Statistical', ar: 'إحصائي' },
  technical: { en: 'Technical', ar: 'فني' },
  economic: { en: 'Economic', ar: 'اقتصادي' },
  cultural: { en: 'Cultural', ar: 'ثقافي' },
  educational: { en: 'Educational', ar: 'تعليمي' },
  research: { en: 'Research', ar: 'بحثي' },
  other: { en: 'Other', ar: 'أخرى' },
}

/**
 * Labels for engagement status
 */
export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, { en: string; ar: string }> = {
  planned: { en: 'Planned', ar: 'مخطط' },
  confirmed: { en: 'Confirmed', ar: 'مؤكد' },
  in_progress: { en: 'In Progress', ar: 'جاري' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  postponed: { en: 'Postponed', ar: 'مؤجل' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
}

/**
 * Labels for delegation levels
 */
export const DELEGATION_LEVEL_LABELS: Record<DelegationLevel, { en: string; ar: string }> = {
  head_of_state: { en: 'Head of State', ar: 'رئيس دولة' },
  ministerial: { en: 'Ministerial', ar: 'وزاري' },
  senior_official: { en: 'Senior Official', ar: 'مسؤول رفيع' },
  director: { en: 'Director', ar: 'مدير' },
  expert: { en: 'Expert', ar: 'خبير' },
  technical: { en: 'Technical', ar: 'فني' },
}

/**
 * Labels for participant roles
 */
export const PARTICIPANT_ROLE_LABELS: Record<ParticipantRole, { en: string; ar: string }> = {
  host: { en: 'Host', ar: 'مضيف' },
  guest: { en: 'Guest', ar: 'ضيف' },
  delegate: { en: 'Delegate', ar: 'مندوب' },
  head_of_delegation: { en: 'Head of Delegation', ar: 'رئيس الوفد' },
  speaker: { en: 'Speaker', ar: 'متحدث' },
  observer: { en: 'Observer', ar: 'مراقب' },
  organizer: { en: 'Organizer', ar: 'منظم' },
  support_staff: { en: 'Support Staff', ar: 'طاقم دعم' },
  interpreter: { en: 'Interpreter', ar: 'مترجم' },
  other: { en: 'Other', ar: 'أخرى' },
}

/**
 * Labels for attendance status
 */
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, { en: string; ar: string }> = {
  expected: { en: 'Expected', ar: 'متوقع' },
  confirmed: { en: 'Confirmed', ar: 'مؤكد' },
  attended: { en: 'Attended', ar: 'حضر' },
  no_show: { en: 'No Show', ar: 'لم يحضر' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
  tentative: { en: 'Tentative', ar: 'غير مؤكد' },
}

/**
 * Labels for agenda item status
 */
export const AGENDA_ITEM_STATUS_LABELS: Record<AgendaItemStatus, { en: string; ar: string }> = {
  planned: { en: 'Planned', ar: 'مخطط' },
  in_progress: { en: 'In Progress', ar: 'جاري' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  skipped: { en: 'Skipped', ar: 'تم تخطيه' },
  postponed: { en: 'Postponed', ar: 'مؤجل' },
}

/**
 * Get label for engagement type
 */
export function getEngagementTypeLabel(type: EngagementType, language: 'en' | 'ar'): string {
  return ENGAGEMENT_TYPE_LABELS[type]?.[language] || type
}

/**
 * Get label for engagement category
 */
export function getEngagementCategoryLabel(
  category: EngagementCategory,
  language: 'en' | 'ar',
): string {
  return ENGAGEMENT_CATEGORY_LABELS[category]?.[language] || category
}

/**
 * Get label for engagement status
 */
export function getEngagementStatusLabel(status: EngagementStatus, language: 'en' | 'ar'): string {
  return ENGAGEMENT_STATUS_LABELS[status]?.[language] || status
}

/**
 * Get label for delegation level
 */
export function getDelegationLevelLabel(level: DelegationLevel, language: 'en' | 'ar'): string {
  return DELEGATION_LEVEL_LABELS[level]?.[language] || level
}

/**
 * Get label for participant role
 */
export function getParticipantRoleLabel(role: ParticipantRole, language: 'en' | 'ar'): string {
  return PARTICIPANT_ROLE_LABELS[role]?.[language] || role
}

/**
 * Get label for attendance status
 */
export function getAttendanceStatusLabel(status: AttendanceStatus, language: 'en' | 'ar'): string {
  return ATTENDANCE_STATUS_LABELS[status]?.[language] || status
}

/**
 * Get label for agenda item status
 */
export function getAgendaItemStatusLabel(status: AgendaItemStatus, language: 'en' | 'ar'): string {
  return AGENDA_ITEM_STATUS_LABELS[status]?.[language] || status
}
