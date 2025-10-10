// T069: useUploadDocument mutation hook for document uploads
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface UploadDocumentParams {
  ownerType: string;
  ownerId: string;
  file: File;
  documentType: string;
  sensitivityLevel?: 'public' | 'internal' | 'confidential' | 'secret';
  language?: 'en' | 'ar' | 'both';
  tags?: string[];
}

interface UploadDocumentResponse {
  id: string;
  owner_type: string;
  owner_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  document_type: string;
  sensitivity_level: string;
  language: string;
  tags: string[];
  scan_status: 'pending' | 'clean' | 'infected' | 'error';
  version_number: number;
  is_latest: boolean;
  uploaded_by: string;
  uploaded_at: string;
}

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
