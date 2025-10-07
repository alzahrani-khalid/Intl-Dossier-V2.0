// Dossier types generated from spec/009-dossiers-hub/data-model.md

export type DossierType = 'country' | 'organization' | 'forum' | 'theme';
export type DossierStatus = 'active' | 'inactive' | 'archived';
export type SensitivityLevel = 'low' | 'medium' | 'high';
export type GeneratedBy = 'ai' | 'manual';
export type EventType =
  | 'engagement'
  | 'position'
  | 'mou'
  | 'commitment'
  | 'document'
  | 'intelligence';
export type RoleType = 'owner' | 'co-owner' | 'reviewer';

export interface Dossier {
  id: string;
  name_en: string;
  name_ar: string;
  type: DossierType;
  status: DossierStatus;
  sensitivity_level: SensitivityLevel;
  summary_en: string | null;
  summary_ar: string | null;
  tags: string[];
  review_cadence: string | null;
  last_review_date: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

export interface DossierCreate {
  name_en: string;
  name_ar: string;
  type: DossierType;
  sensitivity_level?: SensitivityLevel;
  summary_en?: string;
  summary_ar?: string;
  tags?: string[];
  review_cadence?: string;
}

export interface DossierUpdate {
  version: number;
  name_en?: string;
  name_ar?: string;
  status?: DossierStatus;
  sensitivity_level?: SensitivityLevel;
  summary_en?: string;
  summary_ar?: string;
  tags?: string[];
  review_cadence?: string;
  last_review_date?: string;
}

export interface DossierStats {
  total_engagements: number;
  total_positions: number;
  total_mous: number;
  active_commitments: number;
  overdue_commitments: number;
  total_documents: number;
  recent_activity_count: number;
  relationship_health_score: number | null;
}

export interface DossierOwner {
  dossier_id: string;
  user_id: string;
  user_name?: string;
  assigned_at: string;
  role_type: RoleType;
}

export interface KeyContact {
  id: string;
  dossier_id: string;
  name: string;
  role: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  last_interaction_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BriefContent {
  summary: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
}

export interface Brief {
  id: string;
  dossier_id: string;
  content_en: BriefContent;
  content_ar: BriefContent;
  date_range_start: string | null;
  date_range_end: string | null;
  generated_by: GeneratedBy;
  generated_at: string;
  generated_by_user_id: string | null;
  is_template: boolean;
}

export interface BriefSummary {
  id: string;
  generated_at: string;
  generated_by: GeneratedBy;
  summary_en: string;
  summary_ar: string;
}

export interface BriefTemplate {
  sections: Array<{
    id: string;
    title_en: string;
    title_ar: string;
    placeholder_en: string;
    placeholder_ar: string;
    required: boolean;
  }>;
}

export interface TimelineEvent {
  dossier_id: string;
  event_type: EventType;
  source_id: string;
  event_date: string;
  event_title_en: string;
  event_title_ar: string;
  event_description_en: string | null;
  event_description_ar: string | null;
  metadata: Record<string, unknown>;
}

export interface CursorPagination {
  next_cursor: string | null;
  has_more: boolean;
  total_count?: number;
}

export interface DossierListResponse {
  data: Dossier[];
  pagination: CursorPagination;
}

export interface TimelineEventResponse {
  data: TimelineEvent[];
  pagination: CursorPagination;
}

export interface DossierDetailResponse extends Dossier {
  stats?: DossierStats;
  owners?: DossierOwner[];
  contacts?: KeyContact[];
  recent_briefs?: BriefSummary[];
}

export interface DossierFilters {
  type?: DossierType;
  status?: DossierStatus;
  sensitivity?: SensitivityLevel;
  owner_id?: string;
  tags?: string[];
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface TimelineFilters {
  event_type?: EventType[];
  start_date?: string;
  end_date?: string;
  cursor?: string;
  limit?: number;
}

export interface ErrorDetail {
  code: string;
  message_en: string;
  message_ar: string;
  details?: Record<string, unknown>;
}

export interface ApiError {
  error: ErrorDetail;
}

export interface ConflictError extends ApiError {
  error: ErrorDetail & {
    current_version: number;
  };
}

export interface BriefGenerationFallback {
  error: ErrorDetail;
  fallback: {
    template: BriefTemplate;
    pre_populated_data: Record<string, unknown>;
  };
}