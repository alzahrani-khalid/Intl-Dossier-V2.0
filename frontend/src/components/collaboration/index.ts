/**
 * Collaboration Components
 * Feature: realtime-collaboration-indicators
 *
 * Components for real-time collaboration features including:
 * - Active viewers avatar stack
 * - Editing lock indicators
 * - Conflict resolution dialogs
 */

export { ActiveViewers, ActiveViewersCompact } from './ActiveViewers'
export { EditingLockIndicator, EditingLockIndicatorConditional } from './EditingLockIndicator'
export { ConflictResolutionDialog, ConflictBanner } from './ConflictResolutionDialog'

// Re-export types from hooks
export type {
  DossierPresenceUser,
  DossierPresenceState,
  PresenceStatus,
  UseDossierPresenceOptions,
} from '@/hooks/useDossierPresence'
