/**
 * AI Module - Module Implementation
 *
 * Implements the IAIModule contract.
 * This is the public API that other modules use to interact with AI features.
 *
 * @module ai/module
 */

import type {
  ModuleId,
  ModuleStatus,
  ModuleResult,
  ModuleError,
  ModuleRequestContext,
} from '../core/types'
import type {
  IAIModule,
  ModuleHealthStatus,
  SemanticSearchParams,
  SemanticSearchResult,
  ExtractedEntity,
  SummaryOptions,
  BriefOptions,
  BriefDTO,
  RecommendationParams,
  RecommendationDTO,
} from '../core/contracts'
import { aiService } from './service'

// ============================================================================
// Module State
// ============================================================================

let moduleStatus: ModuleStatus = 'stopped'

// ============================================================================
// AI Module Implementation
// ============================================================================

export const aiModule: IAIModule = {
  // ============================================================================
  // Module Identity
  // ============================================================================

  id: 'ai' as ModuleId,
  name: 'AI Module',
  version: '1.0.0',
  dependencies: [], // AI module is standalone

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  getStatus(): ModuleStatus {
    return moduleStatus
  },

  async initialize(): Promise<void> {
    moduleStatus = 'initializing'

    try {
      // Any initialization logic (e.g., model loading, connection checks)
      // For now, just mark as ready
      moduleStatus = 'ready'
    } catch (error) {
      moduleStatus = 'degraded'
      throw error
    }
  },

  async stop(): Promise<void> {
    // Cleanup logic
    moduleStatus = 'stopped'
  },

  async healthCheck(): Promise<ModuleHealthStatus> {
    const isHealthy = moduleStatus === 'ready'

    return {
      status: isHealthy ? 'healthy' : moduleStatus === 'degraded' ? 'degraded' : 'unhealthy',
      module: 'ai',
      timestamp: new Date().toISOString(),
      details: {
        version: this.version,
        status: moduleStatus,
      },
    }
  },

  // ============================================================================
  // AI Operations
  // ============================================================================

  async generateEmbeddings(
    text: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<number[], ModuleError>> {
    return aiService.generateEmbeddings(text, context)
  },

  async semanticSearch(
    params: SemanticSearchParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<SemanticSearchResult[], ModuleError>> {
    return aiService.semanticSearch(params, context)
  },

  async extractEntities(
    text: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<ExtractedEntity[], ModuleError>> {
    return aiService.extractEntities(text, context)
  },

  async generateSummary(
    text: string,
    options: SummaryOptions,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<string, ModuleError>> {
    return aiService.generateSummary(text, options, context)
  },

  async generateBrief(
    entityRef: { moduleId: ModuleId; entityType: string; entityId: string },
    options: BriefOptions,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<BriefDTO, ModuleError>> {
    return aiService.generateBrief(entityRef, options, context)
  },

  async getRecommendations(
    params: RecommendationParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<RecommendationDTO[], ModuleError>> {
    return aiService.getRecommendations(params, context)
  },
}

export default aiModule
