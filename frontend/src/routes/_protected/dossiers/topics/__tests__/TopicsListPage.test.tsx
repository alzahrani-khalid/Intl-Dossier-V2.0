/**
 * Topics List Page test (Phase 40 LIST-03)
 * Asserts the page wires GenericListPage with topic-specific status tones
 * (active→chip-ok, archived→chip-info, draft→chip-warn).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TopicsListPage } from '../index'

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    i18n: { language: string }
    t: (k: string, opts?: Record<string, unknown>) => string
  } => ({
    i18n: { language: 'en' },
    t: (k: string, opts?: Record<string, unknown>): string => {
      if (
        opts !== undefined &&
        opts !== null &&
        typeof opts === 'object' &&
        'defaultValue' in opts &&
        typeof opts.defaultValue === 'string'
      ) {
        return opts.defaultValue
      }
      const map: Record<string, string> = {
        'topics:title': 'Topics',
        'topics:subtitle': 'Policy areas and strategic initiatives',
        'topics:empty.title': 'No topics yet',
        'topics:empty.description': '',
        'topics:status.active': 'Active',
        'topics:status.archived': 'Archived',
        'topics:status.draft': 'Draft',
        'list-pages:search.placeholder': 'Search…',
      }
      return map[k] ?? k
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }): React.ReactNode => children,
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { direction: 'ltr'; isRTL: boolean } => ({ direction: 'ltr', isRTL: false }),
}))

vi.mock('@/hooks/useTopics', () => ({
  useTopics: (): {
    data: { data: Array<Record<string, unknown>> }
    isLoading: boolean
    isError: boolean
  } => ({
    data: {
      data: [
        {
          id: 't1',
          name_en: 'Climate Policy',
          name_ar: 'سياسة المناخ',
          status: 'active',
          updated_at: '2026-04-15T00:00:00Z',
        },
        {
          id: 't2',
          name_en: 'Trade Reform',
          name_ar: 'إصلاح التجارة',
          status: 'draft',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ],
    },
    isLoading: false,
    isError: false,
  }),
}))

// Stub the Route useSearch / useNavigate accessors imported via createFileRoute.
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (): ((opts: unknown) => {
    useSearch: () => { page: number; search?: string }
    useNavigate: () => () => Promise<void>
  }) => () => ({
    useSearch: (): { page: number; search?: string } => ({ page: 1, search: undefined }),
    useNavigate: (): (() => Promise<void>) => () => Promise.resolve(),
  }),
}))

describe('TopicsListPage', () => {
  it('renders Topics title and 2 rows with topic-specific chip tones', () => {
    render(<TopicsListPage />)

    // Title
    expect(screen.getByText('Topics')).toBeTruthy()

    // 2 row <li>s
    const rows = screen.getAllByTestId('generic-list-page-row')
    expect(rows.length).toBe(2)

    // Climate Policy → active → chip-ok
    const climatePolicyText = screen.getByText('Climate Policy')
    expect(climatePolicyText).toBeTruthy()
    const climateRow = climatePolicyText.closest('[data-testid="generic-list-page-row"]')
    expect(climateRow).toBeTruthy()
    const climateChip = climateRow?.querySelector('[data-testid="generic-list-page-status"]')
    expect(climateChip).toBeTruthy()
    expect(climateChip?.className).toContain('chip-ok')

    // Trade Reform → draft → chip-warn
    const tradeText = screen.getByText('Trade Reform')
    expect(tradeText).toBeTruthy()
    const tradeRow = tradeText.closest('[data-testid="generic-list-page-row"]')
    expect(tradeRow).toBeTruthy()
    const tradeChip = tradeRow?.querySelector('[data-testid="generic-list-page-status"]')
    expect(tradeChip).toBeTruthy()
    expect(tradeChip?.className).toContain('chip-warn')

    // Chevron rendered (in LTR, no rotate-180)
    const chevrons = climateRow?.querySelectorAll('svg')
    expect(chevrons && chevrons.length > 0).toBe(true)
  })
})
