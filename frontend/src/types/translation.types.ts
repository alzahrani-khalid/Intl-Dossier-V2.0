/**
 * Translation Service Types
 * Feature: translation-service
 *
 * Type definitions for automatic Arabic/English translation
 */

// Supported translation directions
export type TranslationDirection = 'en_to_ar' | 'ar_to_en' | 'auto'

// Supported languages
export type TranslationLanguage = 'en' | 'ar'

// Content types that can be translated
export type TranslatableContentType =
  | 'title'
  | 'description'
  | 'summary'
  | 'content'
  | 'comment'
  | 'position'
  | 'commitment'
  | 'document'
  | 'general'

// Request parameters for translating content
export interface TranslateRequest {
  text: string
  direction?: TranslationDirection
  content_type?: TranslatableContentType
  preserve_formatting?: boolean
  entity_type?: string
  entity_id?: string
  field_name?: string
}

// Response from translation API
export interface TranslateResponse {
  original_text: string
  translated_text: string
  source_language: TranslationLanguage
  target_language: TranslationLanguage
  confidence: number
  content_type: TranslatableContentType
  metadata: {
    translation_id: string
    translated_at: string
    model_used: string
    char_count: number
    latency_ms: number
  }
}

// Batch translation item
export interface BatchTranslateItem {
  id: string
  text: string
  field_name?: string
}

// Batch translation request
export interface BatchTranslateRequest {
  items: BatchTranslateItem[]
  direction?: TranslationDirection
  content_type?: TranslatableContentType
  entity_type?: string
  entity_id?: string
}

// Batch translation result item
export interface BatchTranslationResult {
  id: string
  original_text: string
  translated_text: string
  confidence: number
}

// Batch translation response
export interface BatchTranslateResponse {
  translations: BatchTranslationResult[]
  source_language: TranslationLanguage
  target_language: TranslationLanguage
  metadata: {
    batch_id: string
    translated_at: string
    total_items: number
    total_chars: number
    latency_ms: number
  }
}

// Translation history item from database
export interface TranslationHistoryItem {
  id: string
  entity_type: string
  entity_id: string
  field_name: string
  source_language: TranslationLanguage
  target_language: TranslationLanguage
  original_text: string
  translated_text: string
  edited_text: string | null
  confidence: number
  approved: boolean
  created_at: string
  translated_by_user_id: string
}

// User translation preferences
export interface TranslationPreferences {
  id: string
  user_id: string
  auto_translate: boolean
  preferred_source_language: TranslationLanguage | null
  show_confidence_indicators: boolean
  save_translation_history: boolean
  created_at: string
  updated_at: string
}

// Glossary term
export interface GlossaryTerm {
  id: string
  term_en: string
  term_ar: string
  category: string
  context: string | null
  is_proper_noun: boolean
  priority: number
}

// Hook parameters for single translation
export interface UseTranslateContentParams {
  text: string
  direction?: TranslationDirection
  contentType?: TranslatableContentType
  preserveFormatting?: boolean
  entityType?: string
  entityId?: string
  fieldName?: string
}

// Hook return type for single translation
export interface UseTranslateContentReturn {
  translate: (params?: Partial<UseTranslateContentParams>) => Promise<TranslateResponse | null>
  translatedText: string | null
  isTranslating: boolean
  progress: number
  error: string | null
  confidence: number | null
  sourceLanguage: TranslationLanguage | null
  targetLanguage: TranslationLanguage | null
  reset: () => void
}

// Hook parameters for batch translation
export interface UseBatchTranslateParams {
  items: BatchTranslateItem[]
  direction?: TranslationDirection
  contentType?: TranslatableContentType
  entityType?: string
  entityId?: string
}

// Hook return type for batch translation
export interface UseBatchTranslateReturn {
  translate: (params?: Partial<UseBatchTranslateParams>) => Promise<BatchTranslateResponse | null>
  results: BatchTranslationResult[]
  isTranslating: boolean
  progress: number
  error: string | null
  reset: () => void
}

// Translation button props
export interface TranslateButtonProps {
  /** The text to translate */
  sourceText: string
  /** Callback when translation completes */
  onTranslate: (translatedText: string) => void
  /** The direction of translation */
  direction?: TranslationDirection
  /** Content type for context-aware translation */
  contentType?: TranslatableContentType
  /** Whether to preserve formatting */
  preserveFormatting?: boolean
  /** Entity type for history tracking */
  entityType?: string
  /** Entity ID for history tracking */
  entityId?: string
  /** Field name for history tracking */
  fieldName?: string
  /** Disable the button */
  disabled?: boolean
  /** Custom class name */
  className?: string
  /** Size variant */
  size?: 'sm' | 'default' | 'lg'
  /** Show confidence indicator after translation */
  showConfidence?: boolean
}

// Bilingual field with translation support
export interface BilingualFieldProps {
  /** English value */
  valueEn: string
  /** Arabic value */
  valueAr: string
  /** Callback when English value changes */
  onChangeEn: (value: string) => void
  /** Callback when Arabic value changes */
  onChangeAr: (value: string) => void
  /** Label key for i18n */
  labelKey: string
  /** Field type: input or textarea */
  fieldType?: 'input' | 'textarea'
  /** Number of rows for textarea */
  rows?: number
  /** Placeholder key for i18n */
  placeholderKey?: string
  /** Whether the field is required */
  required?: boolean
  /** Whether the field is disabled */
  disabled?: boolean
  /** Content type for context-aware translation */
  contentType?: TranslatableContentType
  /** Entity type for history tracking */
  entityType?: string
  /** Entity ID for history tracking */
  entityId?: string
  /** Whether to show inline translate buttons */
  showTranslateButtons?: boolean
}

// Confidence level thresholds
export const CONFIDENCE_LEVELS = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.5,
} as const

// Get confidence level label key
export function getConfidenceLevelKey(confidence: number): string {
  if (confidence >= CONFIDENCE_LEVELS.HIGH) {
    return 'translation.confidence.high'
  }
  if (confidence >= CONFIDENCE_LEVELS.MEDIUM) {
    return 'translation.confidence.medium'
  }
  if (confidence >= CONFIDENCE_LEVELS.LOW) {
    return 'translation.confidence.low'
  }
  return 'translation.confidence.pending'
}

// Get confidence level color class
export function getConfidenceColorClass(confidence: number): string {
  if (confidence >= CONFIDENCE_LEVELS.HIGH) {
    return 'text-green-600 dark:text-green-400'
  }
  if (confidence >= CONFIDENCE_LEVELS.MEDIUM) {
    return 'text-yellow-600 dark:text-yellow-400'
  }
  if (confidence >= CONFIDENCE_LEVELS.LOW) {
    return 'text-orange-600 dark:text-orange-400'
  }
  return 'text-muted-foreground'
}

// Content type configuration for UI
export const CONTENT_TYPE_CONFIG: Record<
  TranslatableContentType,
  { labelKey: string; icon: string }
> = {
  title: { labelKey: 'translation.contentType.title', icon: 'Heading' },
  description: { labelKey: 'translation.contentType.description', icon: 'FileText' },
  summary: { labelKey: 'translation.contentType.summary', icon: 'AlignLeft' },
  content: { labelKey: 'translation.contentType.content', icon: 'FileText' },
  comment: { labelKey: 'translation.contentType.comment', icon: 'MessageSquare' },
  position: { labelKey: 'translation.contentType.position', icon: 'Target' },
  commitment: { labelKey: 'translation.contentType.commitment', icon: 'CheckSquare' },
  document: { labelKey: 'translation.contentType.document', icon: 'File' },
  general: { labelKey: 'translation.contentType.general', icon: 'Globe' },
}
