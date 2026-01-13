/**
 * Enhanced Search Types
 * Feature: Enhanced search with real-time suggestions, fuzzy matching, search history
 * Description: Type definitions for intelligent search with suggestions and adaptive filters
 */

// =============================================================================
// Search Suggestions Types
// =============================================================================

export type SuggestionType = 'title' | 'tag' | 'keyword' | 'name' | 'topic' | 'popular' | 'history'

export interface SearchSuggestion {
  suggestion: string
  suggestion_ar: string | null
  suggestion_type: SuggestionType
  entity_type: string
  similarity_score: number
  frequency: number
}

export interface CategorizedSuggestions {
  titles: SearchSuggestion[]
  tags: SearchSuggestion[]
  popular: SearchSuggestion[]
  history: HistorySuggestion[]
}

export interface HistorySuggestion {
  query: string
  result_count: number
  created_at: string
}

export interface SearchSuggestionsResponse {
  suggestions: CategorizedSuggestions
  query: string
  entity_types: string[]
  took_ms: number
}

export interface PopularSearch {
  query: string
  count: number
}

// =============================================================================
// Search History Types
// =============================================================================

export interface SearchHistoryItem {
  id: string
  query: string
  entity_types: string[]
  result_count: number
  filters_applied: Record<string, unknown>
  created_at: string
}

export interface SearchHistoryResponse {
  history: SearchHistoryItem[]
  count: number
}

export interface AddSearchHistoryRequest {
  query: string
  entity_types: string[]
  result_count: number
  filters?: Record<string, unknown>
}

export interface AddSearchHistoryResponse {
  success: boolean
  history_id: string
}

export interface ClearSearchHistoryResponse {
  success: boolean
  deleted_count: number
}

// =============================================================================
// Adaptive Filter Types
// =============================================================================

export interface FilterCount {
  filter_type: FilterType
  filter_value: string
  result_count: number
}

export type FilterType = 'status' | 'type' | 'tag' | 'date_range' | 'sensitivity_level'

export interface FilterCountsRequest {
  cache_key: string
  entity_types: string[]
  base_query?: string
  compute_if_missing?: boolean
}

export interface FilterCountsResponse {
  filter_counts: FilterCount[]
  from_cache: boolean
}

export interface AdaptiveFilter {
  type: FilterType
  label_en: string
  label_ar: string
  values: AdaptiveFilterValue[]
}

export interface AdaptiveFilterValue {
  value: string
  label_en: string
  label_ar: string
  count: number
  selected: boolean
}

// =============================================================================
// Enhanced Search State
// =============================================================================

export interface EnhancedSearchState {
  query: string
  isLoading: boolean
  isFocused: boolean
  showSuggestions: boolean
  suggestions: CategorizedSuggestions | null
  selectedSuggestionIndex: number
  filterCounts: FilterCount[]
  isLoadingFilterCounts: boolean
}

export type EnhancedSearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_FOCUSED'; payload: boolean }
  | { type: 'SET_SHOW_SUGGESTIONS'; payload: boolean }
  | { type: 'SET_SUGGESTIONS'; payload: CategorizedSuggestions | null }
  | { type: 'SET_SELECTED_INDEX'; payload: number }
  | { type: 'INCREMENT_SELECTED_INDEX' }
  | { type: 'DECREMENT_SELECTED_INDEX' }
  | { type: 'SET_FILTER_COUNTS'; payload: FilterCount[] }
  | { type: 'SET_LOADING_FILTER_COUNTS'; payload: boolean }
  | { type: 'RESET' }

// =============================================================================
// Fuzzy Matching Types
// =============================================================================

export interface FuzzyMatchResult {
  text: string
  score: number
  matchedIndices: number[]
}

export interface FuzzyMatchOptions {
  threshold?: number // Minimum similarity score (0-1)
  ignoreCase?: boolean
  ignoreAccents?: boolean
  maxResults?: number
}

// =============================================================================
// UI Component Props Types
// =============================================================================

export interface EnhancedSearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion | HistorySuggestion) => void
  entityTypes?: string[]
  placeholder?: string
  autoFocus?: boolean
  showHistory?: boolean
  showPopular?: boolean
  className?: string
  debounceMs?: number
}

export interface SuggestionDropdownProps {
  suggestions: CategorizedSuggestions | null
  isOpen: boolean
  isLoading: boolean
  selectedIndex: number
  query: string
  onSelect: (suggestion: SearchSuggestion | HistorySuggestion) => void
  onClose: () => void
  className?: string
}

export interface AdaptiveFiltersProps {
  filters: AdaptiveFilter[]
  selectedFilters: Record<FilterType, string[]>
  onFilterChange: (filterType: FilterType, values: string[]) => void
  isLoading?: boolean
  className?: string
}

// =============================================================================
// Constants
// =============================================================================

export const SUGGESTION_TYPE_LABELS: Record<
  SuggestionType,
  { label_en: string; label_ar: string; icon: string }
> = {
  title: { label_en: 'Titles', label_ar: 'العناوين', icon: 'file-text' },
  tag: { label_en: 'Tags', label_ar: 'الوسوم', icon: 'tag' },
  keyword: { label_en: 'Keywords', label_ar: 'الكلمات المفتاحية', icon: 'key' },
  name: { label_en: 'Names', label_ar: 'الأسماء', icon: 'user' },
  topic: { label_en: 'Topics', label_ar: 'المواضيع', icon: 'bookmark' },
  popular: { label_en: 'Popular', label_ar: 'الأكثر بحثاً', icon: 'trending-up' },
  history: { label_en: 'Recent', label_ar: 'الأخيرة', icon: 'clock' },
}

export const FILTER_TYPE_LABELS: Record<FilterType, { label_en: string; label_ar: string }> = {
  status: { label_en: 'Status', label_ar: 'الحالة' },
  type: { label_en: 'Type', label_ar: 'النوع' },
  tag: { label_en: 'Tags', label_ar: 'الوسوم' },
  date_range: { label_en: 'Date', label_ar: 'التاريخ' },
  sensitivity_level: { label_en: 'Sensitivity', label_ar: 'الحساسية' },
}

// Default enhanced search state
export const defaultEnhancedSearchState: EnhancedSearchState = {
  query: '',
  isLoading: false,
  isFocused: false,
  showSuggestions: false,
  suggestions: null,
  selectedSuggestionIndex: -1,
  filterCounts: [],
  isLoadingFilterCounts: false,
}

// Enhanced search reducer
export function enhancedSearchReducer(
  state: EnhancedSearchState,
  action: EnhancedSearchAction,
): EnhancedSearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload, selectedSuggestionIndex: -1 }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_FOCUSED':
      return { ...state, isFocused: action.payload, showSuggestions: action.payload }
    case 'SET_SHOW_SUGGESTIONS':
      return { ...state, showSuggestions: action.payload }
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload, isLoading: false }
    case 'SET_SELECTED_INDEX':
      return { ...state, selectedSuggestionIndex: action.payload }
    case 'INCREMENT_SELECTED_INDEX': {
      const totalItems = getTotalSuggestionCount(state.suggestions)
      const newIndex =
        state.selectedSuggestionIndex < totalItems - 1 ? state.selectedSuggestionIndex + 1 : 0
      return { ...state, selectedSuggestionIndex: newIndex }
    }
    case 'DECREMENT_SELECTED_INDEX': {
      const total = getTotalSuggestionCount(state.suggestions)
      const newIdx =
        state.selectedSuggestionIndex > 0 ? state.selectedSuggestionIndex - 1 : total - 1
      return { ...state, selectedSuggestionIndex: newIdx }
    }
    case 'SET_FILTER_COUNTS':
      return { ...state, filterCounts: action.payload, isLoadingFilterCounts: false }
    case 'SET_LOADING_FILTER_COUNTS':
      return { ...state, isLoadingFilterCounts: action.payload }
    case 'RESET':
      return defaultEnhancedSearchState
    default:
      return state
  }
}

// Helper to count total suggestions
function getTotalSuggestionCount(suggestions: CategorizedSuggestions | null): number {
  if (!suggestions) return 0
  return (
    suggestions.titles.length +
    suggestions.tags.length +
    suggestions.popular.length +
    suggestions.history.length
  )
}

// Helper to get suggestion at index
export function getSuggestionAtIndex(
  suggestions: CategorizedSuggestions | null,
  index: number,
): SearchSuggestion | HistorySuggestion | null {
  if (!suggestions || index < 0) return null

  let currentIndex = 0

  // Check titles
  if (index < currentIndex + suggestions.titles.length) {
    return suggestions.titles[index - currentIndex]
  }
  currentIndex += suggestions.titles.length

  // Check tags
  if (index < currentIndex + suggestions.tags.length) {
    return suggestions.tags[index - currentIndex]
  }
  currentIndex += suggestions.tags.length

  // Check popular
  if (index < currentIndex + suggestions.popular.length) {
    return suggestions.popular[index - currentIndex]
  }
  currentIndex += suggestions.popular.length

  // Check history
  if (index < currentIndex + suggestions.history.length) {
    return suggestions.history[index - currentIndex]
  }

  return null
}

// Helper to check if item is SearchSuggestion or HistorySuggestion
export function isSearchSuggestion(
  item: SearchSuggestion | HistorySuggestion,
): item is SearchSuggestion {
  return 'suggestion' in item
}

// =============================================================================
// No-Results Intelligent Suggestions Types
// =============================================================================

/**
 * Typo correction suggestion with original query and corrected version
 */
export interface TypoCorrection {
  original: string
  corrected: string
  similarity_score: number
}

/**
 * Related term suggestion based on semantic similarity
 */
export interface RelatedTerm {
  term: string
  term_ar: string | null
  category: 'synonym' | 'broader' | 'narrower' | 'related'
  confidence: number
}

/**
 * Popular search that might be relevant to the user's query
 */
export interface PopularSearchSuggestion {
  query: string
  search_count: number
  result_count: number
  entity_types: string[]
}

/**
 * Recently added content that might be relevant
 */
export interface RecentContent {
  id: string
  title_en: string
  title_ar: string | null
  entity_type: string
  created_at: string
  preview?: string
}

/**
 * Entity creation suggestion for when user might want to create new content
 */
export interface CreateEntitySuggestion {
  entity_type: string
  suggested_name: string
  suggested_name_ar?: string
  route: string
  prefill_params?: Record<string, string>
}

/**
 * Successful search from workspace history
 */
export interface WorkspaceSearchHistory {
  query: string
  result_count: number
  entity_types: string[]
  searched_at: string
  user_name?: string
}

/**
 * Actionable search tip with category
 */
export interface ActionableSearchTip {
  category: 'spelling' | 'broader' | 'filters' | 'entity_specific' | 'general'
  tip: string
  tip_ar: string
  action?: {
    type: 'remove_filters' | 'change_entity_type' | 'use_semantic_search'
    payload?: Record<string, unknown>
  }
}

/**
 * Complete no-results suggestions response
 */
export interface NoResultsSuggestions {
  /** Original query that returned no results */
  original_query: string

  /** Typo corrections if detected */
  typo_corrections: TypoCorrection[]

  /** Related/alternative search terms */
  related_terms: RelatedTerm[]

  /** Popular searches that might be relevant */
  popular_searches: PopularSearchSuggestion[]

  /** Recently added content the user might be looking for */
  recent_content: RecentContent[]

  /** Suggestion to create a new entity matching the search term */
  create_suggestion?: CreateEntitySuggestion

  /** General tips for better search */
  search_tips: string[]

  /** Successful searches from workspace history */
  workspace_history?: WorkspaceSearchHistory[]

  /** Actionable search tips with specific suggestions */
  actionable_tips?: ActionableSearchTip[]

  /** Number of active filters that could be removed */
  active_filters_count?: number
}

/**
 * Props for the IntelligentSearchSuggestions component
 */
export interface IntelligentSearchSuggestionsProps {
  /** Original search query that returned no results */
  query: string
  /** Entity types that were searched */
  entityTypes: string[]
  /** Callback when user selects a suggested search term */
  onSearchSuggestion: (term: string) => void
  /** Callback when user wants to create a new entity */
  onCreateEntity?: (suggestion: CreateEntitySuggestion) => void
  /** Callback when user clicks on recent content */
  onContentClick?: (content: RecentContent) => void
  /** Callback to clear active filters */
  onClearFilters?: () => void
  /** Callback to change entity type filter */
  onChangeEntityType?: (entityType: string) => void
  /** Number of active filters */
  activeFiltersCount?: number
  /** Additional CSS classes */
  className?: string
  /** Callback when user selects a filter preset */
  onApplyPreset?: (preset: FilterPreset) => void
  /** Show filter presets section */
  showFilterPresets?: boolean
}

// =============================================================================
// Smart Filter Presets Types
// =============================================================================

/**
 * Represents a smart filter preset that users can apply with one click
 * These are predefined filter combinations based on common queries
 */
export interface FilterPreset {
  /** Unique identifier for the preset */
  id: string
  /** Display name in English */
  name_en: string
  /** Display name in Arabic */
  name_ar: string
  /** Description explaining what this preset shows */
  description_en: string
  /** Description in Arabic */
  description_ar: string
  /** Icon name from lucide-react */
  icon: string
  /** Category of the preset */
  category: FilterPresetCategory
  /** The actual filter configuration to apply */
  filters: FilterPresetConfig
  /** Estimated result count (can be updated dynamically) */
  estimated_count?: number
  /** Whether this preset is popular/frequently used */
  is_popular?: boolean
  /** Color theme for the preset card */
  color_theme?: 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple'
}

/**
 * Categories for organizing filter presets
 */
export type FilterPresetCategory =
  | 'dossier'
  | 'intake'
  | 'brief'
  | 'engagement'
  | 'workflow'
  | 'geographic'

/**
 * Filter configuration for a preset
 * Matches the structure used in various filter hooks
 */
export interface FilterPresetConfig {
  /** Entity types to filter */
  entity_types?: string[]
  /** Status filter */
  status?: string[]
  /** Type filter (e.g., dossier type) */
  type?: string
  /** Region filter (e.g., MENA, EU, etc.) */
  region?: string
  /** Priority filter */
  priority?: ('low' | 'medium' | 'high' | 'urgent')[]
  /** Assigned/unassigned filter */
  assigned?: boolean
  /** Due date filter */
  due_date?: 'overdue' | 'today' | 'this_week' | 'this_month' | 'next_month'
  /** Sensitivity level */
  sensitivity?: ('low' | 'medium' | 'high')[]
  /** Sort configuration */
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  /** Free-text search query */
  search?: string
  /** Custom filter key-value pairs */
  custom?: Record<string, unknown>
}

/**
 * Props for the FilterPresetsSection component
 */
export interface FilterPresetsSectionProps {
  /** Available presets to display */
  presets: FilterPreset[]
  /** Callback when user clicks a preset */
  onApplyPreset: (preset: FilterPreset) => void
  /** Whether presets are loading */
  isLoading?: boolean
  /** Error message if loading failed */
  error?: string
  /** Maximum number of presets to show initially */
  maxVisible?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Response from the filter presets API
 */
export interface FilterPresetsResponse {
  /** List of available presets */
  presets: FilterPreset[]
  /** Whether these are personalized based on user behavior */
  is_personalized: boolean
  /** Timestamp of when presets were generated */
  generated_at: string
}

/**
 * Smart preset with analytics data
 */
export interface SmartFilterPreset extends FilterPreset {
  /** How often this preset has been used by the user */
  user_usage_count: number
  /** How often this preset is used organization-wide */
  org_usage_count: number
  /** Click-through rate */
  ctr: number
  /** Average results returned */
  avg_results: number
}
