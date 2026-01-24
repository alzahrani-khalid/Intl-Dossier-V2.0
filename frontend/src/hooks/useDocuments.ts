/**
 * Document Management Hooks
 * @module hooks/useDocuments
 * @feature document-management
 *
 * TanStack Query hooks for document retrieval with automatic caching,
 * filtering by entity ownership, and bilingual support.
 *
 * @description
 * This module provides React hooks for managing document entities:
 * - Query hooks for fetching documents with owner/type filtering
 * - Automatic cache management with 5-minute stale time
 * - Bilingual document support (English and Arabic titles)
 * - Entity-scoped document retrieval (owner_type + owner_id)
 *
 * @example
 * // Fetch documents for a specific entity
 * const { documents, isLoading } = useDocuments({
 *   owner_type: 'dossier',
 *   owner_id: 'uuid-here',
 * });
 *
 * @example
 * // Filter by document type
 * const { documents } = useDocuments({
 *   owner_type: 'dossier',
 *   owner_id: 'uuid-here',
 *   document_type: 'briefing_note',
 * });
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Document entity structure
 *
 * @description
 * Represents a document attached to an entity (dossier, brief, etc.)
 * with bilingual titles and metadata support.
 */
export interface Document {
  /** Unique document identifier (UUID) */
  id: string;
  /** Type of entity owning this document (e.g., 'dossier', 'brief') */
  owner_type: string;
  /** ID of the entity owning this document */
  owner_id: string;
  /** Document classification type (e.g., 'briefing_note', 'report') */
  document_type: string;
  /** Document title in English */
  title_en?: string;
  /** Document title in Arabic */
  title_ar?: string;
  /** Storage path in Supabase Storage */
  storage_path: string;
  /** File size in bytes */
  file_size?: number;
  /** MIME type (e.g., 'application/pdf') */
  mime_type?: string;
  /** Additional document metadata */
  metadata?: Record<string, any>;
  /** User ID who uploaded the document */
  uploaded_by: string;
  /** Timestamp when document was created */
  created_at: string;
}

/**
 * Filters for document queries
 *
 * @description
 * Optional filters to narrow down document retrieval.
 * owner_type and owner_id are typically required together.
 */
export interface UseDocumentsFilters {
  /** Filter by entity type owning the documents */
  owner_type?: string;
  /** Filter by entity ID owning the documents */
  owner_id?: string;
  /** Filter by document classification type */
  document_type?: string;
}

/**
 * Return type for useDocuments hook
 *
 * @description
 * Provides documents array, metadata, loading state, and refetch capability.
 */
export interface UseDocumentsResult {
  /** Array of documents matching the filters */
  documents: Document[];
  /** Total count of matching documents */
  totalCount: number;
  /** Loading state from TanStack Query */
  isLoading: boolean;
  /** Error object if query failed */
  error: Error | null;
  /** Function to manually refetch documents */
  refetch: () => void;
}

/**
 * Hook to fetch documents with optional filtering
 *
 * @description
 * Fetches documents from the Edge Function with entity-based filtering.
 * The query is automatically cached for 5 minutes and only runs when
 * both owner_type and owner_id are provided.
 *
 * @param filters - Optional filters for owner type/id and document type
 * @returns Documents array, count, loading state, error, and refetch function
 *
 * @example
 * // Fetch all documents for a dossier
 * const { documents, totalCount, isLoading } = useDocuments({
 *   owner_type: 'dossier',
 *   owner_id: 'abc-123',
 * });
 *
 * @example
 * // Filter by document type
 * const { documents } = useDocuments({
 *   owner_type: 'brief',
 *   owner_id: 'def-456',
 *   document_type: 'briefing_note',
 * });
 *
 * @example
 * // Manually refetch documents
 * const { refetch } = useDocuments({ owner_type: 'dossier', owner_id: 'id' });
 * await refetch();
 */
export function useDocuments(filters?: UseDocumentsFilters): UseDocumentsResult {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.owner_type) {
        params.append('owner_type', filters.owner_type);
      }
      if (filters?.owner_id) {
        params.append('owner_id', filters.owner_id);
      }
      if (filters?.document_type) {
        params.append('document_type', filters.document_type);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/documents-get?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch documents');
      }

      const result = await response.json();
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!(filters?.owner_type && filters?.owner_id),
  });

  return {
    documents: data?.documents || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
