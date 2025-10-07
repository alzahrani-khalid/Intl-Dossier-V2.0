import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Types based on API spec for positions attachments
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

// Fetch attachments list for a position
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

// Upload attachment mutation
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

// Delete attachment mutation
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

// Helper to format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Helper to get file icon based on MIME type
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
