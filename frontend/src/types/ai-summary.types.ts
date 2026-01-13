/**
 * AI Summary Types
 * Feature: ai-summary-generation
 *
 * Type definitions for AI-generated entity summaries
 */

// Supported entity types for summary generation
export type SummaryEntityType =
  | 'dossier'
  | 'country'
  | 'organization'
  | 'forum'
  | 'person'
  | 'engagement'
  | 'theme'

// Summary length options
export type SummaryLength = 'brief' | 'standard' | 'detailed'

// Focus areas for customization
export type SummaryFocusArea = 'activity' | 'relationships' | 'commitments' | 'strategic' | 'all'

// Importance levels for sections
export type SectionImportance = 'high' | 'medium' | 'low'

// Summary section structure
export interface SummarySection {
  title: string
  content: string
  importance: SectionImportance
}

// Summary metadata
export interface SummaryMetadata {
  entity_type: SummaryEntityType
  entity_id: string
  generated_at: string
  data_points_analyzed: number
  confidence_score: number
}

// Summary content structure (for one language)
export interface SummaryContent {
  executive_summary: string
  key_highlights: string[]
  sections: SummarySection[]
  metadata: SummaryMetadata
}

// Full bilingual summary response
export interface AISummary {
  id: string
  en: SummaryContent
  ar: SummaryContent
}

// Request parameters for generating a summary
export interface GenerateSummaryParams {
  entityType: SummaryEntityType
  entityId: string
  length?: SummaryLength
  focusAreas?: SummaryFocusArea[]
  dateRangeStart?: string
  dateRangeEnd?: string
  language?: 'en' | 'ar'
}

// API request body format (snake_case for backend)
export interface GenerateSummaryRequest {
  entity_type: SummaryEntityType
  entity_id: string
  length?: SummaryLength
  focus_areas?: SummaryFocusArea[]
  date_range_start?: string
  date_range_end?: string
  language?: 'en' | 'ar'
}

// Fallback summary response when AI is unavailable
export interface SummaryFallbackResponse {
  error: {
    code: string
    message_en: string
    message_ar: string
  }
  fallback: AISummary
}

// Database record structure
export interface AISummaryRecord {
  id: string
  entity_type: SummaryEntityType
  entity_id: string
  content_en: SummaryContent
  content_ar: SummaryContent
  length: SummaryLength
  focus_areas: SummaryFocusArea[]
  date_range_start: string | null
  date_range_end: string | null
  generated_by_user_id: string
  data_points_analyzed: number
  confidence_score: number
  created_at: string
  updated_at: string
  archived: boolean
}

// Hook return type
export interface UseAISummaryReturn {
  generate: (params: GenerateSummaryParams) => Promise<void>
  summary: AISummary | null
  isGenerating: boolean
  progress: number
  error: string | null
  retry: () => void
  reset: () => void
}

// Summary history item for listing
export interface SummaryHistoryItem {
  id: string
  entity_type: SummaryEntityType
  entity_id: string
  length: SummaryLength
  confidence_score: number
  created_at: string
  // Preview fields
  executive_summary_preview: string
  highlights_count: number
}

// Length configuration for UI
export const SUMMARY_LENGTH_CONFIG: Record<
  SummaryLength,
  { labelKey: string; words: number; sections: number }
> = {
  brief: { labelKey: 'summary.length.brief', words: 150, sections: 2 },
  standard: { labelKey: 'summary.length.standard', words: 300, sections: 4 },
  detailed: { labelKey: 'summary.length.detailed', words: 500, sections: 6 },
}

// Focus area configuration for UI
export const FOCUS_AREA_CONFIG: Record<SummaryFocusArea, { labelKey: string; icon: string }> = {
  all: { labelKey: 'summary.focus.all', icon: 'Grid3X3' },
  activity: { labelKey: 'summary.focus.activity', icon: 'Activity' },
  relationships: { labelKey: 'summary.focus.relationships', icon: 'Users' },
  commitments: { labelKey: 'summary.focus.commitments', icon: 'CheckSquare' },
  strategic: { labelKey: 'summary.focus.strategic', icon: 'Target' },
}

// Entity type configuration for UI
export const ENTITY_TYPE_CONFIG: Record<SummaryEntityType, { labelKey: string; icon: string }> = {
  dossier: { labelKey: 'entity.dossier', icon: 'FileText' },
  country: { labelKey: 'entity.country', icon: 'Globe' },
  organization: { labelKey: 'entity.organization', icon: 'Building' },
  forum: { labelKey: 'entity.forum', icon: 'MessageSquare' },
  person: { labelKey: 'entity.person', icon: 'User' },
  engagement: { labelKey: 'entity.engagement', icon: 'Calendar' },
  theme: { labelKey: 'entity.theme', icon: 'Tag' },
}
