/**
 * Multi-Language Content Hooks
 * @module hooks/useMultiLangContent
 * @feature multilingual-content
 *
 * TanStack Query hooks for managing multi-language content with automatic caching,
 * AI-powered translation, and language settings for translatable entities.
 *
 * @description
 * This module provides a comprehensive set of React hooks for multi-language content management:
 * - Query hooks for fetching translations, available languages, and language settings
 * - Mutation hooks for upserting translations with machine translation tracking
 * - AI-powered field translation between supported languages
 * - Language management (add/remove languages, set primary language)
 * - Localized content retrieval with fallback support
 * - Bulk translation operations for multiple fields
 *
 * @example
 * // Basic usage - manage entity translations
 * const { translations, getContent, setContent } = useMultiLangContent({
 *   entityType: 'dossier',
 *   entityId: 'uuid-here',
 * });
 *
 * @example
 * // Translate a field using AI
 * const { translateField, isTranslating } = useMultiLangContent({
 *   entityType: 'dossier',
 *   entityId: 'uuid-here',
 * });
 * await translateField('description', 'en', 'ar');
 *
 * @example
 * // Get localized content with fallback
 * const { data } = useLocalizedContent('dossier', 'uuid', 'name', 'ar', 'en');
 * // Returns Arabic content or falls back to English
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  ContentLanguage,
  TranslatableEntityType,
  EntityContentTranslation,
  EntityAvailableLanguage,
  EntityLanguageSettings,
  UseMultiLangContentParams,
  UseMultiLangContentReturn,
  ContentFormat,
  TranslationStatus,
} from '@/types/multilingual-content.types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Query Keys Factory for multi-language content queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation for translations,
 * language settings, and supported languages.
 *
 * @example
 * // Invalidate all multilang queries
 * queryClient.invalidateQueries({ queryKey: multiLangContentKeys.all });
 *
 * @example
 * // Invalidate entity-specific translations
 * queryClient.invalidateQueries({
 *   queryKey: multiLangContentKeys.entity('dossier', 'uuid-123')
 * });
 *
 * @example
 * // Invalidate supported languages cache
 * queryClient.invalidateQueries({ queryKey: multiLangContentKeys.languages() });
 */
export const multiLangContentKeys = {
  all: ['multilang-content'] as const,
  entity: (entityType: TranslatableEntityType, entityId: string) =>
    [...multiLangContentKeys.all, entityType, entityId] as const,
  languages: () => [...multiLangContentKeys.all, 'supported-languages'] as const,
}

/**
 * Hook to fetch supported languages from the database
 *
 * @description
 * Fetches all enabled languages with display metadata including name, native name,
 * RTL direction, and flag emoji. Results are cached for 1 hour as language configuration
 * changes infrequently.
 *
 * @returns TanStack Query result with array of supported language objects
 *
 * @example
 * // Fetch supported languages for language selector
 * const { data: languages, isLoading } = useSupportedLanguages();
 * // data: [{ code: 'en', name_en: 'English', name_native: 'English', is_rtl: false, ... }]
 *
 * @example
 * // Use in dropdown component
 * const { data: languages } = useSupportedLanguages();
 * languages?.map(lang => (
 *   <option key={lang.code} value={lang.code}>
 *     {lang.flag_emoji} {lang.name_native}
 *   </option>
 * ));
 */
export function useSupportedLanguages() {
  return useQuery({
    queryKey: multiLangContentKeys.languages(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supported_languages')
        .select('*')
        .eq('is_enabled', true)
        .order('display_order')

      if (error) throw error
      return data as Array<{
        code: ContentLanguage
        name_en: string
        name_native: string
        is_rtl: boolean
        is_enabled: boolean
        display_order: number
        flag_emoji: string | null
      }>
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

/**
 * Hook for comprehensive multi-language content management
 *
 * @description
 * Main hook providing complete multi-language content lifecycle management including:
 * - Fetching translations, available languages, and settings for an entity
 * - Getting and setting content for specific field-language combinations
 * - AI-powered translation between languages via Edge Function
 * - Language management (add/remove languages, set primary)
 * - Automatic cache invalidation on mutations
 * - Error handling and loading states
 *
 * @param params - Configuration object
 * @param params.entityType - Type of entity ('dossier', 'engagement', 'position', etc.)
 * @param params.entityId - Unique identifier of the entity
 * @param params.enabled - Whether to enable queries (default: true)
 * @returns Object with translations data, methods, and state flags
 *
 * @example
 * // Basic usage - fetch and display translations
 * const { translations, isLoading, getContent } = useMultiLangContent({
 *   entityType: 'dossier',
 *   entityId: 'country-uuid',
 * });
 * const arabicName = getContent('name', 'ar');
 *
 * @example
 * // Set content for a field
 * const { setContent, isUpdating } = useMultiLangContent({
 *   entityType: 'dossier',
 *   entityId: 'country-uuid',
 * });
 * await setContent('description', 'ar', 'وصف جديد');
 *
 * @example
 * // AI translation between languages
 * const { translateField, isTranslating } = useMultiLangContent({
 *   entityType: 'engagement',
 *   entityId: 'meeting-uuid',
 * });
 * await translateField('notes', 'en', 'ar'); // Translate English to Arabic
 *
 * @example
 * // Language management
 * const { addLanguage, setPrimaryLanguage } = useMultiLangContent({
 *   entityType: 'dossier',
 *   entityId: 'uuid',
 * });
 * await addLanguage('fr');
 * await setPrimaryLanguage('ar');
 */
export function useMultiLangContent({
  entityType,
  entityId,
  enabled = true,
}: UseMultiLangContentParams): UseMultiLangContentReturn {
  const queryClient = useQueryClient()
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch translations for the entity
  const translationsQuery = useQuery({
    queryKey: multiLangContentKeys.entity(entityType, entityId),
    queryFn: async () => {
      // Get translations
      const { data: translations, error: translationsError } = await supabase.rpc(
        'get_multilang_translations',
        {
          p_entity_type: entityType,
          p_entity_id: entityId,
        },
      )

      if (translationsError) throw translationsError

      // Get available languages
      const { data: availableLanguages, error: langError } = await supabase.rpc(
        'get_multilang_available_languages',
        {
          p_entity_type: entityType,
          p_entity_id: entityId,
        },
      )

      if (langError) throw langError

      // Get language settings
      const { data: settings, error: settingsError } = await supabase
        .from('entity_language_settings')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .maybeSingle()

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError

      return {
        translations: (translations || []) as EntityContentTranslation[],
        availableLanguages: (availableLanguages || []) as EntityAvailableLanguage[],
        settings: settings as EntityLanguageSettings | null,
      }
    },
    enabled: enabled && !!entityId,
  })

  // Mutation for upserting translations
  const upsertMutation = useMutation({
    mutationFn: async ({
      fieldName,
      language,
      content,
      contentFormat = 'plain',
      isPrimary = false,
      isMachineTranslated = false,
      translationConfidence,
      sourceLanguage,
      status = 'draft',
    }: {
      fieldName: string
      language: ContentLanguage
      content: string
      contentFormat?: ContentFormat
      isPrimary?: boolean
      isMachineTranslated?: boolean
      translationConfidence?: number
      sourceLanguage?: ContentLanguage
      status?: TranslationStatus
    }) => {
      const { data, error } = await supabase.rpc('upsert_multilang_translation', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_field_name: fieldName,
        p_language: language,
        p_content: content,
        p_content_format: contentFormat,
        p_is_primary: isPrimary,
        p_is_machine_translated: isMachineTranslated,
        p_translation_confidence: translationConfidence || null,
        p_source_language: sourceLanguage || null,
        p_status: status,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: multiLangContentKeys.entity(entityType, entityId),
      })
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to save translation')
    },
  })

  // Get content for a specific field and language
  const getContent = useCallback(
    (fieldName: string, language: ContentLanguage): string | null => {
      const translation = translationsQuery.data?.translations.find(
        (t) => t.field_name === fieldName && t.language === language,
      )
      return translation?.content || null
    },
    [translationsQuery.data?.translations],
  )

  // Set content for a specific field and language
  const setContent = useCallback(
    async (fieldName: string, language: ContentLanguage, content: string): Promise<void> => {
      await upsertMutation.mutateAsync({
        fieldName,
        language,
        content,
      })
    },
    [upsertMutation],
  )

  // Translate a field from one language to another
  const translateField = useCallback(
    async (
      fieldName: string,
      sourceLanguage: ContentLanguage,
      targetLanguage: ContentLanguage,
    ): Promise<void> => {
      const sourceContent = getContent(fieldName, sourceLanguage)
      if (!sourceContent) {
        setError(`No content found for ${fieldName} in ${sourceLanguage}`)
        return
      }

      setIsTranslating(true)
      setError(null)

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) {
          throw new Error('Not authenticated')
        }

        // Call translation edge function
        const response = await fetch(`${SUPABASE_URL}/functions/v1/multilang-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'translate',
            entity_type: entityType,
            entity_id: entityId,
            field_name: fieldName,
            source_language: sourceLanguage,
            target_language: targetLanguage,
            content: sourceContent,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message || 'Translation failed')
        }

        const result = await response.json()

        // Save the translated content
        await upsertMutation.mutateAsync({
          fieldName,
          language: targetLanguage,
          content: result.translated_content,
          isMachineTranslated: true,
          translationConfidence: result.confidence,
          sourceLanguage,
          status: 'draft',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Translation failed')
        throw err
      } finally {
        setIsTranslating(false)
      }
    },
    [entityType, entityId, getContent, upsertMutation],
  )

  // Set primary language for the entity
  const setPrimaryLanguage = useCallback(
    async (language: ContentLanguage): Promise<void> => {
      const { error } = await supabase
        .from('entity_language_settings')
        .upsert({
          entity_type: entityType,
          entity_id: entityId,
          primary_language: language,
        })
        .select()

      if (error) {
        setError(error.message)
        throw error
      }

      queryClient.invalidateQueries({
        queryKey: multiLangContentKeys.entity(entityType, entityId),
      })
    },
    [entityType, entityId, queryClient],
  )

  // Add a new language to the entity
  const addLanguage = useCallback(
    async (language: ContentLanguage): Promise<void> => {
      const currentSettings = translationsQuery.data?.settings
      const currentLanguages = currentSettings?.available_languages || []

      if (currentLanguages.includes(language)) {
        return // Already exists
      }

      const { error } = await supabase
        .from('entity_language_settings')
        .upsert({
          entity_type: entityType,
          entity_id: entityId,
          available_languages: [...currentLanguages, language],
          primary_language: currentSettings?.primary_language || language,
        })
        .select()

      if (error) {
        setError(error.message)
        throw error
      }

      queryClient.invalidateQueries({
        queryKey: multiLangContentKeys.entity(entityType, entityId),
      })
    },
    [entityType, entityId, translationsQuery.data?.settings, queryClient],
  )

  // Remove a language from the entity
  const removeLanguage = useCallback(
    async (language: ContentLanguage): Promise<void> => {
      const currentSettings = translationsQuery.data?.settings
      const currentLanguages = currentSettings?.available_languages || []

      // Don't remove primary language
      if (currentSettings?.primary_language === language) {
        setError('Cannot remove primary language')
        return
      }

      const newLanguages = currentLanguages.filter((l) => l !== language)

      // Delete translations for this language
      const { error: deleteError } = await supabase
        .from('entity_content_translations')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('language', language)

      if (deleteError) {
        setError(deleteError.message)
        throw deleteError
      }

      // Update settings
      const { error: updateError } = await supabase
        .from('entity_language_settings')
        .update({ available_languages: newLanguages })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (updateError) {
        setError(updateError.message)
        throw updateError
      }

      queryClient.invalidateQueries({
        queryKey: multiLangContentKeys.entity(entityType, entityId),
      })
    },
    [entityType, entityId, translationsQuery.data?.settings, queryClient],
  )

  // Refetch data
  const refetch = useCallback(async (): Promise<void> => {
    await translationsQuery.refetch()
  }, [translationsQuery])

  // Clear error when entity changes
  useEffect(() => {
    setError(null)
  }, [entityType, entityId])

  return {
    translations: translationsQuery.data?.translations || [],
    availableLanguages: translationsQuery.data?.availableLanguages || [],
    settings: translationsQuery.data?.settings || null,
    isLoading: translationsQuery.isLoading,
    isUpdating: upsertMutation.isPending,
    isTranslating,
    error:
      error || (translationsQuery.error instanceof Error ? translationsQuery.error.message : null),
    getContent,
    setContent,
    translateField,
    setPrimaryLanguage,
    addLanguage,
    removeLanguage,
    refetch,
  }
}

/**
 * Hook for getting localized content with automatic fallback
 *
 * @description
 * Fetches content for a specific field in the current UI language with automatic
 * fallback to a secondary language if translation is not available. Returns metadata
 * about the translation including whether fallback was used and machine translation status.
 *
 * @param entityType - Type of entity ('dossier', 'engagement', 'position', etc.)
 * @param entityId - Unique identifier of the entity
 * @param fieldName - Name of the field to retrieve ('name', 'description', etc.)
 * @param currentLanguage - Preferred language code (default: 'en')
 * @param fallbackLanguage - Fallback language if preferred not available (default: 'en')
 * @returns TanStack Query result with localized content and metadata
 *
 * @example
 * // Get Arabic content with English fallback
 * const { data } = useLocalizedContent('dossier', 'uuid', 'name', 'ar', 'en');
 * console.log(data?.content); // "اسم" or "Name" if Arabic unavailable
 * console.log(data?.is_fallback); // true if English was used
 *
 * @example
 * // Use in component with i18n
 * const { i18n } = useTranslation();
 * const { data: localizedName } = useLocalizedContent(
 *   'dossier',
 *   dossierId,
 *   'name',
 *   i18n.language as ContentLanguage,
 *   'en'
 * );
 *
 * @example
 * // Display machine translation warning
 * const { data } = useLocalizedContent('dossier', 'uuid', 'description', 'ar');
 * {data?.is_machine_translated && (
 *   <Badge>Machine Translated (confidence: {data.translation_confidence})</Badge>
 * )}
 */
export function useLocalizedContent(
  entityType: TranslatableEntityType,
  entityId: string,
  fieldName: string,
  currentLanguage: ContentLanguage = 'en',
  fallbackLanguage: ContentLanguage = 'en',
) {
  return useQuery({
    queryKey: [...multiLangContentKeys.entity(entityType, entityId), fieldName, currentLanguage],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_multilang_content', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_field_name: fieldName,
        p_language: currentLanguage,
        p_fallback_language: fallbackLanguage,
      })

      if (error) throw error

      return data?.[0] as {
        content: string
        language: ContentLanguage
        is_fallback: boolean
        is_machine_translated: boolean
        translation_confidence: number | null
      } | null
    },
    enabled: !!entityId,
  })
}

/**
 * Hook for bulk saving multiple translations in a single operation
 *
 * @description
 * Creates a mutation for saving multiple field-language translations simultaneously.
 * Useful for bulk import, form submission with multiple languages, or batch updates.
 * Automatically invalidates cache on success.
 *
 * @returns TanStack Mutation result with mutate function accepting bulk translation data
 *
 * @example
 * // Save multiple translations at once
 * const { mutateAsync: bulkSave } = useBulkSaveTranslations();
 * await bulkSave({
 *   entityType: 'dossier',
 *   entityId: 'uuid',
 *   translations: [
 *     { fieldName: 'name', language: 'en', content: 'Saudi Arabia' },
 *     { fieldName: 'name', language: 'ar', content: 'المملكة العربية السعودية' },
 *     { fieldName: 'description', language: 'en', content: 'Country description' },
 *     { fieldName: 'description', language: 'ar', content: 'وصف الدولة' },
 *   ],
 * });
 *
 * @example
 * // Import translations from CSV
 * const { mutateAsync: bulkSave } = useBulkSaveTranslations();
 * const translations = csvData.map(row => ({
 *   fieldName: row.field,
 *   language: row.lang as ContentLanguage,
 *   content: row.value,
 * }));
 * await bulkSave({ entityType: 'dossier', entityId: id, translations });
 */
export function useBulkSaveTranslations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      translations,
    }: {
      entityType: TranslatableEntityType
      entityId: string
      translations: Array<{
        fieldName: string
        language: ContentLanguage
        content: string
        contentFormat?: ContentFormat
        isPrimary?: boolean
      }>
    }) => {
      const results = await Promise.all(
        translations.map(async (t) => {
          const { data, error } = await supabase.rpc('upsert_multilang_translation', {
            p_entity_type: entityType,
            p_entity_id: entityId,
            p_field_name: t.fieldName,
            p_language: t.language,
            p_content: t.content,
            p_content_format: t.contentFormat || 'plain',
            p_is_primary: t.isPrimary || false,
            p_is_machine_translated: false,
            p_translation_confidence: null,
            p_source_language: null,
            p_status: 'published',
          })

          if (error) throw error
          return data
        }),
      )

      return results
    },
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({
        queryKey: multiLangContentKeys.entity(entityType, entityId),
      })
    },
  })
}

export default useMultiLangContent
