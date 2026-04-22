/**
 * AppShell.a11y.test.tsx — Phase 36 SHELL-04 Wave 2 axe-core matrix.
 *
 * Renders the full AppShell (Sidebar + Topbar + ClassificationBar + main)
 * across the 4 directions × 2 locales = 8 combos, and asserts zero
 * serious/critical violations.
 *
 * VALIDATION.md task id 36-05-04 — title substring 'has no serious/critical'
 * gate for Wave 2 --grep. Do NOT rename.
 *
 * MOCKING NOTES:
 *   - All DesignProvider hooks are mocked at the module level so we can set
 *     direction + classification + locale per `it.each` row without spinning
 *     up a real `<DesignProvider>` tree (which would fight the vi.mock).
 *   - `useRouterState` is stubbed to return a stable pathname.
 *   - `useAuthStore` returns a viewer (no admin group) — a11y gates should
 *     pass for the most common user role.
 */

import type { ReactElement } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

// ---- Module mocks (hoisted by vi.mock — declared BEFORE SUT import) ----

const routerMock = { pathname: '/dashboard' }

vi.mock('@tanstack/react-router', () => ({
  useRouterState: (opts: { select: (s: { location: { pathname: string } }) => unknown }) =>
    opts.select({ location: { pathname: routerMock.pathname } }),
  Link: ({
    to,
    children,
    className,
    'aria-current': ariaCurrent,
  }: {
    to: string
    children: React.ReactNode
    className?: string
    'aria-current'?: 'page' | undefined
  }) => (
    <a href={to} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: routerMock.pathname }),
}))

vi.mock('@/design-system/hooks', () => ({
  useDesignDirection: vi.fn(() => ({ direction: 'chancery', setDirection: vi.fn() })),
  useMode: vi.fn(() => ({ mode: 'light', setMode: vi.fn() })),
  useLocale: vi.fn(() => ({ locale: 'en', setLocale: vi.fn() })),
  useClassification: vi.fn(() => ({ classif: true, setClassif: vi.fn() })),
}))

vi.mock('@/components/tweaks', () => ({
  useTweaksOpen: vi.fn(() => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
  })),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn((selector?: (s: unknown) => unknown) => {
    const state = {
      user: { id: 'u-viewer', email: 'viewer@gastat.gov.sa', name: 'Viewer', role: 'viewer' },
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

import { useDesignDirection, useLocale, useClassification } from '@/design-system/hooks'
import { AppShell } from './AppShell'

type Direction = 'chancery' | 'situation' | 'ministerial' | 'bureau'
type Locale = 'en' | 'ar'

beforeEach(() => {
  vi.clearAllMocks()
  document.documentElement.removeAttribute('dir')
  document.documentElement.removeAttribute('lang')
  document.documentElement.dataset.classification = 'restricted'
})

function renderMatrix(direction: Direction, locale: Locale): ReturnType<typeof render> {
  vi.mocked(useDesignDirection).mockReturnValue({
    direction,
    setDirection: vi.fn(),
  })
  vi.mocked(useLocale).mockReturnValue({ locale, setLocale: vi.fn() })
  vi.mocked(useClassification).mockReturnValue({ classif: true, setClassif: vi.fn() })
  document.documentElement.setAttribute('lang', locale)
  document.documentElement.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')

  const child = (<div data-testid="page-content">Shell axe-core matrix</div>) as ReactElement
  return render(<AppShell>{child}</AppShell>)
}

describe('AppShell axe-core', () => {
  const combos: Array<[Direction, Locale]> = [
    ['chancery', 'en'],
    ['chancery', 'ar'],
    ['situation', 'en'],
    ['situation', 'ar'],
    ['ministerial', 'en'],
    ['ministerial', 'ar'],
    ['bureau', 'en'],
    ['bureau', 'ar'],
  ]

  it.each(combos)('has no serious/critical violations in %s × %s', async (direction, locale) => {
    const { container, unmount } = renderMatrix(direction, locale)

    const results = await axe(container, {
      // Axe rule tuning — only elevate serious/critical. Moderate/minor
      // land as warnings in the results object but do not fail the gate.
      rules: {
        'color-contrast': { enabled: true },
        // Tailwind CSS vars can't always be resolved in jsdom's computed
        // style; the visual-contrast check is better covered by Playwright.
        region: { enabled: false },
      },
    })

    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(seriousOrCritical).toEqual([])

    unmount()
  })
})
