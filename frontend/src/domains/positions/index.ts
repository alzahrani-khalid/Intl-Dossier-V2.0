/**
 * Positions Domain Barrel
 * @module domains/positions
 *
 * Re-exports all hooks, repository, and types for the positions domain.
 * Canonical import path for consumers: `@/domains/positions`
 */

// Hooks
export { usePositions, positionKeys } from './hooks/usePositions'
export { usePosition } from './hooks/usePosition'
export { useCreatePosition } from './hooks/useCreatePosition'
export { useUpdatePosition } from './hooks/useUpdatePosition'
export { useSubmitPosition } from './hooks/useSubmitPosition'
export {
  usePositionSuggestions,
  type UsePositionSuggestionsOptions,
  type UsePositionSuggestionsResult,
} from './hooks/usePositionSuggestions'
export {
  usePositionAnalytics,
  useTopPositions,
  type UsePositionAnalyticsOptions,
} from './hooks/usePositionAnalytics'
export {
  usePositionDossierLinks,
  type UsePositionDossierLinksResult,
} from './hooks/usePositionDossierLinks'
export { useCreatePositionDossierLink } from './hooks/useCreatePositionDossierLink'
export { useDeletePositionDossierLink } from './hooks/useDeletePositionDossierLink'

// Repository
export * as positionsRepo from './repositories/positions.repository'

// Types
export * from './types'
