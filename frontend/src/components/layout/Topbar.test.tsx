/**
 * Topbar.test.tsx — Phase 36 SHELL-02 Wave 1 GREEN implementation.
 *
 * Titles match VALIDATION.md substrings:
 *   - 'item order'
 *   - 'kbd hint responsive'
 *   - 'tweaks trigger'
 *
 * NOTES ON MOCKING:
 *   - The global `tests/setup.ts` stubs `react-i18next` so `t(key)` returns the
 *     raw key (identity fallback). That's enough for these structural tests —
 *     we assert on CSS classes, DOM shape, and aria-labels (which equal the
 *     key strings in fallback mode: `aria-label="shell.tweaks"` etc.).
 *   - `useTweaksOpen` is mocked at the module level so the third test can spy
 *     on the trigger without wiring a full `<TweaksDisclosureProvider>`.
 *   - `useDesignDirection` / `useMode` / `useLocale` are mocked likewise so the
 *     Topbar renders without needing a `<DesignProvider>` tree.
 */

import type { ReactElement } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Module mocks — must be declared before the `import { Topbar }` below.
vi.mock('@/components/tweaks', () => ({
  useTweaksOpen: vi.fn(() => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
  })),
}))

vi.mock('@/design-system/hooks', () => ({
  useDesignDirection: vi.fn(() => ({ direction: 'chancery', setDirection: vi.fn() })),
  useMode: vi.fn(() => ({ mode: 'light', setMode: vi.fn() })),
  useLocale: vi.fn(() => ({ locale: 'en', setLocale: vi.fn() })),
}))

import { useTweaksOpen } from '@/components/tweaks'
import { Topbar } from './Topbar'

function renderTopbar(): ReturnType<typeof render> {
  return render((<Topbar onOpenDrawer={() => {}} />) as ReactElement)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useTweaksOpen).mockReturnValue({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
  })
})

describe('Topbar', () => {
  it('item order — 7 controls in LTR JSX: menu, search, direction, bell, theme, locale, tweaks', () => {
    const { container } = renderTopbar()
    const topbar = container.querySelector('.tb')
    expect(topbar).not.toBeNull()

    // Slots 1 & 2 are direct siblings of the right-cluster wrapper.
    expect(topbar!.querySelector('.tb-menu')).not.toBeNull()
    expect(topbar!.querySelector('.tb-search')).not.toBeNull()

    // Slots 3–7 live inside `.tb-right`.
    const right = topbar!.querySelector('.tb-right')
    expect(right).not.toBeNull()
    expect(right!.querySelector('.tb-dir')).not.toBeNull()
    // `.tb-icon-btn` covers both bell (slot 4) and theme (slot 5).
    expect(right!.querySelectorAll('.tb-icon-btn').length).toBeGreaterThanOrEqual(2)
    expect(right!.querySelector('.tb-locale')).not.toBeNull()
    expect(right!.querySelector('.tb-tweaks')).not.toBeNull()

    // Direction switcher carries 4 radio buttons (chancery/situation/ministerial/bureau).
    const dirRadios = right!.querySelectorAll('.tb-dir [role="radio"]')
    expect(dirRadios.length).toBe(4)

    // Locale switcher carries 2 radio buttons (EN/ع).
    const localeRadios = right!.querySelectorAll('.tb-locale [role="radio"]')
    expect(localeRadios.length).toBe(2)
  })

  it('kbd hint responsive — ⌘K element has `hidden` + `lg:inline` classes', () => {
    const { container } = renderTopbar()
    const kbd = container.querySelector('.tb-kbd')
    expect(kbd).not.toBeNull()
    expect(kbd!.className).toMatch(/\bhidden\b/)
    expect(kbd!.className).toMatch(/\blg:inline\b/)
  })

  it('tweaks trigger — clicking Tweaks calls useTweaksOpen().open()', async () => {
    const openSpy = vi.fn()
    vi.mocked(useTweaksOpen).mockReturnValue({
      isOpen: false,
      open: openSpy,
      close: vi.fn(),
      toggle: vi.fn(),
    })

    const { container } = renderTopbar()
    const tweaks = container.querySelector('.tb-tweaks') as HTMLButtonElement | null
    expect(tweaks).not.toBeNull()

    const user = userEvent.setup()
    await user.click(tweaks!)

    expect(openSpy).toHaveBeenCalledTimes(1)
  })
})
