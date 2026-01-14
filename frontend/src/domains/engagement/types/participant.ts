/**
 * Engagement Context - Participant Types
 *
 * Types for engagement participants including internal dossiers
 * and external attendees.
 */

import type { DossierReference } from '@/domains/shared'

/**
 * Type of participant in the engagement
 */
export type ParticipantType = 'person' | 'organization' | 'country' | 'external'

/**
 * Role of participant in the engagement
 */
export type ParticipantRole =
  | 'host'
  | 'guest'
  | 'delegate'
  | 'head_of_delegation'
  | 'speaker'
  | 'observer'
  | 'organizer'
  | 'support_staff'
  | 'interpreter'
  | 'other'

/**
 * Attendance status of participant
 */
export type AttendanceStatus =
  | 'expected'
  | 'confirmed'
  | 'attended'
  | 'no_show'
  | 'cancelled'
  | 'tentative'

/**
 * Engagement participant record
 */
export interface EngagementParticipant {
  id: string
  engagement_id: string
  participant_type: ParticipantType
  participant_dossier_id?: string
  external_name_en?: string
  external_name_ar?: string
  external_title_en?: string
  external_title_ar?: string
  external_organization_en?: string
  external_organization_ar?: string
  role: ParticipantRole
  attendance_status: AttendanceStatus
  notes?: string
  created_at: string
  created_by?: string
  // Joined dossier info
  dossier?: DossierReference
}

/**
 * Input for adding a participant
 */
export interface EngagementParticipantCreate {
  participant_type: ParticipantType
  participant_dossier_id?: string
  external_name_en?: string
  external_name_ar?: string
  external_title_en?: string
  external_title_ar?: string
  external_organization_en?: string
  external_organization_ar?: string
  role: ParticipantRole
  attendance_status?: AttendanceStatus
  notes?: string
}

/**
 * Input for updating a participant
 */
export interface EngagementParticipantUpdate {
  participant_type?: ParticipantType
  participant_dossier_id?: string
  external_name_en?: string
  external_name_ar?: string
  external_title_en?: string
  external_title_ar?: string
  external_organization_en?: string
  external_organization_ar?: string
  role?: ParticipantRole
  attendance_status?: AttendanceStatus
  notes?: string
}

/**
 * Type guard for internal participant (linked to dossier)
 */
export function isInternalParticipant(participant: EngagementParticipant): boolean {
  return participant.participant_type !== 'external' && !!participant.participant_dossier_id
}

/**
 * Type guard for external participant
 */
export function isExternalParticipant(participant: EngagementParticipant): boolean {
  return participant.participant_type === 'external' || !participant.participant_dossier_id
}

/**
 * Get display name for participant
 */
export function getParticipantDisplayName(
  participant: EngagementParticipant,
  language: 'en' | 'ar',
): string {
  if (participant.dossier) {
    return language === 'ar' ? participant.dossier.name_ar : participant.dossier.name_en
  }
  return language === 'ar'
    ? participant.external_name_ar || participant.external_name_en || ''
    : participant.external_name_en || participant.external_name_ar || ''
}
