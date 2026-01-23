/**
 * Position Attachments Hooks
 * @module hooks/usePositionAttachments
 *
 * TanStack Query hooks for managing position file attachments with validation,
 * optimistic updates, and automatic cache management.
 *
 * @description
 * This module provides React hooks for position attachment operations:
 * - Query hook for fetching attachment lists
 * - Mutation hook for uploading attachments with client-side validation
 * - Mutation hook for deleting attachments with optimistic updates
 * - Helper functions for file size formatting and icon selection
 * - File type and size validation (50MB limit, PDF/DOCX/XLSX/PNG/JPG only)
 *
 * @example
 * // Fetch attachments for a position
 * const { data: attachments } = usePositionAttachments('position-uuid');
 *
 * @example
 * // Upload a new attachment
 * const { mutate: upload } = useUploadPositionAttachment('position-uuid');
 * upload(file);
 *
 * @example
 * // Delete an attachment
 * const { mutate: deleteAttachment } = useDeletePositionAttachment('position-uuid');
 * deleteAttachment('attachment-uuid');
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Position attachment metadata structure
 *
 * @description
 * Contains file metadata and storage information for position attachments.
 */
export interface PositionAttachment {
  id: string;
  position_id: string;
  file_name: string;
  file_size: number; // In bytes
  file_type: string; // MIME type
  storage_path: string;
  uploader_id: string;
  created_at: string;
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  'image/png',
  'image/jpeg',
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

/**
 * Hook to fetch attachments list for a position
 *
 * @description
 * Fetches all file attachments associated with a position. Results are cached
 * and automatically updated when attachments are uploaded or deleted.
 *
 * @param positionId - The unique identifier of the position (optional for conditional queries)
 * @returns TanStack Query result with array of PositionAttachment objects
 *
 * @example
 * // Basic usage
 * const { data: attachments, isLoading } = usePositionAttachments('uuid');
 *
 * @example
 * // Conditional fetching
 * const { data } = usePositionAttachments(positionId);
 * // Only fetches when positionId is defined
 *
 * @example
 * // Display attachments
 * const { data: attachments } = usePositionAttachments('uuid');
 * attachments?.map(att => (
 *   <div key={att.id}>
 *     {getFileIcon(att.file_type)} {att.file_name} ({formatFileSize(att.file_size)})
 *   </div>
 * ));
 */
export function usePositionAttachments(positionId: string | undefined) {
  return useQuery({
    queryKey: ['position-attachments', positionId],
    queryFn: async () => {
      if (!positionId) throw new Error('Position ID is required');

      const { data, error } = await supabase.functions.invoke(
        `positions/${positionId}/attachments`,
        {
          method: 'GET',
        }
      );

      if (error) throw error;
      return data as PositionAttachment[];
    },
    enabled: !!positionId,
  });
}

/**
 * Hook to upload a new attachment to a position
 *
 * @description
 * Uploads a file attachment to a position with client-side validation for file type
 * and size. Implements optimistic updates to cache. Validates against allowed MIME
 * types (PDF, DOCX, XLSX, PNG, JPG) and 50MB size limit.
 *
 * @param positionId - The unique identifier of the position
 * @returns TanStack Mutation result with mutate function accepting File object
 *
 * @example
 * // Basic usage
 * const { mutate: upload, isPending } = useUploadPositionAttachment('uuid');
 * upload(file);
 *
 * @example
 * // With error handling
 * const { mutate, error } = useUploadPositionAttachment('uuid');
 * if (error) {
 *   if (error.message.includes('50MB')) {
 *     console.error('File too large');
 *   } else if (error.message.includes('not allowed')) {
 *     console.error('Invalid file type');
 *   }
 * }
 *
 * @example
 * // Upload with callbacks
 * const { mutate } = useUploadPositionAttachment('uuid');
 * mutate(file, {
 *   onSuccess: (attachment) => toast.success('Uploaded successfully'),
 *   onError: (error) => toast.error(error.message),
 * });
 */
export function useUploadPositionAttachment(positionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // Client-side validation
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 50MB limit');
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
        throw new Error(
          'File type not allowed. Allowed types: PDF, DOCX, XLSX, PNG, JPG'
        );
      }

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke(
        `positions/${positionId}/attachments`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (error) {
        // Handle specific error cases
        if (error.message?.includes('413') || error.message?.includes('too large')) {
          throw new Error('File size exceeds 50MB limit');
        }
        throw error;
      }

      return data as PositionAttachment;
    },
    onSuccess: (newAttachment) => {
      // Optimistically add to cache
      queryClient.setQueryData<PositionAttachment[]>(
        ['position-attachments', positionId],
        (old) => {
          return old ? [...old, newAttachment] : [newAttachment];
        }
      );
    },
  });
}

/**
 * Hook to delete an attachment from a position
 *
 * @description
 * Deletes a file attachment from a position with optimistic updates and automatic
 * rollback on error. Validates user permissions before deletion.
 *
 * @param positionId - The unique identifier of the position
 * @returns TanStack Mutation result with mutate function accepting attachment ID
 *
 * @example
 * // Basic usage
 * const { mutate: deleteAttachment } = useDeletePositionAttachment('position-uuid');
 * deleteAttachment('attachment-uuid');
 *
 * @example
 * // With permission error handling
 * const { mutate, error } = useDeletePositionAttachment('uuid');
 * if (error?.message.includes('permission')) {
 *   console.error('You cannot delete this attachment');
 * }
 *
 * @example
 * // Delete with confirmation
 * const { mutate } = useDeletePositionAttachment('uuid');
 * if (confirm('Delete this attachment?')) {
 *   mutate(attachmentId, {
 *     onSuccess: () => toast.success('Deleted'),
 *     onError: (err) => toast.error(err.message),
 *   });
 * }
 */
export function useDeletePositionAttachment(positionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const { error } = await supabase.functions.invoke(`attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (error) {
        // Check for permission errors
        if (error.message?.includes('permission') || error.message?.includes('forbidden')) {
          throw new Error('You do not have permission to delete this attachment');
        }
        throw error;
      }

      return attachmentId;
    },
    onMutate: async (attachmentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['position-attachments', positionId] });

      // Snapshot previous value
      const previousAttachments = queryClient.getQueryData<PositionAttachment[]>([
        'position-attachments',
        positionId,
      ]);

      // Optimistically remove from cache
      queryClient.setQueryData<PositionAttachment[]>(
        ['position-attachments', positionId],
        (old) => {
          return old ? old.filter((a) => a.id !== attachmentId) : [];
        }
      );

      return { previousAttachments };
    },
    onError: (_err, _attachmentId, context) => {
      // Rollback on error
      if (context?.previousAttachments) {
        queryClient.setQueryData(
          ['position-attachments', positionId],
          context.previousAttachments
        );
      }
    },
    onSuccess: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['position-attachments', positionId] });
    },
  });
}

/**
 * Helper function to format file size for display
 *
 * @description
 * Converts byte count to human-readable format (Bytes, KB, MB, GB).
 *
 * @param bytes - File size in bytes
 * @returns Formatted string with appropriate unit (e.g., "2.5 MB")
 *
 * @example
 * formatFileSize(1024); // "1 KB"
 * formatFileSize(1536000); // "1.46 MB"
 * formatFileSize(52428800); // "50 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Helper function to get file icon emoji based on MIME type
 *
 * @description
 * Returns an appropriate emoji icon for displaying file types visually.
 *
 * @param mimeType - The MIME type of the file
 * @returns Emoji string representing the file type
 *
 * @example
 * getFileIcon('application/pdf'); // "📄"
 * getFileIcon('image/png'); // "🖼️"
 * getFileIcon('application/vnd.openxmlformats-officedocument.wordprocessingml.document'); // "📝"
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📄';
  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return '📝';
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
    return '📊';
  if (mimeType.startsWith('image/')) return '🖼️';
  return '📎';
}
