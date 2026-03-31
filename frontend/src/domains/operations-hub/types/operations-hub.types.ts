/**
 * Operations Hub Type Definitions
 * Phase 10: Operations Hub Dashboard
 *
 * Central types for the Operations Hub including:
 * - Dashboard roles and zone ordering
 * - Attention items (overdue, due-soon, SLA, stalled)
 * - Timeline events with day grouping
 * - Engagement stage groups
 * - Dashboard stats and activity feed
 */

import type { LifecycleStage } from '@/types/lifecycle.types'

// ============================================================================
// Dashboard Roles & Zone Ordering
// ============================================================================

export type DashboardRole = 'leadership' | 'officer' | 'analyst'

export const ZONE_ORDER: Record<DashboardRole, string[]> = {
  leadership: ['engagements', 'stats', 'attention', 'timeline', 'activity'],
  officer: ['attention', 'timeline', 'stats', 'engagements', 'activity'],
  analyst: ['timeline', 'activity', 'attention', 'engagements', 'stats'],
}

export const ROLE_MAP: Record<string, DashboardRole> = {
  admin: 'leadership',
  manager: 'leadership',
  officer: 'officer',
  user: 'officer',
  analyst: 'analyst',
  viewer: 'officer',
}

// ============================================================================
// Attention Zone Types
// ============================================================================

export type AttentionSeverity = 'red' | 'orange' | 'yellow'
export type AttentionItemType =
  | 'overdue_work'
  | 'due_soon_work'
  | 'sla_at_risk'
  | 'stalled_engagement'
export type AttentionEntityType = 'task' | 'commitment' | 'intake' | 'engagement'

export interface AttentionItemData {
  id: string
  item_type: AttentionItemType
  severity: AttentionSeverity
  title: string
  title_ar: string | null
  entity_id: string
  entity_type: AttentionEntityType
  deadline: string | null
  days_overdue: number | null
  days_in_stage: number | null
  lifecycle_stage: LifecycleStage | null
  engagement_name: string | null
  engagement_name_ar: string | null
}

// ============================================================================
// Timeline Zone Types
// ============================================================================

export interface TimelineEvent {
  id: string
  title: string
  title_ar: string | null
  start_date: string
  end_date: string | null
  event_type: string
  engagement_id: string | null
  engagement_name: string | null
  engagement_name_ar: string | null
  lifecycle_stage: LifecycleStage | null
}

export type TimelineGroup = 'today' | 'tomorrow' | 'this_week' | 'next_week'
export type GroupedEvents = Record<TimelineGroup, TimelineEvent[]>

// ============================================================================
// Engagement Stage Zone Types
// ============================================================================

export interface StageEngagement {
  id: string
  name_en: string
  name_ar: string | null
  engagement_type: string
  updated_at: string
}

export interface StageGroup {
  stage: LifecycleStage
  stage_count: number
  top_engagements: StageEngagement[]
}

// ============================================================================
// Quick Stats Types
// ============================================================================

export interface DashboardStats {
  active_engagements: number
  open_tasks: number
  sla_at_risk: number
  upcoming_week: number
}

// ============================================================================
// Activity Feed Types
// ============================================================================

export interface ActivityItemData {
  id: string
  action_type: string
  entity_type: string
  entity_id: string
  entity_name_en: string
  entity_name_ar: string | null
  actor_name: string
  created_at: string
  metadata: Record<string, unknown> | null
}

// ============================================================================
// Dashboard Scope Types
// ============================================================================

export interface DashboardScope {
  userId: string | null
  role: DashboardRole
}
