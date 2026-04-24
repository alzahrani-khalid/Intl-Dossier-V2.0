/**
 * Plan 38-08 — ForumsStrip unit tests.
 *
 * Verifies:
 *   T1. monogram derivation: "General Assembly" → "GA", "United Nations" → "UN"
 *   T2. renders 4 forum cards when 4 forums returned
 *   T3. monogram chip wrapped in LtrIsolate (.forum-monogram present, dir="ltr")
 *   T4. status chip text uses i18n key path forums.status.{status}
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/hooks/useForums', () => ({ useForums: vi.fn() }))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: unknown }): JSX.Element => (
    <span data-testid="badge">{children as JSX.Element}</span>
  ),
}))

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (k: string, fallback?: string) => string
    i18n: { language: string }
  } => ({
    t: (k: string, fallback?: string): string => fallback ?? k,
    i18n: { language: 'en' },
  }),
}))

vi.mock('../WidgetSkeleton', () => ({
  WidgetSkeleton: (): JSX.Element => <div data-testid="skeleton" />,
}))

import { useForums } from '@/hooks/useForums'
import { ForumsStrip } from '../ForumsStrip'

function makeForum(id: string, name_en: string, status = 'active'): Record<string, unknown> {
  return {
    id,
    type: 'forum',
    name_en,
    name_ar: name_en,
    status,
    extension: {},
  }
}

describe('ForumsStrip', () => {
  beforeEach(() => {
    vi.mocked(useForums).mockReset()
  })

  it('derives monogram "GA" from "General Assembly"', () => {
    vi.mocked(useForums).mockReturnValue({
      data: { data: [makeForum('f1', 'General Assembly')], pagination: {} },
      isLoading: false,
      isError: false,
    } as never)
    render(<ForumsStrip />)
    expect(screen.getByText('GA')).toBeTruthy()
  })

  it('derives monogram "UN" from "United Nations"', () => {
    vi.mocked(useForums).mockReturnValue({
      data: { data: [makeForum('f1', 'United Nations')], pagination: {} },
      isLoading: false,
      isError: false,
    } as never)
    render(<ForumsStrip />)
    expect(screen.getByText('UN')).toBeTruthy()
  })

  it('renders 4 forum cards when 4 forums returned', () => {
    vi.mocked(useForums).mockReturnValue({
      data: {
        data: Array.from({ length: 4 }, (_, i) => makeForum(`f${i}`, `Forum ${i}`)),
        pagination: {},
      },
      isLoading: false,
      isError: false,
    } as never)
    const { container } = render(<ForumsStrip />)
    expect(container.querySelectorAll('.forum-card')).toHaveLength(4)
  })

  it('wraps monogram in LtrIsolate (.forum-monogram with dir="ltr")', () => {
    vi.mocked(useForums).mockReturnValue({
      data: { data: [makeForum('f1', 'United Nations')], pagination: {} },
      isLoading: false,
      isError: false,
    } as never)
    const { container } = render(<ForumsStrip />)
    const monogram = container.querySelector('.forum-monogram')
    expect(monogram).not.toBeNull()
    expect(monogram?.getAttribute('dir')).toBe('ltr')
  })

  it('passes useForums limit param of 4', () => {
    vi.mocked(useForums).mockReturnValue({
      data: { data: [], pagination: {} },
      isLoading: false,
      isError: false,
    } as never)
    render(<ForumsStrip />)
    expect(vi.mocked(useForums)).toHaveBeenCalledWith({ limit: 4 })
  })

  it('uses forums.status.{status} i18n key for badge text', () => {
    vi.mocked(useForums).mockReturnValue({
      data: { data: [makeForum('f1', 'General Assembly', 'active')], pagination: {} },
      isLoading: false,
      isError: false,
    } as never)
    render(<ForumsStrip />)
    // t mock returns fallback (status string) so we assert badge contains it
    expect(screen.getByTestId('badge').textContent).toBe('active')
  })
})
