/**
 * View Preferences Types
 *
 * Types for user-specific filter selections, sort orders, column visibility,
 * and saved custom views across sessions.
 */

/**
 * Entity types that can have view preferences
 */
export type EntityViewType =
  | 'dossiers'
  | 'engagements'
  | 'my_work'
  | 'persons'
  | 'forums'
  | 'working_groups'
  | 'calendar'
  | 'analytics'

/**
 * Sort configuration
 */
export interface SortConfig {
  field: string
  order: 'asc' | 'desc'
}

/**
 * Column visibility configuration
 */
export interface ColumnConfig {
  id: string
  visible: boolean
  width?: number
  order?: number
}

/**
 * Filter value types
 */
export type FilterValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | { min?: number | string; max?: number | string }
  | null

/**
 * Filter configuration for a single field
 */
export interface FilterConfig {
  field: string
  operator:
    | 'eq'
    | 'neq'
    | 'in'
    | 'nin'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'between'
    | 'contains'
    | 'starts_with'
  value: FilterValue
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  pageSize: number
  defaultPage?: number
}

/**
 * Display density options
 */
export type DisplayDensity = 'compact' | 'normal' | 'comfortable'

/**
 * View layout options
 */
export type ViewLayout = 'grid' | 'list' | 'table' | 'kanban' | 'calendar'

/**
 * Complete view configuration object
 * This is stored in the view_config JSONB column
 */
export interface ViewConfig {
  // Filtering
  filters?: FilterConfig[]

  // Sorting
  sort?: SortConfig

  // Column visibility and ordering
  columns?: ColumnConfig[]

  // Pagination
  pagination?: PaginationConfig

  // Display settings
  density?: DisplayDensity
  layout?: ViewLayout

  // Search query (persisted)
  searchQuery?: string

  // Entity-specific settings (flexible JSON)
  customSettings?: Record<string, unknown>
}

/**
 * Default preferences stored per entity type
 * This is stored in the default_preferences JSONB column
 */
export interface DefaultViewPreferences extends ViewConfig {
  // ID of the default saved view to apply (optional)
  defaultSavedViewId?: string
}

/**
 * User view preferences record (from database)
 */
export interface UserViewPreference {
  id: string
  user_id: string
  entity_type: EntityViewType
  default_preferences: DefaultViewPreferences
  created_at: string
  updated_at: string
}

/**
 * Saved view record (from database)
 */
export interface SavedView {
  id: string
  user_id: string
  entity_type: EntityViewType
  name: string
  description?: string
  is_default: boolean
  is_pinned: boolean
  view_config: ViewConfig
  created_at: string
  updated_at: string
}

/**
 * Input for creating/updating default preferences
 */
export interface UpsertDefaultPreferencesInput {
  entity_type: EntityViewType
  default_preferences: DefaultViewPreferences
}

/**
 * Input for creating a saved view
 */
export interface CreateSavedViewInput {
  entity_type: EntityViewType
  name: string
  description?: string
  is_default?: boolean
  is_pinned?: boolean
  view_config: ViewConfig
}

/**
 * Input for updating a saved view
 */
export interface UpdateSavedViewInput {
  id: string
  name?: string
  description?: string
  is_default?: boolean
  is_pinned?: boolean
  view_config?: ViewConfig
}

/**
 * API response types
 */
export interface ViewPreferencesResponse {
  preferences: UserViewPreference | null
  saved_views: SavedView[]
}

/**
 * Hook return type for useViewPreferences
 */
export interface UseViewPreferencesReturn {
  // Data
  preferences: UserViewPreference | null
  savedViews: SavedView[]
  defaultView: SavedView | null
  pinnedViews: SavedView[]

  // Loading states
  isLoading: boolean
  isUpdating: boolean

  // Actions
  updateDefaultPreferences: (preferences: DefaultViewPreferences) => Promise<void>
  createSavedView: (input: CreateSavedViewInput) => Promise<SavedView>
  updateSavedView: (input: UpdateSavedViewInput) => Promise<SavedView>
  deleteSavedView: (id: string) => Promise<void>
  setDefaultView: (id: string | null) => Promise<void>
  togglePinned: (id: string) => Promise<void>
  applyView: (viewConfig: ViewConfig) => void

  // Current applied view
  currentViewConfig: ViewConfig
  setCurrentViewConfig: (config: ViewConfig) => void

  // Dirty state (unsaved changes)
  hasUnsavedChanges: boolean
  resetToDefault: () => void
}

/**
 * Dossier-specific view configuration
 */
export interface DossierViewConfig extends ViewConfig {
  customSettings?: {
    typeFilter?: string
    statusFilter?: string[]
    showArchived?: boolean
  }
}

/**
 * My Work-specific view configuration
 */
export interface MyWorkViewConfig extends ViewConfig {
  customSettings?: {
    sourceTab?: 'all' | 'commitments' | 'tasks' | 'intake'
    trackingType?: string
    quickFilter?: 'overdue' | 'due-today' | 'due-week'
  }
}

/**
 * Engagement-specific view configuration
 */
export interface EngagementViewConfig extends ViewConfig {
  customSettings?: {
    statusFilter?: string[]
    dateRange?: { start?: string; end?: string }
    participantFilter?: string[]
  }
}
