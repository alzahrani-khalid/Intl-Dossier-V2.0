/**
 * AI Summary Hooks
 * @module hooks/useAISummary
 * @feature ai-summary-generation
 *
 * React hooks for AI-powered summary generation with progress tracking, history
 * management, and fallback handling.
 *
 * @description
 * This module provides hooks for generating, viewing, and managing AI summaries:
 * - Generate summaries for any entity type (dossiers, engagements, etc.)
 * - Track generation progress with percentage updates
 * - Fetch summary history for entities
 * - Retrieve specific summaries by ID
 * - Handle fallback responses when AI is unavailable
 * - Retry failed generation attempts
 * - Automatic Supabase authentication
 *
 * The summary generation hook manages state for the entire generation lifecycle,
 * from initial request through streaming progress updates to final summary delivery.
 * It handles errors gracefully with fallback summaries and provides retry capability.
 *
 * @example
 * // Generate a summary
 * const { generate, summary, isGenerating, progress } = useAISummary();
 * await generate({
 *   entityType: 'country',
 *   entityId: 'france-uuid',
 *   length: 'medium',
 *   language: 'en'
 * });
 *
 * @example
 * // View summary history
 * const { summaries, isLoading } = useAISummaryHistory('country', 'france-uuid');
 *
 * @example
 * // Load a specific summary
 * const { summary, isLoading } = useAISummaryById('summary-uuid');
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  AISummary,
  GenerateSummaryParams,
  GenerateSummaryRequest,
  UseAISummaryReturn,
  SummaryHistoryItem,
  SummaryEntityType,
} from '@/types/ai-summary.types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Hook for generating AI summaries with progress tracking
 *
 * @description
 * Generates AI-powered summaries for any entity type with customizable options:
 * - Summary length (brief, medium, comprehensive)
 * - Focus areas (specific topics to emphasize)
 * - Date range filtering
 * - Language preference (en/ar)
 *
 * The hook manages the full generation lifecycle:
 * - Validates authentication
 * - Submits generation request to Edge Function
 * - Simulates progress updates while AI processes
 * - Handles fallback responses when AI is unavailable (503 errors)
 * - Provides retry capability on errors
 * - Cleanup on component unmount
 *
 * Progress updates from 0-85% during generation, then jumps to 100% on completion.
 * Supports cancellation via AbortController.
 *
 * @returns {UseAISummaryReturn} Summary generation state and control functions
 *
 * @example
 * // Generate a summary for a country dossier
 * const { generate, summary, isGenerating, progress, error } = useAISummary();
 *
 * const handleGenerate = async () => {
 *   await generate({
 *     entityType: 'country',
 *     entityId: 'france-uuid',
 *     length: 'medium',
 *     focusAreas: ['diplomatic_relations', 'trade'],
 *     language: 'en'
 *   });
 * };
 *
 * @example
 * // With progress indicator
 * function SummaryGenerator() {
 *   const { generate, isGenerating, progress, summary } = useAISummary();
 *
 *   return (
 *     <div>
 *       {isGenerating && <ProgressBar value={progress} />}
 *       {summary && <SummaryDisplay content={summary} />}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Error handling with retry
 * function SummaryWithRetry() {
 *   const { generate, error, retry, reset } = useAISummary();
 *
 *   return (
 *     <div>
 *       {error && error !== 'AI_UNAVAILABLE_FALLBACK' && (
 *         <div>
 *           <p>Error: {error}</p>
 *           <button onClick={retry}>Retry</button>
 *           <button onClick={reset}>Cancel</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 */
export function useAISummary(): UseAISummaryReturn {
  const [summary, setSummary] = useState<AISummary | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const lastParamsRef = useRef<GenerateSummaryParams | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const generate = useCallback(
    async (params: GenerateSummaryParams) => {
      if (isGenerating) return

      // Get fresh token from Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        setError('UNAUTHORIZED')
        return
      }

      lastParamsRef.current = params
      setIsGenerating(true)
      setError(null)
      setProgress(0)
      setSummary(null)

      abortControllerRef.current = new AbortController()

      try {
        // Simulate progress while waiting for AI
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 5, 85))
        }, 500)

        // Build request body
        const requestBody: GenerateSummaryRequest = {
          entity_type: params.entityType,
          entity_id: params.entityId,
          length: params.length,
          focus_areas: params.focusAreas,
          date_range_start: params.dateRangeStart,
          date_range_end: params.dateRangeEnd,
          language: params.language,
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-summary-generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        })

        clearInterval(progressInterval)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))

          // Handle fallback response (503 with fallback data)
          if (response.status === 503 && errorData.fallback) {
            setProgress(100)
            setSummary(errorData.fallback)
            // Set a warning error but still show the fallback
            setError('AI_UNAVAILABLE_FALLBACK')
            return
          }

          throw new Error(errorData.error?.code || 'GENERATION_FAILED')
        }

        const data = await response.json()
        setProgress(100)
        setSummary(data)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('CANCELLED')
        } else {
          const errorMessage = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
          setError(errorMessage)
        }
      } finally {
        setIsGenerating(false)
        abortControllerRef.current = null
      }
    },
    [isGenerating],
  )

  const retry = useCallback(() => {
    if (lastParamsRef.current) {
      generate(lastParamsRef.current)
    }
  }, [generate])

  const reset = useCallback(() => {
    setSummary(null)
    setProgress(0)
    setError(null)
    lastParamsRef.current = null
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsGenerating(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    generate,
    summary,
    isGenerating,
    progress,
    error,
    retry,
    reset,
  }
}

/**
 * Hook to fetch summary history for an entity
 *
 * @description
 * Fetches the last 10 AI-generated summaries for a specific entity, ordered by
 * creation date (newest first). Only returns non-archived summaries. Each history
 * item includes:
 * - Summary ID and metadata
 * - Executive summary preview (first 150 characters)
 * - Highlights count
 * - Confidence score
 * - Creation timestamp
 *
 * Automatically refetches when entityType or entityId changes.
 *
 * @param entityType - The type of entity ('country', 'engagement', etc.)
 * @param entityId - The UUID of the entity
 * @returns Summary history state with summaries array, loading state, error, and refetch function
 *
 * @example
 * // Display summary history
 * const { summaries, isLoading, error } = useAISummaryHistory('country', countryId);
 *
 * return (
 *   <div>
 *     {isLoading && <Spinner />}
 *     {summaries.map(summary => (
 *       <SummaryCard key={summary.id} summary={summary} />
 *     ))}
 *   </div>
 * );
 *
 * @example
 * // With manual refetch
 * const { summaries, refetch } = useAISummaryHistory('engagement', engagementId);
 *
 * const handleGenerateNew = async () => {
 *   await generateNewSummary();
 *   refetch(); // Refresh history to show new summary
 * };
 */
export function useAISummaryHistory(entityType: SummaryEntityType, entityId: string) {
  const [summaries, setSummaries] = useState<SummaryHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    if (!entityId) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('ai_summaries')
        .select('id, entity_type, entity_id, length, confidence_score, created_at, content_en')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('archived', false)
        .order('created_at', { ascending: false })
        .limit(10)

      if (fetchError) throw fetchError

      const items: SummaryHistoryItem[] = (data || []).map((item) => ({
        id: item.id,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        length: item.length,
        confidence_score: item.confidence_score,
        created_at: item.created_at,
        executive_summary_preview:
          (item.content_en as any)?.executive_summary?.substring(0, 150) + '...' || '',
        highlights_count: (item.content_en as any)?.key_highlights?.length || 0,
      }))

      setSummaries(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history')
    } finally {
      setIsLoading(false)
    }
  }, [entityType, entityId])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return {
    summaries,
    isLoading,
    error,
    refetch: fetchHistory,
  }
}

/**
 * Hook to fetch a specific summary by ID
 *
 * @description
 * Fetches a specific AI summary by its UUID. Returns the full summary content in
 * both English and Arabic (if available). Automatically refetches when summaryId
 * changes. Returns null if summaryId is null.
 *
 * Useful for displaying previously generated summaries without regenerating them,
 * such as when viewing summary history or sharing summaries with other users.
 *
 * @param summaryId - The UUID of the summary to fetch, or null to skip fetching
 * @returns Summary state with summary content, loading state, and error
 *
 * @example
 * // Display a specific summary
 * const { summary, isLoading, error } = useAISummaryById(summaryId);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage>{error}</ErrorMessage>;
 * if (!summary) return null;
 *
 * return <SummaryViewer summary={summary} />;
 *
 * @example
 * // Load summary from URL parameter
 * const [summaryId] = useSearchParams();
 * const { summary } = useAISummaryById(summaryId.get('summary'));
 */
export function useAISummaryById(summaryId: string | null) {
  const [summary, setSummary] = useState<AISummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!summaryId) {
      setSummary(null)
      return
    }

    const fetchSummary = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('ai_summaries')
          .select('id, content_en, content_ar')
          .eq('id', summaryId)
          .single()

        if (fetchError) throw fetchError

        setSummary({
          id: data.id,
          en: data.content_en,
          ar: data.content_ar,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch summary')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSummary()
  }, [summaryId])

  return { summary, isLoading, error }
}

export default useAISummary
