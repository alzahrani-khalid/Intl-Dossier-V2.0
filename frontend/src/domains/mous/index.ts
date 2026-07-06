/**
 * MoUs Domain Barrel
 * @module domains/mous
 *
 * Re-exports the hook, keys, repository, and types for the mous domain.
 * Canonical import path for consumers: `@/domains/mous`
 */

// Hooks
export { useCreateMou } from './hooks/useCreateMou'

// Keys
export { mouKeys } from './keys'

// Repository
export * as mousRepo from './repositories/mous.repository'

// Types
export * from './types'
