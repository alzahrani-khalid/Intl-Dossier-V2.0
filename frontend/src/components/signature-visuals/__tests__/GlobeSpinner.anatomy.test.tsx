/**
 * GlobeSpinner SVG anatomy tests (Phase 37 VIZ-03, Plan 04 Task 04-1 — RED).
 *
 * Verifies verbatim handoff port: viewBox, gs-whirl / gs-globe groups, and
 * shape attributes (radius, stroke-width, dasharray, opacity) per
 * .planning/phases/37-signature-visuals/37-VALIDATION.md row 37-04-02 and
 * /tmp/inteldossier-handoff/inteldossier/project/src/loader.jsx lines 121-144.
 *
 * Test titles are referenced by grep in the plan's acceptance criteria — do not
 * rename without updating 37-04-PLAN.md.
 */

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GlobeSpinner } from '../GlobeSpinner'

describe('GlobeSpinner anatomy', (): void => {
  it('renders an svg with the handoff viewBox "0 0 40 40"', (): void => {
    const { container } = render(<GlobeSpinner />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('viewBox')).toBe('0 0 40 40')
  })

  it('has exactly one .gs-whirl group and one .gs-globe group', (): void => {
    const { container } = render(<GlobeSpinner />)
    expect(container.querySelectorAll('g.gs-whirl').length).toBe(1)
    expect(container.querySelectorAll('g.gs-globe').length).toBe(1)
  })

  it('.gs-whirl contains the signature arc (r=18, dasharray=14 90, opacity=0.55)', (): void => {
    const { container } = render(<GlobeSpinner />)
    const whirl = container.querySelector('g.gs-whirl')
    expect(whirl).not.toBeNull()
    const arc = whirl!.querySelector('circle')
    expect(arc).not.toBeNull()
    expect(arc!.getAttribute('r')).toBe('18')
    // React serializes strokeWidth -> stroke-width
    expect(arc!.getAttribute('stroke-width')).toBe('1.4')
    expect(arc!.getAttribute('stroke-dasharray')).toBe('14 90')
    expect(arc!.getAttribute('opacity')).toBe('0.55')
    expect(arc!.getAttribute('stroke-linecap')).toBe('round')
  })

  it('.gs-globe contains one r=11 circle and two ellipses forming the X-pattern', (): void => {
    const { container } = render(<GlobeSpinner />)
    const globe = container.querySelector('g.gs-globe')
    expect(globe).not.toBeNull()

    const circles = globe!.querySelectorAll('circle')
    expect(circles.length).toBe(1)
    expect(circles[0].getAttribute('r')).toBe('11')

    const ellipses = globe!.querySelectorAll('ellipse')
    expect(ellipses.length).toBe(2)

    // First ellipse: wide horizontal (rx=11, ry=4.5)
    expect(ellipses[0].getAttribute('rx')).toBe('11')
    expect(ellipses[0].getAttribute('ry')).toBe('4.5')

    // Second ellipse: tall vertical (rx=4.5, ry=11) — rx/ry swapped for X-pattern
    expect(ellipses[1].getAttribute('rx')).toBe('4.5')
    expect(ellipses[1].getAttribute('ry')).toBe('11')
  })

  it('fills are "none" on every shape — strokes only', (): void => {
    const { container } = render(<GlobeSpinner />)
    const shapes = container.querySelectorAll('g.gs-whirl > *, g.gs-globe > *')
    expect(shapes.length).toBeGreaterThan(0)
    shapes.forEach((el): void => {
      expect(el.getAttribute('fill')).toBe('none')
    })
  })
})
