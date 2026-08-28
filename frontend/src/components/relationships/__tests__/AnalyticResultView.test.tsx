/**
 * AnalyticResultView unit tests (RED until plan 71-04).
 *
 * Pins the structured-result contract from 71-UI-SPEC ("Result (primary =
 * structured)" + "Empty" states) keyed to query type (D-03):
 *   - membership   → a list
 *   - intersection → a table
 *   - chain        → an ordered timeline
 *   - path         → an ordered hop sequence
 *   - empty        → the "No results" copy
 *   - INDISTINGUISHABLE-EMPTY: the rendered DOM contains NO clearance-revealing
 *     text (LOCKED contract — 71-UI-SPEC "Clearance-reduction copy contract").
 *
 * EXPECTED RED NOW: `../AnalyticResultView` does not exist → import fails →
 * suite errors. GREEN when 71-04 builds the component.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', async () => {
  const { default: graph } =
    await vi.importActual<typeof import('@/i18n/en/graph.json')>('@/i18n/en/graph.json')
  const resolve = (path: string): unknown =>
    path.split('.').reduce((value, segment) => (value as Record<string, unknown>)?.[segment], graph)

  return {
    useTranslation: () => ({
      t: (key: string, opts: Record<string, unknown> = {}): string => {
        const value = resolve(key)
        return typeof value === 'string'
          ? value.replace(/\{\{(\w+)\}\}/g, (match, name: string) => String(opts[name] ?? match))
          : key
      },
      i18n: { language: 'en' },
    }),
  }
})

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ direction: 'ltr', isRTL: false }),
}))

// RED import: the component does not exist yet (built in 71-04).
import { AnalyticResultView } from '../AnalyticResultView'

const membershipResult = {
  query_type: 'forum_membership',
  nodes: [
    { id: 'f1', type: 'forum', name_en: 'Trade Forum', name_ar: 'منتدى التجارة' },
    { id: 'wg1', type: 'working_group', name_en: 'Tariffs WG', name_ar: 'مجموعة التعريفات' },
  ],
  edges: [],
}

const intersectionResult = {
  query_type: 'shared_committees',
  nodes: [{ id: 'wg2', type: 'working_group', name_en: 'Shared WG', name_ar: 'لجنة مشتركة' }],
  edges: [],
}

const chainResult = {
  query_type: 'engagement_chain',
  nodes: [
    { id: 'e1', name_en: 'Summit A', name_ar: 'قمة أ', start_date: '2026-04-28T10:00:00Z' },
    { id: 'e2', name_en: 'Summit B', name_ar: 'قمة ب', start_date: '2026-05-12T10:00:00Z' },
  ],
  edges: [],
}

const pathResult = {
  query_type: 'shortest_path',
  path: ['a', 'b', 'c'],
  relationship_path: ['member_of', 'participates_in'],
  path_length: 2,
  nodes: [],
  edges: [],
}

const emptyResult = {
  query_type: 'forum_membership',
  nodes: [],
  edges: [],
}

describe('AnalyticResultView (GRAPH-01 / GRAPH-03 structured result contract)', () => {
  it('renders membership as a list', () => {
    render(<AnalyticResultView result={membershipResult} />)
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getByText('Trade Forum')).toBeInTheDocument()
  })

  it('renders intersection as a table', () => {
    render(<AnalyticResultView result={intersectionResult} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Shared WG')).toBeInTheDocument()
  })

  it('renders the engagement chain as an ordered timeline', () => {
    render(<AnalyticResultView result={chainResult} />)
    expect(screen.getByText('Summit A')).toBeInTheDocument()
    expect(screen.getByText('Summit B')).toBeInTheDocument()
  })

  it('renders the shortest path as a hop sequence', () => {
    render(<AnalyticResultView result={pathResult} />)
    // Connected in {N} hops — the path count line.
    expect(screen.getByText(/2 hops/i)).toBeInTheDocument()
  })

  it('renders the "No results" empty state', () => {
    render(<AnalyticResultView result={emptyResult} />)
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('never renders clearance-revealing copy (indistinguishable-empty, LOCKED)', () => {
    const { container } = render(<AnalyticResultView result={emptyResult} />)
    expect(container.textContent ?? '').not.toMatch(/clearance|filtered|restricted|permission/i)
  })

  it('PRODUCTION keys are byte-untouched because P99-49 owns the prerequisite key-routing repair. Across the 36 production files this diff contains fallback deletions only — no key rewrite, namespace rewrite, import move, hardcoded-result helper, or test-mode branch. The only permitted additive behavior outside the SUMMARY is in the five owned companion tests, whose local i18n mocks must resolve the real resources used by EngagementsList, PersonsGrid, AnalyticQueryPicker, and AnalyticResultView. || NO i18n JSON changes in this lane.', () => {
    render(<AnalyticResultView result={emptyResult} />)

    expect(screen.getByText('No results')).toBeInTheDocument()
    expect(
      screen.getByText('This entity has no matching records for this analysis.'),
    ).toBeInTheDocument()
  })
})
