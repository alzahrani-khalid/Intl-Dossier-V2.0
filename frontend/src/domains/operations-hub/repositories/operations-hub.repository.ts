/**
 * Operations Hub Repository
 * Phase 10: Operations Hub Dashboard
 *
 * Supabase RPC call wrappers for all Operations Hub data.
 * Each function maps to a corresponding RPC function in
 * supabase/migrations/20260330000001_operations_hub_rpcs.sql
 */

import { supabase } from '@/lib/supabase'
import type {
  AttentionItemData,
  TimelineEvent,
  StageGroup,
  DashboardStats,
  ActivityItemData,
} from '../types/operations-hub.types'

// ============================================================================
// Attention Items
// ============================================================================

/**
 * Fetch items needing attention: overdue, due-soon, SLA-at-risk, stalled.
 * When userId is null, returns all items (leadership/analyst view).
 * When userId is set, filters to user's assigned items (officer view).
 */
export async function getAttentionItems(
  userId: string | null,
  thresholdHours: number = 48,
): Promise<AttentionItemData[]> {
  const { data, error } = await supabase.rpc('get_attention_items', {
    p_user_id: userId,
    p_threshold_hours: thresholdHours,
  })

  if (error) {
    throw new Error(`Failed to fetch attention items: ${error.message}`)
  }

  return (data as AttentionItemData[]) ?? []
}

// ============================================================================
// Upcoming Events
// ============================================================================

/**
 * Fetch upcoming events within the specified days-ahead window.
 * Includes engagement start dates and calendar entries.
 */
export async function getUpcomingEvents(
  userId: string | null,
  daysAhead: number = 14,
): Promise<TimelineEvent[]> {
  const { data, error } = await supabase.rpc('get_upcoming_events', {
    p_user_id: userId,
    p_days_ahead: daysAhead,
  })

  if (error) {
    throw new Error(`Failed to fetch upcoming events: ${error.message}`)
  }

  return (data as TimelineEvent[]) ?? []
}

// ============================================================================
// Engagement Stage Counts
// ============================================================================

/**
 * Fetch engagement counts grouped by lifecycle stage with top 5 per stage.
 */
export async function getEngagementStageCounts(
  userId: string | null,
): Promise<StageGroup[]> {
  const { data, error } = await supabase.rpc('get_engagement_stage_counts', {
    p_user_id: userId,
  })

  if (error) {
    throw new Error(`Failed to fetch engagement stage counts: ${error.message}`)
  }

  return (data as StageGroup[]) ?? []
}

// ============================================================================
// Dashboard Stats
// ============================================================================

/**
 * Fetch summary counts for the Quick Stats bar.
 * Returns a single row with active engagements, open tasks, SLA at risk,
 * and upcoming events this week.
 */
export async function getDashboardStats(
  userId: string | null,
): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('get_dashboard_stats', {
    p_user_id: userId,
  })

  if (error) {
    throw new Error(`Failed to fetch dashboard stats: ${error.message}`)
  }

  const row = Array.isArray(data) ? data[0] : data

  return (row as DashboardStats) ?? {
    active_engagements: 0,
    open_tasks: 0,
    sla_at_risk: 0,
    upcoming_week: 0,
  }
}

// ============================================================================
// Recent Activity
// ============================================================================

/**
 * Fetch recent activity items from the activity log.
 * Uses direct table query rather than RPC.
 */
export async function getRecentActivity(
  limit: number = 10,
): Promise<ActivityItemData[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('id, action, entity_type, entity_id, entity_name, entity_name_ar, actor_name, created_at, metadata')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch recent activity: ${error.message}`)
  }

  return (data as ActivityItemData[]) ?? []
}
