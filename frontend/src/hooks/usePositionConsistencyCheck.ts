/**
 * Position Consistency Check Hooks
 * @module hooks/usePositionConsistencyCheck
 * @feature position-consistency-checker
 *
 * TanStack Query hooks for position consistency checking with AI-powered conflict detection,
 * automated review workflows, and comprehensive history tracking.
 *
 * @description
 * This module provides a comprehensive set of React hooks for managing position consistency:
 * - Mutation hooks for running consistency checks with AI analysis
 * - Query hooks for fetching consistency check history and latest results
 * - Review workflow hooks for submitting approval/rejection decisions
 * - Utility functions for risk level assessment and conflict severity classification
 * - Auto-approval detection based on consistency scores
 * - Pending review queue management for reviewers
 *
 * @example
 * // Run a consistency check on a position
 * const { mutate: runCheck, isPending } = useRunConsistencyCheck();
 * runCheck({ position_id: 'uuid-here', analysis_type: 'pre_approval' });
 *
 * @example
 * // Fetch the latest consistency check result
 * const { data: latestCheck, isLoading } = useLatestConsistencyCheck('position-uuid');
 *
 * @example
 * // Submit a review decision
 * const { mutate: submitDecision } = useSubmitReviewDecision();
 * submitDecision({ check_id: 'uuid', decision: 'approved', notes: 'Looks good' });
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

/**
 * Query Keys Factory for position consistency check queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation of consistency checks.
 *
 * @example
 * // Invalidate all consistency check queries
 * queryClient.invalidateQueries({ queryKey: consistencyCheckKeys.all });
 *
 * @example
 * // Invalidate specific position's history
 * queryClient.invalidateQueries({ queryKey: consistencyCheckKeys.history('uuid') });
 *
 * @example
 * // Invalidate latest check for a position
 * queryClient.invalidateQueries({ queryKey: consistencyCheckKeys.latest('uuid') });
 */
export const consistencyCheckKeys = {
  all: ['position-consistency-check'] as const,
  check: (positionId: string) => [...consistencyCheckKeys.all, 'check', positionId] as const,
  history: (positionId: string) => [...consistencyCheckKeys.all, 'history', positionId] as const,
  latest: (positionId: string) => [...consistencyCheckKeys.all, 'latest', positionId] as const,
}

/**
 * Helper to get authentication headers for API requests
 *
 * @private
 * @returns Promise resolving to headers object with auth token
 * @throws Error if session is not available
 */
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
 *
 * @description
 * Executes an AI-powered consistency check that analyzes a position for conflicts,
 * redundancies, gaps, and semantic issues. Automatically invalidates related queries
 * on success and updates the position's consistency score.
 *
 * The check includes:
 * - Conflict detection (contradictions, redundancies, semantic conflicts)
 * - Similar position identification with similarity scores
 * - Gap analysis for missing topics or coverage
 * - Automated recommendations for resolution
 * - Risk assessment and auto-approval eligibility
 *
 * @returns TanStack Mutation result with mutate function accepting ConsistencyCheckRequest
 *
 * @example
 * const { mutate: runCheck, isPending, isError } = useRunConsistencyCheck();
 *
 * // Run a pre-approval check
 * runCheck({
 *   position_id: 'uuid-123',
 *   analysis_type: 'pre_approval',
 *   similarity_threshold: 0.8,
 *   include_recommendations: true,
 * });
 *
 * @example
 * // Run a manual check with custom threshold
 * const handleRunCheck = () => {
 *   runCheck({
 *     position_id: positionId,
 *     analysis_type: 'manual',
 *     similarity_threshold: 0.7,
 *   });
 * };
 *
 * @example
 * // Handle errors and loading states
 * if (isPending) return <Spinner />;
 * if (isError) return <ErrorAlert message="Check failed" />;
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
 *
 * @description
 * Fetches the most recent consistency check result for a position from the database.
 * Returns null if no checks have been run. Automatically enabled only when positionId
 * is provided. Results are cached for 1 minute to reduce database load.
 *
 * @param positionId - The unique identifier (UUID) of the position, or undefined
 * @returns TanStack Query result with data typed as ConsistencyCheckHistoryItem | null
 *
 * @example
 * // Basic usage
 * const { data: latestCheck, isLoading } = useLatestConsistencyCheck('uuid-123');
 *
 * if (isLoading) return <Skeleton />;
 * if (!latestCheck) return <NoChecksMessage />;
 *
 * // Display risk level and score
 * return (
 *   <div>
 *     <Badge variant={latestCheck.risk_level}>{latestCheck.risk_level}</Badge>
 *     <ScoreDisplay score={latestCheck.overall_score} />
 *   </div>
 * );
 *
 * @example
 * // Conditional fetching with optional positionId
 * const { data, isLoading } = useLatestConsistencyCheck(
 *   isEditMode ? positionId : undefined
 * );
 *
 * @example
 * // Check if position requires human review
 * const { data: latestCheck } = useLatestConsistencyCheck(positionId);
 * const needsReview = latestCheck?.requires_human_review;
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
 *
 * @description
 * Fetches a paginated list of all consistency checks run on a position, ordered by
 * analyzed_at timestamp (most recent first). Useful for displaying audit trails and
 * tracking score changes over time. Results are cached for 1 minute.
 *
 * @param positionId - The unique identifier (UUID) of the position, or undefined
 * @param limit - Maximum number of history items to fetch (defaults to 10)
 * @returns TanStack Query result with array of ConsistencyCheckHistoryItem
 *
 * @example
 * // Basic usage with default limit
 * const { data: history, isLoading } = useConsistencyCheckHistory('uuid-123');
 *
 * @example
 * // Custom limit for pagination
 * const { data: history } = useConsistencyCheckHistory('uuid-123', 20);
 *
 * @example
 * // Display history timeline
 * const { data: history, isLoading } = useConsistencyCheckHistory(positionId);
 *
 * return (
 *   <Timeline>
 *     {history?.map(check => (
 *       <TimelineItem key={check.id}>
 *         <Badge>{check.overall_score}</Badge>
 *         <Text>{formatDate(check.analyzed_at)}</Text>
 *         <Badge variant={check.risk_level}>{check.risk_level}</Badge>
 *       </TimelineItem>
 *     ))}
 *   </Timeline>
 * );
 *
 * @example
 * // Track score improvements over time
 * const { data: history } = useConsistencyCheckHistory(positionId, 50);
 * const scores = history?.map(h => h.overall_score) || [];
 * const isImproving = scores[0] > scores[scores.length - 1];
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
 *
 * @description
 * Allows authorized reviewers to submit approval/rejection decisions for consistency
 * checks that require human review. Updates the check's review status, records the
 * reviewer and timestamp, and optionally adds review notes. Automatically invalidates
 * related queries on success.
 *
 * @returns TanStack Mutation result with mutate function accepting ReviewDecisionRequest
 *
 * @example
 * const { mutate: submitDecision, isPending } = useSubmitReviewDecision();
 *
 * // Approve with notes
 * submitDecision({
 *   check_id: 'uuid-123',
 *   decision: 'approved',
 *   notes: 'All conflicts addressed, cleared for approval',
 * });
 *
 * @example
 * // Reject and request revision
 * const handleReject = () => {
 *   submitDecision({
 *     check_id: checkId,
 *     decision: 'revision_required',
 *     notes: 'Please address the high-severity conflicts before resubmitting',
 *   });
 * };
 *
 * @example
 * // Simple approval without notes
 * <Button
 *   onClick={() => submitDecision({ check_id: id, decision: 'approved' })}
 *   disabled={isPending}
 * >
 *   Approve
 * </Button>
 *
 * @example
 * // Handle submission with toast notifications
 * const { mutate, isPending, isError, error } = useSubmitReviewDecision();
 *
 * useEffect(() => {
 *   if (isError) {
 *     toast.error(`Failed to submit decision: ${error.message}`);
 *   }
 * }, [isError, error]);
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
 *
 * @description
 * Queries the database to determine if a position meets the criteria for automatic
 * approval based on its consistency score and risk level. Uses a stored procedure
 * for efficient server-side evaluation. Results are cached for 30 seconds.
 *
 * @param positionId - The unique identifier (UUID) of the position, or undefined
 * @returns TanStack Query result with boolean indicating auto-approval eligibility
 *
 * @example
 * const { data: canAutoApprove, isLoading } = useCanAutoApprove('uuid-123');
 *
 * if (canAutoApprove) {
 *   return <Badge variant="success">Auto-Approval Eligible</Badge>;
 * }
 *
 * @example
 * // Conditionally show approval button based on eligibility
 * const { data: canAutoApprove } = useCanAutoApprove(positionId);
 *
 * return (
 *   <div>
 *     {canAutoApprove ? (
 *       <Button onClick={handleAutoApprove}>Auto-Approve</Button>
 *     ) : (
 *       <Button onClick={handleManualReview}>Send for Review</Button>
 *     )}
 *   </div>
 * );
 *
 * @example
 * // Display approval workflow based on eligibility
 * const { data: canAutoApprove, isLoading } = useCanAutoApprove(positionId);
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <Card>
 *     <Text>Approval Status: {canAutoApprove ? 'Fast-Track' : 'Standard Review'}</Text>
 *   </Card>
 * );
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
 *
 * @description
 * Fetches a paginated list of consistency checks that are pending human review,
 * ordered by analyzed_at timestamp. Includes related position metadata for context.
 * Used primarily by reviewer dashboards to display pending approval queues.
 * Results are cached for 30 seconds.
 *
 * @param limit - Maximum number of pending checks to fetch (defaults to 20)
 * @returns TanStack Query result with array of ConsistencyCheckHistoryItem
 *
 * @example
 * // Basic usage for reviewer dashboard
 * const { data: pendingChecks, isLoading } = usePendingReviewChecks();
 *
 * return (
 *   <ReviewQueue>
 *     {pendingChecks?.map(check => (
 *       <ReviewCard key={check.id} check={check} />
 *     ))}
 *   </ReviewQueue>
 * );
 *
 * @example
 * // Custom limit for pagination
 * const { data: pendingChecks } = usePendingReviewChecks(50);
 *
 * @example
 * // Display pending count badge
 * const { data: pendingChecks, isLoading } = usePendingReviewChecks();
 * const count = pendingChecks?.length || 0;
 *
 * return (
 *   <NavItem>
 *     Reviews
 *     {count > 0 && <Badge variant="danger">{count}</Badge>}
 *   </NavItem>
 * );
 *
 * @example
 * // Filter by risk level
 * const { data: allPending } = usePendingReviewChecks(100);
 * const criticalChecks = allPending?.filter(c => c.risk_level === 'critical');
 * const highChecks = allPending?.filter(c => c.risk_level === 'high');
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
 *
 * @description
 * Collection of helper functions for formatting and displaying consistency check data.
 * Provides color coding, formatting, and assessment utilities for UI components.
 */
export const consistencyCheckUtils = {
  /**
   * Get color class based on risk level
   *
   * @param riskLevel - The risk level to get color for
   * @returns Tailwind CSS color classes for text and background
   *
   * @example
   * const colors = consistencyCheckUtils.getRiskLevelColor('critical');
   * // Returns: 'text-red-600 bg-red-100'
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
   *
   * @param severity - The conflict severity level
   * @returns Tailwind CSS color classes for text and background
   *
   * @example
   * const colors = consistencyCheckUtils.getSeverityColor('high');
   * // Returns: 'text-orange-600 bg-orange-100'
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
   *
   * @param score - The consistency score (0-100)
   * @returns Tailwind CSS text color class
   *
   * @example
   * const color = consistencyCheckUtils.getScoreColor(85);
   * // Returns: 'text-green-600'
   */
  getScoreColor: (score: number): string => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  },

  /**
   * Get progress bar color based on score
   *
   * @param score - The consistency score (0-100)
   * @returns Tailwind CSS background color class
   *
   * @example
   * const bgColor = consistencyCheckUtils.getScoreProgressColor(75);
   * // Returns: 'bg-yellow-500'
   */
  getScoreProgressColor: (score: number): string => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  },

  /**
   * Format conflict type for display
   *
   * @param type - The conflict type enum value
   * @returns Human-readable formatted string
   *
   * @example
   * const formatted = consistencyCheckUtils.formatConflictType('semantic_conflict');
   * // Returns: 'Semantic Conflict'
   */
  formatConflictType: (type: ConflictType): string => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  },

  /**
   * Check if consistency check is outdated (older than 24 hours)
   *
   * @param analyzedAt - ISO timestamp of when the check was analyzed
   * @returns True if the check is older than 24 hours
   *
   * @example
   * const isOld = consistencyCheckUtils.isOutdated('2026-01-20T10:00:00Z');
   * // Returns: true (if current date is 2026-01-24)
   */
  isOutdated: (analyzedAt: string): boolean => {
    const checkDate = new Date(analyzedAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - checkDate.getTime()) / (1000 * 60 * 60)
    return hoursDiff > 24
  },

  /**
   * Get recommendation type icon
   *
   * @param type - The recommendation type
   * @returns Icon name for UI rendering
   *
   * @example
   * const icon = consistencyCheckUtils.getRecommendationIcon('approve');
   * // Returns: 'check'
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
