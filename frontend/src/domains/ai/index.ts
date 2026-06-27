/**
 * AI Domain Barrel
 * @module domains/ai
 *
 * Re-exports all hooks, repository, and types for the AI domain.
 */

// Hooks
export { useAIFieldAssist } from './hooks/useAIFieldAssist'
export type {
  GeneratedFields,
  FieldAssistParams,
  UseAIFieldAssistReturn,
} from './hooks/useAIFieldAssist'

export { useGenerateBrief } from './hooks/useGenerateBrief'
export type {
  BriefGenerationParams,
  BriefContent,
  UseGenerateBriefReturn,
} from './hooks/useGenerateBrief'

export { useCreateManualBrief } from './hooks/useCreateManualBrief'

// Repository
export * as aiRepo from './repositories/ai.repository'

// Types
export * from './types'
