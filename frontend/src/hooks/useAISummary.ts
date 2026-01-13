/**
 * useAISummary Hook
 * Feature: ai-summary-generation
 *
 * Hook for generating AI summaries for any entity type
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
