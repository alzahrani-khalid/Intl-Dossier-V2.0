/**
 * AI Module - Public API
 *
 * This is the public entry point for the AI module.
 * Only types and functions exported from here should be used by other modules.
 *
 * @module ai
 */

// ============================================================================
// Module (Primary Export)
// ============================================================================

export { aiModule, default } from './module'

// ============================================================================
// Public Types (Re-exported from core contracts)
// ============================================================================

export type {
  SemanticSearchParams,
  SemanticSearchResult,
  ExtractedEntity,
  SummaryOptions,
  BriefOptions,
  BriefDTO,
  RecommendationParams,
  RecommendationDTO,
} from '../core/contracts'

// ============================================================================
// Events (for subscription)
// ============================================================================

export { AI_EVENTS } from '../core/contracts'
export type { AIEventType } from '../core/contracts'

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * @example
 * // Access the AI module from another module
 * import { getModule } from '@/modules/core'
 * import type { IAIModule } from '@/modules/core/contracts'
 *
 * const aiModule = getModule<IAIModule>('ai')
 *
 * // Perform semantic search
 * const searchResult = await aiModule.semanticSearch(
 *   { query: 'trade agreements with EU', modules: ['documents', 'engagements'] },
 *   context
 * )
 *
 * if (searchResult.success) {
 *   console.log('Search results:', searchResult.data)
 * }
 *
 * @example
 * // Extract entities from text
 * const text = 'Meeting with John Smith from Acme Corp on January 15, 2025 in Riyadh'
 * const result = await aiModule.extractEntities(text, context)
 *
 * if (result.success) {
 *   result.data.forEach(entity => {
 *     console.log(`${entity.type}: ${entity.value} (${entity.confidence}%)`)
 *   })
 * }
 *
 * @example
 * // Generate a brief for an entity
 * const briefResult = await aiModule.generateBrief(
 *   { moduleId: 'engagements', entityType: 'dossier', entityId: '123' },
 *   { includeRelationships: true, includeDocuments: true, language: 'en' },
 *   context
 * )
 *
 * @example
 * // Subscribe to AI events
 * import { getEventBus } from '@/modules/core'
 * import { AI_EVENTS } from '@/modules/ai'
 *
 * const eventBus = getEventBus()
 *
 * eventBus.subscribe(AI_EVENTS.BRIEF_GENERATED, (event) => {
 *   console.log('Brief generated:', event.payload)
 * })
 */
