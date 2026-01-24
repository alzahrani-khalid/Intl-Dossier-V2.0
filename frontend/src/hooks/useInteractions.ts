/**
 * Interaction Note Hooks
 * @module hooks/useInteractions
 * @feature 027-contact-directory
 *
 * TanStack Query hooks for interaction note management with automatic caching,
 * cache invalidation, optimistic updates, and attachment handling.
 *
 * @description
 * This module provides a comprehensive set of React hooks for managing interaction notes:
 * - Query hooks for fetching contact interaction histories and searching across notes
 * - Mutation hooks for CRUD operations with optimistic updates and rollback
 * - Attachment management hooks for uploading and downloading files
 * - Utility hooks for prefetching and manual cache invalidation
 * - Toast notifications with i18n support for user feedback
 *
 * All hooks leverage TanStack Query's caching and the interactionKeys factory for
 * hierarchical cache invalidation. Mutations include optimistic updates with automatic
 * rollback on error to provide instant UI feedback.
 *
 * @example
 * // Fetch interaction notes for a contact
 * const { data: notes } = useInteractionNotes('contact-uuid');
 *
 * @example
 * // Search across all interactions
 * const { data } = useSearchNotes({ search: 'meeting', type: 'meeting' });
 *
 * @example
 * // Create new interaction note
 * const { mutate } = useCreateNote();
 * mutate({
 *   contact_id: 'contact-uuid',
 *   type: 'email',
 *   subject: 'Follow-up discussion',
 *   notes: 'Discussed project timeline'
 * });
 *
 * @example
 * // Update note with optimistic UI
 * const { mutate } = useUpdateNote();
 * mutate({ id: 'note-uuid', contactId: 'contact-uuid', updates: { notes: 'Updated content' } });
 * // UI updates immediately, rolls back if server fails
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
 * Query Keys Factory for interaction note queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation at different levels.
 *
 * @example
 * // Invalidate all interaction queries
 * queryClient.invalidateQueries({ queryKey: interactionKeys.all });
 *
 * @example
 * // Invalidate only list queries
 * queryClient.invalidateQueries({ queryKey: interactionKeys.lists() });
 *
 * @example
 * // Invalidate specific contact's interactions
 * queryClient.invalidateQueries({ queryKey: interactionKeys.list('contact-uuid') });
 *
 * @example
 * // Invalidate all search queries
 * queryClient.invalidateQueries({ queryKey: interactionKeys.searches() });
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
 *
 * @description
 * Fetches all interaction notes associated with a specific contact, ordered by date.
 * Query is automatically disabled when contactId is empty. Results include all note
 * types (meetings, emails, calls, visits) and attachment metadata.
 *
 * @param contactId - The unique identifier of the contact
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with array of interaction note responses
 *
 * @example
 * // Basic usage
 * const { data: notes, isLoading } = useInteractionNotes('contact-uuid');
 *
 * @example
 * // With custom stale time
 * const { data } = useInteractionNotes(contactId, {
 *   staleTime: 10 * 60 * 1000, // 10 minutes
 * });
 *
 * @example
 * // Sort by date
 * const { data } = useInteractionNotes(contactId);
 * const sortedNotes = data?.sort((a, b) =>
 *   new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime()
 * );
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
 *
 * @description
 * Searches across all interaction notes with optional filtering by type, contact,
 * date range, and text search. Supports pagination for large result sets. Useful
 * for global search interfaces and reporting.
 *
 * @param params - Optional search parameters including search text, type, contact_id, date range, pagination
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with paginated search results
 *
 * @example
 * // Search by keyword
 * const { data } = useSearchNotes({ search: 'budget meeting' });
 *
 * @example
 * // Filter by type and date range
 * const { data } = useSearchNotes({
 *   type: 'meeting',
 *   from_date: '2024-01-01',
 *   to_date: '2024-12-31',
 *   limit: 50
 * });
 *
 * @example
 * // Search for specific contact's interactions
 * const { data } = useSearchNotes({
 *   contact_id: contactId,
 *   search: 'project'
 * });
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
 *
 * @description
 * Creates a new interaction note for a contact with automatic cache invalidation.
 * After successful creation, invalidates both the contact's note list and all search
 * queries. Shows toast notification with i18n support on success or error.
 *
 * @returns TanStack Mutation result with mutate function accepting CreateInteractionNoteParams
 *
 * @example
 * const { mutate, isPending } = useCreateNote();
 * mutate({
 *   contact_id: 'contact-uuid',
 *   type: 'meeting',
 *   subject: 'Quarterly Review',
 *   notes: 'Discussed budget and timeline',
 *   interaction_date: '2024-01-15T10:00:00Z'
 * });
 *
 * @example
 * // With async/await
 * const { mutateAsync } = useCreateNote();
 * try {
 *   const newNote = await mutateAsync(noteData);
 *   navigate(`/contacts/${contactId}/interactions/${newNote.id}`);
 * } catch (error) {
 *   // Error toast is shown automatically
 * }
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
 *
 * @description
 * Updates an interaction note with optimistic UI updates and automatic rollback on error.
 * The UI is updated immediately before the server responds, providing instant feedback.
 * If the server update fails, the previous state is automatically restored. Shows toast
 * notifications for success and error states.
 *
 * @returns TanStack Mutation result with mutate function accepting id, contactId, and updates
 *
 * @example
 * const { mutate } = useUpdateNote();
 * mutate({
 *   id: 'note-uuid',
 *   contactId: 'contact-uuid',
 *   updates: { notes: 'Updated meeting notes' }
 * });
 *
 * @example
 * // Update multiple fields
 * const { mutate } = useUpdateNote();
 * mutate({
 *   id: noteId,
 *   contactId: contactId,
 *   updates: {
 *     subject: 'Revised Title',
 *     notes: 'Updated content',
 *     interaction_date: '2024-01-16T14:00:00Z'
 *   }
 * });
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
 *
 * @description
 * Deletes an interaction note with optimistic UI updates and automatic rollback on error.
 * The note is immediately removed from the UI before server confirmation. If deletion
 * fails, the note is restored to its previous position. Shows toast notifications for
 * success and error states.
 *
 * @returns TanStack Mutation result with mutate function accepting id and contactId
 *
 * @example
 * const { mutate, isPending } = useDeleteNote();
 * mutate({ id: 'note-uuid', contactId: 'contact-uuid' });
 *
 * @example
 * // With confirmation dialog
 * const { mutate } = useDeleteNote();
 * const handleDelete = () => {
 *   if (confirm('Delete this interaction note?')) {
 *     mutate({ id: noteId, contactId: contactId });
 *   }
 * };
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
 * Hook to upload an attachment to an interaction note
 *
 * @description
 * Uploads a file attachment to an interaction note using Supabase Storage. Shows
 * toast notification on success or error. Uploaded files are linked to the note
 * and can be downloaded later via useDownloadAttachment.
 *
 * @returns TanStack Mutation result with mutate function accepting contactId, noteId, and file
 *
 * @example
 * const { mutate: uploadFile, isPending } = useUploadAttachment();
 * uploadFile({
 *   contactId: 'contact-uuid',
 *   noteId: 'note-uuid',
 *   file: selectedFile
 * });
 *
 * @example
 * // Handle file input change
 * const { mutate } = useUploadAttachment();
 * const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
 *   const file = e.target.files?.[0];
 *   if (file) {
 *     mutate({ contactId, noteId, file });
 *   }
 * };
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
 * Hook to download an attachment from an interaction note
 *
 * @description
 * Downloads a file attachment from Supabase Storage and triggers browser download.
 * Creates a temporary blob URL, programmatically clicks a download link, and cleans
 * up resources. Shows toast notification on success or error.
 *
 * @returns TanStack Mutation result with mutate function accepting path and filename
 *
 * @example
 * const { mutate: downloadFile, isPending } = useDownloadAttachment();
 * downloadFile({
 *   path: 'contact-uuid/note-uuid/document.pdf',
 *   filename: 'Meeting Notes.pdf'
 * });
 *
 * @example
 * // Download from attachment list
 * const { mutate } = useDownloadAttachment();
 * const handleDownload = (attachment) => {
 *   mutate({
 *     path: attachment.storage_path,
 *     filename: attachment.filename
 *   });
 * };
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
 * Hook to invalidate all interaction queries manually
 *
 * @description
 * Returns a function to manually invalidate interaction queries. Useful after batch
 * operations, external data changes, or when real-time updates need to be triggered.
 * Can invalidate all queries or just a specific contact's interactions.
 *
 * @returns Function accepting optional contactId to invalidate specific or all queries
 *
 * @example
 * const invalidateInteractions = useInvalidateInteractions();
 * // Invalidate specific contact's interactions
 * invalidateInteractions('contact-uuid');
 *
 * @example
 * // Invalidate all interaction queries
 * const invalidateInteractions = useInvalidateInteractions();
 * invalidateInteractions(); // no contactId = invalidate all
 *
 * @example
 * // After batch import
 * const invalidate = useInvalidateInteractions();
 * const handleBatchImport = async () => {
 *   await importInteractions(data);
 *   invalidate(); // Refresh all data
 * };
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
 *
 * @description
 * Returns a function to prefetch interaction notes for a contact before they're needed.
 * Useful for hover cards, tooltips, or preloading data before navigation. Prefetched
 * data is cached for 5 minutes and automatically used when the same query is executed.
 *
 * @returns Function accepting contactId to prefetch their interaction notes
 *
 * @example
 * const prefetchNotes = usePrefetchInteractionNotes();
 * // Prefetch on hover
 * <Card onMouseEnter={() => prefetchNotes(contact.id)}>
 *   {contact.name}
 * </Card>
 *
 * @example
 * // Prefetch before navigation
 * const prefetch = usePrefetchInteractionNotes();
 * const handleClick = (contactId: string) => {
 *   prefetch(contactId);
 *   navigate(`/contacts/${contactId}`);
 * };
 *
 * @example
 * // Prefetch on component mount for likely next page
 * const prefetch = usePrefetchInteractionNotes();
 * useEffect(() => {
 *   upcomingContacts.forEach(c => prefetch(c.id));
 * }, [upcomingContacts]);
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
