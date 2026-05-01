/**
 * ClassificationBar.test.tsx — Phase 36 SHELL-03 Wave 1 GREEN implementation.
 *
 * Titles match VALIDATION.md substrings:
 *   - 'visibility gate'
 *   - 'chancery marginalia'
 *   - 'situation ribbon'
 *   - 'chip variants'
 *
 * NOTES ON MOCKING:
 *   - The global `tests/setup.ts` stubs `react-i18next` so `t(key)` returns
 *     the raw key (identity fallback). Good enough for structural assertions.
 *   - `useClassification` / `useDesignDirection` are mocked at the module
 *     level so each test controls its own slice of state without a full
 *     `<DesignProvider>` tree.
 *   - `useAuthStore` is mocked to supply a minimal user so `getInitials`
 *     has something to chew on.
 */

import type { ReactElement } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

// Module mocks — MUST be declared before `import { ClassificationBar }`.
vi.mock('@/design-system/hooks', () => ({
  useClassification: vi.fn(() => ({ classif: true, setClassif: vi.fn() })),
  useDesignDirection: vi.fn(() => ({ direction: 'chancery', setDirection: vi.fn() })),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({ user: { id: 'u1', email: 'k.alzahrani@gastat.gov.sa', name: 'Khalid Alzahrani' } }),
  ),
}))

import { useClassification, useDesignDirection } from '@/design-system/hooks'
import { ClassificationBar } from './ClassificationBar'

beforeEach(() => {
  vi.clearAllMocks()
  // Ensure html[data-classification] is set so readLevel returns a deterministic value.
  document.documentElement.dataset.classification = 'restricted'
  // Default: gate is open + chancery direction (individual tests override as needed).
  vi.mocked(useClassification).mockReturnValue({ classif: true, setClassif: vi.fn() })
  vi.mocked(useDesignDirection).mockReturnValue({
    direction: 'chancery',
    setDirection: vi.fn(),
  })
})

function renderBar(): ReturnType<typeof render> {
  return render((<ClassificationBar />) as ReactElement)
}

describe('ClassificationBar', () => {
  it('visibility gate — returns null when useClassification().classif is false', () => {
    vi.mocked(useClassification).mockReturnValue({ classif: false, setClassif: vi.fn() })
    const { container } = renderBar()
    expect(container.firstChild).toBeNull()
  })

  it('chancery marginalia — italic em-dash-wrapped serif line', () => {
    vi.mocked(useDesignDirection).mockReturnValue({
      direction: 'chancery',
      setDirection: vi.fn(),
    })
    const { container } = renderBar()
    const el = container.querySelector('.cls-marginalia')
    expect(el).not.toBeNull()
    expect(el!.className).toMatch(/\bitalic\b/)
    expect(el!.textContent ?? '').toMatch(/^—[\s\S]+—$/)
  })

  it('situation ribbon — full-width accent banner with uppercase mono text', () => {
    vi.mocked(useDesignDirection).mockReturnValue({
      direction: 'situation',
      setDirection: vi.fn(),
    })
    const { container } = renderBar()
    const el = container.querySelector('.cls-ribbon')
    expect(el).not.toBeNull()
    expect(el!.className).toMatch(/bg-\[var\(--accent\)\]/)
    expect(el!.className).toMatch(/\buppercase\b/)
    expect(el!.className).toMatch(/font-mono/)
  })

  it('classification bootstrap marker — show/hide toggles do not render as levels', () => {
    document.documentElement.dataset.classification = 'show'
    vi.mocked(useDesignDirection).mockReturnValue({
      direction: 'situation',
      setDirection: vi.fn(),
    })
    const { container } = renderBar()
    const text = container.textContent ?? ''
    expect(text).toContain('RESTRICTED')
    expect(text).not.toContain('SHOW')
  })

  it('chip variants — ministerial and bureau both render .cls-chip with accent dot', () => {
    for (const direction of ['ministerial', 'bureau'] as const) {
      vi.mocked(useDesignDirection).mockReturnValue({ direction, setDirection: vi.fn() })
      const { container, unmount } = renderBar()
      const chip = container.querySelector('.cls-chip')
      expect(chip, `chip missing for ${direction}`).not.toBeNull()
      expect(chip!.className, `chip should remain in normal document flow for ${direction}`).not.toMatch(
        /\babsolute\b/,
      )
      const dot = chip!.querySelector('span.bg-\\[var\\(--accent\\)\\]')
      expect(dot, `accent dot missing for ${direction}`).not.toBeNull()
      unmount()
    }
  })
})
