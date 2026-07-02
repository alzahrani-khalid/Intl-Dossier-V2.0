/**
 * ClassificationBar.test.tsx — Phase 77 (linear-token-system) collapsed reality.
 *
 * The former direction-matrix (chancery marginalia / situation ribbon /
 * ministerial+bureau chip) is gone — the single-direction engine renders the
 * one Linear `.cls-chip` variant. These tests cover the visibility gate, the
 * chip shape, and the classification-level marker.
 *
 * NOTES ON MOCKING:
 *   - The global `tests/setup.ts` stubs `react-i18next` so `t(key)` returns
 *     the raw key (identity fallback). Good enough for structural assertions.
 *   - `useClassification` is mocked at the module level so each test controls
 *     the gate without a full `<DesignProvider>` tree.
 *   - `useAuthStore` is mocked to supply a minimal user so `getInitials`
 *     has something to chew on.
 */

import type { ReactElement } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

// Module mocks — MUST be declared before `import { ClassificationBar }`.
vi.mock('@/design-system/hooks', () => ({
  useClassification: vi.fn(() => ({ classif: true, setClassif: vi.fn() })),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({ user: { id: 'u1', email: 'k.alzahrani@gastat.gov.sa', name: 'Khalid Alzahrani' } }),
  ),
}))

import { useClassification } from '@/design-system/hooks'
import { ClassificationBar } from './ClassificationBar'

beforeEach(() => {
  vi.clearAllMocks()
  // Ensure html[data-classification] is set so readLevel returns a deterministic value.
  document.documentElement.dataset.classification = 'restricted'
  // Default: gate is open (individual tests override as needed).
  vi.mocked(useClassification).mockReturnValue({ classif: true, setClassif: vi.fn() })
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

  it('linear chip — renders .cls-chip with an accent dot in normal flow', () => {
    const { container } = renderBar()
    const chip = container.querySelector('.cls-chip')
    expect(chip).not.toBeNull()
    expect(chip!.className).not.toMatch(/\babsolute\b/)
    const dot = chip!.querySelector('span.bg-\\[var\\(--accent\\)\\]')
    expect(dot).not.toBeNull()
  })

  it('classification bootstrap marker — show/hide toggles do not render as levels', () => {
    document.documentElement.dataset.classification = 'show'
    const { container } = renderBar()
    const text = container.textContent ?? ''
    expect(text).toContain('RESTRICTED')
    expect(text).not.toContain('SHOW')
  })
})
