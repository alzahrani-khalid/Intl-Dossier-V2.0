/**
 * TanStack Query hooks for Position Consistency Check
 * Feature: position-consistency-checker
 *
 * Provides hooks for:
 * - Running consistency checks on positions
 * - Fetching consistency check history
 * - Submitting review decisions
 *
 * Query keys: ['position-consistency-check', positionId]
 * Cache: staleTime 60s, gcTime 5min
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

// Types
export type ConflictType =
  | 'contradiction'
  | 'redundancy'
  | 'gap'
  | 'outdated'
  | 'ambiguity'
  | 'semantic_conflict'

export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type ReviewStatus =
  | 'pending_review'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'revision_required'

export type RecommendationType = 'merge' | 'update' | 'deprecate' | 'review' | 'approve' | 'reject'

export type RecommendationPriority = 'low' | 'medium' | 'high'

export interface ConflictResult {
  conflict_id: string
  conflicting_position_id: string
  conflicting_position_title_en: string
  conflicting_position_title_ar: string
  conflict_type: ConflictType
  severity: ConflictSeverity
  description_en: string
  description_ar: string
  evidence_en: string
  evidence_ar: string
  suggested_resolution_en?: string
  suggested_resolution_ar?: string
  similarity_score: number
  detected_at: string
}

export interface SimilarPosition {
  position_id: string
  title_en: string
  title_ar: string
  similarity_score: number
  status: string
  thematic_category: string | null
  relationship: 'duplicate' | 'related' | 'supersedes' | 'superseded_by'
}

export interface Recommendation {
  type: RecommendationType
  priority: RecommendationPriority
  description_en: string
  description_ar: string
  affected_positions?: string[]
  action_items_en?: string[]
  action_items_ar?: string[]
}

export interface Gap {
  gap_id: string
  topic_en: string
  topic_ar: string
  description_en: string
  description_ar: string
  relevance_score: number
}

export interface ConsistencyCheckResult {
  id: string
  position_id: string
  overall_score: number
  risk_level: RiskLevel
  conflicts: ConflictResult[]
  similar_positions: SimilarPosition[]
  recommendations: {
    summary_en: string
    summary_ar: string
    items: Recommendation[]
  }
  gaps_identified: Gap[]
  requires_human_review: boolean
  auto_approved: boolean
  ai_service_available: boolean
  processing_time_ms: number
  analyzed_at: string
}

export interface ConsistencyCheckHistoryItem {
  id: string
  position_id: string
  analyzed_at: string
  analyzed_by: string
  analysis_type: 'pre_approval' | 'scheduled' | 'manual' | 'on_edit'
  overall_score: number
  risk_level: RiskLevel
  conflicts: ConflictResult[]
  similar_positions: SimilarPosition[]
  recommendations: {
    summary_en: string
    summary_ar: string
    items: Recommendation[]
  }
  gaps_identified: Gap[]
  review_status: ReviewStatus
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  requires_human_review: boolean
  auto_approved: boolean
  ai_service_available: boolean
  processing_time_ms: number
}

export interface ConsistencyCheckRequest {
  position_id: string
  analysis_type?: 'pre_approval' | 'scheduled' | 'manual' | 'on_edit'
  similarity_threshold?: number
  include_recommendations?: boolean
}

export interface ReviewDecisionRequest {
  check_id: string
  decision: 'approved' | 'rejected' | 'revision_required'
  notes?: string
}

// Query keys
export const consistencyCheckKeys = {
  all: ['position-consistency-check'] as const,
  check: (positionId: string) => [...consistencyCheckKeys.all, 'check', positionId] as const,
  history: (positionId: string) => [...consistencyCheckKeys.all, 'history', positionId] as const,
  latest: (positionId: string) => [...consistencyCheckKeys.all, 'latest', positionId] as const,
}

// Helper to get auth headers
const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

/**
 * Hook to run a consistency check on a position
 */
export const useRunConsistencyCheck = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ConsistencyCheckRequest): Promise<ConsistencyCheckResult> => {
      const headers = await getAuthHeaders()

      const response = await fetch(`${API_BASE_URL}/positions-consistency-check`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || error.error || 'Failed to run consistency check')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: consistencyCheckKeys.check(data.position_id),
      })
      queryClient.invalidateQueries({
        queryKey: consistencyCheckKeys.history(data.position_id),
      })
      queryClient.invalidateQueries({
        queryKey: consistencyCheckKeys.latest(data.position_id),
      })
      // Also invalidate position queries to reflect updated consistency_score
      queryClient.invalidateQueries({ queryKey: ['positions'] })
    },
  })
}

/**
 * Hook to fetch the latest consistency check for a position
 */
export const useLatestConsistencyCheck = (positionId: string | undefined) => {
  return useQuery({
    queryKey: consistencyCheckKeys.latest(positionId || ''),
    queryFn: async (): Promise<ConsistencyCheckHistoryItem | null> => {
      if (!positionId) return null

      const { data, error } = await supabase
        .from('position_consistency_checks')
        .select('*')
        .eq('position_id', positionId)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        throw new Error(error.message)
      }

      return data as ConsistencyCheckHistoryItem
    },
    enabled: !!positionId,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes
  })
}

/**
 * Hook to fetch consistency check history for a position
 */
export const useConsistencyCheckHistory = (positionId: string | undefined, limit = 10) => {
  return useQuery({
    queryKey: [...consistencyCheckKeys.history(positionId || ''), { limit }],
    queryFn: async (): Promise<ConsistencyCheckHistoryItem[]> => {
      if (!positionId) return []

      const { data, error } = await supabase
        .from('position_consistency_checks')
        .select('*')
        .eq('position_id', positionId)
        .order('analyzed_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(error.message)
      }

      return (data as ConsistencyCheckHistoryItem[]) || []
    },
    enabled: !!positionId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

/**
 * Hook to submit a review decision for a consistency check
 */
export const useSubmitReviewDecision = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ReviewDecisionRequest): Promise<ConsistencyCheckHistoryItem> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('position_consistency_checks')
        .update({
          review_status: request.decision,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: request.notes || null,
        })
        .eq('id', request.check_id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as ConsistencyCheckHistoryItem
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: consistencyCheckKeys.check(data.position_id),
      })
      queryClient.invalidateQueries({
        queryKey: consistencyCheckKeys.history(data.position_id),
      })
      queryClient.invalidateQueries({
        queryKey: consistencyCheckKeys.latest(data.position_id),
      })
    },
  })
}

/**
 * Hook to check if a position can be auto-approved
 */
export const useCanAutoApprove = (positionId: string | undefined) => {
  return useQuery({
    queryKey: ['position-can-auto-approve', positionId],
    queryFn: async (): Promise<boolean> => {
      if (!positionId) return false

      const { data, error } = await supabase.rpc('can_auto_approve_position', {
        p_position_id: positionId,
      })

      if (error) {
        console.error('Error checking auto-approval:', error)
        return false
      }

      return data as boolean
    },
    enabled: !!positionId,
    staleTime: 30_000,
    gcTime: 2 * 60_000,
  })
}

/**
 * Hook to fetch pending review checks (for reviewers)
 */
export const usePendingReviewChecks = (limit = 20) => {
  return useQuery({
    queryKey: ['position-consistency-checks', 'pending', { limit }],
    queryFn: async (): Promise<ConsistencyCheckHistoryItem[]> => {
      const { data, error } = await supabase
        .from('position_consistency_checks')
        .select(
          `
          *,
          positions:position_id (
            id,
            title_en,
            title_ar,
            status,
            thematic_category
          )
        `,
        )
        .eq('review_status', 'pending_review')
        .eq('requires_human_review', true)
        .order('analyzed_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(error.message)
      }

      return (data as ConsistencyCheckHistoryItem[]) || []
    },
    staleTime: 30_000,
    gcTime: 2 * 60_000,
  })
}

/**
 * Utility functions for consistency check results
 */
export const consistencyCheckUtils = {
  /**
   * Get color class based on risk level
   */
  getRiskLevelColor: (riskLevel: RiskLevel): string => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'high':
        return 'text-orange-600 bg-orange-100'
      case 'critical':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  },

  /**
   * Get color class based on severity
   */
  getSeverityColor: (severity: ConflictSeverity): string => {
    switch (severity) {
      case 'low':
        return 'text-blue-600 bg-blue-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'high':
        return 'text-orange-600 bg-orange-100'
      case 'critical':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  },

  /**
   * Get color class based on overall score
   */
  getScoreColor: (score: number): string => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  },

  /**
   * Get progress bar color based on score
   */
  getScoreProgressColor: (score: number): string => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  },

  /**
   * Format conflict type for display
   */
  formatConflictType: (type: ConflictType): string => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  },

  /**
   * Check if consistency check is outdated (older than 24 hours)
   */
  isOutdated: (analyzedAt: string): boolean => {
    const checkDate = new Date(analyzedAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - checkDate.getTime()) / (1000 * 60 * 60)
    return hoursDiff > 24
  },

  /**
   * Get recommendation type icon
   */
  getRecommendationIcon: (
    type: RecommendationType,
  ): 'check' | 'x' | 'merge' | 'edit' | 'archive' | 'eye' => {
    switch (type) {
      case 'approve':
        return 'check'
      case 'reject':
        return 'x'
      case 'merge':
        return 'merge'
      case 'update':
        return 'edit'
      case 'deprecate':
        return 'archive'
      case 'review':
        return 'eye'
      default:
        return 'eye'
    }
  },
}
