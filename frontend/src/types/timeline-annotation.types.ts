/**
 * Timeline Annotation Types
 *
 * Type definitions for timeline annotations feature.
 * Supports notes, markers, and highlights on timeline events.
 */

/**
 * Annotation type identifiers
 */
export type AnnotationType = 'note' | 'marker' | 'highlight' | 'milestone'

/**
 * Annotation color options
 */
export type AnnotationColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange'

/**
 * Visibility scope for annotations
 */
export type AnnotationVisibility = 'private' | 'team' | 'public'

/**
 * Timeline annotation entity
 */
export interface TimelineAnnotation {
  id: string
  event_id: string // Reference to timeline event
  type: AnnotationType
  content_en: string
  content_ar?: string
  color: AnnotationColor
  visibility: AnnotationVisibility
  created_by: string
  created_at: string
  updated_at: string
  position?: {
    x: number
    y: number
  }
  metadata?: Record<string, unknown>
}

/**
 * Create annotation request
 */
export interface CreateAnnotationRequest {
  event_id: string
  type: AnnotationType
  content_en: string
  content_ar?: string
  color?: AnnotationColor
  visibility?: AnnotationVisibility
  position?: {
    x: number
    y: number
  }
}

/**
 * Update annotation request
 */
export interface UpdateAnnotationRequest {
  content_en?: string
  content_ar?: string
  color?: AnnotationColor
  visibility?: AnnotationVisibility
  position?: {
    x: number
    y: number
  }
}

/**
 * Annotation filter options
 */
export interface AnnotationFilters {
  types?: AnnotationType[]
  colors?: AnnotationColor[]
  visibility?: AnnotationVisibility[]
  created_by?: string
  event_ids?: string[]
}

/**
 * Zoom level configuration
 */
export type TimelineZoomLevel = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all'

/**
 * Zoom level metadata
 */
export interface ZoomLevelConfig {
  level: TimelineZoomLevel
  label_en: string
  label_ar: string
  daysVisible: number // -1 for all
  groupBy: 'hour' | 'day' | 'week' | 'month' | 'year'
}

/**
 * Timeline view mode
 */
export type TimelineViewMode = 'vertical' | 'horizontal' | 'calendar'

/**
 * Interactive timeline state
 */
export interface InteractiveTimelineState {
  zoomLevel: TimelineZoomLevel
  viewMode: TimelineViewMode
  showAnnotations: boolean
  selectedEventId: string | null
  focusedDate: Date | null
  visibleDateRange: {
    start: Date
    end: Date
  }
}

/**
 * Timeline navigation actions
 */
export type TimelineNavigationAction =
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'SET_ZOOM'; level: TimelineZoomLevel }
  | { type: 'GO_TO_DATE'; date: Date }
  | { type: 'GO_TO_TODAY' }
  | { type: 'SCROLL_BACKWARD' }
  | { type: 'SCROLL_FORWARD' }
  | { type: 'SELECT_EVENT'; eventId: string | null }
  | { type: 'TOGGLE_ANNOTATIONS' }
  | { type: 'SET_VIEW_MODE'; mode: TimelineViewMode }
