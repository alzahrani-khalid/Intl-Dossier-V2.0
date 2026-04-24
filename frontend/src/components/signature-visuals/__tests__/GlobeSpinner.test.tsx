/**
 * GlobeSpinner unit tests (Phase 37 VIZ-03, Plan 04 Task 04-1 — RED).
 *
 * Verifies VIZ-03 contract:
 *   - stroke="currentColor" inheritance from parent CSS color
 *   - role="status" + aria-label a11y announcement
 *   - size prop defaults to 20 and accepts custom values
 *
 * Per .planning/phases/37-signature-visuals/37-VALIDATION.md row 37-04-01.
 *
 * Test titles are referenced by grep in the plan's acceptance criteria — do not
 * rename without updating 37-04-PLAN.md.
 */

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GlobeSpinner } from '../GlobeSpinner'

describe('GlobeSpinner', (): void => {
  it('strokes inherit currentColor from the parent', (): void => {
    const { container } = render(
      <div style={{ color: 'rgb(255, 0, 0)' }}>
        <GlobeSpinner />
      </div>,
    )
    const circle = container.querySelector('circle')
    expect(circle).not.toBeNull()
    expect(circle!.getAttribute('stroke')).toBe('currentColor')

    // Verify every stroked shape inherits currentColor (no hard-coded color fallback)
    const strokedShapes = container.querySelectorAll('circle, ellipse')
    strokedShapes.forEach((el): void => {
      expect(el.getAttribute('stroke')).toBe('currentColor')
    })
  })

  it('exposes role="status" and a default aria-label', (): void => {
    const { getByRole } = render(<GlobeSpinner />)
    const el = getByRole('status')
    expect(el.getAttribute('aria-label')).toBe('Loading')
  })

  it('honors custom aria-label', (): void => {
    const { getByRole } = render(<GlobeSpinner aria-label="Refreshing" />)
    expect(getByRole('status').getAttribute('aria-label')).toBe('Refreshing')
  })

  it('defaults size to 20 and accepts a custom size', (): void => {
    const { container, rerender } = render(<GlobeSpinner />)
    let svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('width')).toBe('20')
    expect(svg!.getAttribute('height')).toBe('20')

    rerender(<GlobeSpinner size={32} />)
    svg = container.querySelector('svg')
    expect(svg!.getAttribute('width')).toBe('32')
    expect(svg!.getAttribute('height')).toBe('32')
  })

  it('passes through className to the wrapping span', (): void => {
    const { getByRole } = render(<GlobeSpinner className="text-danger" />)
    const span = getByRole('status')
    expect(span.className).toContain('text-danger')
  })
})
