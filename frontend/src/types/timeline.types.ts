/**
 * Unified Timeline Types
 *
 * Type definitions for the vertical timeline component system
 * Supports Country, Engagement, Organization, and Person dossiers
 */

export type TimelineEventType =
  | 'calendar'
  | 'interaction'
  | 'intelligence'
  | 'document'
  | 'mou'
  | 'position'
  | 'relationship'
  | 'commitment'
  | 'decision';

export type TimelinePriority = 'high' | 'medium' | 'low';

export type TimelineEventStatus =
  | 'planned'
  | 'ongoing'
  | 'completed'
  | 'cancelled'
  | 'postponed';

/**
 * Participant in a timeline event
 */
export interface TimelineParticipant {
  id: string;
  name_en: string;
  name_ar: string;
  type: 'user' | 'contact' | 'person_dossier' | 'organization_dossier';
  avatar_url?: string;
}

/**
 * Attachment metadata
 */
export interface TimelineAttachment {
  id: string;
  filename: string;
  url: string;
  size?: number;
  mime_type?: string;
  uploaded_at?: string;
}

/**
 * Metadata for timeline events
 */
export interface TimelineEventMetadata {
  icon: string; // Lucide icon name
  color: string; // Tailwind color class (e.g., 'blue', 'green', 'red')
  badge_text_en?: string; // Badge label in English
  badge_text_ar?: string; // Badge label in Arabic
  participants?: TimelineParticipant[];
  attachments?: TimelineAttachment[];
  navigation_url?: string; // URL to navigate to for full details
  location_en?: string;
  location_ar?: string;
  is_virtual?: boolean;
  virtual_link?: string;
  confidence_score?: number; // For intelligence reports
  report_type?: string; // For intelligence reports
  interaction_type?: string; // For dossier interactions
  document_type?: string; // For documents
  [key: string]: any; // Allow type-specific metadata
}

/**
 * Unified timeline event structure
 *
 * Aggregates data from multiple sources:
 * - calendar_entries
 * - dossier_interactions
 * - intelligence_reports
 * - documents
 * - mous
 * - positions
 * - dossier_relationships
 */
export interface UnifiedTimelineEvent {
  id: string;
  event_type: TimelineEventType;
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  event_date: string; // ISO 8601 datetime
  end_date?: string; // For multi-day events
  source_id: string; // Original record ID
  source_table: string; // Source table name
  priority: TimelinePriority;
  status?: TimelineEventStatus;
  metadata: TimelineEventMetadata;
  created_at: string;
  updated_at: string;
  created_by?: string; // User ID
}

/**
 * Filter options for timeline events
 */
export interface TimelineFilters {
  event_types?: TimelineEventType[];
  priority?: TimelinePriority[];
  status?: TimelineEventStatus[];
  date_from?: string; // ISO 8601 date
  date_to?: string; // ISO 8601 date
  search_query?: string; // Full-text search
  participants?: string[]; // Filter by participant IDs
}

/**
 * Timeline configuration per dossier type
 */
export interface TimelineConfig {
  dossier_type: 'Country' | 'Organization' | 'Person' | 'Engagement' | 'Forum' | 'WorkingGroup' | 'Topic';
  available_event_types: TimelineEventType[];
  default_event_types: TimelineEventType[];
  show_filters: boolean;
  show_search: boolean;
  show_date_range: boolean;
  enable_realtime: boolean;
  items_per_page: number;
}

/**
 * Timeline API response
 */
export interface TimelineResponse {
  events: UnifiedTimelineEvent[];
  next_cursor?: string;
  has_more: boolean;
  total_count?: number;
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
  | 'custom';

/**
 * Date range filter configuration
 */
export interface DateRangeConfig {
  preset: DateRangePreset;
  custom_from?: string;
  custom_to?: string;
}

/**
 * Timeline event card state
 */
export interface TimelineCardState {
  isExpanded: boolean;
  isLoading: boolean;
  error?: string;
}

/**
 * Timeline hook return type
 */
export interface UseUnifiedTimelineReturn {
  events: UnifiedTimelineEvent[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  refetch: () => void;
  filters: TimelineFilters;
  setFilters: (filters: TimelineFilters) => void;
}
