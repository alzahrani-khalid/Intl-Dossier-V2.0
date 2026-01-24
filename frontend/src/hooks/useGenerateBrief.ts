/**
 * AI Brief Generation Hook
 * @module hooks/useGenerateBrief
 * @feature 033-ai-brief-generation
 * @task T026
 *
 * React hook for generating AI-powered policy briefs with Server-Sent Events (SSE) streaming support.
 *
 * @description
 * This hook provides a comprehensive interface for generating AI briefs with real-time streaming updates.
 * It connects to the backend AI service to generate briefs based on engagements, dossiers, or custom prompts.
 *
 * Features:
 * - SSE streaming for real-time content updates
 * - Progress tracking (0-100%)
 * - Bilingual support (EN/AR)
 * - Cancellation support via AbortController
 * - Retry logic for failed generations
 * - Automatic authentication token management
 * - Citation and source tracking
 * - Talking points extraction
 *
 * @example
 * // Generate brief for an engagement
 * const { generate, brief, streamingContent, isGenerating, progress } = useGenerateBrief();
 * await generate({
 *   engagementId: 'uuid-123',
 *   language: 'en'
 * });
 *
 * @example
 * // Generate brief for a dossier
 * const { generate } = useGenerateBrief();
 * await generate({
 *   dossierId: 'dossier-uuid',
 *   language: 'ar'
 * });
 *
 * @example
 * // Cancel generation
 * const { generate, cancel, isGenerating } = useGenerateBrief();
 * generate({ engagementId: 'uuid' });
 * // Later...
 * if (isGenerating) cancel();
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Parameters for brief generation request
 *
 * @description
 * At least one of engagementId, dossierId, or customPrompt must be provided.
 */
export interface BriefGenerationParams {
  /** Engagement ID to generate brief for (optional) */
  engagementId?: string
  /** Dossier ID to generate brief for (optional) */
  dossierId?: string
  /** Custom prompt for brief generation (optional) */
  customPrompt?: string
  /** Target language for generated content (default: 'en') */
  language?: 'en' | 'ar'
}

/**
 * Generated brief content with structured sections
 *
 * @description
 * Complete brief content including all sections, citations, and metadata.
 * The structure follows diplomatic briefing best practices.
 */
export interface BriefContent {
  id: string
  title: string
  executiveSummary: string
  background: string
  keyParticipants: Array<{
    name: string
    role: string
    relevance: string
  }>
  relevantPositions: Array<{
    title: string
    stance: string
    source: string
    sourceId: string
  }>
  activeCommitments: Array<{
    description: string
    status: string
    deadline?: string
    sourceId: string
  }>
  historicalContext: string
  talkingPoints: string[]
  recommendations: string
  citations: Array<{
    type: 'dossier' | 'position' | 'commitment' | 'engagement'
    id: string
    title: string
    snippet?: string
  }>
  status: 'generating' | 'completed' | 'partial' | 'failed'
}

/**
 * Return type for useGenerateBrief hook
 *
 * @description
 * Provides functions and state for managing brief generation lifecycle.
 */
export interface UseGenerateBriefReturn {
  /** Function to initiate brief generation */
  generate: (params: BriefGenerationParams) => Promise<void>
  /** Final structured brief content (null until generation completes) */
  brief: BriefContent | null
  /** Real-time streaming content as it's generated */
  streamingContent: string
  /** Whether brief is currently being generated */
  isGenerating: boolean
  /** Generation progress (0-100) */
  progress: number
  /** Error message if generation failed */
  error: string | null
  /** Cancel ongoing generation */
  cancel: () => void
  /** Retry last failed generation */
  retry: () => void
  /** Reset all state to initial values */
  reset: () => void
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Hook to generate AI-powered policy briefs with SSE streaming
 *
 * @description
 * Manages the entire lifecycle of AI brief generation including authentication,
 * SSE streaming, progress tracking, error handling, and state management.
 *
 * The generation process:
 * 1. Validates authentication token
 * 2. Initiates SSE connection to backend AI service
 * 3. Streams content updates in real-time
 * 4. Fetches final structured brief when complete
 * 5. Handles errors and supports retry/cancel
 *
 * Error codes:
 * - UNAUTHORIZED: No valid authentication token
 * - CANCELLED: User cancelled generation
 * - BRIEF_FETCH_FAILED: Brief generated but fetch failed
 * - GENERATION_FAILED: AI generation failed
 * - TIMEOUT: Generation exceeded time limit
 * - UNKNOWN_ERROR: Unexpected error
 *
 * @returns Hook interface with generate function and state
 *
 * @example
 * // Basic usage with engagement
 * const { generate, brief, isGenerating, progress } = useGenerateBrief();
 *
 * const handleGenerate = async () => {
 *   await generate({
 *     engagementId: 'engagement-uuid',
 *     language: 'en'
 *   });
 * };
 *
 * @example
 * // Display streaming content and progress
 * const { streamingContent, progress, isGenerating } = useGenerateBrief();
 *
 * {isGenerating && (
 *   <>
 *     <ProgressBar value={progress} />
 *     <div>{streamingContent}</div>
 *   </>
 * )}
 *
 * @example
 * // Handle errors and retry
 * const { generate, error, retry } = useGenerateBrief();
 *
 * {error && (
 *   <Alert>
 *     <p>Error: {error}</p>
 *     <Button onClick={retry}>Retry</Button>
 *   </Alert>
 * )}
 *
 * @example
 * // Cancel generation
 * const { generate, cancel, isGenerating } = useGenerateBrief();
 *
 * {isGenerating && (
 *   <Button onClick={cancel}>Cancel Generation</Button>
 * )}
 */
export function useGenerateBrief(): UseGenerateBriefReturn {
  const [token, setToken] = useState<string | null>(null)
  const [brief, setBrief] = useState<BriefContent | null>(null)

  // Get the auth token from Supabase session
  useEffect(() => {
    const getToken = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setToken(session?.access_token || null)
    }
    getToken()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || null)
    })

    return () => subscription.unsubscribe()
  }, [])
  const [streamingContent, setStreamingContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastParamsRef = useRef<BriefGenerationParams | null>(null)

  const generate = useCallback(
    async (params: BriefGenerationParams) => {
      if (isGenerating) return

      // Get fresh token from Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const currentToken = session?.access_token

      if (!currentToken) {
        setError('UNAUTHORIZED')
        return
      }

      lastParamsRef.current = params
      setIsGenerating(true)
      setError(null)
      setStreamingContent('')
      setProgress(0)
      setBrief(null)

      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch(`${API_BASE}/ai/briefs/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            engagement_id: params.engagementId,
            dossier_id: params.dossierId,
            custom_prompt: params.customPrompt,
            language: params.language || 'en',
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to generate brief')
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let content = ''
        let briefId: string | undefined

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue

            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'init' && data.briefId) {
                briefId = data.briefId
                setProgress(10)
              } else if (data.type === 'content' && data.content) {
                content += data.content
                setStreamingContent(content)
                setProgress((p) => Math.min(90, p + 1))
              } else if (data.type === 'done') {
                setProgress(100)
                // Fetch the final brief
                if (briefId) {
                  try {
                    const briefResponse = await fetch(`${API_BASE}/ai/briefs/${briefId}`, {
                      headers: { Authorization: `Bearer ${currentToken}` },
                    })
                    if (briefResponse.ok) {
                      const briefData = await briefResponse.json()
                      setBrief(briefData.data)
                    } else {
                      throw new Error('BRIEF_FETCH_FAILED')
                    }
                  } catch (fetchError) {
                    // Surface the error to the user instead of failing silently
                    setError('BRIEF_FETCH_FAILED')
                  }
                }
              } else if (data.type === 'error') {
                throw new Error(data.code || 'GENERATION_FAILED')
              } else if (data.type === 'timeout') {
                setError('TIMEOUT')
                setProgress(100)
              }
            } catch (parseError) {
              // Ignore parse errors for partial chunks
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('CANCELLED')
        } else {
          // Use error code if available, otherwise parse from message
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

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsGenerating(false)
  }, [])

  const retry = useCallback(() => {
    if (lastParamsRef.current) {
      generate(lastParamsRef.current)
    }
  }, [generate])

  const reset = useCallback(() => {
    setBrief(null)
    setStreamingContent('')
    setProgress(0)
    setError(null)
    lastParamsRef.current = null
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsGenerating(false)
  }, [])

  return {
    generate,
    brief,
    streamingContent,
    isGenerating,
    progress,
    error,
    cancel,
    retry,
    reset,
  }
}

export default useGenerateBrief
