import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Types based on API spec
export interface Attachment {
  id: string;
  after_action_id: string;
  file_name: string;
  file_url: string; // Signed URL with 24-hour expiry
  file_size: number; // In bytes
  mime_type: string;
  scan_status: 'pending' | 'clean' | 'infected' | 'scan_failed';
  uploaded_by: string;
  uploaded_at: string;
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'image/png',
  'image/jpeg',
  'text/plain',
  'text/csv',
] as const;

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
export const MAX_ATTACHMENTS = 10;

// Fetch attachments list for an after-action record
export function useAttachments(afterActionId: string | undefined) {
  return useQuery({
    queryKey: ['attachments', afterActionId],
    queryFn: async () => {
      if (!afterActionId) throw new Error('After-action ID is required');

      const { data, error } = await supabase.functions.invoke('attachments-list', {
        body: { after_action_id: afterActionId },
      });

      if (error) throw error;
      return data as Attachment[];
    },
    enabled: !!afterActionId,
    refetchInterval: (data) => {
      // Poll every 5 seconds if any attachment has scan_status = pending
      const hasPending = data?.some((a) => a.scan_status === 'pending');
      return hasPending ? 5000 : false;
    },
  });
}

// Upload attachment mutation
export function useUploadAttachment(afterActionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // Client-side validation
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 100MB limit');
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
        throw new Error(
          'File type not allowed. Allowed types: PDF, DOCX, XLSX, PPTX, PNG, JPG, TXT, CSV'
        );
      }

      // Check current attachment count
      const currentAttachments = queryClient.getQueryData<Attachment[]>([
        'attachments',
        afterActionId,
      ]);
      if (currentAttachments && currentAttachments.length >= MAX_ATTACHMENTS) {
        throw new Error('Maximum 10 attachments per after-action record');
      }

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('attachments-upload', {
        body: { after_action_id: afterActionId, file: formData },
      });

      if (error) {
        // Handle specific error cases
        if (error.message?.includes('limit')) {
          throw new Error('Maximum 10 attachments per after-action record');
        }
        throw error;
      }

      return data as Attachment;
    },
    onSuccess: (newAttachment) => {
      // Optimistically add to cache
      queryClient.setQueryData<Attachment[]>(['attachments', afterActionId], (old) => {
        return old ? [...old, newAttachment] : [newAttachment];
      });
    },
  });
}

// Delete attachment mutation
export function useDeleteAttachment(afterActionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const { error } = await supabase.functions.invoke('attachments-delete', {
        body: { id: attachmentId },
      });

      if (error) {
        // Check for permission errors
        if (error.message?.includes('permission') || error.message?.includes('creator')) {
          throw new Error('You can only delete attachments you uploaded');
        }
        throw error;
      }

      return attachmentId;
    },
    onMutate: async (attachmentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['attachments', afterActionId] });

      // Snapshot previous value
      const previousAttachments = queryClient.getQueryData<Attachment[]>([
        'attachments',
        afterActionId,
      ]);

      // Optimistically remove from cache
      queryClient.setQueryData<Attachment[]>(['attachments', afterActionId], (old) => {
        return old ? old.filter((a) => a.id !== attachmentId) : [];
      });

      return { previousAttachments };
    },
    onError: (_err, _attachmentId, context) => {
      // Rollback on error
      if (context?.previousAttachments) {
        queryClient.setQueryData(['attachments', afterActionId], context.previousAttachments);
      }
    },
    onSuccess: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['attachments', afterActionId] });
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

// Helper to get file extension from mime type
export function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'text/plain': 'txt',
    'text/csv': 'csv',
  };

  return extensions[mimeType] || 'file';
}

// Helper to check if file URL is still valid (within 24 hours)
export function isFileURLValid(uploadedAt: string): boolean {
  const uploaded = new Date(uploadedAt).getTime();
  const now = Date.now();
  const hoursElapsed = (now - uploaded) / (1000 * 60 * 60);

  return hoursElapsed < 24;
}

// Helper to get scan status color and label
export function getScanStatusDisplay(
  scanStatus: Attachment['scan_status']
): { color: string; label: string; icon: string } {
  switch (scanStatus) {
    case 'pending':
      return { color: 'yellow', label: 'Scanning...', icon: '⏳' };
    case 'clean':
      return { color: 'green', label: 'Safe', icon: '✓' };
    case 'infected':
      return { color: 'red', label: 'Threat Detected', icon: '⚠️' };
    case 'scan_failed':
      return { color: 'gray', label: 'Scan Failed', icon: '?' };
  }
}
