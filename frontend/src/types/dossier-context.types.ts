/**
 * Dossier Context Types
 *
 * Types for smart dossier context inheritance feature.
 * Enables automatic context resolution from entity relationships.
 *
 * @module dossier-context.types
 * @see specs/035-dossier-context/data-model.md
 */

// =============================================================================
// Core Types (T001)
// =============================================================================

/**
 * Work item types that can link to dossiers
 */
export type WorkItemType = 'task' | 'commitment' | 'intake'

/**
 * How the dossier link was established
 */
export type InheritanceSource =
  | 'direct' // User linked directly from dossier page
  | 'engagement' // Inherited from engagement → dossier
  | 'after_action' // Inherited from after-action → engagement → dossier
  | 'position' // Inherited from position → dossier
  | 'mou' // Inherited from MOU → dossier

/**
 * Entity types that can resolve to dossier context
 */
export type ContextEntityType = 'dossier' | 'engagement' | 'after_action' | 'position'

/**
 * Single step in the inheritance chain
 */
export interface InheritancePathStep {
  type: ContextEntityType
  id: string
  name_en: string
  name_ar: string
}

/**
 * Link between work item and dossier
 */
export interface WorkItemDossierLink {
  id: string
  work_item_type: WorkItemType
  work_item_id: string
  dossier_id: string
  inheritance_source: InheritanceSource
  inherited_from_type: ContextEntityType | null
  inherited_from_id: string | null
  inheritance_path?: InheritancePathStep[]
  display_order?: number
  is_primary: boolean
  created_by: string
  created_at: string
  updated_at?: string
  /** Populated by useWorkItemDossierLinks hook via join */
  dossier?: DossierReference
}

/**
 * Dossier type for categorization
 */
export type DossierType = 'country' | 'organization' | 'forum' | 'theme'

/**
 * Dossier status
 */
export type DossierStatus = 'active' | 'inactive' | 'archived'

/**
 * Dossier reference for display in badges
 */
export interface DossierReference {
  id: string
  name_en: string
  name_ar: string
  type: DossierType
  status: DossierStatus
}

/**
 * Resolved dossier context from RPC
 */
export interface ResolvedDossierContext {
  dossier_id: string
  dossier_name_en: string
  dossier_name_ar: string
  dossier_type: string
  dossier_status: string
  inheritance_source: InheritanceSource
  resolution_path: string[]
}

/**
 * Context resolution request
 */
export interface DossierContextRequest {
  entity_type: ContextEntityType
  entity_id: string
}

/**
 * Context resolution response
 */
export interface DossierContextResponse {
  dossiers: ResolvedDossierContext[]
  resolved_from: ContextEntityType
  query_time_ms: number
}

// =============================================================================
// State Management Types (T002)
// =============================================================================

/**
 * Creation context (detected from URL)
 */
export interface CreationContext {
  route: string
  entityType?: ContextEntityType
  entityId?: string

  /** Resolved dossier context */
  resolvedDossiers?: DossierReference[]
  inheritanceSource?: InheritanceSource

  /** If context could not be resolved */
  requiresSelection: boolean
}

/**
 * Dossier context state (synced with URL)
 */
export interface DossierContextState {
  /** Loading state */
  isLoading: boolean

  /** Error state */
  error: string | null

  /** Resolved context from entity relationships */
  resolvedContext: ResolvedDossierContext[]

  /** Selected dossier(s) for current operation */
  selectedDossiers: DossierReference[]

  /** Primary dossier for display */
  primaryDossier: DossierReference | null

  /** If manual selection is required */
  requiresSelection: boolean

  /** How context was established */
  inheritanceSource: InheritanceSource

  /** Entity the context was inherited from */
  inheritedFrom: { type: ContextEntityType; id: string } | null
}

/**
 * Dossier context actions
 */
export interface DossierContextActions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setResolvedContext: (context: ResolvedDossierContext[]) => void
  selectDossier: (dossier: DossierReference) => void
  deselectDossier: (dossierId: string) => void
  setPrimaryDossier: (dossier: DossierReference | null) => void
  reset: () => void
}

/**
 * Full context value (state + actions)
 */
export interface DossierContextValue {
  state: DossierContextState
  actions: DossierContextActions
}

// =============================================================================
// Activity Timeline Types (T003)
// =============================================================================

/**
 * Icon type for timeline items
 */
export type ActivityIconType = 'checklist' | 'handshake' | 'inbox'

/**
 * Single activity in the timeline
 */
export interface DossierActivity {
  link_id: string
  work_item_id: string
  work_item_type: WorkItemType
  dossier_id: string
  inheritance_source: InheritanceSource
  inheritance_path: InheritancePathStep[]
  activity_timestamp: string
  activity_title: string
  status: string
  priority: string
  assignee_id: string | null
  icon_type: ActivityIconType
  inheritance_label: string | null
}

/**
 * Timeline query parameters
 */
export interface DossierTimelineParams {
  dossier_id: string
  limit?: number
  cursor?: string // ISO timestamp
  work_item_type?: WorkItemType
  inheritance_source?: InheritanceSource
}

/**
 * Timeline response
 */
export interface DossierTimelineResponse {
  activities: DossierActivity[]
  next_cursor: string | null
  total_count: number
}

// =============================================================================
// Component Props Types (T004)
// =============================================================================

/**
 * DossierContextBadge props
 */
export interface DossierContextBadgeProps {
  dossier: DossierReference
  inheritanceSource?: InheritanceSource
  inheritedFromName?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Show inheritance label (e.g., "via Engagement") */
  showInheritanceLabel?: boolean
}

/**
 * DossierSelector props
 */
export interface DossierSelectorProps {
  value: string[]
  onChange: (dossierIds: string[]) => void
  multiple?: boolean
  required?: boolean
  placeholder?: string
  className?: string
  /** Filter by dossier type */
  filterByType?: DossierType
  /** Disable specific dossiers */
  disabledDossierIds?: string[]
  /** Error message to display */
  error?: string
}

/**
 * DossierActivityTimeline props
 */
export interface DossierActivityTimelineProps {
  dossierId: string
  className?: string
  initialLimit?: number
  filterByType?: WorkItemType
  filterByInheritance?: InheritanceSource
  /** Show empty state message */
  showEmptyState?: boolean
}

/**
 * DossierTypeIcon props
 */
export interface DossierTypeIconProps {
  type: DossierType
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * ActivityTimelineItem props
 */
export interface ActivityTimelineItemProps {
  activity: DossierActivity
  className?: string
  onNavigate?: (workItemType: WorkItemType, workItemId: string) => void
}

// =============================================================================
// API Request/Response Types
// =============================================================================

/**
 * Create work item dossier link request
 */
export interface CreateWorkItemDossierLinkRequest {
  work_item_type: WorkItemType
  work_item_id: string
  dossier_ids: string[]
  inheritance_source: InheritanceSource
  inherited_from_type?: ContextEntityType
  inherited_from_id?: string
  is_primary?: boolean
}

/**
 * Create work item dossier link response
 */
export interface CreateWorkItemDossierLinkResponse {
  links: WorkItemDossierLink[]
  created_count: number
}

/**
 * List work item dossier links response
 */
export interface ListWorkItemDossierLinksResponse {
  links: WorkItemDossierLink[]
  primary_dossier: DossierReference | null
}

// =============================================================================
// Dossier Search Types (for DossierSelector)
// =============================================================================

/**
 * Dossier search result
 */
export interface DossierSearchResult extends DossierReference {
  /** Match score for relevance sorting */
  score?: number
  /** Highlighted text for search term */
  highlight?: {
    name_en?: string
    name_ar?: string
  }
}

/**
 * Dossier search params
 */
export interface DossierSearchParams {
  query: string
  limit?: number
  type?: DossierType
  status?: DossierStatus
  excludeIds?: string[]
}

/**
 * Dossier search response
 */
export interface DossierSearchResponse {
  results: DossierSearchResult[]
  total_count: number
  query_time_ms: number
}
