import type { ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RelationshipGraphPage } from '@/pages/relationships/RelationshipGraphPage'

// The four analytic query templates (Phase 71 / GRAPH-01). Kept in sync with
// AnalyticQueryType in `@/hooks/useAnalyticGraph`.
const ANALYTIC_QUERY_TYPES = [
  'forum_membership',
  'shared_committees',
  'engagement_chain',
  'shortest_path',
] as const

type AnalyticQuery = (typeof ANALYTIC_QUERY_TYPES)[number]

interface GraphSearch {
  dossierId?: string
  mode?: 'analyze'
  query?: AnalyticQuery
  entity2?: string
  windowDays?: number
}

export const Route = createFileRoute('/_protected/relationships/graph')({
  validateSearch: (search: Record<string, unknown>): GraphSearch => {
    const dossierId = search.dossierId
    const entity2 = search.entity2
    const windowDays = search.windowDays

    return {
      dossierId: typeof dossierId === 'string' && dossierId.length > 0 ? dossierId : undefined,
      mode: search.mode === 'analyze' ? 'analyze' : undefined,
      query: ANALYTIC_QUERY_TYPES.includes(search.query as AnalyticQuery)
        ? (search.query as AnalyticQuery)
        : undefined,
      entity2: typeof entity2 === 'string' && entity2.length > 0 ? entity2 : undefined,
      windowDays:
        typeof windowDays === 'number' && windowDays >= 1 && windowDays <= 365
          ? windowDays
          : undefined,
    }
  },
  component: RelationshipGraphRoute,
})

function RelationshipGraphRoute(): ReactElement {
  return <RelationshipGraphPage />
}
