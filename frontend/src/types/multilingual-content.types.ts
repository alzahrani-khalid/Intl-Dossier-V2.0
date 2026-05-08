/**
 * Multi-Language Content System Types
 * Feature: Multi-language content authoring and storage
 *
 * Supports Arabic, English, French, and other diplomatic languages
 * with proper RTL/LTR handling
 */

// ============================================================================
// CONTENT LANGUAGES
// ============================================================================

/**
 * Supported content languages (matches database enum)
 */
export type ContentLanguage =
  | 'ar' // Arabic (RTL)
  | 'en' // English
  | 'fr' // French
  | 'es' // Spanish
  | 'zh' // Chinese
  | 'ru' // Russian
  | 'pt' // Portuguese
  | 'de' // German
  | 'it' // Italian
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'tr' // Turkish
  | 'fa' // Persian/Farsi (RTL)
  | 'ur' // Urdu (RTL)
  | 'hi' // Hindi

/**
 * RTL languages list
 */
export const RTL_LANGUAGES: ContentLanguage[] = ['ar', 'fa', 'ur']

/**
 * UN official languages (commonly used in diplomacy)
 */
export const UN_OFFICIAL_LANGUAGES: ContentLanguage[] = ['ar', 'en', 'fr', 'es', 'zh', 'ru']

/**
 * Check if a language is RTL
 */
export function isRTLLanguage(lang: ContentLanguage): boolean {
  return RTL_LANGUAGES.includes(lang)
}

// ============================================================================
// LANGUAGE METADATA
// ============================================================================

/**
 * Static language metadata for client-side use
 */
export const LANGUAGE_METADATA: Record<
  ContentLanguage,
  {
    name_en: string
    name_native: string
    is_rtl: boolean
    flag_emoji: string
  }
> = {
  ar: { name_en: 'Arabic', name_native: 'العربية', is_rtl: true, flag_emoji: '🇸🇦' },
  en: { name_en: 'English', name_native: 'English', is_rtl: false, flag_emoji: '🇬🇧' },
  fr: { name_en: 'French', name_native: 'Français', is_rtl: false, flag_emoji: '🇫🇷' },
  es: { name_en: 'Spanish', name_native: 'Español', is_rtl: false, flag_emoji: '🇪🇸' },
  zh: { name_en: 'Chinese', name_native: '中文', is_rtl: false, flag_emoji: '🇨🇳' },
  ru: { name_en: 'Russian', name_native: 'Русский', is_rtl: false, flag_emoji: '🇷🇺' },
  pt: { name_en: 'Portuguese', name_native: 'Português', is_rtl: false, flag_emoji: '🇵🇹' },
  de: { name_en: 'German', name_native: 'Deutsch', is_rtl: false, flag_emoji: '🇩🇪' },
  it: { name_en: 'Italian', name_native: 'Italiano', is_rtl: false, flag_emoji: '🇮🇹' },
  ja: { name_en: 'Japanese', name_native: '日本語', is_rtl: false, flag_emoji: '🇯🇵' },
  ko: { name_en: 'Korean', name_native: '한국어', is_rtl: false, flag_emoji: '🇰🇷' },
  tr: { name_en: 'Turkish', name_native: 'Türkçe', is_rtl: false, flag_emoji: '🇹🇷' },
  fa: { name_en: 'Persian', name_native: 'فارسی', is_rtl: true, flag_emoji: '🇮🇷' },
  ur: { name_en: 'Urdu', name_native: 'اردو', is_rtl: true, flag_emoji: '🇵🇰' },
  hi: { name_en: 'Hindi', name_native: 'हिन्दी', is_rtl: false, flag_emoji: '🇮🇳' },
}

// ============================================================================
// ENTITY TYPES
// ============================================================================

/**
 * Entity types that support multi-language content
 */
export type TranslatableEntityType =
  | 'dossier'
  | 'brief'
  | 'position'
  | 'commitment'
  | 'mou'
  | 'calendar_entry'
  | 'document'
  | 'engagement'
  | 'forum'
  | 'working_group'
  | 'intelligence_signal'

/**
 * Content format types
 */
export type ContentFormat = 'plain' | 'html' | 'markdown' | 'json'

/**
 * Translation status
 */
export type TranslationStatus = 'draft' | 'pending_review' | 'approved' | 'published'

// ============================================================================
// ENTITY CONTENT TRANSLATION
// ============================================================================

/**
 * Single translation record
 */
export interface EntityContentTranslation {
  id: string
  entity_type: TranslatableEntityType
  entity_id: string
  field_name: string
  language: ContentLanguage
  content: string
  content_format: ContentFormat
  is_primary: boolean
  is_machine_translated: boolean
  translation_confidence: number | null
  source_language: ContentLanguage | null
  version: number
  status: TranslationStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

/**
 * Entity language settings
 */
export interface EntityLanguageSettings {
  id: string
  entity_type: string
  entity_id: string
  primary_language: ContentLanguage
  available_languages: ContentLanguage[]
  auto_translate: boolean
  auto_translate_to: ContentLanguage[]
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

/**
 * Available language info for an entity
 */
export interface EntityAvailableLanguage {
  language: ContentLanguage
  name_en: string
  name_native: string
  is_rtl: boolean
  is_primary: boolean
  field_count: number
  last_updated: string | null
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// ============================================================================
// HOOK TYPES
// ============================================================================

/**
 * Hook parameters for useMultiLangContent
 */
export interface UseMultiLangContentParams {
  entityType: TranslatableEntityType
  entityId: string
  enabled?: boolean
}

/**
 * Hook return type for useMultiLangContent
 */
export interface UseMultiLangContentReturn {
  // Data
  translations: EntityContentTranslation[]
  availableLanguages: EntityAvailableLanguage[]
  settings: EntityLanguageSettings | null

  // Loading states
  isLoading: boolean
  isUpdating: boolean
  isTranslating: boolean

  // Error
  error: string | null

  // Actions
  getContent: (fieldName: string, language: ContentLanguage) => string | null
  setContent: (fieldName: string, language: ContentLanguage, content: string) => Promise<void>
  translateField: (
    fieldName: string,
    sourceLanguage: ContentLanguage,
    targetLanguage: ContentLanguage,
  ) => Promise<void>
  setPrimaryLanguage: (language: ContentLanguage) => Promise<void>
  addLanguage: (language: ContentLanguage) => Promise<void>
  removeLanguage: (language: ContentLanguage) => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Field configuration for multi-language editor
 */
export interface MultiLangFieldConfig {
  fieldName: string
  labelKey: string
  placeholderKey?: string
  type: 'input' | 'textarea' | 'richtext'
  rows?: number
  required?: boolean
  contentFormat?: ContentFormat
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props for ContentLanguageSelector component
 */
export interface ContentLanguageSelectorProps {
  /** Currently selected language */
  value: ContentLanguage
  /** Callback when language changes */
  onChange: (language: ContentLanguage) => void
  /** Available languages to choose from */
  availableLanguages?: ContentLanguage[]
  /** Show all languages or only available ones */
  showAllLanguages?: boolean
  /** Show language native name */
  showNativeName?: boolean
  /** Show flag emoji */
  showFlag?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Custom class name */
  className?: string
  /** Size variant */
  size?: 'sm' | 'default' | 'lg'
}

/**
 * Props for MultiLanguageContentEditor component
 */
export interface MultiLanguageContentEditorProps {
  /** Entity type being edited */
  entityType: TranslatableEntityType
  /** Entity ID being edited */
  entityId: string
  /** Field configurations */
  fields: MultiLangFieldConfig[]
  /** Default language tab to show */
  defaultLanguage?: ContentLanguage
  /** Callback when content changes */
  onChange?: (fieldName: string, language: ContentLanguage, content: string) => void
  /** Callback when all changes are saved */
  onSave?: () => void
  /** Whether to show translate buttons */
  showTranslateButtons?: boolean
  /** Whether to show language completeness indicator */
  showCompletenessIndicator?: boolean
  /** Whether editor is read-only */
  readOnly?: boolean
  /** Custom class name */
  className?: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Map of field content by language
 */
export type FieldContentByLanguage = Record<ContentLanguage, string | undefined>

/**
 * Translation completeness info
 */
export interface TranslationCompleteness {
  language: ContentLanguage
  totalFields: number
  translatedFields: number
  percentage: number
  missingFields: string[]
}

/**
 * Calculate translation completeness for each language
 */
export function calculateCompleteness(
  translations: EntityContentTranslation[],
  requiredFields: string[],
  languages: ContentLanguage[],
): TranslationCompleteness[] {
  return languages.map((language) => {
    const langTranslations = translations.filter(
      (t) => t.language === language && requiredFields.includes(t.field_name),
    )
    const translatedFieldNames = langTranslations.map((t) => t.field_name)
    const missingFields = requiredFields.filter((f) => !translatedFieldNames.includes(f))

    return {
      language,
      totalFields: requiredFields.length,
      translatedFields: langTranslations.length,
      percentage:
        requiredFields.length > 0
          ? Math.round((langTranslations.length / requiredFields.length) * 100)
          : 100,
      missingFields,
    }
  })
}
