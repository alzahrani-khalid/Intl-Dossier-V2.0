/**
 * Advanced Search Hook
 * Feature: advanced-search-filters
 * Description: TanStack Query hook for complex multi-criteria search
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  AdvancedSearchRequest,
  AdvancedSearchResponse,
  SearchResult,
  FilterCondition,
  FilterGroup,
  RelationshipQuery,
  DateRange,
  SearchableEntityType,
  LogicOperator,
  SortBy,
  SortOrder,
} from '@/types/advanced-search.types'

// Query key factory
export const advancedSearchKeys = {
  all: ['advanced-search'] as const,
  search: (params: AdvancedSearchRequest) =>
    [...advancedSearchKeys.all, 'results', params] as const,
  history: () => [...advancedSearchKeys.all, 'history'] as const,
}

// API function to execute advanced search
async function executeAdvancedSearch(
  request: AdvancedSearchRequest,
): Promise<AdvancedSearchResponse> {
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/advanced-search`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(request),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Search failed')
  }

  return response.json()
}

// Main search hook with caching
export function useAdvancedSearch(
  request: AdvancedSearchRequest | null,
  options?: {
    enabled?: boolean
    staleTime?: number
    refetchOnWindowFocus?: boolean
  },
) {
  return useQuery({
    queryKey: request ? advancedSearchKeys.search(request) : ['advanced-search', 'disabled'],
    queryFn: () => (request ? executeAdvancedSearch(request) : Promise.resolve(null)),
    enabled: options?.enabled !== false && request !== null,
    staleTime: options?.staleTime ?? 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

// Mutation-based search for on-demand execution
export function useAdvancedSearchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: executeAdvancedSearch,
    onSuccess: (data, variables) => {
      // Cache the results
      queryClient.setQueryData(advancedSearchKeys.search(variables), data)

      // Add to search history
      addToSearchHistory(variables)
    },
  })
}

// Search history management
const SEARCH_HISTORY_KEY = 'advanced-search-history'
const MAX_HISTORY_ITEMS = 10

interface SearchHistoryItem {
  id: string
  request: AdvancedSearchRequest
  timestamp: string
  resultCount: number
}

function addToSearchHistory(request: AdvancedSearchRequest): void {
  try {
    const history = getSearchHistory()
    const newItem: SearchHistoryItem = {
      id: crypto.randomUUID(),
      request,
      timestamp: new Date().toISOString(),
      resultCount: 0,
    }

    // Remove duplicate searches
    const filteredHistory = history.filter(
      (item) => JSON.stringify(item.request) !== JSON.stringify(request),
    )

    // Add new item at the beginning
    const updatedHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS)

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory))
  } catch {
    console.warn('Failed to save search history')
  }
}

export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function clearSearchHistory(): void {
  localStorage.removeItem(SEARCH_HISTORY_KEY)
}

// Hook for search history
export function useSearchHistory() {
  return useQuery({
    queryKey: advancedSearchKeys.history(),
    queryFn: getSearchHistory,
    staleTime: Infinity,
  })
}

// Search state builder helper
export interface SearchState {
  query: string
  entityTypes: SearchableEntityType[]
  conditions: FilterCondition[]
  conditionGroups: FilterGroup[]
  relationships: RelationshipQuery[]
  dateRange: DateRange | null
  status: string[]
  tags: string[]
  filterLogic: LogicOperator
  includeArchived: boolean
  sortBy: SortBy
  sortOrder: SortOrder
  limit: number
  offset: number
  savedFilterId: string | null
}

export const defaultSearchState: SearchState = {
  query: '',
  entityTypes: ['dossier'],
  conditions: [],
  conditionGroups: [],
  relationships: [],
  dateRange: null,
  status: [],
  tags: [],
  filterLogic: 'AND',
  includeArchived: false,
  sortBy: 'relevance',
  sortOrder: 'desc',
  limit: 50,
  offset: 0,
  savedFilterId: null,
}

// Convert SearchState to AdvancedSearchRequest
export function buildSearchRequest(state: SearchState): AdvancedSearchRequest {
  const request: AdvancedSearchRequest = {
    entity_types: state.entityTypes,
    filter_logic: state.filterLogic,
    include_archived: state.includeArchived,
    sort_by: state.sortBy,
    sort_order: state.sortOrder,
    limit: state.limit,
    offset: state.offset,
  }

  if (state.query.trim()) {
    request.query = state.query.trim()
  }

  if (state.conditions.length > 0) {
    request.conditions = state.conditions
  }

  if (state.conditionGroups.length > 0) {
    request.condition_groups = state.conditionGroups
  }

  if (state.relationships.length > 0) {
    request.relationships = state.relationships
  }

  if (state.dateRange && (state.dateRange.from || state.dateRange.to || state.dateRange.preset)) {
    request.date_range = state.dateRange
  }

  if (state.status.length > 0) {
    request.status = state.status
  }

  if (state.tags.length > 0) {
    request.tags = state.tags
  }

  if (state.savedFilterId) {
    request.saved_filter_id = state.savedFilterId
  }

  return request
}

// Search state reducer actions
export type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_ENTITY_TYPES'; payload: SearchableEntityType[] }
  | { type: 'TOGGLE_ENTITY_TYPE'; payload: SearchableEntityType }
  | { type: 'ADD_CONDITION'; payload: FilterCondition }
  | { type: 'UPDATE_CONDITION'; payload: { index: number; condition: FilterCondition } }
  | { type: 'REMOVE_CONDITION'; payload: number }
  | { type: 'CLEAR_CONDITIONS' }
  | { type: 'ADD_CONDITION_GROUP'; payload: FilterGroup }
  | { type: 'REMOVE_CONDITION_GROUP'; payload: number }
  | { type: 'ADD_RELATIONSHIP'; payload: RelationshipQuery }
  | { type: 'REMOVE_RELATIONSHIP'; payload: number }
  | { type: 'SET_DATE_RANGE'; payload: DateRange | null }
  | { type: 'SET_STATUS'; payload: string[] }
  | { type: 'TOGGLE_STATUS'; payload: string }
  | { type: 'SET_TAGS'; payload: string[] }
  | { type: 'SET_FILTER_LOGIC'; payload: LogicOperator }
  | { type: 'SET_INCLUDE_ARCHIVED'; payload: boolean }
  | { type: 'SET_SORT'; payload: { sortBy: SortBy; sortOrder: SortOrder } }
  | { type: 'SET_PAGINATION'; payload: { limit?: number; offset?: number } }
  | { type: 'SET_SAVED_FILTER_ID'; payload: string | null }
  | { type: 'LOAD_STATE'; payload: Partial<SearchState> }
  | { type: 'RESET' }

// Search state reducer
export function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload, offset: 0 }

    case 'SET_ENTITY_TYPES':
      return { ...state, entityTypes: action.payload, offset: 0 }

    case 'TOGGLE_ENTITY_TYPE': {
      const types = state.entityTypes.includes(action.payload)
        ? state.entityTypes.filter((t) => t !== action.payload)
        : [...state.entityTypes, action.payload]
      return { ...state, entityTypes: types.length > 0 ? types : state.entityTypes, offset: 0 }
    }

    case 'ADD_CONDITION':
      return { ...state, conditions: [...state.conditions, action.payload], offset: 0 }

    case 'UPDATE_CONDITION':
      return {
        ...state,
        conditions: state.conditions.map((c, i) =>
          i === action.payload.index ? action.payload.condition : c,
        ),
        offset: 0,
      }

    case 'REMOVE_CONDITION':
      return {
        ...state,
        conditions: state.conditions.filter((_, i) => i !== action.payload),
        offset: 0,
      }

    case 'CLEAR_CONDITIONS':
      return { ...state, conditions: [], conditionGroups: [], offset: 0 }

    case 'ADD_CONDITION_GROUP':
      return { ...state, conditionGroups: [...state.conditionGroups, action.payload], offset: 0 }

    case 'REMOVE_CONDITION_GROUP':
      return {
        ...state,
        conditionGroups: state.conditionGroups.filter((_, i) => i !== action.payload),
        offset: 0,
      }

    case 'ADD_RELATIONSHIP':
      return { ...state, relationships: [...state.relationships, action.payload], offset: 0 }

    case 'REMOVE_RELATIONSHIP':
      return {
        ...state,
        relationships: state.relationships.filter((_, i) => i !== action.payload),
        offset: 0,
      }

    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload, offset: 0 }

    case 'SET_STATUS':
      return { ...state, status: action.payload, offset: 0 }

    case 'TOGGLE_STATUS': {
      const newStatus = state.status.includes(action.payload)
        ? state.status.filter((s) => s !== action.payload)
        : [...state.status, action.payload]
      return { ...state, status: newStatus, offset: 0 }
    }

    case 'SET_TAGS':
      return { ...state, tags: action.payload, offset: 0 }

    case 'SET_FILTER_LOGIC':
      return { ...state, filterLogic: action.payload, offset: 0 }

    case 'SET_INCLUDE_ARCHIVED':
      return { ...state, includeArchived: action.payload, offset: 0 }

    case 'SET_SORT':
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
        offset: 0,
      }

    case 'SET_PAGINATION':
      return {
        ...state,
        limit: action.payload.limit ?? state.limit,
        offset: action.payload.offset ?? state.offset,
      }

    case 'SET_SAVED_FILTER_ID':
      return { ...state, savedFilterId: action.payload }

    case 'LOAD_STATE':
      return { ...state, ...action.payload, offset: 0 }

    case 'RESET':
      return { ...defaultSearchState }

    default:
      return state
  }
}

// Hook to check if search has any active filters
export function hasActiveFilters(state: SearchState): boolean {
  return (
    state.query.trim().length > 0 ||
    state.conditions.length > 0 ||
    state.conditionGroups.length > 0 ||
    state.relationships.length > 0 ||
    state.dateRange !== null ||
    state.status.length > 0 ||
    state.tags.length > 0 ||
    state.includeArchived
  )
}

// Count active filters
export function countActiveFilters(state: SearchState): number {
  let count = 0
  if (state.query.trim()) count++
  count += state.conditions.length
  count += state.conditionGroups.length
  count += state.relationships.length
  if (state.dateRange) count++
  count += state.status.length
  count += state.tags.length
  if (state.includeArchived) count++
  return count
}
