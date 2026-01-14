/**
 * Engagement Bounded Context - Public API
 *
 * This module exports all public types, hooks, and services
 * from the Engagement context.
 *
 * Import from this module:
 * ```typescript
 * import {
 *   useEngagements,
 *   useEngagement,
 *   EngagementDossier,
 *   engagementService
 * } from '@/domains/engagement'
 * ```
 */

// ============================================================================
// Types
// ============================================================================

// Engagement Types
export type {
  EngagementType,
  EngagementCategory,
  EngagementStatus,
  DelegationLevel,
  EngagementDossier,
  EngagementExtension,
  EngagementListItem,
  EngagementCreate,
  EngagementUpdate,
  EngagementSearchParams,
  EngagementFullProfile,
} from './types/engagement'

// Participant Types
export type {
  ParticipantType,
  ParticipantRole,
  AttendanceStatus,
  EngagementParticipant,
  EngagementParticipantCreate,
  EngagementParticipantUpdate,
} from './types/participant'
export {
  isInternalParticipant,
  isExternalParticipant,
  getParticipantDisplayName,
} from './types/participant'

// Agenda Types
export type {
  AgendaItemStatus,
  EngagementAgendaItem,
  EngagementAgendaItemCreate,
  EngagementAgendaItemUpdate,
} from './types/agenda'
export {
  calculateTotalDuration,
  getCompletedCount,
  getProgressPercentage,
  sortAgendaItems,
} from './types/agenda'

// Labels
export {
  ENGAGEMENT_TYPE_LABELS,
  ENGAGEMENT_CATEGORY_LABELS,
  ENGAGEMENT_STATUS_LABELS,
  DELEGATION_LEVEL_LABELS,
  PARTICIPANT_ROLE_LABELS,
  ATTENDANCE_STATUS_LABELS,
  AGENDA_ITEM_STATUS_LABELS,
  getEngagementTypeLabel,
  getEngagementCategoryLabel,
  getEngagementStatusLabel,
  getDelegationLevelLabel,
  getParticipantRoleLabel,
  getAttendanceStatusLabel,
  getAgendaItemStatusLabel,
} from './types/labels'

// ============================================================================
// Repository
// ============================================================================

export {
  engagementRepository,
  type EngagementRepository,
  type EngagementListResponse,
} from './repositories/engagement.repository'

// ============================================================================
// Service
// ============================================================================

export { engagementService, type EngagementService } from './services/engagement.service'

// ============================================================================
// Hooks
// ============================================================================

export {
  // Query Keys
  engagementKeys,
  // Engagement Hooks
  useEngagements,
  useEngagement,
  useCreateEngagement,
  useUpdateEngagement,
  useArchiveEngagement,
  // Participant Hooks
  useEngagementParticipants,
  useAddEngagementParticipant,
  useRemoveEngagementParticipant,
  // Agenda Hooks
  useEngagementAgenda,
  useAddEngagementAgendaItem,
  useUpdateEngagementAgendaItem,
  useRemoveEngagementAgendaItem,
  // Utility Hooks
  useInvalidateEngagements,
} from './hooks/useEngagements'
