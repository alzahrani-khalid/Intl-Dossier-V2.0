/**
 * useMilestonePlanning Hook
 *
 * Hook for managing planned milestones with CRUD operations.
 * Uses TanStack Query for caching and optimistic updates.
 */

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type {
  PlannedMilestone,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
  MilestoneStats,
  UseMilestonePlanningReturn,
  MilestoneStatus,
} from '@/types/milestone-planning.types'

interface UseMilestonePlanningOptions {
  dossierId: string
  dossierType: PlannedMilestone['dossier_type']
  enabled?: boolean
}

/**
 * Calculate milestone statistics from a list of milestones
 */
function calculateStats(milestones: PlannedMilestone[]): MilestoneStats {
  const now = new Date()
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const stats: MilestoneStats = {
    total: milestones.length,
    by_status: {
      planned: 0,
      in_progress: 0,
      completed: 0,
      postponed: 0,
      cancelled: 0,
    },
    by_type: {
      engagement: 0,
      policy_deadline: 0,
      relationship_review: 0,
      document_due: 0,
      follow_up: 0,
      renewal: 0,
      custom: 0,
    },
    upcoming_this_week: 0,
    upcoming_this_month: 0,
    overdue: 0,
  }

  milestones.forEach((milestone) => {
    // Count by status
    stats.by_status[milestone.status]++

    // Count by type
    stats.by_type[milestone.milestone_type]++

    // Skip completed/cancelled for date calculations
    if (milestone.status === 'completed' || milestone.status === 'cancelled') {
      return
    }

    const targetDate = new Date(milestone.target_date)

    // Check if overdue
    if (targetDate < now) {
      stats.overdue++
    }
    // Check if this week
    else if (targetDate <= oneWeekFromNow) {
      stats.upcoming_this_week++
    }
    // Check if this month
    else if (targetDate <= oneMonthFromNow) {
      stats.upcoming_this_month++
    }
  })

  return stats
}

/**
 * Hook for managing planned milestones
 */
export function useMilestonePlanning({
  dossierId,
  dossierType,
  enabled = true,
}: UseMilestonePlanningOptions): UseMilestonePlanningReturn {
  const { t } = useTranslation('milestone-planning')
  const queryClient = useQueryClient()

  const queryKey = ['milestones', dossierId]

  // Fetch milestones
  const {
    data: milestones = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<PlannedMilestone[]> => {
      const { data, error } = await supabase
        .from('planned_milestones')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('target_date', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: enabled && !!dossierId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Calculate stats from milestones
  const stats = milestones.length > 0 ? calculateStats(milestones) : null

  // Create milestone mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateMilestoneRequest): Promise<PlannedMilestone> => {
      const { data: result, error } = await supabase
        .from('planned_milestones')
        .insert({
          ...data,
          status: 'planned' as MilestoneStatus,
          reminders: data.reminders || [],
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return result
    },
    onSuccess: (newMilestone) => {
      // Update cache optimistically
      queryClient.setQueryData<PlannedMilestone[]>(queryKey, (old = []) => [...old, newMilestone])
      toast.success(t('messages.createSuccess'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.createError'), {
        description: error.message,
      })
    },
  })

  // Update milestone mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdateMilestoneRequest
    }): Promise<PlannedMilestone> => {
      const { data: result, error } = await supabase
        .from('planned_milestones')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return result
    },
    onSuccess: (updatedMilestone) => {
      // Update cache optimistically
      queryClient.setQueryData<PlannedMilestone[]>(queryKey, (old = []) =>
        old.map((m) => (m.id === updatedMilestone.id ? updatedMilestone : m)),
      )
      toast.success(t('messages.updateSuccess'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.updateError'), {
        description: error.message,
      })
    },
  })

  // Delete milestone mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('planned_milestones').delete().eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: (_, deletedId) => {
      // Update cache optimistically
      queryClient.setQueryData<PlannedMilestone[]>(queryKey, (old = []) =>
        old.filter((m) => m.id !== deletedId),
      )
      toast.success(t('messages.deleteSuccess'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.deleteError'), {
        description: error.message,
      })
    },
  })

  // Mark complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: async (id: string): Promise<PlannedMilestone> => {
      const { data: result, error } = await supabase
        .from('planned_milestones')
        .update({
          status: 'completed' as MilestoneStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return result
    },
    onSuccess: (updatedMilestone) => {
      queryClient.setQueryData<PlannedMilestone[]>(queryKey, (old = []) =>
        old.map((m) => (m.id === updatedMilestone.id ? updatedMilestone : m)),
      )
      toast.success(t('messages.updateSuccess'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.updateError'), {
        description: error.message,
      })
    },
  })

  // Convert to event mutation
  const convertMutation = useMutation({
    mutationFn: async ({
      milestoneId,
      eventType,
    }: {
      milestoneId: string
      eventType: string
    }): Promise<void> => {
      // Get the milestone first
      const { data: milestone, error: fetchError } = await supabase
        .from('planned_milestones')
        .select('*')
        .eq('id', milestoneId)
        .single()

      if (fetchError || !milestone) {
        throw new Error(fetchError?.message || 'Milestone not found')
      }

      // Create the calendar entry based on event type
      if (eventType === 'calendar') {
        const { error: createError } = await supabase.from('calendar_entries').insert({
          title_en: milestone.title_en,
          title_ar: milestone.title_ar,
          description_en: milestone.description_en,
          description_ar: milestone.description_ar,
          start_datetime:
            milestone.target_date +
            (milestone.target_time ? `T${milestone.target_time}:00` : 'T09:00:00'),
          end_datetime: milestone.end_date
            ? milestone.end_date + 'T17:00:00'
            : milestone.target_date + 'T10:00:00',
          entity_type: milestone.dossier_type.toLowerCase(),
          entity_id: milestone.dossier_id,
          event_type: 'meeting',
          priority: milestone.priority,
          status: 'scheduled',
        })

        if (createError) {
          throw new Error(createError.message)
        }
      }

      // Update milestone as converted
      const { error: updateError } = await supabase
        .from('planned_milestones')
        .update({
          converted_to_event: true,
          converted_at: new Date().toISOString(),
          status: 'completed' as MilestoneStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', milestoneId)

      if (updateError) {
        throw new Error(updateError.message)
      }
    },
    onSuccess: (_, { milestoneId }) => {
      // Update the milestone in cache
      queryClient.setQueryData<PlannedMilestone[]>(queryKey, (old = []) =>
        old.map((m) =>
          m.id === milestoneId
            ? { ...m, converted_to_event: true, status: 'completed' as MilestoneStatus }
            : m,
        ),
      )
      // Invalidate calendar queries to show the new event
      queryClient.invalidateQueries({ queryKey: ['calendar-entries', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['timeline', dossierId] })
      toast.success(t('convert.success'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.updateError'), {
        description: error.message,
      })
    },
  })

  // Wrapped functions for cleaner API
  const createMilestone = useCallback(
    async (data: CreateMilestoneRequest): Promise<PlannedMilestone> => {
      return createMutation.mutateAsync(data)
    },
    [createMutation],
  )

  const updateMilestone = useCallback(
    async (id: string, data: UpdateMilestoneRequest): Promise<PlannedMilestone> => {
      return updateMutation.mutateAsync({ id, data })
    },
    [updateMutation],
  )

  const deleteMilestone = useCallback(
    async (id: string): Promise<void> => {
      return deleteMutation.mutateAsync(id)
    },
    [deleteMutation],
  )

  const convertToEvent = useCallback(
    async ({
      milestone_id,
      event_type,
    }: {
      milestone_id: string
      event_type: string
    }): Promise<void> => {
      return convertMutation.mutateAsync({ milestoneId: milestone_id, eventType: event_type })
    },
    [convertMutation],
  )

  return {
    milestones,
    stats,
    isLoading,
    error: error as Error | null,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    convertToEvent: async (request) =>
      convertToEvent({ milestone_id: request.milestone_id, event_type: request.event_type }),
    refetch,
  }
}

/**
 * Hook for marking a milestone as complete
 */
export function useMarkMilestoneComplete(dossierId: string) {
  const { t } = useTranslation('milestone-planning')
  const queryClient = useQueryClient()
  const queryKey = ['milestones', dossierId]

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('planned_milestones')
        .update({
          status: 'completed' as MilestoneStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey })
      toast.success(t('messages.updateSuccess'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.updateError'), {
        description: error.message,
      })
    },
  })
}
