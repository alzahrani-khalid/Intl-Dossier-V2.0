/**
 * Documents Module - Module Implementation
 *
 * Implements the IDocumentModule contract.
 * This is the public API that other modules use to interact with documents.
 *
 * @module documents/module
 */

import type {
  ModuleId,
  ModuleStatus,
  ModuleResult,
  ModuleError,
  ModuleRequestContext,
  ModulePaginatedResponse,
} from '../core/types'
import type {
  IDocumentModule,
  ModuleHealthStatus,
  DocumentDTO,
  DocumentListParams,
  DocumentUploadParams,
} from '../core/contracts'
import { documentService } from './service'

// ============================================================================
// Module State
// ============================================================================

let moduleStatus: ModuleStatus = 'stopped'

// ============================================================================
// Document Module Implementation
// ============================================================================

export const documentModule: IDocumentModule = {
  // ============================================================================
  // Module Identity
  // ============================================================================

  id: 'documents' as ModuleId,
  name: 'Documents Module',
  version: '1.0.0',
  dependencies: [], // Documents has no module dependencies

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  getStatus(): ModuleStatus {
    return moduleStatus
  },

  async initialize(): Promise<void> {
    moduleStatus = 'initializing'

    try {
      // Any initialization logic (e.g., cache warming, subscriptions)
      // For now, just mark as ready
      moduleStatus = 'ready'
    } catch (error) {
      moduleStatus = 'degraded'
      throw error
    }
  },

  async stop(): Promise<void> {
    // Cleanup logic (e.g., close connections, cancel subscriptions)
    moduleStatus = 'stopped'
  },

  async healthCheck(): Promise<ModuleHealthStatus> {
    // Basic health check - could be extended to check storage, database, etc.
    const isHealthy = moduleStatus === 'ready'

    return {
      status: isHealthy ? 'healthy' : moduleStatus === 'degraded' ? 'degraded' : 'unhealthy',
      module: 'documents',
      timestamp: new Date().toISOString(),
      details: {
        version: this.version,
        status: moduleStatus,
      },
    }
  },

  // ============================================================================
  // Document Operations
  // ============================================================================

  async getDocument(
    id: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<DocumentDTO, ModuleError>> {
    return documentService.getDocument(id, context)
  },

  async listDocuments(
    params: DocumentListParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<ModulePaginatedResponse<DocumentDTO>, ModuleError>> {
    return documentService.listDocuments(params, context)
  },

  async getLinkedDocuments(
    entityRef: { moduleId: ModuleId; entityType: string; entityId: string },
    context: ModuleRequestContext,
  ): Promise<ModuleResult<DocumentDTO[], ModuleError>> {
    return documentService.getLinkedDocuments(entityRef, context)
  },

  async linkDocument(
    documentId: string,
    entityRef: { moduleId: ModuleId; entityType: string; entityId: string },
    context: ModuleRequestContext,
  ): Promise<ModuleResult<void, ModuleError>> {
    return documentService.linkDocument(documentId, entityRef, context)
  },

  async unlinkDocument(
    documentId: string,
    entityRef: { moduleId: ModuleId; entityType: string; entityId: string },
    context: ModuleRequestContext,
  ): Promise<ModuleResult<void, ModuleError>> {
    return documentService.unlinkDocument(documentId, entityRef, context)
  },

  async uploadDocument(
    data: DocumentUploadParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<DocumentDTO, ModuleError>> {
    return documentService.uploadDocument(data, context)
  },

  async deleteDocument(
    id: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<void, ModuleError>> {
    return documentService.deleteDocument(id, context)
  },
}

export default documentModule
