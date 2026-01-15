/**
 * Stakeholder Interaction Types
 *
 * Type definitions for the stakeholder interaction timeline feature.
 * Aggregates all interactions with a stakeholder into a unified chronological view.
 */

// ===========================================
// ENUMS & CONSTANTS
// ===========================================

export type StakeholderInteractionType =
  | 'email'
  | 'meeting'
  | 'phone_call'
  | 'document_exchange'
  | 'comment'
  | 'message'
  | 'visit'
  | 'conference'
  | 'workshop'
  | 'negotiation'
  | 'other'

export type InteractionDirection = 'inbound' | 'outbound' | 'bidirectional'

export type InteractionSentiment = 'positive' | 'neutral' | 'negative' | 'mixed'

export type InteractionPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TimelineAnnotationType =
  | 'note'
  | 'marker'
  | 'highlight'
  | 'milestone'
  | 'turning_point'
  | 'breakthrough'
  | 'concern'

export type AnnotationVisibility = 'private' | 'team' | 'public'

export type AnnotationColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange'

// ===========================================
// CORE TYPES
// ===========================================

/**
 * Participant in an interaction
 */
export interface InteractionParticipant {
  id?: string
  name_en: string
  name_ar?: string
  email?: string
  role?: string
  type: 'internal' | 'external'
  organization_en?: string
  organization_ar?: string
  avatar_url?: string
}

/**
 * Attachment on an interaction
 */
export interface InteractionAttachment {
  id: string
  filename: string
  url?: string
  storage_path?: string
  size?: number
  mime_type?: string
  uploaded_at?: string
}

/**
 * Timeline annotation for marking key moments
 */
export interface TimelineAnnotation {
  id: string
  event_type: string
  event_id: string
  interaction_id?: string
  stakeholder_type?: string
  stakeholder_id?: string
  annotation_type: TimelineAnnotationType
  content_en: string
  content_ar?: string
  color: AnnotationColor
  visibility: AnnotationVisibility
  is_key_moment: boolean
  is_turning_point: boolean
  importance_score: number
  tags?: string[]
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Stakeholder interaction event
 */
export interface StakeholderInteraction {
  id: string
  stakeholder_type: string
  stakeholder_id: string
  secondary_stakeholder_type?: string
  secondary_stakeholder_id?: string
  organization_id?: string
  interaction_type: StakeholderInteractionType
  direction: InteractionDirection
  sentiment?: InteractionSentiment
  title_en: string
  title_ar?: string
  summary_en?: string
  summary_ar?: string
  content_en?: string
  content_ar?: string
  interaction_date: string
  duration_minutes?: number
  location_en?: string
  location_ar?: string
  is_virtual: boolean
  virtual_link?: string
  participants: InteractionParticipant[]
  internal_participants: InteractionParticipant[]
  external_participants: InteractionParticipant[]
  attachments: InteractionAttachment[]
  related_documents?: string[]
  tags?: string[]
  priority: InteractionPriority
  requires_followup: boolean
  followup_date?: string
  followup_notes?: string
  outcome_en?: string
  outcome_ar?: string
  impact_score?: number
  source_type?: string
  source_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * Unified timeline event (from multiple sources)
 */
export interface StakeholderTimelineEvent {
  id: string
  event_type: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  event_date: string
  source_id: string
  source_table: string
  priority: InteractionPriority
  metadata: StakeholderEventMetadata
  annotations: TimelineAnnotation[]
  created_at: string
  created_by?: string
}

/**
 * Metadata for timeline events
 */
export interface StakeholderEventMetadata {
  icon: string
  color: string
  location_en?: string
  location_ar?: string
  is_virtual?: boolean
  virtual_link?: string
  duration_minutes?: number
  participants?: InteractionParticipant[]
  attachments?: InteractionAttachment[]
  direction?: InteractionDirection
  sentiment?: InteractionSentiment
  impact_score?: number
  outcome_en?: string
  outcome_ar?: string
  [key: string]: unknown
}

// ===========================================
// FILTER & REQUEST TYPES
// ===========================================

/**
 * Filters for timeline events
 */
export interface StakeholderTimelineFilters {
  event_types?: StakeholderInteractionType[]
  date_from?: string
  date_to?: string
  search_query?: string
  direction?: InteractionDirection
  sentiment?: InteractionSentiment
  priority?: InteractionPriority
  has_annotations?: boolean
  tags?: string[]
}

/**
 * Date range preset options
 */
export type DateRangePreset =
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'last_year'
  | 'all_time'
  | 'custom'

// ===========================================
// API REQUEST/RESPONSE TYPES
// ===========================================

/**
 * Timeline API response
 */
export interface StakeholderTimelineResponse {
  events: StakeholderTimelineEvent[]
  next_cursor?: string
  has_more: boolean
  total_count: number
}

/**
 * Interaction statistics
 */
export interface StakeholderInteractionStats {
  total_interactions: number
  interactions_by_type: Record<string, number>
  interactions_by_month: Record<string, number>
  avg_sentiment: number
  key_moments_count: number
  last_interaction_date: string | null
  most_common_type: string | null
}

/**
 * Create interaction request
 */
export interface CreateInteractionRequest {
  stakeholder_type: string
  stakeholder_id: string
  interaction_type: StakeholderInteractionType
  title_en: string
  title_ar?: string
  summary_en?: string
  summary_ar?: string
  content_en?: string
  content_ar?: string
  interaction_date?: string
  duration_minutes?: number
  location_en?: string
  location_ar?: string
  is_virtual?: boolean
  virtual_link?: string
  participants?: InteractionParticipant[]
  direction?: InteractionDirection
  sentiment?: InteractionSentiment
  priority?: InteractionPriority
  tags?: string[]
  outcome_en?: string
  outcome_ar?: string
  impact_score?: number
  requires_followup?: boolean
  followup_date?: string
  followup_notes?: string
}

/**
 * Create annotation request
 */
export interface CreateAnnotationRequest {
  event_type: string
  event_id: string
  interaction_id?: string
  stakeholder_type?: string
  stakeholder_id?: string
  annotation_type: TimelineAnnotationType
  content_en: string
  content_ar?: string
  color?: AnnotationColor
  visibility?: AnnotationVisibility
  is_key_moment?: boolean
  is_turning_point?: boolean
  importance_score?: number
  tags?: string[]
}

/**
 * Update annotation request
 */
export interface UpdateAnnotationRequest {
  content_en?: string
  content_ar?: string
  color?: AnnotationColor
  visibility?: AnnotationVisibility
  is_key_moment?: boolean
  is_turning_point?: boolean
  importance_score?: number
  tags?: string[]
}

// ===========================================
// HOOK RETURN TYPES
// ===========================================

/**
 * Hook return type for stakeholder timeline
 */
export interface UseStakeholderTimelineReturn {
  events: StakeholderTimelineEvent[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  error: Error | null
  fetchNextPage: () => void
  refetch: () => void
  filters: StakeholderTimelineFilters
  setFilters: (filters: StakeholderTimelineFilters) => void
  stats: StakeholderInteractionStats | null
  isLoadingStats: boolean
}

/**
 * Hook return type for interaction mutations
 */
export interface UseStakeholderInteractionMutationsReturn {
  createInteraction: (data: CreateInteractionRequest) => Promise<StakeholderInteraction>
  isCreating: boolean
  createAnnotation: (data: CreateAnnotationRequest) => Promise<TimelineAnnotation>
  updateAnnotation: (id: string, data: UpdateAnnotationRequest) => Promise<TimelineAnnotation>
  deleteAnnotation: (id: string) => Promise<void>
  isAnnotating: boolean
}

// ===========================================
// COMPONENT PROP TYPES
// ===========================================

/**
 * Timeline component props
 */
export interface StakeholderInteractionTimelineProps {
  stakeholderType: string
  stakeholderId: string
  stakeholderName?: string
  initialFilters?: StakeholderTimelineFilters
  showFilters?: boolean
  showSearch?: boolean
  showStats?: boolean
  showAnnotations?: boolean
  allowNewInteractions?: boolean
  itemsPerPage?: number
  className?: string
}

/**
 * Interaction card props
 */
export interface InteractionCardProps {
  event: StakeholderTimelineEvent
  isFirst?: boolean
  isLast?: boolean
  onAnnotate?: (event: StakeholderTimelineEvent) => void
  onViewDetails?: (event: StakeholderTimelineEvent) => void
  showAnnotations?: boolean
}

/**
 * Stats card props
 */
export interface InteractionStatsCardProps {
  stats: StakeholderInteractionStats
  isLoading?: boolean
  className?: string
}
