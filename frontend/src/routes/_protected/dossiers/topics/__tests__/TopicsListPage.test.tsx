/**
 * Topics list route test (Phase 40 LIST-03 · Phase 87 F23/F24/F26).
 *
 * Renders the wired route component with a mocked router + useTopics adapter.
 * Asserts: title, populated rows + topic-specific chip tones (active→chip-ok,
 * draft→chip-warn), F23 peek registration on row click (type 'topic'), and the F26
 * rich empty state when there are no rows.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from '@/components/language-provider/language-provider'
import { usePeekStore } from '@/store/peekStore'

// --- Router mock (createFileRoute + useNavigate/useSearch for the route + drawer) ---

let currentSearch: Record<string, unknown> = { page: 1 }
const navigateSpy = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (config: Record<string, unknown>) => ({
    ...config,
    useSearch: (): Record<string, unknown> => currentSearch,
    useNavigate: (): typeof navigateSpy => navigateSpy,
  }),
  useNavigate: (): typeof navigateSpy => navigateSpy,
  useSearch: (): Record<string, unknown> => currentSearch,
}))

const useTopicsMock = vi.fn()
vi.mock('@/hooks/useTopics', () => ({
  useTopics: (...args: unknown[]): unknown => useTopicsMock(...args),
}))

import { Route } from '../index'

const TopicsRoute = (Route as unknown as { component: () => ReactElement }).component

const renderRoute = (): ReturnType<typeof render> => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <LanguageProvider initialLanguage="en">
        <TopicsRoute />
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

const activeRow = {
  id: 't1',
  name_en: 'Climate Policy',
  name_ar: 'سياسة المناخ',
  status: 'active',
  updated_at: '2026-04-15T00:00:00Z',
}
const draftRow = {
  id: 't2',
  name_en: 'Trade Reform',
  name_ar: 'إصلاح التجارة',
  status: 'draft',
  updated_at: '2026-03-01T00:00:00Z',
}

describe('Topics list route (Phase 87 wiring)', () => {
  beforeEach(() => {
    cleanup()
    useTopicsMock.mockReset()
    navigateSpy.mockReset()
    currentSearch = { page: 1 }
    usePeekStore.getState().clear()
  })

  it('renders the title and one row per topic with chip tones', () => {
    useTopicsMock.mockReturnValue({
      data: { data: [activeRow, draftRow], pagination: { total_count: 2 } },
      isLoading: false,
      isError: false,
    })

    const { container } = renderRoute()

    expect(screen.getByRole('heading', { name: 'Topics' })).toBeTruthy()
    const rows = screen.getAllByTestId('generic-list-page-row')
    expect(rows.length).toBe(2)

    const climateChip = screen
      .getByText('Climate Policy')
      .closest('[data-testid="generic-list-page-row"]')
      ?.querySelector('[data-testid="generic-list-page-status"]')
    expect(climateChip?.className).toContain('chip-ok')
    expect(container.querySelector('.chip.chip-warn')).toBeTruthy()
  })

  it('registers a topic peek window and opens the drawer on row click (F23)', () => {
    useTopicsMock.mockReturnValue({
      data: { data: [activeRow, draftRow], pagination: { total_count: 2 } },
      isLoading: false,
      isError: false,
    })

    renderRoute()

    fireEvent.click(screen.getAllByTestId('generic-list-page-row')[0])

    const peek = usePeekStore.getState()
    expect(peek.ids).toEqual(['t1', 't2'])
    expect(peek.type).toBe('topic')
    expect(peek.total).toBe(2)
    expect(navigateSpy).toHaveBeenCalled()
    const navArg = navigateSpy.mock.calls[0]?.[0] as { to?: string }
    expect(navArg.to).toBeUndefined()
  })

  it('renders the rich empty state when the adapter returns no rows', () => {
    useTopicsMock.mockReturnValue({
      data: { data: [], pagination: { total_count: 0 } },
      isLoading: false,
      isError: false,
    })

    renderRoute()

    expect(screen.getByTestId('list-empty-state-topic')).toBeTruthy()
  })
})
