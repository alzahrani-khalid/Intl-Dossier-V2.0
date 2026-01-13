/**
 * useTeamCollaboration Hook
 * Feature: Collaborative Empty States
 *
 * TanStack Query hooks for team collaboration features:
 * - useTeamStats: Fetch team activity statistics for empty states
 * - useInvitationTemplates: Fetch message templates
 * - useSendInvitation: Send team collaboration invitations
 * - useMyInvitations: Fetch user's invitations
 * - useRespondToInvitation: Accept or decline invitations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTeamStats,
  getInvitationTemplates,
  sendTeamInvitation,
  getMyInvitations,
  respondToInvitation,
  type TeamStats,
  type InvitationTemplate,
  type TeamInvitation,
  type SendInvitationRequest,
  type SendInvitationResponse,
} from '@/services/team-collaboration.service'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'

// ============================================================================
// Query Keys
// ============================================================================

export const teamCollaborationKeys = {
  all: ['teamCollaboration'] as const,
  stats: (entityType: string) => [...teamCollaborationKeys.all, 'stats', entityType] as const,
  templates: (entityType: string) =>
    [...teamCollaborationKeys.all, 'templates', entityType] as const,
  invitations: () => [...teamCollaborationKeys.all, 'invitations'] as const,
}

// ============================================================================
// useTeamStats Hook
// ============================================================================

export interface UseTeamStatsOptions {
  /**
   * Entity type to get stats for (dossier, document, engagement, etc.)
   */
  entityType: string
  /**
   * Enable or disable the query (default: true)
   */
  enabled?: boolean
}

/**
 * Hook to fetch team activity statistics for empty states
 *
 * Features:
 * - 10-minute stale time (data considered fresh)
 * - Shows team activity, top contributors, and suggested users to invite
 * - Only fetches when enabled
 *
 * @param options - Hook options
 * @returns TanStack Query result with TeamStats
 */
export function useTeamStats(options: UseTeamStatsOptions) {
  const { entityType, enabled = true } = options

  return useQuery<TeamStats, Error>({
    queryKey: teamCollaborationKeys.stats(entityType),
    queryFn: () => getTeamStats(entityType),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled && !!entityType,
  })
}

// ============================================================================
// useInvitationTemplates Hook
// ============================================================================

export interface UseInvitationTemplatesOptions {
  /**
   * Entity type to get templates for
   */
  entityType: string
  /**
   * Enable or disable the query (default: true)
   */
  enabled?: boolean
}

/**
 * Hook to fetch invitation message templates
 *
 * @param options - Hook options
 * @returns TanStack Query result with templates array
 */
export function useInvitationTemplates(options: UseInvitationTemplatesOptions) {
  const { entityType, enabled = true } = options

  return useQuery<InvitationTemplate[], Error>({
    queryKey: teamCollaborationKeys.templates(entityType),
    queryFn: () => getInvitationTemplates(entityType),
    staleTime: 30 * 60 * 1000, // 30 minutes (templates don't change often)
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: enabled && !!entityType,
  })
}

// ============================================================================
// useSendInvitation Hook
// ============================================================================

/**
 * Hook to send a team collaboration invitation
 *
 * @returns Mutation for sending invitations
 */
export function useSendInvitation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t, i18n } = useTranslation('empty-states')
  const isRTL = i18n.language === 'ar'

  return useMutation<SendInvitationResponse, Error, SendInvitationRequest>({
    mutationFn: sendTeamInvitation,
    onSuccess: (data, variables) => {
      // Invalidate invitations list
      queryClient.invalidateQueries({ queryKey: teamCollaborationKeys.invitations() })

      // Show success toast
      toast({
        title: isRTL ? 'تم إرسال الدعوة' : 'Invitation Sent',
        description: isRTL
          ? `تم إرسال الدعوة إلى ${variables.inviteeEmail}`
          : `Invitation sent to ${variables.inviteeEmail}`,
      })
    },
    onError: (error) => {
      toast({
        title: isRTL ? 'فشل إرسال الدعوة' : 'Failed to Send Invitation',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// ============================================================================
// useMyInvitations Hook
// ============================================================================

export interface UseMyInvitationsOptions {
  /**
   * Enable or disable the query (default: true)
   */
  enabled?: boolean
}

/**
 * Hook to fetch the current user's invitations (sent and received)
 *
 * @param options - Hook options
 * @returns TanStack Query result with invitations array
 */
export function useMyInvitations(options: UseMyInvitationsOptions = {}) {
  const { enabled = true } = options

  return useQuery<TeamInvitation[], Error>({
    queryKey: teamCollaborationKeys.invitations(),
    queryFn: getMyInvitations,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled,
  })
}

// ============================================================================
// useRespondToInvitation Hook
// ============================================================================

export interface RespondToInvitationParams {
  invitationId: string
  status: 'accepted' | 'declined'
}

/**
 * Hook to respond to a team invitation
 *
 * @returns Mutation for responding to invitations
 */
export function useRespondToInvitation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return useMutation<TeamInvitation, Error, RespondToInvitationParams>({
    mutationFn: ({ invitationId, status }) => respondToInvitation(invitationId, status),
    onSuccess: (data, variables) => {
      // Invalidate invitations list
      queryClient.invalidateQueries({ queryKey: teamCollaborationKeys.invitations() })

      // Show success toast
      const accepted = variables.status === 'accepted'
      toast({
        title: accepted
          ? isRTL
            ? 'تم قبول الدعوة'
            : 'Invitation Accepted'
          : isRTL
            ? 'تم رفض الدعوة'
            : 'Invitation Declined',
        description: accepted
          ? isRTL
            ? 'مرحباً بك في الفريق!'
            : 'Welcome to the team!'
          : isRTL
            ? 'تم رفض الدعوة بنجاح'
            : 'Invitation declined successfully',
      })
    },
    onError: (error) => {
      toast({
        title: isRTL ? 'فشلت العملية' : 'Operation Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// ============================================================================
// Re-exports
// ============================================================================

export type {
  TeamStats,
  InvitationTemplate,
  TeamInvitation,
  SendInvitationRequest,
  SendInvitationResponse,
}

export { formatTemplateBody, getEntityTypeDisplayName } from '@/services/team-collaboration.service'
