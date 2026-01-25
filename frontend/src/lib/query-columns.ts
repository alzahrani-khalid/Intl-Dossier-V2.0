/**
 * Query Columns Constants
 * Feature: Performance optimization - reduce over-fetching
 *
 * Centralized column selections for Supabase queries to reduce
 * network payload by 30-70% compared to .select('*').
 *
 * Usage:
 *   import { COLUMNS } from '@/lib/query-columns';
 *   const { data } = await supabase.from('users').select(COLUMNS.USERS.PROFILE);
 */

// =============================================================================
// USERS TABLE
// =============================================================================
export const USERS_COLUMNS = {
  /** User profile data for auth and settings */
  PROFILE:
    'id, full_name, role, language_preference, timezone, avatar_url, is_active, mfa_enabled, last_login_at, mfa_backup_codes, default_organization_id',
  /** Minimal user info for display (e.g., assignee names) */
  MINIMAL: 'id, full_name, email',
  /** User info with username for fallback display */
  DISPLAY: 'full_name, username, email',
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
  /** Detail view with all fields */
  DETAIL:
    'id, dossier_id, after_action_id, title, description, due_date, owner_type, owner_user_id, owner_contact_id, priority, status, tracking_mode, proof_required, proof_url, evidence_submitted_at, completed_at, completion_notes, status_changed_at, created_by, updated_by, created_at, updated_at',
  /** Summary for dashboard widgets */
  SUMMARY: 'id, title, status, priority, due_date, deadline, assignee_id, created_at',
} as const

// =============================================================================
// CALENDAR EVENTS TABLE
// =============================================================================
export const CALENDAR_EVENTS_COLUMNS = {
  /** List view columns */
  LIST: 'id, title_en, title_ar, title, event_type, start_datetime, end_datetime, is_all_day, location_en, location_ar, location, is_virtual, meeting_link, description_en, description_ar, description, dossier_id, created_at',
  /** Detail view */
  DETAIL:
    'id, title_en, title_ar, title, event_type, start_datetime, end_datetime, is_all_day, location_en, location_ar, location, is_virtual, meeting_link, description_en, description_ar, description, dossier_id, created_at, updated_at',
} as const

// =============================================================================
// KEY CONTACTS TABLE
// =============================================================================
export const KEY_CONTACTS_COLUMNS = {
  /** List view columns */
  LIST: 'id, name, name_ar, role, title_en, title_ar, organization, organization_ar, email, phone, photo_url, last_interaction_date, notes, linked_person_dossier_id, dossier_id',
} as const

// =============================================================================
// POSITIONS TABLE
// =============================================================================
export const POSITIONS_COLUMNS = {
  /** List view */
  LIST: 'id, title_en, title_ar, status, created_at, updated_at',
  /** Minimal for lookups */
  MINIMAL: 'title_en, title_ar',
} as const

// =============================================================================
// INTAKE TICKETS TABLE
// =============================================================================
export const INTAKE_TICKETS_COLUMNS = {
  /** List view */
  LIST: 'id, subject, title, title_en, title_ar, description, description_ar, status, priority, sla_deadline, assigned_to_id, created_at, updated_at',
  /** Minimal for lookups */
  MINIMAL: 'title, title_ar',
} as const

// =============================================================================
// ENGAGEMENTS TABLE
// =============================================================================
export const ENGAGEMENTS_COLUMNS = {
  /** List view */
  LIST: 'id, title, engagement_type, engagement_date, location, dossier_id, status, created_at',
  /** With dossier join */
  WITH_DOSSIER: `
    id,
    title,
    engagement_type,
    engagement_date,
    location,
    dossier_id,
    dossiers (
      id,
      name_en,
      name_ar
    )
  `,
} as const

// =============================================================================
// COMMITMENT STATUS HISTORY TABLE
// =============================================================================
export const COMMITMENT_STATUS_HISTORY_COLUMNS = {
  /** Full history entry */
  LIST: 'id, commitment_id, old_status, new_status, changed_at, changed_by, notes',
} as const

// =============================================================================
// USER PREFERENCES TABLE
// =============================================================================
export const USER_PREFERENCES_COLUMNS = {
  /** All preferences */
  ALL: 'id, user_id, theme, color_mode, language, created_at, updated_at',
} as const

// =============================================================================
// DOSSIER RELATIONSHIPS TABLE
// =============================================================================
export const DOSSIER_RELATIONSHIPS_COLUMNS = {
  /** Outgoing relationships with target dossier */
  OUTGOING: `
    id,
    relationship_type,
    effective_from,
    effective_to,
    notes_en,
    notes_ar,
    created_at,
    target_dossier:target_dossier_id(id, name_en, name_ar, type, status)
  `,
  /** Incoming relationships with source dossier */
  INCOMING: `
    id,
    relationship_type,
    effective_from,
    effective_to,
    notes_en,
    notes_ar,
    created_at,
    source_dossier:source_dossier_id(id, name_en, name_ar, type, status)
  `,
} as const

// =============================================================================
// POSITION DOSSIER LINKS TABLE
// =============================================================================
export const POSITION_DOSSIER_LINKS_COLUMNS = {
  /** With position join */
  WITH_POSITION: `
    position:position_id(id, title_en, title_ar, status, created_at, updated_at)
  `,
} as const

// =============================================================================
// MOUS TABLE
// =============================================================================
export const MOUS_COLUMNS = {
  /** List view */
  LIST: 'id, title, status, created_at, updated_at',
} as const

// =============================================================================
// BRIEFS TABLE
// =============================================================================
export const BRIEFS_COLUMNS = {
  /** List view */
  LIST: 'id, content_en, content_ar, generated_by, generated_at, is_template, dossier_id',
} as const

// =============================================================================
// WORK ITEM DOSSIERS TABLE
// =============================================================================
export const WORK_ITEM_DOSSIERS_COLUMNS = {
  /** List view */
  LIST: 'work_item_type, work_item_id, inheritance_source, dossier_id',
} as const

// =============================================================================
// COMMITMENT DELIVERABLES TABLE
// =============================================================================
export const COMMITMENT_DELIVERABLES_COLUMNS = {
  /** List view */
  LIST: 'id, commitment_id, title_en, title_ar, description_en, description_ar, deliverable_type, status, due_date, progress, weight, sort_order, notes, completed_at, created_by, updated_by, created_at, updated_at',
} as const

// =============================================================================
// TASK CONTRIBUTORS TABLE
// =============================================================================
export const TASK_CONTRIBUTORS_COLUMNS = {
  /** List view */
  LIST: 'id, task_id, user_id, role, added_at, added_by, removed_at, removed_by',
} as const

// =============================================================================
// LEGISLATION SPONSORS TABLE
// =============================================================================
export const LEGISLATION_SPONSORS_COLUMNS = {
  /** List view */
  LIST: 'id, legislation_id, sponsor_name, sponsor_name_ar, sponsor_type, party, position, contact_email, contact_phone, notes, created_at',
} as const

// =============================================================================
// LEGISLATION AMENDMENTS TABLE
// =============================================================================
export const LEGISLATION_AMENDMENTS_COLUMNS = {
  /** List view */
  LIST: 'id, legislation_id, amendment_number, title_en, title_ar, description_en, description_ar, proposed_date, status, proposed_by, vote_date, vote_result, legislation_version, created_by, created_at, updated_at',
} as const

// =============================================================================
// LEGISLATION DEADLINES TABLE
// =============================================================================
export const LEGISLATION_DEADLINES_COLUMNS = {
  /** List view */
  LIST: 'id, legislation_id, deadline_type, deadline_date, title_en, title_ar, description_en, description_ar, is_critical, is_completed, completed_at, completed_by, reminder_days, created_by, created_at, updated_at',
} as const

// =============================================================================
// LEGISLATION STATUS HISTORY TABLE
// =============================================================================
export const LEGISLATION_STATUS_HISTORY_COLUMNS = {
  /** List view */
  LIST: 'id, legislation_id, old_status, new_status, changed_at, changed_by, change_reason, change_notes_en, change_notes_ar',
} as const

// =============================================================================
// UNIFIED EXPORT
// =============================================================================
export const COLUMNS = {
  USERS: USERS_COLUMNS,
  DOSSIERS: DOSSIERS_COLUMNS,
  TASKS: TASKS_COLUMNS,
  COMMITMENTS: COMMITMENTS_COLUMNS,
  CALENDAR_EVENTS: CALENDAR_EVENTS_COLUMNS,
  KEY_CONTACTS: KEY_CONTACTS_COLUMNS,
  POSITIONS: POSITIONS_COLUMNS,
  INTAKE_TICKETS: INTAKE_TICKETS_COLUMNS,
  ENGAGEMENTS: ENGAGEMENTS_COLUMNS,
  COMMITMENT_STATUS_HISTORY: COMMITMENT_STATUS_HISTORY_COLUMNS,
  USER_PREFERENCES: USER_PREFERENCES_COLUMNS,
  DOSSIER_RELATIONSHIPS: DOSSIER_RELATIONSHIPS_COLUMNS,
  POSITION_DOSSIER_LINKS: POSITION_DOSSIER_LINKS_COLUMNS,
  MOUS: MOUS_COLUMNS,
  BRIEFS: BRIEFS_COLUMNS,
  WORK_ITEM_DOSSIERS: WORK_ITEM_DOSSIERS_COLUMNS,
  COMMITMENT_DELIVERABLES: COMMITMENT_DELIVERABLES_COLUMNS,
  TASK_CONTRIBUTORS: TASK_CONTRIBUTORS_COLUMNS,
  LEGISLATION_SPONSORS: LEGISLATION_SPONSORS_COLUMNS,
  LEGISLATION_AMENDMENTS: LEGISLATION_AMENDMENTS_COLUMNS,
  LEGISLATION_DEADLINES: LEGISLATION_DEADLINES_COLUMNS,
  LEGISLATION_STATUS_HISTORY: LEGISLATION_STATUS_HISTORY_COLUMNS,
} as const

export default COLUMNS
