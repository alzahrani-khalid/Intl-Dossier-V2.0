/**
 * Interaction Note Hooks
 * Part of: 027-contact-directory Phase 7 implementation
 *
 * TanStack Query hooks for interaction note operations with automatic caching,
 * invalidation, and optimistic updates.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  createNote,
  getNotesForContact,
  searchNotes,
  updateNote,
  deleteNote,
  uploadAttachment,
  downloadAttachment,
  type InteractionNoteResponse,
  type CreateInteractionNoteParams,
  type SearchInteractionNotesParams,
  type InteractionNotesSearchResponse,
  InteractionAPIError,
} from '@/services/interaction-api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Query Keys Factory
 */
export const interactionKeys = {
  all: ['interactions'] as const,
  lists: () => [...interactionKeys.all, 'list'] as const,
  list: (contactId: string) => [...interactionKeys.lists(), contactId] as const,
  searches: () => [...interactionKeys.all, 'search'] as const,
  search: (params?: SearchInteractionNotesParams) =>
    [...interactionKeys.searches(), { params }] as const,
  details: () => [...interactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...interactionKeys.details(), id] as const,
};

/**
 * Hook to fetch interaction notes for a contact
 */
export function useInteractionNotes(
  contactId: string,
  options?: Omit<
    UseQueryOptions<InteractionNoteResponse[], InteractionAPIError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: interactionKeys.list(contactId),
    queryFn: () => getNotesForContact(contactId),
    enabled: !!contactId,
    ...options,
  });
}

/**
 * Hook to search interaction notes with filters
 */
export function useSearchNotes(
  params?: SearchInteractionNotesParams,
  options?: Omit<
    UseQueryOptions<InteractionNotesSearchResponse, InteractionAPIError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: interactionKeys.search(params),
    queryFn: () => searchNotes(params),
    ...options,
  });
}

/**
 * Hook to create a new interaction note
 */
export function useCreateNote() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('contacts');

  return useMutation({
    mutationFn: async (params: CreateInteractionNoteParams) => {
      return await createNote(params);
    },
    onSuccess: (data, variables) => {
      // Invalidate the contact's interaction list
      queryClient.invalidateQueries({ queryKey: interactionKeys.list(variables.contact_id) });

      // Invalidate all search queries
      queryClient.invalidateQueries({ queryKey: interactionKeys.searches() });

      toast.success(
        t('contactDirectory.interactions.hooks.note_created_success', {
          type: t(`contactDirectory.interactions.types.${data.type}`),
        })
      );
    },
    onError: (error: InteractionAPIError) => {
      toast.error(
        t('contactDirectory.interactions.hooks.note_created_error', { error: error.message })
      );
    },
  });
}

/**
 * Hook to update an existing interaction note
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('contacts');

  return useMutation({
    mutationFn: ({
      id,
      contactId,
      updates,
    }: {
      id: string;
      contactId: string;
      updates: Partial<CreateInteractionNoteParams>;
    }) => updateNote(id, updates),
    onMutate: async ({ id, contactId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: interactionKeys.list(contactId) });

      // Snapshot previous value for rollback
      const previousNotes = queryClient.getQueryData<InteractionNoteResponse[]>(
        interactionKeys.list(contactId)
      );

      // Optimistically update cache
      if (previousNotes) {
        const updatedNotes = previousNotes.map((note) =>
          note.id === id
            ? {
                ...note,
                ...updates,
                updated_at: new Date().toISOString(),
              }
            : note
        );
        queryClient.setQueryData<InteractionNoteResponse[]>(
          interactionKeys.list(contactId),
          updatedNotes
        );
      }

      return { previousNotes, contactId };
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to refetch with server data
      queryClient.invalidateQueries({ queryKey: interactionKeys.list(variables.contactId) });
      queryClient.invalidateQueries({ queryKey: interactionKeys.searches() });

      toast.success(t('contactDirectory.interactions.hooks.note_updated_success'));
    },
    onError: (error: InteractionAPIError, variables, context) => {
      // Rollback on error
      if (context?.previousNotes && context?.contactId) {
        queryClient.setQueryData(interactionKeys.list(context.contactId), context.previousNotes);
      }
      toast.error(
        t('contactDirectory.interactions.hooks.note_updated_error', { error: error.message })
      );
    },
  });
}

/**
 * Hook to delete an interaction note
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('contacts');

  return useMutation({
    mutationFn: ({ id, contactId }: { id: string; contactId: string }) => deleteNote(id),
    onMutate: async ({ id, contactId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: interactionKeys.list(contactId) });

      // Snapshot previous value for rollback
      const previousNotes = queryClient.getQueryData<InteractionNoteResponse[]>(
        interactionKeys.list(contactId)
      );

      // Optimistically remove from cache
      if (previousNotes) {
        const filteredNotes = previousNotes.filter((note) => note.id !== id);
        queryClient.setQueryData<InteractionNoteResponse[]>(
          interactionKeys.list(contactId),
          filteredNotes
        );
      }

      return { previousNotes, contactId };
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: interactionKeys.list(variables.contactId) });
      queryClient.invalidateQueries({ queryKey: interactionKeys.searches() });

      toast.success(t('contactDirectory.interactions.hooks.note_deleted_success'));
    },
    onError: (error: InteractionAPIError, variables, context) => {
      // Rollback on error
      if (context?.previousNotes && context?.contactId) {
        queryClient.setQueryData(interactionKeys.list(context.contactId), context.previousNotes);
      }
      toast.error(
        t('contactDirectory.interactions.hooks.note_deleted_error', { error: error.message })
      );
    },
  });
}

/**
 * Hook to upload an attachment
 */
export function useUploadAttachment() {
  const { t } = useTranslation('contacts');

  return useMutation({
    mutationFn: async ({
      contactId,
      noteId,
      file,
    }: {
      contactId: string;
      noteId: string;
      file: File;
    }) => {
      return await uploadAttachment(contactId, noteId, file);
    },
    onSuccess: () => {
      toast.success(t('contactDirectory.interactions.hooks.attachment_uploaded_success'));
    },
    onError: (error: InteractionAPIError) => {
      toast.error(
        t('contactDirectory.interactions.hooks.attachment_upload_error', { error: error.message })
      );
    },
  });
}

/**
 * Hook to download an attachment
 */
export function useDownloadAttachment() {
  const { t } = useTranslation('contacts');

  return useMutation({
    mutationFn: async ({ path, filename }: { path: string; filename: string }) => {
      const blob = await downloadAttachment(path);
      return { blob, filename };
    },
    onSuccess: ({ blob, filename }) => {
      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('contactDirectory.interactions.hooks.attachment_downloaded_success'));
    },
    onError: (error: InteractionAPIError) => {
      toast.error(
        t('contactDirectory.interactions.hooks.attachment_download_error', {
          error: error.message,
        })
      );
    },
  });
}

/**
 * Hook to invalidate all interaction queries
 * Useful after batch operations or external changes
 */
export function useInvalidateInteractions() {
  const queryClient = useQueryClient();

  return (contactId?: string) => {
    if (contactId) {
      queryClient.invalidateQueries({ queryKey: interactionKeys.list(contactId) });
    } else {
      queryClient.invalidateQueries({ queryKey: interactionKeys.all });
    }
  };
}

/**
 * Hook to prefetch interaction notes for a contact
 * Useful for hover cards or preloading before navigation
 */
export function usePrefetchInteractionNotes() {
  const queryClient = useQueryClient();

  return (contactId: string) => {
    queryClient.prefetchQuery({
      queryKey: interactionKeys.list(contactId),
      queryFn: () => getNotesForContact(contactId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
}
