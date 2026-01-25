/**
 * Query Columns Constants
 * Feature: Performance optimization - reduce over-fetching
 *
 * Centralized column selections for Supabase queries to reduce
 * network payload by 30-70% compared to .select('*').
 *
 * Usage:
 *   import { COLUMNS } from '../lib/query-columns';
 *   const { data } = await supabaseAdmin.from('users').select(COLUMNS.USERS.PROFILE);
 */

// =============================================================================
// USERS TABLE
// =============================================================================
export const USERS_COLUMNS = {
  /** User profile data for auth and settings */
  PROFILE:
    'id, full_name, role, language_preference, timezone, avatar_url, is_active, mfa_enabled, last_login_at, organization_id',
  /** Minimal user info for display (e.g., assignee names) */
  MINIMAL: 'id, full_name, email',
  /** User info with username for fallback display */
  DISPLAY: 'full_name, username, email',
} as const

// =============================================================================
// COUNTRIES TABLE
// =============================================================================
export const COUNTRIES_COLUMNS = {
  /** List view columns */
  LIST: 'id, name_en, name_ar, iso_code, status, region, created_at',
  /** Detail view columns */
  DETAIL:
    'id, name_en, name_ar, iso_code, status, region, description_en, description_ar, metadata, tags, created_at, updated_at',
} as const

// =============================================================================
// COUNTRY RELATIONSHIPS TABLE
// =============================================================================
export const COUNTRY_RELATIONSHIPS_COLUMNS = {
  /** List view */
  LIST: 'id, country_id, related_country_id, relationship_type, status, notes, created_at, updated_at',
} as const

// =============================================================================
// DOSSIERS TABLE
// =============================================================================
export const DOSSIERS_COLUMNS = {
  /** List view columns */
  LIST: 'id, name_en, name_ar, type, status, created_at',
  /** Detail view columns */
  DETAIL:
    'id, name_en, name_ar, type, status, description_en, description_ar, sensitivity_level, tags, metadata, created_at, updated_at',
  /** Full columns for overview page */
  OVERVIEW:
    'id, name_en, name_ar, type, status, description_en, description_ar, sensitivity_level, tags, created_at, updated_at, metadata',
  /** Minimal for foreign key lookups */
  MINIMAL: 'id, name_en, name_ar',
} as const

// =============================================================================
// TASKS TABLE
// =============================================================================
export const TASKS_COLUMNS = {
  /** List view columns */
  LIST: 'id, title, description, status, priority, workflow_stage, assignee_id, engagement_id, sla_deadline, work_item_type, work_item_id, source, created_by, created_at, updated_at, completed_at, completed_by, is_deleted',
  /** Detail view with all fields */
  DETAIL:
    'id, title, title_en, title_ar, description, description_en, description_ar, status, priority, workflow_stage, assignee_id, engagement_id, sla_deadline, work_item_type, work_item_id, source, created_by, created_at, updated_at, completed_at, completed_by, is_deleted, deleted_at',
  /** Kanban board columns */
  KANBAN:
    'id, title, status, priority, workflow_stage, assignee_id, sla_deadline, created_at, updated_at',
} as const

// =============================================================================
// COMMITMENTS TABLE (aa_commitments)
// =============================================================================
export const COMMITMENTS_COLUMNS = {
  /** List view columns */
  LIST: 'id, dossier_id, after_action_id, title, description, due_date, owner_type, owner_user_id, owner_contact_id, priority, status, tracking_mode, proof_required, proof_url, evidence_submitted_at, completed_at, completion_notes, status_changed_at, created_by, updated_by, created_at, updated_at',
  /** Summary for dashboard widgets */
  SUMMARY: 'id, title, status, priority, due_date, deadline, assignee_id, created_at',
} as const

// =============================================================================
// CALENDAR EVENTS TABLE
// =============================================================================
export const CALENDAR_EVENTS_COLUMNS = {
  /** List view columns */
  LIST: 'id, title_en, title_ar, title, event_type, start_datetime, end_datetime, is_all_day, location_en, location_ar, location, is_virtual, meeting_link, description_en, description_ar, description, dossier_id, created_at',
} as const

// =============================================================================
// EVENTS TABLE
// =============================================================================
export const EVENTS_COLUMNS = {
  /** List view */
  LIST: 'id, title, start_date, end_date, event_type, status, location, country_id, created_at, updated_at',
} as const

// =============================================================================
// CONTACTS TABLE
// =============================================================================
export const CONTACTS_COLUMNS = {
  /** List view */
  LIST: 'id, name, name_ar, title, organization, email, phone, country_id, created_at, updated_at',
} as const

// =============================================================================
// TIMELINE EVENTS TABLE
// =============================================================================
export const TIMELINE_EVENTS_COLUMNS = {
  /** List view */
  LIST: 'id, event_type, event_date, title, description, country_id, entity_id, entity_type, created_at',
} as const

// =============================================================================
// MOUS TABLE
// =============================================================================
export const MOUS_COLUMNS = {
  /** List view */
  LIST: 'id, title, status, parties, signature_date, expiry_date, created_at, updated_at',
} as const

// =============================================================================
// INTAKE TICKETS TABLE
// =============================================================================
export const INTAKE_TICKETS_COLUMNS = {
  /** List view */
  LIST: 'id, subject, title, title_en, title_ar, description, description_ar, status, priority, sla_deadline, assigned_to_id, created_at, updated_at',
  /** Detail view */
  DETAIL:
    'id, subject, title, title_en, title_ar, description, description_ar, status, priority, sla_deadline, assigned_to_id, requester_id, requester_email, requester_name, ticket_type, source, created_at, updated_at, closed_at',
} as const

// =============================================================================
// INTELLIGENCE REPORTS TABLE
// =============================================================================
export const INTELLIGENCE_REPORTS_COLUMNS = {
  /** List view */
  LIST: 'id, title, report_type, source, priority, classification, status, publish_date, created_by, created_at, updated_at',
  /** Detail view */
  DETAIL:
    'id, title, content, summary, report_type, source, priority, classification, status, tags, publish_date, created_by, created_at, updated_at',
} as const

// =============================================================================
// AUDIT LOGS TABLE
// =============================================================================
export const AUDIT_LOGS_COLUMNS = {
  /** List view */
  LIST: 'id, user_id, action, entity_type, entity_id, changes, ip_address, user_agent, created_at',
} as const

// =============================================================================
// EMBEDDING QUEUE TABLE
// =============================================================================
export const EMBEDDING_QUEUE_COLUMNS = {
  /** List view */
  LIST: 'id, content_type, content_id, status, priority, error_message, attempts, created_at, processed_at',
} as const

// =============================================================================
// INTELLIGENCE EMBEDDINGS TABLE
// =============================================================================
export const INTELLIGENCE_EMBEDDINGS_COLUMNS = {
  /** List view */
  LIST: 'id, content_type, content_id, chunk_index, content, embedding, metadata, created_at',
} as const

// =============================================================================
// SLA TRACKER TABLE
// =============================================================================
export const SLA_TRACKER_COLUMNS = {
  /** List view */
  LIST: 'id, entity_type, entity_id, sla_type, deadline, status, breach_at, resolved_at, created_at, updated_at',
} as const

// =============================================================================
// SLA POLICIES TABLE
// =============================================================================
export const SLA_POLICIES_COLUMNS = {
  /** List view */
  LIST: 'id, priority, acknowledgment_target, resolution_target, business_hours_only, timezone, is_active, created_at, updated_at',
} as const

// =============================================================================
// SLA EVENTS TABLE
// =============================================================================
export const SLA_EVENTS_COLUMNS = {
  /** List view */
  LIST: 'id, ticket_id, policy_id, event_type, event_timestamp, elapsed_minutes, remaining_minutes, is_breached, created_by, reason, created_at',
} as const

// =============================================================================
// USER PREFERENCES TABLE
// =============================================================================
export const USER_PREFERENCES_COLUMNS = {
  /** All preferences */
  ALL: 'id, user_id, theme, color_mode, language, responsive_settings, created_at, updated_at',
} as const

// =============================================================================
// AI CONVERSATIONS TABLE
// =============================================================================
export const AI_CONVERSATIONS_COLUMNS = {
  /** List view */
  LIST: 'id, user_id, title, context_type, context_id, messages, model, tokens_used, created_at, updated_at',
} as const

// =============================================================================
// BRIEFS TABLE
// =============================================================================
export const BRIEFS_COLUMNS = {
  /** List view */
  LIST: 'id, dossier_id, content_en, content_ar, generated_by, generated_at, is_template, created_at',
} as const

// =============================================================================
// AFTER ACTION TABLE
// =============================================================================
export const AFTER_ACTION_COLUMNS = {
  /** List view */
  LIST: 'id, engagement_id, title, summary, key_outcomes, action_items, attendees, status, created_by, created_at, updated_at',
} as const

// =============================================================================
// DESIGN TOKENS TABLE
// =============================================================================
export const DESIGN_TOKENS_COLUMNS = {
  /** List view */
  LIST: 'id, name, category, value, description, theme_id, created_at, updated_at',
} as const

// =============================================================================
// LINK AUDIT TABLE
// =============================================================================
export const LINK_AUDIT_COLUMNS = {
  /** List view */
  LIST: 'id, source_type, source_id, target_type, target_id, link_type, status, last_checked, created_at',
} as const

// =============================================================================
// UNIFIED EXPORT
// =============================================================================
export const COLUMNS = {
  USERS: USERS_COLUMNS,
  COUNTRIES: COUNTRIES_COLUMNS,
  COUNTRY_RELATIONSHIPS: COUNTRY_RELATIONSHIPS_COLUMNS,
  DOSSIERS: DOSSIERS_COLUMNS,
  TASKS: TASKS_COLUMNS,
  COMMITMENTS: COMMITMENTS_COLUMNS,
  CALENDAR_EVENTS: CALENDAR_EVENTS_COLUMNS,
  EVENTS: EVENTS_COLUMNS,
  CONTACTS: CONTACTS_COLUMNS,
  TIMELINE_EVENTS: TIMELINE_EVENTS_COLUMNS,
  MOUS: MOUS_COLUMNS,
  INTAKE_TICKETS: INTAKE_TICKETS_COLUMNS,
  INTELLIGENCE_REPORTS: INTELLIGENCE_REPORTS_COLUMNS,
  AUDIT_LOGS: AUDIT_LOGS_COLUMNS,
  EMBEDDING_QUEUE: EMBEDDING_QUEUE_COLUMNS,
  INTELLIGENCE_EMBEDDINGS: INTELLIGENCE_EMBEDDINGS_COLUMNS,
  SLA_TRACKER: SLA_TRACKER_COLUMNS,
  SLA_POLICIES: SLA_POLICIES_COLUMNS,
  SLA_EVENTS: SLA_EVENTS_COLUMNS,
  USER_PREFERENCES: USER_PREFERENCES_COLUMNS,
  AI_CONVERSATIONS: AI_CONVERSATIONS_COLUMNS,
  BRIEFS: BRIEFS_COLUMNS,
  AFTER_ACTION: AFTER_ACTION_COLUMNS,
  DESIGN_TOKENS: DESIGN_TOKENS_COLUMNS,
  LINK_AUDIT: LINK_AUDIT_COLUMNS,
} as const

export default COLUMNS
