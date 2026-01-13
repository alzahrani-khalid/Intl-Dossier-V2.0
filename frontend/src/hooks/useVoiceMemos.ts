import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  VoiceMemo,
  VoiceMemoFilters,
  VoiceMemoListResponse,
  UpdateVoiceMemoInput,
} from '@/types/voice-memo.types'

// Query key factory
const voiceMemoKeys = {
  all: ['voice-memos'] as const,
  lists: () => [...voiceMemoKeys.all, 'list'] as const,
  list: (filters: VoiceMemoFilters) => [...voiceMemoKeys.lists(), filters] as const,
  details: () => [...voiceMemoKeys.all, 'detail'] as const,
  detail: (id: string) => [...voiceMemoKeys.details(), id] as const,
}

// Transform snake_case response to camelCase
function transformVoiceMemo(data: Record<string, unknown>): VoiceMemo {
  return {
    id: data.id as string,
    organizationId: data.organization_id as string,
    documentId: data.document_id as string | undefined,
    entityType: data.entity_type as string,
    entityId: data.entity_id as string,
    title: data.title as string | undefined,
    description: data.description as string | undefined,
    durationSeconds: data.duration_seconds as number,
    fileSizeBytes: data.file_size_bytes as number,
    mimeType: data.mime_type as string,
    sampleRate: data.sample_rate as number,
    channels: data.channels as number,
    storagePath: data.storage_path as string,
    storageBucket: data.storage_bucket as string,
    localUri: data.local_uri as string | undefined,
    isCachedOffline: data.is_cached_offline as boolean,
    status: data.status as VoiceMemo['status'],
    transcription: data.transcription as string | undefined,
    transcriptionConfidence: data.transcription_confidence as number | undefined,
    transcriptionLanguage: data.transcription_language as string,
    transcriptionSegments: data.transcription_segments as VoiceMemo['transcriptionSegments'],
    transcriptionMetadata: data.transcription_metadata as VoiceMemo['transcriptionMetadata'],
    transcriptionStartedAt: data.transcription_started_at as string | undefined,
    transcriptionCompletedAt: data.transcription_completed_at as string | undefined,
    transcriptionError: data.transcription_error as string | undefined,
    recordedAt: data.recorded_at as string,
    recordedBy: data.recorded_by as string,
    recordedByName: (data.profiles as Record<string, unknown>)?.full_name as string | undefined,
    recordedOnDevice: data.recorded_on_device as string | undefined,
    recordedLocation: data.recorded_location as VoiceMemo['recordedLocation'],
    tags: (data.tags as string[]) || [],
    metadata: (data.metadata as Record<string, unknown>) || {},
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    syncedAt: data.synced_at as string | undefined,
    deletedAt: data.deleted_at as string | undefined,
  }
}

/**
 * Fetch voice memos with filters
 */
async function fetchVoiceMemos(filters: VoiceMemoFilters): Promise<VoiceMemoListResponse> {
  const params = new URLSearchParams()
  if (filters.entityType) params.append('entity_type', filters.entityType)
  if (filters.entityId) params.append('entity_id', filters.entityId)
  if (filters.documentId) params.append('document_id', filters.documentId)
  if (filters.status) {
    const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status]
    statusArray.forEach((s) => params.append('status', s))
  }
  if (filters.recordedBy) params.append('recorded_by', filters.recordedBy)
  if (filters.fromDate) params.append('from_date', filters.fromDate)
  if (filters.toDate) params.append('to_date', filters.toDate)
  if (filters.searchQuery) params.append('q', filters.searchQuery)
  if (filters.tags) {
    filters.tags.forEach((tag) => params.append('tags', tag))
  }

  const { data, error } = await supabase.functions.invoke('voice-memos', {
    method: 'GET',
  })

  if (error) throw error

  return {
    voiceMemos: (data.voice_memos || []).map(transformVoiceMemo),
    total: data.total || 0,
    hasMore: data.has_more || false,
    cursor: data.cursor,
  }
}

/**
 * Fetch a single voice memo by ID
 */
async function fetchVoiceMemo(id: string): Promise<VoiceMemo> {
  const { data, error } = await supabase.functions.invoke(`voice-memos/${id}`, {
    method: 'GET',
  })

  if (error) throw error

  return transformVoiceMemo(data)
}

/**
 * Update a voice memo
 */
async function updateVoiceMemo(id: string, input: UpdateVoiceMemoInput): Promise<VoiceMemo> {
  const { data, error } = await supabase.functions.invoke(`voice-memos/${id}`, {
    method: 'PUT',
    body: input,
  })

  if (error) throw error

  return transformVoiceMemo(data)
}

/**
 * Delete a voice memo
 */
async function deleteVoiceMemo(id: string): Promise<void> {
  const { error } = await supabase.functions.invoke(`voice-memos/${id}`, {
    method: 'DELETE',
  })

  if (error) throw error
}

/**
 * Hook to fetch voice memos list
 */
export function useVoiceMemosList(filters: VoiceMemoFilters, enabled = true) {
  return useQuery({
    queryKey: voiceMemoKeys.list(filters),
    queryFn: () => fetchVoiceMemos(filters),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to fetch a single voice memo
 */
export function useVoiceMemo(id: string, enabled = true) {
  return useQuery({
    queryKey: voiceMemoKeys.detail(id),
    queryFn: () => fetchVoiceMemo(id),
    enabled: enabled && !!id,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to update a voice memo
 */
export function useUpdateVoiceMemo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVoiceMemoInput }) =>
      updateVoiceMemo(id, data),
    onSuccess: (updatedMemo) => {
      // Update the specific memo in cache
      queryClient.setQueryData(voiceMemoKeys.detail(updatedMemo.id), updatedMemo)

      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: voiceMemoKeys.lists() })
    },
  })
}

/**
 * Hook to delete a voice memo
 */
export function useDeleteVoiceMemo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteVoiceMemo,
    onSuccess: (_result, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: voiceMemoKeys.detail(id) })

      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: voiceMemoKeys.lists() })
    },
  })
}

/**
 * Hook to poll transcription status
 */
export function useVoiceMemoTranscriptionPoll(
  id: string,
  status: VoiceMemo['status'],
  onComplete?: (memo: VoiceMemo) => void,
) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [...voiceMemoKeys.detail(id), 'transcription-poll'] as const,
    queryFn: async () => {
      const memo = await fetchVoiceMemo(id)

      if (memo.status === 'completed' || memo.status === 'failed') {
        // Update the main query cache
        queryClient.setQueryData(voiceMemoKeys.detail(id), memo)
        queryClient.invalidateQueries({ queryKey: voiceMemoKeys.lists() })

        if (onComplete) {
          onComplete(memo)
        }
      }

      return memo
    },
    enabled: status === 'processing' || status === 'transcribing',
    refetchInterval: 5000, // Poll every 5 seconds
  })
}

export { voiceMemoKeys }
