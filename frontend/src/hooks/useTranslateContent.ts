/**
 * Translation Service Hooks
 * @module hooks/useTranslateContent
 * @feature translation-service
 *
 * Hooks for AI-powered translation between Arabic and English with progress tracking,
 * batch operations, history management, and glossary integration.
 *
 * @description
 * This module provides a comprehensive set of React hooks for content translation:
 * - Single text translation with progress tracking and confidence scores
 * - Batch translation for multiple text items
 * - Translation history retrieval for entities
 * - User translation preferences management
 * - Translation glossary search with term suggestions
 * - Language detection utilities
 * - Cancelable translation operations
 *
 * @example
 * // Basic translation
 * const { translate, translatedText, isTranslating } = useTranslateContent();
 * await translate({ text: 'Hello', direction: 'en-to-ar' });
 *
 * @example
 * // Batch translation
 * const { translate, results } = useBatchTranslateContent();
 * await translate({
 *   items: [
 *     { id: '1', text: 'Hello', field_name: 'title' },
 *     { id: '2', text: 'World', field_name: 'description' },
 *   ],
 *   direction: 'en-to-ar',
 * });
 *
 * @example
 * // Translation history
 * const { history, isLoading } = useTranslationHistory('dossier', 'uuid');
 * // Returns list of previous translations for this entity
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
 * Detect language of text using Unicode range analysis
 *
 * @description
 * Client-side language detection based on Arabic Unicode character ranges.
 * Performs a quick check without API calls. Text is considered Arabic if more
 * than 30% of non-whitespace characters are in Arabic Unicode ranges.
 *
 * @param text - The text to analyze
 * @returns Detected language code ('ar' or 'en')
 *
 * @example
 * // Detect Arabic text
 * detectLanguage('مرحبا بك'); // Returns 'ar'
 *
 * @example
 * // Detect English text
 * detectLanguage('Hello world'); // Returns 'en'
 *
 * @example
 * // Mixed text defaults to language with higher percentage
 * detectLanguage('Hello مرحبا'); // Returns based on character count
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
 * Get the opposite translation language
 *
 * @description
 * Utility function to get the target language for translation.
 * Maps English to Arabic and vice versa.
 *
 * @param lang - The source language code
 * @returns The opposite language code
 *
 * @example
 * getOppositeLanguage('en'); // Returns 'ar'
 * getOppositeLanguage('ar'); // Returns 'en'
 */
export function getOppositeLanguage(lang: TranslationLanguage): TranslationLanguage {
  return lang === 'en' ? 'ar' : 'en'
}

/**
 * Hook for AI-powered single text translation with progress tracking
 *
 * @description
 * Provides stateful translation functionality with:
 * - Real-time progress updates during translation (0-100%)
 * - Confidence score from translation model
 * - Source and target language detection
 * - Cancelable operations via AbortController
 * - Error handling with specific error codes
 * - Automatic cleanup on unmount
 * - Support for formatting preservation and content type hints
 *
 * @param initialParams - Optional initial parameters for translation
 * @returns Object with translate function, result state, and control methods
 *
 * @example
 * // Basic translation with progress
 * const { translate, translatedText, progress, isTranslating } = useTranslateContent();
 * await translate({
 *   text: 'Hello World',
 *   direction: 'en-to-ar',
 * });
 * console.log(translatedText); // "مرحبا بالعالم"
 * console.log(progress); // 100
 *
 * @example
 * // Translation with entity context for better accuracy
 * const { translate, confidence } = useTranslateContent({
 *   entityType: 'dossier',
 *   entityId: 'country-uuid',
 * });
 * await translate({
 *   text: 'Kingdom of Saudi Arabia',
 *   direction: 'en-to-ar',
 *   fieldName: 'official_name',
 * });
 * console.log(confidence); // 0.95 (95% confidence)
 *
 * @example
 * // Preserve formatting in translation
 * const { translate } = useTranslateContent();
 * await translate({
 *   text: '**Bold** and *italic* text',
 *   direction: 'en-to-ar',
 *   contentType: 'markdown',
 *   preserveFormatting: true,
 * });
 *
 * @example
 * // Reset translation state
 * const { translate, translatedText, reset } = useTranslateContent();
 * await translate({ text: 'Hello', direction: 'en-to-ar' });
 * // Later...
 * reset(); // Clears translatedText and resets state
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
 * Hook for batch translating multiple text items simultaneously
 *
 * @description
 * Provides batch translation functionality for translating multiple text items
 * in a single API call. Useful for translating forms, documents, or bulk content
 * with progress tracking and individual result status.
 *
 * @param initialParams - Optional initial parameters for batch translation
 * @returns Object with translate function, results array, and state
 *
 * @example
 * // Batch translate form fields
 * const { translate, results, isTranslating } = useBatchTranslateContent();
 * await translate({
 *   items: [
 *     { id: 'title', text: 'Title', field_name: 'title' },
 *     { id: 'desc', text: 'Description', field_name: 'description' },
 *     { id: 'notes', text: 'Notes', field_name: 'notes' },
 *   ],
 *   direction: 'en-to-ar',
 *   contentType: 'plain',
 * });
 * console.log(results); // Array of { id, translated_text, confidence, ... }
 *
 * @example
 * // Batch translate with entity context
 * const { translate } = useBatchTranslateContent({
 *   entityType: 'engagement',
 *   entityId: 'meeting-uuid',
 * });
 * await translate({
 *   items: [
 *     { id: '1', text: 'Agenda', field_name: 'agenda' },
 *     { id: '2', text: 'Minutes', field_name: 'minutes' },
 *   ],
 *   direction: 'en-to-ar',
 * });
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
 * Hook for fetching translation history for a specific entity
 *
 * @description
 * Retrieves the translation history for an entity, showing all past translations
 * with timestamps, users, source/target languages, and confidence scores.
 * Automatically refetches when entity changes.
 *
 * @param entityType - Type of entity ('dossier', 'engagement', 'position', etc.)
 * @param entityId - Unique identifier of the entity
 * @returns Object with history array, loading state, error, and refetch function
 *
 * @example
 * // Display translation history for a dossier
 * const { history, isLoading, error } = useTranslationHistory('dossier', dossierId);
 * {history.map(item => (
 *   <div key={item.id}>
 *     {item.field_name}: {item.source_language} → {item.target_language}
 *     (Confidence: {item.confidence})
 *   </div>
 * ))}
 *
 * @example
 * // Show recent translations in sidebar
 * const { history } = useTranslationHistory('engagement', engagementId);
 * const recentTranslations = history.slice(0, 5); // Latest 5
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
 * Hook for managing user-specific translation preferences
 *
 * @description
 * Manages translation preferences for the authenticated user including default
 * languages, translation quality settings, and auto-translate options.
 * Automatically loads preferences on mount and provides update functionality.
 *
 * @returns Object with preferences data, loading state, update function, and refetch
 *
 * @example
 * // Load and display user preferences
 * const { preferences, isLoading } = useTranslationPreferences();
 * console.log(preferences?.default_source_language); // 'en'
 * console.log(preferences?.auto_translate_on_save); // true/false
 *
 * @example
 * // Update user preferences
 * const { updatePreferences } = useTranslationPreferences();
 * await updatePreferences({
 *   default_source_language: 'ar',
 *   default_target_language: 'en',
 *   auto_translate_on_save: true,
 * });
 *
 * @example
 * // Use preferences to set translation defaults
 * const { preferences } = useTranslationPreferences();
 * const { translate } = useTranslateContent({
 *   direction: preferences?.default_source_language === 'ar' ? 'ar-to-en' : 'en-to-ar',
 * });
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
 * Hook for searching the translation glossary with debouncing
 *
 * @description
 * Searches the translation glossary for term suggestions based on input text.
 * Results are debounced (300ms) to avoid excessive queries. Returns prioritized
 * terms with translations, context, and usage examples.
 *
 * @param searchText - Text to search for in glossary (minimum 2 characters)
 * @param sourceLanguage - Language to search in ('en' or 'ar', default: 'en')
 * @returns Object with terms array, loading state, error, and refetch function
 *
 * @example
 * // Search glossary for translation suggestions
 * const [search, setSearch] = useState('diplomacy');
 * const { terms, isLoading } = useTranslationGlossary(search, 'en');
 * // Returns: [{ term_en: 'diplomacy', term_ar: 'الدبلوماسية', priority: 10, ... }]
 *
 * @example
 * // Use in autocomplete for translation assistance
 * const { terms } = useTranslationGlossary(inputValue, 'en');
 * <Autocomplete
 *   options={terms}
 *   getOptionLabel={(term) => `${term.term_en} → ${term.term_ar}`}
 * />
 *
 * @example
 * // Search Arabic terms
 * const { terms } = useTranslationGlossary('دبلوماسي', 'ar');
 * console.log(terms[0].term_en); // 'diplomatic'
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
