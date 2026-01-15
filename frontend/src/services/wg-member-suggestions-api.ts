/**
 * Working Group Member Suggestions API Service
 * Feature: working-group-member-suggestions
 *
 * API client for AI-powered working group member suggestions
 */

import { supabase } from '@/lib/supabase-client'
import type {
  GetWGSuggestionsResponse,
  BulkAddMembersRequest,
  BulkAddMembersResponse,
  RejectWGSuggestionRequest,
  WGMemberSuggestion,
  WGSuggestionType,
} from '@/types/wg-member-suggestion.types'

/**
 * Get member suggestions for a working group
 */
export async function getWGMemberSuggestions(
  workingGroupId: string,
  options: {
    limit?: number
    includeRejected?: boolean
  } = {},
): Promise<GetWGSuggestionsResponse> {
  const { limit = 15, includeRejected = false } = options

  // Call the RPC function to generate suggestions
  const { data: suggestions, error: rpcError } = await supabase.rpc(
    'generate_all_wg_member_suggestions',
    { p_working_group_id: workingGroupId },
  )

  if (rpcError) {
    throw new Error(rpcError.message)
  }

  // Get member count
  const { data: memberCount } = await supabase.rpc('get_wg_member_count', {
    p_working_group_id: workingGroupId,
  })

  // Get rejected suggestions if not including them
  let rejectedIds: Set<string> = new Set()
  if (!includeRejected) {
    const { data: rejectedSuggestions } = await supabase
      .from('working_group_member_suggestions')
      .select('suggested_organization_id, suggested_person_id')
      .eq('working_group_id', workingGroupId)
      .eq('status', 'rejected')

    if (rejectedSuggestions) {
      rejectedSuggestions.forEach((s) => {
        if (s.suggested_organization_id) {
          rejectedIds.add(`org_${s.suggested_organization_id}`)
        }
        if (s.suggested_person_id) {
          rejectedIds.add(`person_${s.suggested_person_id}`)
        }
      })
    }
  }

  // Filter suggestions
  const filteredSuggestions = ((suggestions as WGMemberSuggestion[]) || [])
    .filter((s) => {
      const key =
        s.suggested_entity_type === 'organization'
          ? `org_${s.suggested_organization_id}`
          : `person_${s.suggested_person_id}`
      return !rejectedIds.has(key)
    })
    .slice(0, limit)

  // Group by type
  const groupedByType = filteredSuggestions.reduce(
    (acc: Record<string, WGMemberSuggestion[]>, suggestion) => {
      const type = suggestion.suggestion_type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(suggestion)
      return acc
    },
    {} as Record<string, WGMemberSuggestion[]>,
  )

  // Count by entity type
  const orgSuggestions = filteredSuggestions.filter(
    (s) => s.suggested_entity_type === 'organization',
  ).length
  const personSuggestions = filteredSuggestions.filter(
    (s) => s.suggested_entity_type === 'person',
  ).length

  // Build summary
  const summary = {
    total_suggestions: filteredSuggestions.length,
    existing_member_count: memberCount || 0,
    has_no_members: (memberCount || 0) === 0,
    suggestion_types: Object.keys(groupedByType).map((type) => ({
      type: type as WGSuggestionType,
      count: groupedByType[type].length,
      avg_confidence:
        groupedByType[type].reduce((sum, s) => sum + s.confidence_score, 0) /
        groupedByType[type].length,
    })),
    high_confidence_count: filteredSuggestions.filter((s) => s.confidence_score >= 0.8).length,
    organization_suggestions: orgSuggestions,
    person_suggestions: personSuggestions,
  }

  return {
    suggestions: filteredSuggestions,
    grouped_by_type: groupedByType,
    summary,
    metadata: {
      working_group_id: workingGroupId,
      generated_at: new Date().toISOString(),
      limit,
    },
  }
}

/**
 * Add multiple members at once
 */
export async function addBulkWGMembers(
  request: BulkAddMembersRequest,
): Promise<BulkAddMembersResponse> {
  const { data: user } = await supabase.auth.getUser()

  if (!user.user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase.rpc('add_bulk_wg_members', {
    p_working_group_id: request.working_group_id,
    p_members: request.members,
    p_user_id: user.user.id,
  })

  if (error) {
    throw new Error(error.message)
  }

  const results = data || []
  const successCount = results.filter((r: { success: boolean }) => r.success).length
  const failureCount = results.length - successCount

  return {
    success: true,
    results,
    summary: {
      total_requested: request.members.length,
      added_count: successCount,
      failed_count: failureCount,
    },
    message:
      failureCount === 0
        ? `Successfully added ${successCount} members`
        : `Added ${successCount} members, ${failureCount} failed`,
    message_ar:
      failureCount === 0
        ? `تم إضافة ${successCount} أعضاء بنجاح`
        : `تم إضافة ${successCount} أعضاء، فشلت ${failureCount}`,
  }
}

/**
 * Reject a member suggestion
 */
export async function rejectWGMemberSuggestion(
  request: RejectWGSuggestionRequest,
): Promise<{ success: boolean }> {
  const { data: user } = await supabase.auth.getUser()

  if (!user.user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase.rpc('reject_wg_member_suggestion', {
    p_working_group_id: request.working_group_id,
    p_entity_type: request.entity_type,
    p_organization_id: request.organization_id || null,
    p_person_id: request.person_id || null,
    p_suggestion_type: request.suggestion_type,
    p_user_id: user.user.id,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
