/**
 * Dashboard Success Metrics Hook
 *
 * Combines data from multiple sources:
 * - get_analytics_summary RPC → fulfillment_rate
 * - get_user_productivity_metrics RPC → avg completion hours
 * - get_team_workload RPC → active contributors & top contributors
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface SuccessMetricsData {
  completionRate: number | null
  avgResponseTimeHours: number | null
  activeContributors: number
  contributors: Array<{
    initials: string
    name: string
  }>
}

async function fetchSuccessMetrics(): Promise<SuccessMetricsData> {
  // Run all 3 RPC calls in parallel
  const [analyticsResult, metricsResult, teamResult] = await Promise.allSettled([
    supabase.rpc('get_analytics_summary', {}),
    supabase.rpc('get_user_productivity_metrics'),
    supabase.rpc('get_team_workload'),
  ])

  // Extract fulfillment rate from analytics
  let completionRate: number | null = null
  if (analyticsResult.status === 'fulfilled' && analyticsResult.value.data?.[0]) {
    completionRate = analyticsResult.value.data[0].fulfillment_rate ?? null
  }

  // Extract avg completion hours from productivity metrics
  let avgResponseTimeHours: number | null = null
  if (metricsResult.status === 'fulfilled' && metricsResult.value.data?.[0]) {
    const metrics = metricsResult.value.data[0] as Record<string, unknown>
    const avgHours = metrics.avg_completion_hours ?? metrics.avg_resolution_hours
    if (typeof avgHours === 'number') {
      avgResponseTimeHours = avgHours
    }
  }

  // Extract team members for contributors
  let activeContributors = 0
  const contributors: SuccessMetricsData['contributors'] = []

  if (teamResult.status === 'fulfilled' && Array.isArray(teamResult.value.data)) {
    const members = teamResult.value.data as Array<Record<string, unknown>>
    activeContributors = members.length

    // Top 5 contributors by completed count
    const sorted = [...members]
      .sort((a, b) => ((b.completed_count as number) || 0) - ((a.completed_count as number) || 0))
      .slice(0, 5)

    for (const m of sorted) {
      const name = String(m.display_name || m.email || '')
      const parts = name.split(/[\s@]+/)
      const initials = parts
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join('')
      contributors.push({ initials, name: name.split('@')[0] ?? name })
    }
  }

  return {
    completionRate,
    avgResponseTimeHours,
    activeContributors,
    contributors,
  }
}

export function useDashboardSuccessMetrics(options?: { enabled?: boolean }) {
  return useQuery<SuccessMetricsData>({
    queryKey: ['dashboard-success-metrics'],
    queryFn: fetchSuccessMetrics,
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
