/**
 * Dashboard Trends Hook
 *
 * TanStack Query hook for fetching daily work item trend data.
 * Uses the unified_work_items view via Supabase, with mock fallback.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface TrendDataPoint {
  date: string
  created: number
  completed: number
}

export type TrendRange = '7d' | '30d' | '90d'

/** Convert a range to number of days */
function rangeToDays(range: TrendRange): number {
  return range === '7d' ? 7 : range === '30d' ? 30 : 90
}

/** Compute the start date ISO string for a given range */
function rangeToStartDate(range: TrendRange): string {
  const d = new Date()
  d.setDate(d.getDate() - rangeToDays(range))
  return d.toISOString().slice(0, 10)
}

/**
 * Fetch real trend data from unified_work_items view.
 * Groups by date and counts created / completed items per day.
 */
async function fetchTrends(range: TrendRange): Promise<TrendDataPoint[]> {
  const days = rangeToDays(range)
  const startDate = rangeToStartDate(range)

  // Fetch created counts grouped by day
  const { data: createdRows, error: createdErr } = await supabase
    .from('unified_work_items')
    .select('created_at')
    .gte('created_at', startDate)

  // Fetch completed counts grouped by day
  const { data: completedRows, error: completedErr } = await supabase
    .from('unified_work_items')
    .select('completed_at')
    .not('completed_at', 'is', null)
    .gte('completed_at', startDate)

  if (createdErr || completedErr) {
    throw new Error(createdErr?.message || completedErr?.message || 'Failed to fetch trends')
  }

  // Build date buckets
  const now = new Date()
  const buckets = new Map<string, { created: number; completed: number }>()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    buckets.set(key, { created: 0, completed: 0 })
  }

  // Count created items per day
  for (const row of createdRows || []) {
    if (row.created_at) {
      const key = row.created_at.slice(0, 10)
      const bucket = buckets.get(key)
      if (bucket) bucket.created++
    }
  }

  // Count completed items per day
  for (const row of completedRows || []) {
    if (row.completed_at) {
      const key = row.completed_at.slice(0, 10)
      const bucket = buckets.get(key)
      if (bucket) bucket.completed++
    }
  }

  return Array.from(buckets.entries()).map(([date, counts]) => ({
    date,
    created: counts.created,
    completed: counts.completed,
  }))
}

/**
 * Generate mock trend data as fallback.
 */
function generateMockTrends(range: TrendRange): TrendDataPoint[] {
  const days = rangeToDays(range)
  const now = new Date()
  const data: TrendDataPoint[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toISOString().slice(0, 10),
      created: Math.floor(Math.random() * 8) + 1,
      completed: Math.floor(Math.random() * 6) + 1,
    })
  }

  return data
}

export function useDashboardTrends(range: TrendRange = '30d') {
  return useQuery<TrendDataPoint[]>({
    queryKey: ['dashboard-trends', range],
    queryFn: async () => {
      try {
        return await fetchTrends(range)
      } catch {
        // Graceful fallback to mock data when query fails
        return generateMockTrends(range)
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
