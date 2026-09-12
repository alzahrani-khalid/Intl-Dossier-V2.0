/**
 * QueryErrorState — the C9a POSITIVE CONTROL for the cross-plan testid contract (Plan 93-01).
 *
 * Every wave-2/3 plan in Phase 93 selects on `query-error-state` / `query-error-inline`. Those
 * selectors are this plan's OUTPUT and a later plan's gate INPUT — the exact shape of cross-plan
 * artifact that C9a says is checked for the first time by the consuming gate, after the producing
 * plan has already closed green. This test is that check, run in the producing plan.
 *
 * Notes:
 * - The project test setup does NOT register `@testing-library/jest-dom`; assertions use plain
 *   DOM queries (`querySelector`, `textContent`) with `.toBe()` / `.toBeNull()`, matching
 *   ListEmptyState.test.tsx.
 * - `t` echoes the key back verbatim so we assert on `errors.*` keys directly.
 * - This test CANNOT catch a missing `ar` key — the i18n mock is English-only. The bilingual
 *   guarantee is Task 3's gate, not a test.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ isRTL: false, direction: 'ltr' as const, locale: 'en' }),
}))

import { QueryErrorState } from '../QueryErrorState'

describe('QueryErrorState — D-03/D-04 contract', () => {
  it('page variant carries role="alert" and data-testid="query-error-state"', () => {
    const { container } = render(<QueryErrorState onRetry={vi.fn()} />)
    const state = container.querySelector('[data-testid="query-error-state"]')
    expect(state).not.toBeNull()
    expect(state?.getAttribute('role')).toBe('alert')
  })

  it('inline variant carries role="alert" and data-testid="query-error-inline"', () => {
    const { container } = render(<QueryErrorState variant="inline" onRetry={vi.fn()} />)
    const state = container.querySelector('[data-testid="query-error-inline"]')
    expect(state).not.toBeNull()
    expect(state?.getAttribute('role')).toBe('alert')
  })

  it('page variant renders the title and description keys', () => {
    const { container } = render(<QueryErrorState onRetry={vi.fn()} />)
    expect(container.textContent).toContain('errors.queryFailed.title')
    expect(container.textContent).toContain('errors.queryFailed.description')
  })

  it('inline variant renders the one-line key', () => {
    const { container } = render(<QueryErrorState variant="inline" onRetry={vi.fn()} />)
    expect(container.textContent).toContain('errors.queryFailedInline')
  })

  it('page variant has exactly one .btn-primary labelled errors.retry, wired to onRetry', () => {
    const onRetry = vi.fn()
    const { container } = render(<QueryErrorState onRetry={onRetry} />)
    const primaries = container.querySelectorAll('.btn-primary')
    expect(primaries.length).toBe(1)
    expect(primaries[0]?.textContent).toContain('errors.retry')
    fireEvent.click(primaries[0] as Element)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('inline variant has exactly one .btn-ghost labelled errors.retry, wired to onRetry', () => {
    const onRetry = vi.fn()
    const { container } = render(<QueryErrorState variant="inline" onRetry={onRetry} />)
    const ghosts = container.querySelectorAll('.btn-ghost')
    expect(ghosts.length).toBe(1)
    expect(ghosts[0]?.textContent).toContain('errors.retry')
    fireEvent.click(ghosts[0] as Element)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('page variant uses AlertCircle in a rounded-full danger wash, and no second accent', () => {
    const { container } = render(<QueryErrorState onRetry={vi.fn()} />)
    const wash = container.querySelector('.bg-danger\\/10')
    expect(wash).not.toBeNull()
    expect(wash?.className).toContain('rounded-full')
    expect(container.querySelectorAll('.btn-primary').length).toBe(1)
  })

  it('disables retry while a refetch is in flight, leaving the label unchanged', () => {
    const onRetry = vi.fn()
    const { container } = render(<QueryErrorState onRetry={onRetry} isRetrying />)
    const button = container.querySelector('.btn-primary') as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(button.textContent).toContain('errors.retry')
  })

  it('renders the bilingual envelope when given one, and never a raw error field', () => {
    const { container } = render(
      <QueryErrorState
        onRetry={vi.fn()}
        message={{
          message_en: 'Delegation service unavailable',
          message_ar: 'خدمة التفويض غير متاحة',
        }}
      />,
    )
    expect(container.textContent).toContain('Delegation service unavailable')
    expect(container.textContent).not.toContain('errors.queryFailed.description')
  })
})
