/**
 * useGenerateBrief Hook
 * Feature: 033-ai-brief-generation
 * Task: T026
 *
 * Hook for generating AI briefs with SSE streaming support
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface BriefGenerationParams {
  engagementId?: string
  dossierId?: string
  customPrompt?: string
  language?: 'en' | 'ar'
}

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

export interface UseGenerateBriefReturn {
  generate: (params: BriefGenerationParams) => Promise<void>
  brief: BriefContent | null
  streamingContent: string
  isGenerating: boolean
  progress: number
  error: string | null
  cancel: () => void
  retry: () => void
  reset: () => void
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

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
