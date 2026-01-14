/**
 * Saved Search Types
 * Feature: saved-searches-feature
 * Description: Type definitions for saved searches with sharing and alerts
 */

import type {
  TemplateDefinition,
  SearchableEntityType,
  FilterCondition,
} from './advanced-search.types'

// Saved search categories
export type SavedSearchCategory = 'personal' | 'team' | 'organization' | 'smart' | 'recent'

// Share types
export type ShareType = 'user' | 'team' | 'organization' | 'public'

// Share permissions
export type SharePermission = 'view' | 'edit' | 'admin'

// Alert frequency
export type AlertFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly'

// Alert trigger conditions
export type AlertTrigger = 'new_results' | 'result_changes' | 'threshold_reached'

// Saved search definition (same as template definition but with more context)
export interface SavedSearchDefinition extends TemplateDefinition {
  // Additional metadata tracked for saved searches
}

// Saved search model
export interface SavedSearch {
  id: string
  user_id: string
  name_en: string
  name_ar: string
  description_en: string | null
  description_ar: string | null
  icon: string
  color: string
  search_definition: SavedSearchDefinition
  category: SavedSearchCategory
  tags: string[]
  is_pinned: boolean
  pin_order: number
  use_count: number
  last_used_at: string | null
  last_result_count: number | null
  created_at: string
  updated_at: string
  // Extended fields when fetching with shares/alerts
  is_shared?: boolean
  permission?: SharePermission
  shared_by_name?: string
  shares?: SavedSearchShare[]
  alert?: SavedSearchAlert | null
}

// Share model
export interface SavedSearchShare {
  id: string
  saved_search_id: string
  share_type: ShareType
  shared_with_user_id: string | null
  shared_with_team_id: string | null
  permission: SharePermission
  shared_by: string
  message: string | null
  created_at: string
  expires_at: string | null
  // Extended fields
  shared_with_user?: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
  shared_with_team?: {
    id: string
    name: string
  }
}

// Alert configuration
export interface SavedSearchAlert {
  id: string
  saved_search_id: string
  user_id: string
  is_enabled: boolean
  frequency: AlertFrequency
  notify_in_app: boolean
  notify_email: boolean
  notify_push: boolean
  trigger_on: AlertTrigger
  threshold_count: number | null
  last_check_at: string | null
  last_alert_at: string | null
  last_result_count: number | null
  alert_count: number
  created_at: string
  updated_at: string
}

// Alert history entry
export interface AlertHistoryEntry {
  id: string
  alert_id: string
  triggered_at: string
  trigger_reason: string
  new_result_count: number
  previous_result_count: number | null
  new_item_ids: string[]
  delivered_in_app: boolean
  delivered_email: boolean
  delivered_push: boolean
  read_at: string | null
  dismissed_at: string | null
}

// API request types
export interface CreateSavedSearchRequest {
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  icon?: string
  color?: string
  search_definition: SavedSearchDefinition
  category?: SavedSearchCategory
  tags?: string[]
  is_pinned?: boolean
}

export interface UpdateSavedSearchRequest {
  name_en?: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  icon?: string
  color?: string
  search_definition?: SavedSearchDefinition
  category?: SavedSearchCategory
  tags?: string[]
  is_pinned?: boolean
  pin_order?: number
}

export interface ShareSavedSearchRequest {
  share_type: ShareType
  shared_with_user_id?: string
  shared_with_team_id?: string
  permission?: SharePermission
  message?: string
  expires_at?: string
}

export interface CreateAlertRequest {
  is_enabled?: boolean
  frequency?: AlertFrequency
  notify_in_app?: boolean
  notify_email?: boolean
  notify_push?: boolean
  trigger_on?: AlertTrigger
  threshold_count?: number
}

export interface UpdateAlertRequest extends CreateAlertRequest {}

// API response types
export interface SavedSearchListResponse {
  data: SavedSearch[]
  count: number
  limit: number
  offset: number
  metadata: {
    has_more: boolean
    next_offset: number | null
  }
}

export interface SavedSearchResponse {
  data: SavedSearch
}

export interface ShareResponse {
  data: SavedSearchShare
}

export interface AlertResponse {
  data: SavedSearchAlert
}

export interface ExecuteSearchResponse {
  data: SearchResult[]
  count: number
  search_id: string
}

export interface SearchResult {
  entity_id: string
  entity_type: SearchableEntityType
  title_en: string
  title_ar: string
  snippet_en: string
  snippet_ar: string
  rank_score: number
  status: string
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
}

// List params
export interface SavedSearchListParams {
  category?: SavedSearchCategory
  limit?: number
  offset?: number
  include_shared?: boolean
  pinned_only?: boolean
}

// Smart filter (predefined system template)
export interface SmartFilter {
  id: string
  name_en: string
  name_ar: string
  description_en: string | null
  description_ar: string | null
  icon: string
  color: string
  category: string
  template_definition: SavedSearchDefinition
  is_system: boolean
  is_public: boolean
  use_count: number
  created_at: string
  updated_at: string
}

// Color options for UI
export const SAVED_SEARCH_COLORS = [
  { value: 'blue', label_en: 'Blue', label_ar: 'أزرق' },
  { value: 'green', label_en: 'Green', label_ar: 'أخضر' },
  { value: 'red', label_en: 'Red', label_ar: 'أحمر' },
  { value: 'purple', label_en: 'Purple', label_ar: 'بنفسجي' },
  { value: 'orange', label_en: 'Orange', label_ar: 'برتقالي' },
  { value: 'yellow', label_en: 'Yellow', label_ar: 'أصفر' },
  { value: 'gray', label_en: 'Gray', label_ar: 'رمادي' },
  { value: 'pink', label_en: 'Pink', label_ar: 'وردي' },
  { value: 'indigo', label_en: 'Indigo', label_ar: 'نيلي' },
  { value: 'teal', label_en: 'Teal', label_ar: 'أخضر مزرق' },
] as const

// Category options for UI
export const SAVED_SEARCH_CATEGORIES = [
  { value: 'personal', label_en: 'Personal', label_ar: 'شخصي', icon: 'user' },
  { value: 'team', label_en: 'Team', label_ar: 'فريق', icon: 'users' },
  { value: 'organization', label_en: 'Organization', label_ar: 'منظمة', icon: 'building' },
  { value: 'smart', label_en: 'Smart Filter', label_ar: 'فلتر ذكي', icon: 'sparkles' },
  { value: 'recent', label_en: 'Recent', label_ar: 'حديث', icon: 'clock' },
] as const

// Alert frequency options for UI
export const ALERT_FREQUENCY_OPTIONS = [
  {
    value: 'realtime',
    label_en: 'Real-time',
    label_ar: 'فوري',
    description_en: 'Immediate notifications',
    description_ar: 'إشعارات فورية',
  },
  {
    value: 'hourly',
    label_en: 'Hourly',
    label_ar: 'كل ساعة',
    description_en: 'Check every hour',
    description_ar: 'فحص كل ساعة',
  },
  {
    value: 'daily',
    label_en: 'Daily',
    label_ar: 'يومي',
    description_en: 'Daily digest',
    description_ar: 'ملخص يومي',
  },
  {
    value: 'weekly',
    label_en: 'Weekly',
    label_ar: 'أسبوعي',
    description_en: 'Weekly summary',
    description_ar: 'ملخص أسبوعي',
  },
  {
    value: 'monthly',
    label_en: 'Monthly',
    label_ar: 'شهري',
    description_en: 'Monthly summary',
    description_ar: 'ملخص شهري',
  },
] as const

// Alert trigger options for UI
export const ALERT_TRIGGER_OPTIONS = [
  {
    value: 'new_results',
    label_en: 'New Results',
    label_ar: 'نتائج جديدة',
    description_en: 'Alert when new items match',
    description_ar: 'تنبيه عند مطابقة عناصر جديدة',
  },
  {
    value: 'result_changes',
    label_en: 'Result Changes',
    label_ar: 'تغيير النتائج',
    description_en: 'Alert when result count changes',
    description_ar: 'تنبيه عند تغيير عدد النتائج',
  },
  {
    value: 'threshold_reached',
    label_en: 'Threshold Reached',
    label_ar: 'الوصول للحد',
    description_en: 'Alert when results exceed threshold',
    description_ar: 'تنبيه عند تجاوز النتائج للحد',
  },
] as const

// Share permission options for UI
export const SHARE_PERMISSION_OPTIONS = [
  {
    value: 'view',
    label_en: 'View Only',
    label_ar: 'عرض فقط',
    description_en: 'Can only execute the search',
    description_ar: 'يمكنه تنفيذ البحث فقط',
  },
  {
    value: 'edit',
    label_en: 'Can Edit',
    label_ar: 'يمكنه التعديل',
    description_en: 'Can modify search settings',
    description_ar: 'يمكنه تعديل إعدادات البحث',
  },
  {
    value: 'admin',
    label_en: 'Full Access',
    label_ar: 'وصول كامل',
    description_en: 'Can share and delete',
    description_ar: 'يمكنه المشاركة والحذف',
  },
] as const
