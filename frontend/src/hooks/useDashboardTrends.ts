/**
 * Dashboard Trends Hook
 *
 * TanStack Query hook for fetching daily work item trend data.
 * Used by the area chart on the dashboard.
 */

import { useQuery } from '@tanstack/react-query'

export interface TrendDataPoint {
  date: string
  created: number
  completed: number
}

type TrendRange = '7d' | '30d' | '90d'

/**
 * Generate mock trend data for a given range.
 * TODO: Replace with real Supabase RPC call.
 */
function generateMockTrends(range: TrendRange): TrendDataPoint[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
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
    queryFn: () => Promise.resolve(generateMockTrends(range)),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
