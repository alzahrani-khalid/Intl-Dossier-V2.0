/**
 * useCollaborativeEditing Hook
 *
 * Provides real-time collaborative editing functionality with:
 * - Edit sessions and presence tracking
 * - Suggestions with accept/reject workflow
 * - Track changes with authorship
 * - Inline comments with threading
 * - Collaborator management
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import {
  EditSession,
  ActiveEditor,
  SuggestionWithAuthor,
  TrackChangeWithAuthor,
  InlineCommentWithAuthor,
  CollaboratorWithUser,
  CollaborationSummary,
  CursorPosition,
  Viewport,
  TextPosition,
  TrackChangeType,
  InlineCommentStatus,
  UseCollaborativeEditingReturn,
  CreateSuggestionParams,
  CreateTrackChangeParams,
  CreateInlineCommentParams,
  UpdateCollaboratorParams,
  AddCollaboratorParams,
} from '@/types/collaborative-editing.types'

const EDGE_FUNCTION_URL = '/functions/v1/collaborative-editing'

// Query key factory
export const collaborativeEditingKeys = {
  all: ['collaborative-editing'] as const,
  sessions: (documentId: string) =>
    [...collaborativeEditingKeys.all, 'sessions', documentId] as const,
  editors: (documentId: string) =>
    [...collaborativeEditingKeys.all, 'editors', documentId] as const,
  summary: (documentId: string) =>
    [...collaborativeEditingKeys.all, 'summary', documentId] as const,
  suggestions: (documentId: string) =>
    [...collaborativeEditingKeys.all, 'suggestions', documentId] as const,
  changes: (documentId: string) =>
    [...collaborativeEditingKeys.all, 'changes', documentId] as const,
  comments: (documentId: string) =>
    [...collaborativeEditingKeys.all, 'comments', documentId] as const,
  collaborators: (documentId: string) =>
    [...collaborativeEditingKeys.all, 'collaborators', documentId] as const,
}

interface UseCollaborativeEditingOptions {
  documentId: string
  documentVersionId?: string
  autoJoin?: boolean
  onEditorJoined?: (editor: ActiveEditor) => void
  onEditorLeft?: (editor: ActiveEditor) => void
  onSuggestionCreated?: (suggestion: SuggestionWithAuthor) => void
  onChangeCreated?: (change: TrackChangeWithAuthor) => void
  onCommentCreated?: (comment: InlineCommentWithAuthor) => void
}

// Debounce helper
function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function useCollaborativeEditing(
  options: UseCollaborativeEditingOptions,
): UseCollaborativeEditingReturn {
  const {
    documentId,
    documentVersionId,
    autoJoin = true,
    onEditorJoined,
    onEditorLeft,
    onSuggestionCreated,
    onChangeCreated,
    onCommentCreated,
  } = options

  const { user, session: authSession } = useAuthStore()
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [currentSession, setCurrentSession] = useState<EditSession | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const cursorUpdateRef = useRef<ReturnType<typeof debounce> | null>(null)

  // ========== API HELPERS ==========
  const callEdgeFunction = useCallback(
    async <T>(
      path: string,
      method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
      body?: unknown,
    ): Promise<T> => {
      const response = await supabase.functions.invoke('collaborative-editing', {
        body: method === 'GET' ? undefined : body,
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      return response.data as T
    },
    [],
  )

  // ========== QUERIES ==========

  // Active editors query
  const {
    data: activeEditors = [],
    isLoading: isLoadingEditors,
    error: editorsError,
  } = useQuery({
    queryKey: collaborativeEditingKeys.editors(documentId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_editors', {
        p_document_id: documentId,
      })
      if (error) throw error
      return (data || []) as ActiveEditor[]
    },
    enabled: !!documentId,
    staleTime: 5000, // 5 seconds
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  })

  // Summary query
  const {
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = useQuery({
    queryKey: collaborativeEditingKeys.summary(documentId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_collaboration_summary', {
        p_document_id: documentId,
      })
      if (error) throw error
      return (data?.[0] || null) as CollaborationSummary | null
    },
    enabled: !!documentId,
    staleTime: 10000,
  })

  // Suggestions query
  const {
    data: suggestions = [],
    isLoading: isLoadingSuggestions,
    error: suggestionsError,
  } = useQuery({
    queryKey: collaborativeEditingKeys.suggestions(documentId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_document_suggestions', {
        p_document_id: documentId,
        p_status: null, // Get all statuses
        p_limit: 100,
        p_offset: 0,
      })
      if (error) throw error
      return (data || []) as SuggestionWithAuthor[]
    },
    enabled: !!documentId,
    staleTime: 5000,
  })

  // Track changes query
  const {
    data: trackChanges = [],
    isLoading: isLoadingChanges,
    error: changesError,
  } = useQuery({
    queryKey: collaborativeEditingKeys.changes(documentId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_document_track_changes', {
        p_document_id: documentId,
        p_show_pending_only: false,
        p_limit: 200,
        p_offset: 0,
      })
      if (error) throw error
      return (data || []) as TrackChangeWithAuthor[]
    },
    enabled: !!documentId,
    staleTime: 5000,
  })

  // Inline comments query
  const {
    data: inlineComments = [],
    isLoading: isLoadingComments,
    error: commentsError,
  } = useQuery({
    queryKey: collaborativeEditingKeys.comments(documentId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_document_inline_comments', {
        p_document_id: documentId,
        p_status: null,
        p_thread_root_id: null,
      })
      if (error) throw error
      return (data || []) as InlineCommentWithAuthor[]
    },
    enabled: !!documentId,
    staleTime: 5000,
  })

  // Collaborators query
  const {
    data: collaborators = [],
    isLoading: isLoadingCollaborators,
    error: collaboratorsError,
  } = useQuery({
    queryKey: collaborativeEditingKeys.collaborators(documentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_collaborators')
        .select(
          `
          *,
          user:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `,
        )
        .eq('document_id', documentId)
        .eq('is_active', true)
      if (error) throw error
      return (data || []) as CollaboratorWithUser[]
    },
    enabled: !!documentId,
    staleTime: 30000,
  })

  // ========== MUTATIONS ==========

  // Join session mutation
  const joinSessionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('join_edit_session', {
        p_document_id: documentId,
        p_document_version_id: documentVersionId,
      })
      if (error) throw error
      return data as EditSession
    },
    onSuccess: (session) => {
      setCurrentSession(session)
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.editors(documentId),
      })
    },
  })

  // Leave session mutation
  const leaveSessionMutation = useMutation({
    mutationFn: async () => {
      if (!currentSession) return
      const { error } = await supabase.rpc('leave_edit_session', {
        p_session_id: currentSession.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      setCurrentSession(null)
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.editors(documentId),
      })
    },
  })

  // Create suggestion mutation
  const createSuggestionMutation = useMutation({
    mutationFn: async (params: Omit<CreateSuggestionParams, 'documentId'>) => {
      const { data, error } = await supabase
        .from('document_suggestions')
        .insert({
          document_id: documentId,
          document_version_id: params.documentVersionId,
          author_id: user?.id,
          start_position: params.startPosition,
          end_position: params.endPosition,
          original_text: params.originalText,
          suggested_text: params.suggestedText,
          change_type: params.changeType,
          comment: params.comment,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.suggestions(documentId),
      })
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.summary(documentId),
      })
    },
  })

  // Resolve suggestion mutation
  const resolveSuggestionMutation = useMutation({
    mutationFn: async ({
      suggestionId,
      accept,
      comment,
    }: {
      suggestionId: string
      accept: boolean
      comment?: string
    }) => {
      const { data, error } = await supabase.rpc('resolve_suggestion', {
        p_suggestion_id: suggestionId,
        p_accept: accept,
        p_comment: comment,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.suggestions(documentId),
      })
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.summary(documentId),
      })
    },
  })

  // Resolve track change mutation
  const resolveChangeMutation = useMutation({
    mutationFn: async ({ changeId, accept }: { changeId: string; accept: boolean }) => {
      const { data, error } = await supabase.rpc('resolve_track_change', {
        p_change_id: changeId,
        p_accept: accept,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.changes(documentId),
      })
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.summary(documentId),
      })
    },
  })

  // Accept all changes mutation
  const acceptAllChangesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('document_track_changes')
        .update({
          is_accepted: true,
          accepted_by: user?.id,
          accepted_at: new Date().toISOString(),
        })
        .eq('document_id', documentId)
        .is('is_accepted', null)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.changes(documentId),
      })
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.summary(documentId),
      })
    },
  })

  // Reject all changes mutation
  const rejectAllChangesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('document_track_changes')
        .update({
          is_accepted: false,
          accepted_by: user?.id,
          accepted_at: new Date().toISOString(),
        })
        .eq('document_id', documentId)
        .is('is_accepted', null)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.changes(documentId),
      })
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.summary(documentId),
      })
    },
  })

  // Resolve change group mutation
  const resolveChangeGroupMutation = useMutation({
    mutationFn: async ({ groupId, accept }: { groupId: string; accept: boolean }) => {
      const { data, error } = await supabase.rpc('resolve_change_group', {
        p_group_id: groupId,
        p_accept: accept,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.changes(documentId),
      })
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.summary(documentId),
      })
    },
  })

  // Create inline comment mutation
  const createInlineCommentMutation = useMutation({
    mutationFn: async (params: Omit<CreateInlineCommentParams, 'documentId'>) => {
      const { data, error } = await supabase
        .from('document_inline_comments')
        .insert({
          document_id: documentId,
          document_version_id: params.documentVersionId,
          author_id: user?.id,
          anchor_start: params.anchorStart,
          anchor_end: params.anchorEnd,
          highlighted_text: params.highlightedText,
          content: params.content,
          parent_id: params.parentId,
          mentioned_users: params.mentionedUsers || [],
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.comments(documentId),
      })
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.summary(documentId),
      })
    },
  })

  // Update inline comment mutation
  const updateInlineCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { data, error } = await supabase
        .from('document_inline_comments')
        .update({
          content,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .eq('author_id', user?.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.comments(documentId),
      })
    },
  })

  // Resolve inline comment mutation
  const resolveInlineCommentMutation = useMutation({
    mutationFn: async ({
      commentId,
      status,
    }: {
      commentId: string
      status: InlineCommentStatus
    }) => {
      const { data, error } = await supabase.rpc('resolve_inline_comment', {
        p_comment_id: commentId,
        p_status: status,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.comments(documentId),
      })
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.summary(documentId),
      })
    },
  })

  // Delete inline comment mutation
  const deleteInlineCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('document_inline_comments')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id,
        })
        .eq('id', commentId)
        .eq('author_id', user?.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.comments(documentId),
      })
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.summary(documentId),
      })
    },
  })

  // Add collaborator mutation
  const addCollaboratorMutation = useMutation({
    mutationFn: async (params: Omit<AddCollaboratorParams, 'documentId'>) => {
      const { data, error } = await supabase
        .from('document_collaborators')
        .insert({
          document_id: documentId,
          user_id: params.userId,
          can_edit: params.canEdit ?? false,
          can_suggest: params.canSuggest ?? true,
          can_comment: params.canComment ?? true,
          can_resolve: params.canResolve ?? false,
          can_manage: params.canManage ?? false,
          invited_by: user?.id,
          expires_at: params.expiresAt,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.collaborators(documentId),
      })
    },
  })

  // Update collaborator mutation
  const updateCollaboratorMutation = useMutation({
    mutationFn: async (params: UpdateCollaboratorParams) => {
      const { collaboratorId, ...updateData } = params
      const { data, error } = await supabase
        .from('document_collaborators')
        .update(updateData)
        .eq('id', collaboratorId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.collaborators(documentId),
      })
    },
  })

  // Remove collaborator mutation
  const removeCollaboratorMutation = useMutation({
    mutationFn: async (collaboratorId: string) => {
      const { error } = await supabase
        .from('document_collaborators')
        .update({ is_active: false })
        .eq('id', collaboratorId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.collaborators(documentId),
      })
    },
  })

  // Toggle track changes mutation
  const toggleTrackChangesMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data, error } = await supabase
        .from('document_collaborative_state')
        .upsert(
          {
            document_id: documentId,
            track_changes_enabled: enabled,
          },
          { onConflict: 'document_id' },
        )
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.summary(documentId),
      })
    },
  })

  // Toggle suggestions mutation
  const toggleSuggestionsMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data, error } = await supabase
        .from('document_collaborative_state')
        .upsert(
          {
            document_id: documentId,
            suggestions_enabled: enabled,
          },
          { onConflict: 'document_id' },
        )
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.summary(documentId),
      })
    },
  })

  // Lock document mutation
  const lockDocumentMutation = useMutation({
    mutationFn: async (reason?: string) => {
      const { data, error } = await supabase
        .from('document_collaborative_state')
        .upsert(
          {
            document_id: documentId,
            is_locked: true,
            locked_by: user?.id,
            locked_at: new Date().toISOString(),
            lock_reason: reason,
          },
          { onConflict: 'document_id' },
        )
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.summary(documentId),
      })
    },
  })

  // Unlock document mutation
  const unlockDocumentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('document_collaborative_state')
        .update({
          is_locked: false,
          locked_by: null,
          locked_at: null,
          lock_reason: null,
        })
        .eq('document_id', documentId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborativeEditingKeys.summary(documentId),
      })
    },
  })

  // ========== REALTIME SUBSCRIPTIONS ==========
  useEffect(() => {
    if (!documentId || !user) return

    const channel = supabase
      .channel(`collaborative-editing:${documentId}`)
      // Edit sessions changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_edit_sessions',
          filter: `document_id=eq.${documentId}`,
        },
        (payload: RealtimePostgresChangesPayload<EditSession>) => {
          queryClient.invalidateQueries({
            queryKey: collaborativeEditingKeys.editors(documentId),
          })

          // Notify callbacks
          if (payload.eventType === 'INSERT' && onEditorJoined) {
            // Fetch editor info and notify
            supabase.rpc('get_active_editors', { p_document_id: documentId }).then(({ data }) => {
              const newEditor = data?.find((e: ActiveEditor) => e.sessionId === payload.new?.id)
              if (newEditor) onEditorJoined(newEditor)
            })
          }
        },
      )
      // Suggestions changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_suggestions',
          filter: `document_id=eq.${documentId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: collaborativeEditingKeys.suggestions(documentId),
          })
          queryClient.invalidateQueries({
            queryKey: collaborativeEditingKeys.summary(documentId),
          })
        },
      )
      // Track changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_track_changes',
          filter: `document_id=eq.${documentId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: collaborativeEditingKeys.changes(documentId),
          })
          queryClient.invalidateQueries({
            queryKey: collaborativeEditingKeys.summary(documentId),
          })
        },
      )
      // Inline comments
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_inline_comments',
          filter: `document_id=eq.${documentId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: collaborativeEditingKeys.comments(documentId),
          })
          queryClient.invalidateQueries({
            queryKey: collaborativeEditingKeys.summary(documentId),
          })
        },
      )
      // Collaborative state changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_collaborative_state',
          filter: `document_id=eq.${documentId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: collaborativeEditingKeys.summary(documentId),
          })
        },
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
      setIsConnected(false)
    }
  }, [documentId, user, queryClient, onEditorJoined, onEditorLeft])

  // Auto-join session
  useEffect(() => {
    if (autoJoin && documentId && user && !currentSession) {
      joinSessionMutation.mutate()
    }
  }, [autoJoin, documentId, user])

  // Leave session on unmount
  useEffect(() => {
    return () => {
      if (currentSession) {
        leaveSessionMutation.mutate()
      }
    }
  }, [currentSession])

  // Debounced cursor update
  const updateCursor = useCallback(
    (position: CursorPosition, viewport?: Viewport) => {
      if (!currentSession) return

      if (!cursorUpdateRef.current) {
        cursorUpdateRef.current = debounce((pos: CursorPosition, vp?: Viewport) => {
          supabase.rpc('update_cursor_position', {
            p_session_id: currentSession.id,
            p_cursor_position: pos,
            p_viewport: vp,
          })
        }, 50)
      }

      cursorUpdateRef.current(position, viewport)
    },
    [currentSession],
  )

  // ========== COMPUTED VALUES ==========
  const isLoading =
    isLoadingEditors ||
    isLoadingSummary ||
    isLoadingSuggestions ||
    isLoadingChanges ||
    isLoadingComments ||
    isLoadingCollaborators

  const error =
    editorsError ||
    summaryError ||
    suggestionsError ||
    changesError ||
    commentsError ||
    collaboratorsError

  // ========== RETURN ==========
  return {
    // State
    session: currentSession,
    activeEditors,
    suggestions,
    trackChanges,
    inlineComments,
    collaborators,
    summary,
    isConnected,
    isLoading,
    error: error as Error | null,

    // Session actions
    joinSession: () => joinSessionMutation.mutateAsync(),
    leaveSession: () => leaveSessionMutation.mutateAsync(),
    updateCursor,

    // Suggestion actions
    createSuggestion: (params) => createSuggestionMutation.mutateAsync(params),
    resolveSuggestion: (suggestionId, accept, comment) =>
      resolveSuggestionMutation.mutateAsync({ suggestionId, accept, comment }),

    // Track change actions
    acceptChange: (changeId) => resolveChangeMutation.mutateAsync({ changeId, accept: true }),
    rejectChange: (changeId) => resolveChangeMutation.mutateAsync({ changeId, accept: false }),
    acceptAllChanges: () => acceptAllChangesMutation.mutateAsync(),
    rejectAllChanges: () => rejectAllChangesMutation.mutateAsync(),
    acceptChangeGroup: (groupId) =>
      resolveChangeGroupMutation.mutateAsync({ groupId, accept: true }),
    rejectChangeGroup: (groupId) =>
      resolveChangeGroupMutation.mutateAsync({ groupId, accept: false }),

    // Inline comment actions
    createInlineComment: (params) => createInlineCommentMutation.mutateAsync(params),
    updateInlineComment: (commentId, content) =>
      updateInlineCommentMutation.mutateAsync({ commentId, content }),
    resolveInlineComment: (commentId, status) =>
      resolveInlineCommentMutation.mutateAsync({ commentId, status }),
    deleteInlineComment: (commentId) => deleteInlineCommentMutation.mutateAsync(commentId),

    // Collaborator actions
    addCollaborator: (params) => addCollaboratorMutation.mutateAsync(params),
    updateCollaborator: (params) => updateCollaboratorMutation.mutateAsync(params),
    removeCollaborator: (collaboratorId) => removeCollaboratorMutation.mutateAsync(collaboratorId),

    // Settings
    toggleTrackChanges: (enabled) => toggleTrackChangesMutation.mutateAsync(enabled),
    toggleSuggestions: (enabled) => toggleSuggestionsMutation.mutateAsync(enabled),
    lockDocument: (reason) => lockDocumentMutation.mutateAsync(reason),
    unlockDocument: () => unlockDocumentMutation.mutateAsync(),
  }
}

// Export types for component usage
export type {
  EditSession,
  ActiveEditor,
  SuggestionWithAuthor,
  TrackChangeWithAuthor,
  InlineCommentWithAuthor,
  CollaboratorWithUser,
  CollaborationSummary,
  CursorPosition,
  TextPosition,
  TrackChangeType,
  InlineCommentStatus,
}
