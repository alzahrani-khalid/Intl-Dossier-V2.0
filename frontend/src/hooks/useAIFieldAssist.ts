/**
 * useAIFieldAssist Hook
 *
 * Hook for AI-assisted field pre-filling when creating dossiers.
 * Takes a user's natural language description and dossier type,
 * then generates bilingual name, description, and suggested tags.
 *
 * Features:
 * - Calls the dossier-field-assist Edge Function
 * - Fallback generation if AI service is unavailable
 * - Loading and error state management
 * - Retry capability
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { DossierType } from '@/services/dossier-api'

/**
 * Generated fields from AI assistance
 */
export interface GeneratedFields {
  name_en: string
  name_ar: string
  description_en: string
  description_ar: string
  suggested_tags: string[]
}

/**
 * Parameters for generating fields
 */
export interface FieldAssistParams {
  dossier_type: DossierType
  description: string
  language?: 'en' | 'ar'
}

/**
 * Return type for the hook
 */
export interface UseAIFieldAssistReturn {
  generate: (params: FieldAssistParams) => Promise<void>
  generatedFields: GeneratedFields | null
  isGenerating: boolean
  error: string | null
  retry: () => void
  reset: () => void
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

// Type labels for generating fallback content
const TYPE_LABELS: Record<DossierType, { en: string; ar: string }> = {
  country: { en: 'Country', ar: 'دولة' },
  organization: { en: 'Organization', ar: 'منظمة' },
  forum: { en: 'Forum', ar: 'منتدى' },
  engagement: { en: 'Engagement', ar: 'مشاركة' },
  topic: { en: 'Topic', ar: 'موضوع' },
  working_group: { en: 'Working Group', ar: 'مجموعة عمل' },
  person: { en: 'Person', ar: 'شخص' },
}

// Common tags by dossier type
const TYPE_TAGS: Record<DossierType, string[]> = {
  country: ['bilateral', 'diplomatic', 'relations'],
  organization: ['international', 'partnership', 'collaboration'],
  forum: ['multilateral', 'conference', 'summit'],
  engagement: ['meeting', 'coordination', 'event'],
  topic: ['policy', 'strategic', 'analysis'],
  working_group: ['committee', 'task-force', 'coordination'],
  person: ['contact', 'official', 'stakeholder'],
}

export function useAIFieldAssist(): UseAIFieldAssistReturn {
  const [generatedFields, setGeneratedFields] = useState<GeneratedFields | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastParamsRef = useRef<FieldAssistParams | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Extract potential name from user description
   */
  const extractNameFromDescription = useCallback(
    (description: string, type: DossierType): { name_en: string; name_ar: string } => {
      // Simple extraction: take first sentence or first 50 chars as name
      const firstSentence = (description.split(/[.،!?]/)[0] || '').trim()
      const name = firstSentence.length > 50 ? firstSentence.slice(0, 47) + '...' : firstSentence

      // For Arabic, if description looks Arabic, use it directly
      const isArabicText = /[\u0600-\u06FF]/.test(description)
      const typeLabel = TYPE_LABELS[type]

      if (isArabicText) {
        return {
          name_en: `${typeLabel.en}: ${name}`,
          name_ar: name,
        }
      }

      return {
        name_en: name,
        name_ar: `${typeLabel.ar}: ${name}`,
      }
    },
    [],
  )

  /**
   * Generate fallback content when AI is unavailable
   */
  const generateFallback = useCallback(
    (params: FieldAssistParams): GeneratedFields => {
      const { dossier_type, description } = params
      const names = extractNameFromDescription(description, dossier_type)
      const typeLabel = TYPE_LABELS[dossier_type]

      // Clean description for use
      const cleanDesc = description.trim()
      const isArabicText = /[\u0600-\u06FF]/.test(description)

      // Generate description based on type
      const descEn = isArabicText
        ? `${typeLabel.en} dossier for tracking and managing related information.`
        : cleanDesc.length > 200
          ? cleanDesc.slice(0, 197) + '...'
          : cleanDesc

      const descAr = isArabicText
        ? cleanDesc.length > 200
          ? cleanDesc.slice(0, 197) + '...'
          : cleanDesc
        : `ملف ${typeLabel.ar} لتتبع وإدارة المعلومات ذات الصلة.`

      // Extract potential tags from description
      const words = description.toLowerCase().split(/\s+/)
      const potentialTags = words
        .filter((word) => word.length > 4 && /^[a-z]+$/.test(word))
        .slice(0, 2)

      const suggestedTags = [...TYPE_TAGS[dossier_type], ...potentialTags].slice(0, 5)

      return {
        name_en: names.name_en,
        name_ar: names.name_ar,
        description_en: descEn,
        description_ar: descAr,
        suggested_tags: suggestedTags,
      }
    },
    [extractNameFromDescription],
  )

  /**
   * Generate fields using AI
   */
  const generate = useCallback(
    async (params: FieldAssistParams) => {
      if (isGenerating) return

      // Validate input
      if (!params.description || params.description.trim().length < 10) {
        setError('Description must be at least 10 characters')
        return
      }

      // Get fresh token from Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        setError('Please sign in to use AI assistance')
        return
      }

      lastParamsRef.current = params
      setIsGenerating(true)
      setError(null)
      setGeneratedFields(null)

      abortControllerRef.current = new AbortController()

      try {
        // Try backend first (can reach local AnythingLLM), fallback to Edge Function
        const backendAvailable = BACKEND_URL && BACKEND_URL !== 'undefined'
        // BACKEND_URL already includes /api (e.g., http://localhost:5001/api)
        const apiUrl = backendAvailable
          ? `${BACKEND_URL}/ai/dossier-field-assist`
          : `${SUPABASE_URL}/functions/v1/dossier-field-assist`

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(backendAvailable ? {} : { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY }),
          },
          body: JSON.stringify({
            dossier_type: params.dossier_type,
            description: params.description.trim(),
            language: params.language || 'en',
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          // Check for specific error codes
          if (response.status === 401) {
            // Auth error - session may be expired, use fallback
            console.warn('AI field assist auth error (401), using fallback')
            const fallback = generateFallback(params)
            setGeneratedFields(fallback)
            return
          }

          if (response.status === 404) {
            // Edge function doesn't exist yet - use fallback
            console.warn('AI field assist endpoint not found, using fallback')
            const fallback = generateFallback(params)
            setGeneratedFields(fallback)
            return
          }

          if (response.status === 503) {
            // AI service unavailable - use fallback
            console.warn('AI service unavailable, using fallback')
            const fallback = generateFallback(params)
            setGeneratedFields(fallback)
            return
          }

          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.error?.message_en || errorData.error?.message || 'Failed to generate fields',
          )
        }

        const data = await response.json()

        if (data.name_en && data.name_ar) {
          setGeneratedFields({
            name_en: data.name_en,
            name_ar: data.name_ar,
            description_en: data.description_en || '',
            description_ar: data.description_ar || '',
            suggested_tags: data.suggested_tags || [],
          })
        } else {
          // Invalid response, use fallback
          const fallback = generateFallback(params)
          setGeneratedFields(fallback)
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Generation cancelled')
        } else if (err instanceof Error && err.message.includes('fetch')) {
          // Network error - use fallback
          console.warn('Network error, using fallback field generation')
          const fallback = generateFallback(params)
          setGeneratedFields(fallback)
          setError(null)
        } else {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
          setError(errorMessage)
          // Still try fallback on error
          const fallback = generateFallback(params)
          setGeneratedFields(fallback)
        }
      } finally {
        setIsGenerating(false)
        abortControllerRef.current = null
      }
    },
    [isGenerating, generateFallback],
  )

  /**
   * Retry the last generation
   */
  const retry = useCallback(() => {
    if (lastParamsRef.current) {
      generate(lastParamsRef.current)
    }
  }, [generate])

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setGeneratedFields(null)
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
    generatedFields,
    isGenerating,
    error,
    retry,
    reset,
  }
}

