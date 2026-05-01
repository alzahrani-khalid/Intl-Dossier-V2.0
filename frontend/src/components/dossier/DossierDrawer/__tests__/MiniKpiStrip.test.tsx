/**
 * MiniKpiStrip — Wave 1 (Phase 41-03) tests.
 *
 * Asserts the locked D-04 KPI mapping:
 *   engagements → stats.calendar_events_count
 *   commitments → work_items.by_source.commitments.length
 *   overdue     → stats.overdue_work_items
 *   documents   → stats.documents_count
 *
 * Each value is rendered through toArDigits and wrapped in LtrIsolate.
 */
import { render, cleanup, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DossierOverviewResponse } from '@/types/dossier-overview.types'

// Per-file override of the global react-i18next mock so we can flip language
// to 'ar' for the toArDigits assertion (Test 11).
const i18nLanguageHolder: { value: string } = { value: 'en' }

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (k: string) => string; i18n: { language: string } } => ({
    t: (k: string): string => k,
    i18n: { language: i18nLanguageHolder.value },
  }),
}))

import { MiniKpiStrip } from '../MiniKpiStrip'

function makeOverview(
  overrides: Partial<{
    calendar_events_count: number
    commitments_count: number
    overdue_work_items: number
    documents_count: number
    omitCommitments: boolean
  }>,
): DossierOverviewResponse {
  const commitmentsList =
    overrides.omitCommitments === true
      ? (undefined as unknown as DossierOverviewResponse['work_items']['by_source']['commitments'])
      : (Array.from({ length: overrides.commitments_count ?? 0 }, (_, i) => ({
          id: `c${i}`,
        })) as unknown as DossierOverviewResponse['work_items']['by_source']['commitments'])

  return {
    dossier: {} as DossierOverviewResponse['dossier'],
    stats: {
      related_dossiers_count: 0,
      documents_count: overrides.documents_count ?? 0,
      work_items_count: 0,
      pending_work_items: 0,
      overdue_work_items: overrides.overdue_work_items ?? 0,
      calendar_events_count: overrides.calendar_events_count ?? 0,
      upcoming_events_count: 0,
      key_contacts_count: 0,
      recent_activities_count: 0,
      last_activity_date: null,
    },
    related_dossiers: {} as DossierOverviewResponse['related_dossiers'],
    documents: {} as DossierOverviewResponse['documents'],
    work_items: {
      total_count: 0,
      status_breakdown: {
        pending: 0,
        in_progress: 0,
        review: 0,
        completed: 0,
        cancelled: 0,
        overdue: 0,
      },
      by_source: {
        tasks: [],
        commitments: commitmentsList,
        intakes: [],
      },
      urgent_items: [],
      overdue_items: [],
    },
    calendar_events: {} as DossierOverviewResponse['calendar_events'],
    key_contacts: {} as DossierOverviewResponse['key_contacts'],
    activity_timeline: {} as DossierOverviewResponse['activity_timeline'],
    generated_at: new Date().toISOString(),
  }
}

describe('MiniKpiStrip (Phase 41-03)', () => {
  beforeEach(() => {
    i18nLanguageHolder.value = 'en'
    cleanup()
  })

  it('renders 4 cells in order: engagements, commitments, overdue, documents', () => {
    const overview = makeOverview({
      calendar_events_count: 5,
      commitments_count: 3,
      overdue_work_items: 2,
      documents_count: 7,
    })
    const { container } = render(<MiniKpiStrip overview={overview} />)
    const cells = container.querySelectorAll('.kpi-mini')
    expect(cells).toHaveLength(4)
    expect(cells[0].querySelector('.kpi-mini-label')?.textContent).toBe('kpi.engagements')
    expect(cells[1].querySelector('.kpi-mini-label')?.textContent).toBe('kpi.commitments')
    expect(cells[2].querySelector('.kpi-mini-label')?.textContent).toBe('kpi.overdue')
    expect(cells[3].querySelector('.kpi-mini-label')?.textContent).toBe('kpi.documents')
  })

  it('engagements cell value === toArDigits(stats.calendar_events_count)', () => {
    const overview = makeOverview({ calendar_events_count: 22 })
    const { container } = render(<MiniKpiStrip overview={overview} />)
    const cell = container.querySelectorAll('.kpi-mini')[0] as HTMLElement
    expect(within(cell).getByText('22')).toBeTruthy()
  })

  it('commitments cell value === toArDigits(work_items.by_source.commitments.length)', () => {
    const overview = makeOverview({ commitments_count: 4 })
    const { container } = render(<MiniKpiStrip overview={overview} />)
    const cell = container.querySelectorAll('.kpi-mini')[1] as HTMLElement
    expect(within(cell).getByText('4')).toBeTruthy()
  })

  it('overdue cell value === toArDigits(stats.overdue_work_items)', () => {
    const overview = makeOverview({ overdue_work_items: 9 })
    const { container } = render(<MiniKpiStrip overview={overview} />)
    const cell = container.querySelectorAll('.kpi-mini')[2] as HTMLElement
    expect(within(cell).getByText('9')).toBeTruthy()
  })

  it('documents cell value === toArDigits(stats.documents_count)', () => {
    const overview = makeOverview({ documents_count: 13 })
    const { container } = render(<MiniKpiStrip overview={overview} />)
    const cell = container.querySelectorAll('.kpi-mini')[3] as HTMLElement
    expect(within(cell).getByText('13')).toBeTruthy()
  })

  it('each cell label matches t(kpi.<key>) for engagements/commitments/overdue/documents', () => {
    const overview = makeOverview({})
    const { container } = render(<MiniKpiStrip overview={overview} />)
    const labels = Array.from(container.querySelectorAll('.kpi-mini-label')).map(
      (el) => el.textContent,
    )
    expect(labels).toEqual([
      'kpi.engagements',
      'kpi.commitments',
      'kpi.overdue',
      'kpi.documents',
    ])
  })

  it('each value span uses class kpi-mini-val and is wrapped in LtrIsolate (dir="ltr")', () => {
    const overview = makeOverview({
      calendar_events_count: 1,
      commitments_count: 1,
      overdue_work_items: 1,
      documents_count: 1,
    })
    const { container } = render(<MiniKpiStrip overview={overview} />)
    const valueSpans = container.querySelectorAll('.kpi-mini-val')
    expect(valueSpans).toHaveLength(4)
    valueSpans.forEach((span) => {
      const ltr = span.querySelector('[dir="ltr"]')
      expect(ltr).not.toBeNull()
    })
  })

  it('each label span uses class kpi-mini-label', () => {
    const overview = makeOverview({})
    const { container } = render(<MiniKpiStrip overview={overview} />)
    expect(container.querySelectorAll('.kpi-mini-label')).toHaveLength(4)
  })

  it('container has class kpi-mini-strip', () => {
    const overview = makeOverview({})
    const { container } = render(<MiniKpiStrip overview={overview} />)
    expect(container.querySelector('.kpi-mini-strip')).not.toBeNull()
  })

  it('when work_items.by_source.commitments is undefined, commitments cell shows 0 (no throw)', () => {
    const overview = makeOverview({ omitCommitments: true })
    const { container } = render(<MiniKpiStrip overview={overview} />)
    const cell = container.querySelectorAll('.kpi-mini')[1] as HTMLElement
    expect(within(cell).getByText('0')).toBeTruthy()
  })

  it('under AR locale, engagements cell of value 22 renders as "٢٢"', () => {
    i18nLanguageHolder.value = 'ar'
    const overview = makeOverview({ calendar_events_count: 22 })
    const { container } = render(<MiniKpiStrip overview={overview} />)
    const cell = container.querySelectorAll('.kpi-mini')[0] as HTMLElement
    expect(within(cell).getByText('٢٢')).toBeTruthy()
  })
})
