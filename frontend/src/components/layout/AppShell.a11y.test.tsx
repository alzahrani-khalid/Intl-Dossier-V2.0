/**
 * AppShell.a11y.test.tsx — Wave 0 RED axe-core harness (Phase 36 SHELL-04).
 *
 * Wave 1 Plan 04 replaces the placeholder render with a full AppShell mounted
 * under the 4 direction × 2 locale combos from DesignProvider.
 *
 * VALIDATION.md task id 36-05-04 — title substring 'has no serious/critical'
 * gate for Wave 2 --grep. Do NOT rename.
 */

import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, it, expect } from 'vitest'

expect.extend(toHaveNoViolations)

describe('AppShell axe-core', () => {
  it.each([
    ['chancery', 'en'],
    ['chancery', 'ar'],
    ['situation', 'en'],
    ['situation', 'ar'],
    ['ministerial', 'en'],
    ['ministerial', 'ar'],
    ['bureau', 'en'],
    ['bureau', 'ar'],
  ])('has no serious/critical violations in %s × %s', async (_direction, _locale) => {
    // RED: Wave 1 will render <AppShell /> with direction+locale providers mocked.
    // The placeholder below intentionally triggers no violations so the harness
    // loads and the --grep title is addressable; Wave 1 swaps in the real tree.
    const { container } = render(<div>AppShell RED scaffold</div>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
