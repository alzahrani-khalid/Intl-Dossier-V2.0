/**
 * Documents Domain Barrel
 * @module domains/documents
 *
 * Re-exports all hooks, repository, and types for the documents domain.
 * Canonical import path for consumers: `@/domains/documents`
 */

// Hooks
export {
  useDocuments,
  type Document,
  type UseDocumentsFilters,
  type UseDocumentsResult,
} from './hooks/useDocuments'

export { useExportData } from './hooks/useExportData'

// Repository
export * as documentsRepo from './repositories/documents.repository'

// Types
export * from './types'
