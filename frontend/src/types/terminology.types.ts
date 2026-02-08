// Terminology glossary types for bilingual term management
// These types support the diplomatic and technical terminology features

// ============================================================================
// Domain and Frequency Enums
// ============================================================================

export type TerminologyDomain =
  | 'diplomatic'
  | 'legal'
  | 'technical'
  | 'organizational'
  | 'un_system'
  | 'oic_system'
  | 'gcc_system'
  | 'government'
  | 'correspondence'
  | 'document_type'
  | 'priority'
  | 'role'
  | 'status'
  | 'process'
  | 'general'

export type FrequencyOfUse = 'rare' | 'uncommon' | 'common' | 'frequent' | 'very_frequent'

// ============================================================================
// Terminology Types
// ============================================================================

export interface Terminology {
  id: string
  term_en: string
  term_ar: string
  abbreviation_en?: string | null
  abbreviation_ar?: string | null
  definition_en?: string | null
  definition_ar?: string | null
  domain: TerminologyDomain
  subdomain?: string | null
  usage_notes_en?: string | null
  usage_notes_ar?: string | null
  example_sentence_en?: string | null
  example_sentence_ar?: string | null
  source?: string | null
  source_url?: string | null
  parent_term_id?: string | null
  related_terms: string[]
  synonyms_en: string[]
  synonyms_ar: string[]
  is_approved: boolean
  approved_by?: string | null
  approved_at?: string | null
  is_active: boolean
  tags: string[]
  frequency_of_use: FrequencyOfUse
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface TerminologyWithUsage extends Terminology {
  usage_count?: number
}

export interface CreateTerminologyRequest {
  term_en: string
  term_ar: string
  abbreviation_en?: string
  abbreviation_ar?: string
  definition_en?: string
  definition_ar?: string
  domain: TerminologyDomain
  subdomain?: string
  usage_notes_en?: string
  usage_notes_ar?: string
  example_sentence_en?: string
  example_sentence_ar?: string
  source?: string
  source_url?: string
  parent_term_id?: string
  related_terms?: string[]
  synonyms_en?: string[]
  synonyms_ar?: string[]
  tags?: string[]
  frequency_of_use?: FrequencyOfUse
}

export interface UpdateTerminologyRequest extends Partial<CreateTerminologyRequest> {
  is_approved?: boolean
  is_active?: boolean
}

// ============================================================================
// Term Translation Types
// ============================================================================

export interface TermTranslation {
  id: string
  terminology_id: string
  language_code: string
  language_name: string
  term: string
  abbreviation?: string | null
  definition?: string | null
  usage_notes?: string | null
  is_approved: boolean
  approved_by?: string | null
  created_at: string
  created_by?: string | null
}

export interface CreateTranslationRequest {
  terminology_id: string
  language_code: string
  language_name: string
  term: string
  abbreviation?: string
  definition?: string
  usage_notes?: string
}

export interface UpdateTranslationRequest {
  term?: string
  abbreviation?: string
  definition?: string
  usage_notes?: string
  is_approved?: boolean
}

// ============================================================================
// Term Usage Log Types
// ============================================================================

export interface TermUsageLog {
  id: string
  terminology_id: string
  entity_type: string
  entity_id: string
  context_snippet?: string | null
  language: string
  used_at: string
}

export interface LogUsageRequest {
  terminology_id: string
  entity_type: string
  entity_id: string
  context_snippet?: string
  language?: string
}

// ============================================================================
// Related Term Types
// ============================================================================

export type TermRelationType = 'related' | 'parent' | 'child'

export interface RelatedTerm {
  id: string
  term_en: string
  term_ar: string
  abbreviation_en?: string
  domain: TerminologyDomain
  relation_type: TermRelationType
}

// ============================================================================
// Search Types
// ============================================================================

export interface TermSearchResult extends Terminology {
  match_score: number
}

export interface TermSearchParams {
  query: string
  domain?: TerminologyDomain
  language?: 'en' | 'ar'
  limit?: number
}

// ============================================================================
// Most Used Terms Types
// ============================================================================

export interface MostUsedTerm {
  id: string
  term_en: string
  term_ar: string
  abbreviation_en?: string
  domain: TerminologyDomain
  usage_count: number
}

export interface MostUsedTermsParams {
  domain?: TerminologyDomain
  days?: number
  limit?: number
}

// ============================================================================
// API Response Types
// ============================================================================

export interface TerminologyListResponse {
  data: TerminologyWithUsage[]
  total: number
  pagination: {
    page: number
    limit: number
    total_pages: number
  }
}

export interface TermSearchResponse {
  data: TermSearchResult[]
  total: number
}

export interface RelatedTermsResponse {
  data: RelatedTerm[]
  total: number
}

export interface TranslationsResponse {
  data: TermTranslation[]
  total: number
}

// ============================================================================
// Filter Types
// ============================================================================

export interface TerminologyFilters {
  domain?: TerminologyDomain
  subdomain?: string
  is_approved?: boolean
  is_active?: boolean
  has_abbreviation?: boolean
  frequency_of_use?: FrequencyOfUse
  created_after?: string
  created_before?: string
}

// ============================================================================
// Predefined Term Categories (for UI)
// ============================================================================

export const TERMINOLOGY_DOMAINS: Record<TerminologyDomain, { en: string; ar: string }> = {
  diplomatic: { en: 'Diplomatic', ar: 'دبلوماسي' },
  legal: { en: 'Legal', ar: 'قانوني' },
  technical: { en: 'Technical', ar: 'تقني' },
  organizational: { en: 'Organizational', ar: 'تنظيمي' },
  un_system: { en: 'UN System', ar: 'منظومة الأمم المتحدة' },
  oic_system: { en: 'OIC System', ar: 'منظومة التعاون الإسلامي' },
  gcc_system: { en: 'GCC System', ar: 'منظومة الخليج' },
  government: { en: 'Government', ar: 'حكومي' },
  correspondence: { en: 'Correspondence', ar: 'مراسلات' },
  document_type: { en: 'Document Type', ar: 'نوع المستند' },
  priority: { en: 'Priority', ar: 'أولوية' },
  role: { en: 'Role', ar: 'دور' },
  status: { en: 'Status', ar: 'حالة' },
  process: { en: 'Process', ar: 'إجراء' },
  general: { en: 'General', ar: 'عام' },
}

export const FREQUENCY_LABELS: Record<FrequencyOfUse, { en: string; ar: string }> = {
  rare: { en: 'Rare', ar: 'نادر' },
  uncommon: { en: 'Uncommon', ar: 'غير شائع' },
  common: { en: 'Common', ar: 'شائع' },
  frequent: { en: 'Frequent', ar: 'متكرر' },
  very_frequent: { en: 'Very Frequent', ar: 'متكرر جداً' },
}
