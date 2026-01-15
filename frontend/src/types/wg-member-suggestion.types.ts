/**
 * Working Group Member Suggestion Types
 * Feature: working-group-member-suggestions
 *
 * Type definitions for AI-powered working group member suggestions
 */

/**
 * Types of suggestions that can be generated
 */
export type WGSuggestionType =
  | 'parent_forum_member'
  | 'related_engagement'
  | 'past_collaboration'
  | 'lead_org_affiliate'
  | 'topic_expertise'
  | 'country_representation'
  | 'organizational_mandate'
  | 'role_seniority'

/**
 * Entity types that can be suggested
 */
export type SuggestedEntityType = 'organization' | 'person'

/**
 * Suggestion status
 */
export type WGSuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

/**
 * Member roles available
 */
export type MemberRole =
  | 'chair'
  | 'co_chair'
  | 'vice_chair'
  | 'secretary'
  | 'member'
  | 'observer'
  | 'advisor'
  | 'liaison'

/**
 * A single member suggestion
 */
export interface WGMemberSuggestion {
  suggested_entity_type: SuggestedEntityType
  suggested_organization_id: string | null
  suggested_person_id: string | null
  suggested_name_en: string
  suggested_name_ar: string
  suggestion_type: WGSuggestionType
  confidence_score: number
  suggested_role: MemberRole
  context_notes_en: string
  context_notes_ar: string
  evidence: WGSuggestionEvidence
}

/**
 * Evidence supporting a suggestion
 */
export interface WGSuggestionEvidence {
  // Forum-based suggestions
  parent_forum_id?: string
  parent_forum_name_en?: string
  parent_forum_name_ar?: string
  engagement_count?: number

  // Engagement-based suggestions
  engagements?: Array<{
    engagement_id: string
    engagement_name: string
    role: string
  }>
  organization_name_en?: string
  organization_name_ar?: string
  title?: string

  // Past collaboration suggestions
  past_wg_count?: number
  past_wg_names?: string[]

  // Lead org suggestions
  lead_org_id?: string
  lead_org_name_en?: string
  lead_org_name_ar?: string
  role_title?: string
  importance_level?: number
}

/**
 * Summary of suggestions for a working group
 */
export interface WGSuggestionSummary {
  total_suggestions: number
  existing_member_count: number
  has_no_members: boolean
  suggestion_types: Array<{
    type: WGSuggestionType
    count: number
    avg_confidence: number
  }>
  high_confidence_count: number
  organization_suggestions: number
  person_suggestions: number
}

/**
 * API response for getting suggestions
 */
export interface GetWGSuggestionsResponse {
  suggestions: WGMemberSuggestion[]
  grouped_by_type: Record<string, WGMemberSuggestion[]>
  summary: WGSuggestionSummary
  metadata: {
    working_group_id: string
    generated_at: string
    limit: number
  }
}

/**
 * Request to add bulk members
 */
export interface BulkAddMembersRequest {
  working_group_id: string
  members: Array<{
    entity_type: SuggestedEntityType
    organization_id?: string
    person_id?: string
    role?: MemberRole
    notes?: string
  }>
}

/**
 * Result of a single member addition
 */
export interface BulkAddMemberResult {
  member_id: string | null
  entity_type: SuggestedEntityType
  organization_id: string | null
  person_id: string | null
  role: string
  success: boolean
  error_message: string | null
}

/**
 * API response for bulk add
 */
export interface BulkAddMembersResponse {
  success: boolean
  results: BulkAddMemberResult[]
  summary: {
    total_requested: number
    added_count: number
    failed_count: number
  }
  message: string
  message_ar: string
}

/**
 * Request to reject a suggestion
 */
export interface RejectWGSuggestionRequest {
  working_group_id: string
  entity_type: SuggestedEntityType
  organization_id?: string
  person_id?: string
  suggestion_type: WGSuggestionType
}

/**
 * Labels for suggestion types
 */
export const WG_SUGGESTION_TYPE_LABELS: Record<WGSuggestionType, { en: string; ar: string }> = {
  parent_forum_member: { en: 'Forum Member', ar: 'عضو منتدى' },
  related_engagement: { en: 'Related Engagement', ar: 'مشاركة ذات صلة' },
  past_collaboration: { en: 'Past Collaboration', ar: 'تعاون سابق' },
  lead_org_affiliate: { en: 'Lead Organization', ar: 'المنظمة الرائدة' },
  topic_expertise: { en: 'Topic Expert', ar: 'خبير في الموضوع' },
  country_representation: { en: 'Country Rep', ar: 'ممثل دولة' },
  organizational_mandate: { en: 'Mandate Match', ar: 'تطابق التفويض' },
  role_seniority: { en: 'Senior Role', ar: 'دور رفيع' },
}

/**
 * Labels for member roles
 */
export const MEMBER_ROLE_LABELS: Record<MemberRole, { en: string; ar: string }> = {
  chair: { en: 'Chair', ar: 'رئيس' },
  co_chair: { en: 'Co-Chair', ar: 'رئيس مشارك' },
  vice_chair: { en: 'Vice Chair', ar: 'نائب الرئيس' },
  secretary: { en: 'Secretary', ar: 'أمين السر' },
  member: { en: 'Member', ar: 'عضو' },
  observer: { en: 'Observer', ar: 'مراقب' },
  advisor: { en: 'Advisor', ar: 'مستشار' },
  liaison: { en: 'Liaison', ar: 'منسق' },
}

/**
 * Icons for suggestion types
 */
export const WG_SUGGESTION_TYPE_ICONS: Record<WGSuggestionType, string> = {
  parent_forum_member: 'users',
  related_engagement: 'calendar',
  past_collaboration: 'history',
  lead_org_affiliate: 'building2',
  topic_expertise: 'lightbulb',
  country_representation: 'flag',
  organizational_mandate: 'file-text',
  role_seniority: 'crown',
}

/**
 * Get confidence level label
 */
export function getWGConfidenceLabel(score: number): {
  en: string
  ar: string
  variant: 'high' | 'medium' | 'low'
} {
  if (score >= 0.85) {
    return { en: 'Highly Recommended', ar: 'موصى به بشدة', variant: 'high' }
  } else if (score >= 0.7) {
    return { en: 'Recommended', ar: 'موصى به', variant: 'medium' }
  } else {
    return { en: 'Suggested', ar: 'مقترح', variant: 'low' }
  }
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: MemberRole): string {
  switch (role) {
    case 'chair':
      return 'bg-primary text-primary-foreground'
    case 'co_chair':
    case 'vice_chair':
      return 'bg-primary/80 text-primary-foreground'
    case 'secretary':
      return 'bg-blue-500 text-white'
    case 'advisor':
      return 'bg-amber-500 text-white'
    case 'observer':
      return 'bg-muted text-muted-foreground'
    case 'liaison':
      return 'bg-purple-500 text-white'
    default:
      return 'bg-secondary text-secondary-foreground'
  }
}
