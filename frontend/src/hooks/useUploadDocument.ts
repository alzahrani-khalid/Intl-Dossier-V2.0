/**
 * Document Upload Hook
 * @module hooks/useUploadDocument
 * @feature document-management
 *
 * TanStack Mutation hook for uploading documents with progress tracking,
 * automatic cache invalidation, and security classification.
 *
 * @description
 * This module provides a React hook for uploading documents to entities:
 * - File upload with XMLHttpRequest for progress tracking
 * - Support for sensitivity levels (public, internal, confidential, secret)
 * - Bilingual support (English, Arabic, or both)
 * - Tag-based organization
 * - Automatic virus scanning
 * - Version control with latest flag
 * - Automatic cache invalidation after successful upload
 *
 * @example
 * // Upload a document to a dossier
 * const { uploadDocument, isUploading, uploadProgress } = useUploadDocument('dossier', dossierId);
 * uploadDocument({
 *   file: selectedFile,
 *   documentType: 'briefing_note',
 *   sensitivityLevel: 'internal',
 *   language: 'both',
 *   tags: ['policy', 'bilateral'],
 * });
 *
 * @example
 * // Monitor upload progress
 * const { uploadProgress, isUploading } = useUploadDocument('brief', briefId);
 * // uploadProgress ranges from 0-100
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Parameters for document upload
 *
 * @description
 * Defines the structure for uploading a document with metadata.
 * ownerType and ownerId are bound at hook initialization.
 */
interface UploadDocumentParams {
  /** Type of entity owning the document (e.g., 'dossier', 'brief') */
  ownerType: string;
  /** ID of the entity owning the document */
  ownerId: string;
  /** File object to upload */
  file: File;
  /** Document classification type */
  documentType: string;
  /** Security classification level (defaults to 'internal') */
  sensitivityLevel?: 'public' | 'internal' | 'confidential' | 'secret';
  /** Document language(s) */
  language?: 'en' | 'ar' | 'both';
  /** Optional tags for organization */
  tags?: string[];
}

/**
 * Response from document upload API
 *
 * @description
 * Contains the created document metadata including storage path,
 * scan status, and version information.
 */
interface UploadDocumentResponse {
  /** Unique document identifier (UUID) */
  id: string;
  /** Type of entity owning the document */
  owner_type: string;
  /** ID of the entity owning the document */
  owner_id: string;
  /** Original file name */
  file_name: string;
  /** File size in bytes */
  file_size: number;
  /** MIME type detected */
  mime_type: string;
  /** Storage path in Supabase Storage */
  storage_path: string;
  /** Document classification type */
  document_type: string;
  /** Security classification level */
  sensitivity_level: string;
  /** Document language */
  language: string;
  /** Assigned tags */
  tags: string[];
  /** Virus scan status */
  scan_status: 'pending' | 'clean' | 'infected' | 'error';
  /** Version number (1-indexed) */
  version_number: number;
  /** Whether this is the latest version */
  is_latest: boolean;
  /** User ID who uploaded */
  uploaded_by: string;
  /** Upload timestamp */
  uploaded_at: string;
}

/**
 * Hook to upload documents with progress tracking
 *
 * @description
 * Creates a mutation for uploading files with real-time progress updates.
 * Uses XMLHttpRequest instead of fetch to track upload progress.
 * Automatically invalidates document cache after successful upload.
 *
 * @param ownerType - Type of entity owning the document (e.g., 'dossier')
 * @param ownerId - ID of the entity owning the document
 * @returns Upload mutation, progress percentage, loading state, and error
 *
 * @example
 * // Basic document upload
 * const { uploadDocument, isUploading, uploadProgress, error } = useUploadDocument(
 *   'dossier',
 *   dossierId
 * );
 *
 * const handleUpload = (file: File) => {
 *   uploadDocument({
 *     file,
 *     documentType: 'memo',
 *     sensitivityLevel: 'internal',
 *   });
 * };
 *
 * @example
 * // Upload with tags and language
 * const { uploadDocument } = useUploadDocument('brief', briefId);
 * uploadDocument({
 *   file: pdfFile,
 *   documentType: 'briefing_note',
 *   sensitivityLevel: 'confidential',
 *   language: 'both',
 *   tags: ['urgent', 'bilateral', 'france'],
 * });
 *
 * @example
 * // Show progress bar
 * const { uploadProgress, isUploading } = useUploadDocument('dossier', id);
 * return (
 *   <div>
 *     {isUploading && <ProgressBar value={uploadProgress} />}
 *   </div>
 * );
 */
export function useUploadDocument(ownerType: string, ownerId: string) {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (params: Omit<UploadDocumentParams, 'ownerType' | 'ownerId'>) => {
      const formData = new FormData();
      formData.append('owner_type', ownerType);
      formData.append('owner_id', ownerId);
      formData.append('file', params.file);
      formData.append('document_type', params.documentType);

      if (params.sensitivityLevel) {
        formData.append('sensitivity_level', params.sensitivityLevel);
      }

      if (params.language) {
        formData.append('language', params.language);
      }

      if (params.tags && params.tags.length > 0) {
        formData.append('tags', JSON.stringify(params.tags));
      }

      // Create XMLHttpRequest for progress tracking
      return new Promise<UploadDocumentResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          setUploadProgress(100);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        xhr.open('POST', `${supabaseUrl}/functions/v1/documents-create`);

        // Get auth token from localStorage or your auth provider
        const token = localStorage.getItem('supabase.auth.token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.send(formData);
      });
    },
    onSuccess: () => {
      // Invalidate documents query cache
      queryClient.invalidateQueries({
        queryKey: ['documents', ownerType, ownerId],
      });

      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000);
    },
    onError: () => {
      // Reset progress on error
      setUploadProgress(0);
    },
  });

  return {
    uploadDocument: mutation.mutate,
    isUploading: mutation.isPending,
    uploadProgress,
    error: mutation.error,
  };
}
