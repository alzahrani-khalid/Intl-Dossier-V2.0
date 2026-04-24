/**
 * Donut dasharray segment math tests (Phase 37 VIZ-05, Plan 07 Task 07-1 — RED).
 *
 * Verifies three stacked `strokeDasharray` segments (ok/risk/bad), segment
 * lengths equal `(percentage / 100) * 2πr`, stacking offsets accumulate,
 * sub-100% totals leave a visible track gap, clamping at per-variant 100%,
 * and each segment rotates -90° to start at 12 o'clock.
 *
 * Test titles referenced by grep in 37-07-PLAN.md acceptance criteria — do
 * not rename without updating the plan.
 */

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Donut } from '../Donut'

const getStrokedSegments = (container: HTMLElement): Element[] =>
  Array.from(container.querySelectorAll('circle')).filter(
    (c): boolean => c.getAttribute('stroke-dasharray') !== null,
  )

const parseFirstSeg = (el: Element | undefined): number =>
  Number((el?.getAttribute('stroke-dasharray') ?? '').split(/\s+/)[0])

describe('Donut dasharray segments (37-07-01)', (): void => {
  it('renders ok/risk/bad segments with lengths equal to (pct/100) * 2 * Math.PI * r', (): void => {
    const { container } = render(<Donut value={50} variants={[60, 30, 10]} />)
    const segs = getStrokedSegments(container)
    expect(segs).toHaveLength(3)
    const [circleOk, circleRisk, circleBad] = segs
    const r = Number(circleOk?.getAttribute('r'))
    expect(r).toBeGreaterThan(0)
    const circumference = 2 * Math.PI * r
    expect(parseFirstSeg(circleOk)).toBeCloseTo(circumference * 0.6, 0)
    expect(parseFirstSeg(circleRisk)).toBeCloseTo(circumference * 0.3, 0)
    expect(parseFirstSeg(circleBad)).toBeCloseTo(circumference * 0.1, 0)
  })

  it('stacks strokeDashoffset so segments chain: 0, -segOk, -(segOk + segRisk)', (): void => {
    const { container } = render(<Donut value={50} variants={[60, 30, 10]} />)
    const segs = getStrokedSegments(container)
    const r = Number(segs[0]?.getAttribute('r'))
    const circumference = 2 * Math.PI * r
    const segOk = circumference * 0.6
    const segRisk = circumference * 0.3

    const offOk = Number(segs[0]?.getAttribute('stroke-dashoffset'))
    const offRisk = Number(segs[1]?.getAttribute('stroke-dashoffset'))
    const offBad = Number(segs[2]?.getAttribute('stroke-dashoffset'))

    expect(offOk).toBeCloseTo(0, 5)
    expect(offRisk).toBeCloseTo(-segOk, 0)
    expect(offBad).toBeCloseTo(-(segOk + segRisk), 0)
  })

  it('leaves the remaining arc unpainted when variants sum < 100', (): void => {
    const { container } = render(<Donut value={50} variants={[40, 20, 10]} />)
    const segs = getStrokedSegments(container)
    expect(segs).toHaveLength(3)
    const r = Number(segs[0]?.getAttribute('r'))
    const circumference = 2 * Math.PI * r
    const painted =
      parseFirstSeg(segs[0]) + parseFirstSeg(segs[1]) + parseFirstSeg(segs[2])
    // Painted arc is 70% of the circle — the remaining 30% is track only.
    expect(painted).toBeCloseTo(circumference * 0.7, 0)
    expect(painted).toBeLessThan(circumference)
    // Track circle (no dasharray) is still present.
    const allCircles = container.querySelectorAll('circle')
    const trackCircles = Array.from(allCircles).filter(
      (c): boolean => c.getAttribute('stroke-dasharray') === null,
    )
    expect(trackCircles.length).toBeGreaterThanOrEqual(1)
  })

  it('clamps each variant to [0, 100] individually (no NaN, no negative offsets)', (): void => {
    const { container } = render(<Donut value={80} variants={[150, -20, 50]} />)
    const segs = getStrokedSegments(container)
    const r = Number(segs[0]?.getAttribute('r'))
    const circumference = 2 * Math.PI * r
    // 150 clamps to 100, -20 clamps to 0, 50 stays 50.
    expect(parseFirstSeg(segs[0])).toBeCloseTo(circumference, 0)
    expect(parseFirstSeg(segs[1])).toBeCloseTo(0, 0)
    expect(parseFirstSeg(segs[2])).toBeCloseTo(circumference * 0.5, 0)
    segs.forEach((s): void => {
      expect(Number.isNaN(parseFirstSeg(s))).toBe(false)
    })
  })

  it('rotates each segment -90 around its center so arcs start at 12 o\'clock', (): void => {
    const { container } = render(<Donut value={50} variants={[60, 30, 10]} />)
    const segs = getStrokedSegments(container)
    segs.forEach((s): void => {
      const t = s.getAttribute('transform') ?? ''
      expect(t).toMatch(/rotate\(-90/)
    })
  })

  it('strokes use CSS var tokens — no hex literals on segments', (): void => {
    const { container } = render(<Donut value={50} variants={[60, 30, 10]} />)
    const segs = getStrokedSegments(container)
    const strokes = segs.map((s): string => s.getAttribute('stroke') ?? '')
    expect(strokes[0]).toContain('var(--ok)')
    expect(strokes[1]).toContain('var(--risk)')
    expect(strokes[2]).toContain('var(--bad)')
  })
})
