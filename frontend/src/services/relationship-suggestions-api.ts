/**
 * Relationship Suggestions API Service
 * Feature: ai-relationship-suggestions
 *
 * API client for AI-powered relationship suggestions
 */

import { supabase } from '@/lib/supabase-client'
import type {
  GetSuggestionsResponse,
  BulkCreateRelationshipsRequest,
  BulkCreateResponse,
  RejectSuggestionRequest,
  SuggestionType,
} from '@/types/relationship-suggestion.types'

const EDGE_FUNCTION_URL = 'relationship-suggestions'

/**
 * Get relationship suggestions for a person
 */
export async function getRelationshipSuggestions(
  personId: string,
  options: {
    limit?: number
    includeRejected?: boolean
  } = {},
): Promise<GetSuggestionsResponse> {
  const { limit = 10, includeRejected = false } = options

  const params = new URLSearchParams({
    person_id: personId,
    limit: String(limit),
  })

  if (includeRejected) {
    params.append('include_rejected', 'true')
  }

  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: null,
  })

  // Due to Edge Function limitations, we use RPC directly
  // The Edge Function approach above may not work for GET with query params
  // Fallback to direct RPC call
  const { data: suggestions, error: rpcError } = await supabase.rpc(
    'generate_all_relationship_suggestions',
    { p_person_id: personId },
  )

  if (rpcError) {
    throw new Error(rpcError.message)
  }

  // Get relationship count
  const { data: relationshipCount } = await supabase.rpc('get_person_relationship_count', {
    p_person_id: personId,
  })

  // Get rejected suggestions
  let rejectedPersonIds: string[] = []
  if (!includeRejected) {
    const { data: rejectedSuggestions } = await supabase
      .from('person_relationship_suggestions')
      .select('suggested_person_id')
      .eq('person_id', personId)
      .eq('status', 'rejected')

    if (rejectedSuggestions) {
      rejectedPersonIds = rejectedSuggestions.map((s) => s.suggested_person_id)
    }
  }

  // Filter and process suggestions
  const filteredSuggestions = (suggestions || [])
    .filter(
      (s: { suggested_person_id: string }) => !rejectedPersonIds.includes(s.suggested_person_id),
    )
    .slice(0, limit)

  // Group by type
  const groupedByType = filteredSuggestions.reduce(
    (acc: Record<string, typeof filteredSuggestions>, suggestion: { suggestion_type: string }) => {
      const type = suggestion.suggestion_type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(suggestion)
      return acc
    },
    {} as Record<string, typeof filteredSuggestions>,
  )

  // Build summary
  const summary = {
    total_suggestions: filteredSuggestions.length,
    existing_relationship_count: relationshipCount || 0,
    has_no_relationships: (relationshipCount || 0) === 0,
    suggestion_types: Object.keys(groupedByType).map((type) => ({
      type: type as SuggestionType,
      count: groupedByType[type].length,
      avg_confidence:
        groupedByType[type].reduce(
          (sum: number, s: { confidence_score: number }) => sum + s.confidence_score,
          0,
        ) / groupedByType[type].length,
    })),
    high_confidence_count: filteredSuggestions.filter(
      (s: { confidence_score: number }) => s.confidence_score >= 0.8,
    ).length,
  }

  return {
    suggestions: filteredSuggestions,
    grouped_by_type: groupedByType,
    summary,
    metadata: {
      person_id: personId,
      generated_at: new Date().toISOString(),
      limit,
    },
  }
}

/**
 * Create multiple relationships at once
 */
export async function createBulkRelationships(
  request: BulkCreateRelationshipsRequest,
): Promise<BulkCreateResponse> {
  const { data: user } = await supabase.auth.getUser()

  if (!user.user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase.rpc('create_bulk_relationships', {
    p_from_person_id: request.person_id,
    p_relationships: request.relationships,
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
      total_requested: request.relationships.length,
      created_count: successCount,
      failed_count: failureCount,
    },
    message:
      failureCount === 0
        ? `Successfully created ${successCount} relationships`
        : `Created ${successCount} relationships, ${failureCount} failed`,
    message_ar:
      failureCount === 0
        ? `تم إنشاء ${successCount} علاقات بنجاح`
        : `تم إنشاء ${successCount} علاقات، فشلت ${failureCount}`,
  }
}

/**
 * Reject a suggestion
 */
export async function rejectSuggestion(
  request: RejectSuggestionRequest,
): Promise<{ success: boolean }> {
  const { data: user } = await supabase.auth.getUser()

  if (!user.user) {
    throw new Error('User not authenticated')
  }

  // Check if suggestion exists
  const { data: existingSuggestion } = await supabase
    .from('person_relationship_suggestions')
    .select('id')
    .eq('person_id', request.person_id)
    .eq('suggested_person_id', request.suggested_person_id)
    .eq('suggestion_type', request.suggestion_type)
    .single()

  if (existingSuggestion) {
    // Update existing
    const { error } = await supabase
      .from('person_relationship_suggestions')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.user.id,
      })
      .eq('id', existingSuggestion.id)

    if (error) {
      throw new Error(error.message)
    }
  } else {
    // Create rejected record
    const { error } = await supabase.from('person_relationship_suggestions').insert({
      person_id: request.person_id,
      suggested_person_id: request.suggested_person_id,
      suggestion_type: request.suggestion_type,
      confidence_score: 0,
      suggested_relationship_type: 'knows',
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.user.id,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  return { success: true }
}
