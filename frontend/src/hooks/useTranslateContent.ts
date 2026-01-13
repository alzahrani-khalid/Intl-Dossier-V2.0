/**
 * useTranslateContent Hook
 * Feature: translation-service
 *
 * Hook for translating content between Arabic and English using AI
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  TranslateRequest,
  TranslateResponse,
  TranslationLanguage,
  TranslatableContentType,
  TranslationDirection,
  UseTranslateContentParams,
  UseTranslateContentReturn,
  BatchTranslateItem,
  BatchTranslateRequest,
  BatchTranslateResponse,
  BatchTranslationResult,
  UseBatchTranslateParams,
  UseBatchTranslateReturn,
  TranslationHistoryItem,
  TranslationPreferences,
  GlossaryTerm,
} from '@/types/translation.types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Detect language of text (client-side for quick checks)
 */
export function detectLanguage(text: string): TranslationLanguage {
  // Arabic Unicode range detection
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
  const arabicMatches = (text.match(new RegExp(arabicPattern, 'g')) || []).length
  const totalChars = text.replace(/\s/g, '').length

  // If more than 30% Arabic characters, consider it Arabic
  return arabicMatches / totalChars > 0.3 ? 'ar' : 'en'
}

/**
 * Get the opposite language
 */
export function getOppositeLanguage(lang: TranslationLanguage): TranslationLanguage {
  return lang === 'en' ? 'ar' : 'en'
}

/**
 * Hook for translating single text content
 */
export function useTranslateContent(
  initialParams?: Partial<UseTranslateContentParams>,
): UseTranslateContentReturn {
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [sourceLanguage, setSourceLanguage] = useState<TranslationLanguage | null>(null)
  const [targetLanguage, setTargetLanguage] = useState<TranslationLanguage | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const paramsRef = useRef<Partial<UseTranslateContentParams> | undefined>(initialParams)

  // Update stored params when initialParams change
  useEffect(() => {
    paramsRef.current = initialParams
  }, [initialParams])

  const translate = useCallback(
    async (
      overrideParams?: Partial<UseTranslateContentParams>,
    ): Promise<TranslateResponse | null> => {
      const params = { ...paramsRef.current, ...overrideParams }

      if (!params.text || params.text.trim().length === 0) {
        setError('NO_TEXT')
        return null
      }

      if (isTranslating) {
        return null
      }

      // Get fresh token from Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        setError('UNAUTHORIZED')
        return null
      }

      setIsTranslating(true)
      setError(null)
      setProgress(0)
      setTranslatedText(null)
      setConfidence(null)

      abortControllerRef.current = new AbortController()

      try {
        // Simulate progress while waiting for AI
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 85))
        }, 300)

        // Build request body
        const requestBody: TranslateRequest = {
          text: params.text,
          direction: params.direction,
          content_type: params.contentType,
          preserve_formatting: params.preserveFormatting,
          entity_type: params.entityType,
          entity_id: params.entityId,
          field_name: params.fieldName,
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/translate-content`, {
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
          throw new Error(errorData.error?.code || 'TRANSLATION_FAILED')
        }

        const data: TranslateResponse = await response.json()

        setProgress(100)
        setTranslatedText(data.translated_text)
        setConfidence(data.confidence)
        setSourceLanguage(data.source_language)
        setTargetLanguage(data.target_language)

        return data
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('CANCELLED')
        } else {
          const errorMessage = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
          setError(errorMessage)
        }
        return null
      } finally {
        setIsTranslating(false)
        abortControllerRef.current = null
      }
    },
    [isTranslating],
  )

  const reset = useCallback(() => {
    setTranslatedText(null)
    setProgress(0)
    setError(null)
    setConfidence(null)
    setSourceLanguage(null)
    setTargetLanguage(null)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsTranslating(false)
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
    translate,
    translatedText,
    isTranslating,
    progress,
    error,
    confidence,
    sourceLanguage,
    targetLanguage,
    reset,
  }
}

/**
 * Hook for batch translating multiple text items
 */
export function useBatchTranslateContent(
  initialParams?: Partial<UseBatchTranslateParams>,
): UseBatchTranslateReturn {
  const [results, setResults] = useState<BatchTranslationResult[]>([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const paramsRef = useRef<Partial<UseBatchTranslateParams> | undefined>(initialParams)

  useEffect(() => {
    paramsRef.current = initialParams
  }, [initialParams])

  const translate = useCallback(
    async (
      overrideParams?: Partial<UseBatchTranslateParams>,
    ): Promise<BatchTranslateResponse | null> => {
      const params = { ...paramsRef.current, ...overrideParams }

      if (!params.items || params.items.length === 0) {
        setError('NO_ITEMS')
        return null
      }

      if (isTranslating) {
        return null
      }

      // Get fresh token from Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        setError('UNAUTHORIZED')
        return null
      }

      setIsTranslating(true)
      setError(null)
      setProgress(0)
      setResults([])

      abortControllerRef.current = new AbortController()

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 5, 85))
        }, 500)

        const requestBody: BatchTranslateRequest = {
          items: params.items,
          direction: params.direction,
          content_type: params.contentType,
          entity_type: params.entityType,
          entity_id: params.entityId,
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/translate-content/batch`, {
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
          throw new Error(errorData.error?.code || 'BATCH_TRANSLATION_FAILED')
        }

        const data: BatchTranslateResponse = await response.json()

        setProgress(100)
        setResults(data.translations)

        return data
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('CANCELLED')
        } else {
          const errorMessage = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
          setError(errorMessage)
        }
        return null
      } finally {
        setIsTranslating(false)
        abortControllerRef.current = null
      }
    },
    [isTranslating],
  )

  const reset = useCallback(() => {
    setResults([])
    setProgress(0)
    setError(null)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsTranslating(false)
  }, [])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    translate,
    results,
    isTranslating,
    progress,
    error,
    reset,
  }
}

/**
 * Hook for fetching translation history for an entity
 */
export function useTranslationHistory(entityType: string, entityId: string) {
  const [history, setHistory] = useState<TranslationHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    if (!entityId) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase.rpc('get_entity_translations', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_limit: 20,
      })

      if (fetchError) throw fetchError

      setHistory(data || [])
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
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  }
}

/**
 * Hook for managing user translation preferences
 */
export function useTranslationPreferences() {
  const [preferences, setPreferences] = useState<TranslationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Not authenticated')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('translation_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      setPreferences(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updatePreferences = useCallback(
    async (updates: Partial<TranslationPreferences>) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error('Not authenticated')
        }

        const { data, error: upsertError } = await supabase
          .from('translation_preferences')
          .upsert({
            user_id: user.id,
            ...preferences,
            ...updates,
          })
          .select()
          .single()

        if (upsertError) throw upsertError

        setPreferences(data)
        return data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update preferences')
        throw err
      }
    },
    [preferences],
  )

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    refetch: fetchPreferences,
  }
}

/**
 * Hook for searching the translation glossary
 */
export function useTranslationGlossary(
  searchText: string,
  sourceLanguage: TranslationLanguage = 'en',
) {
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchGlossary = useCallback(async () => {
    if (!searchText || searchText.length < 2) {
      setTerms([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const column = sourceLanguage === 'en' ? 'term_en' : 'term_ar'

      const { data, error: fetchError } = await supabase
        .from('translation_glossary')
        .select('*')
        .ilike(column, `%${searchText}%`)
        .order('priority', { ascending: false })
        .limit(10)

      if (fetchError) throw fetchError

      setTerms(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search glossary')
    } finally {
      setIsLoading(false)
    }
  }, [searchText, sourceLanguage])

  useEffect(() => {
    const debounceTimer = setTimeout(searchGlossary, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchGlossary])

  return {
    terms,
    isLoading,
    error,
    refetch: searchGlossary,
  }
}

export default useTranslateContent
