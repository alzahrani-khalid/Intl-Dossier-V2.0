/**
 * Store Index
 *
 * Central export point for all Zustand stores.
 */

// Auth Store
export { useAuthStore, type AuthUser, type AuthState } from './authStore'

// UI Store
export { useUIStore, type Notification, type SupportedLanguage, type ModalState } from './uiStore'

// Entity History Store
export {
  useEntityHistoryStore,
  createDossierHistoryEntry,
  createPersonHistoryEntry,
  createEngagementHistoryEntry,
  createPositionHistoryEntry,
  type EntityType,
  type EntityHistoryEntry,
} from './entityHistoryStore'

// Pinned Entities Store
export {
  usePinnedEntitiesStore,
  getPinnedColorClass,
  type PinnedEntityEntry,
} from './pinnedEntitiesStore'

// Dossier Store (Enhanced Context Management)
export {
  useDossierStore,
  useActiveDossier,
  useRecentDossiers,
  usePinnedDossiers,
  useDossierContextResolution,
  getDossierRoute,
  getDossierColorClass,
  type DossierEntry,
  type InheritanceContext,
  type DossierStoreState,
  type DossierStoreActions,
  type DossierStore,
} from './dossierStore'
