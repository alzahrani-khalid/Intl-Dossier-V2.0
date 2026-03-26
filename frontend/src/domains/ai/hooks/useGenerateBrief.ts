/**
 * useGenerateBrief Hook
 * @module domains/ai/hooks/useGenerateBrief
 *
 * Hook for generating AI briefs with SSE streaming support.
 */

import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { generateBrief, getBrief } from '../repositories/ai.repository'
import type { BriefGenerationParams, BriefContent, UseGenerateBriefReturn } from '../types'

export type { BriefGenerationParams, BriefContent, UseGenerateBriefReturn }

export function useGenerateBrief(): UseGenerateBriefReturn {
  const [brief, setBrief] = useState<BriefContent | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastParamsRef = useRef<BriefGenerationParams | null>(null)

  const generate = useCallback(
    async (params: BriefGenerationParams) => {
      if (isGenerating) return

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
        const response = await generateBrief(
          {
            engagement_id: params.engagementId,
            dossier_id: params.dossierId,
            custom_prompt: params.customPrompt,
            language: params.language || 'en',
          },
          abortControllerRef.current.signal,
        )

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
                if (briefId) {
                  try {
                    const briefData = await getBrief(briefId)
                    setBrief(briefData.data)
                  } catch (_fetchError) {
                    setError('BRIEF_FETCH_FAILED')
                  }
                }
              } else if (data.type === 'error') {
                throw new Error(data.code || 'GENERATION_FAILED')
              } else if (data.type === 'timeout') {
                setError('TIMEOUT')
                setProgress(100)
              }
            } catch (_parseError) {
              // Ignore parse errors for partial chunks
            }
          }
        }
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

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsGenerating(false)
  }, [])

  const retry = useCallback(() => {
    if (lastParamsRef.current) {
      void generate(lastParamsRef.current)
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
