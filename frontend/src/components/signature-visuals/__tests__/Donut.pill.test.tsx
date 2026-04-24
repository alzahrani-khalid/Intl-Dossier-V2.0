/**
 * Donut center pill tests (Phase 37 VIZ-05, Plan 07 Task 07-1 — RED).
 *
 * Verifies the center `<text>` pill displays the rounded percentage using
 * the Phase 35 `--font-display` cascade, fills with `var(--ink)`, and is
 * centered horizontally + vertically.
 *
 * Test titles referenced by grep in 37-07-PLAN.md acceptance criteria — do
 * not rename without updating the plan.
 */

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Donut } from '../Donut'

const getPill = (container: HTMLElement): SVGTextElement | null =>
  container.querySelector('text')

describe('Donut center pill (37-07-02)', (): void => {
  it('renders rounded percentage text for value={78.4} → "78%"', (): void => {
    const { container } = render(<Donut value={78.4} variants={[50, 30, 0]} />)
    const text = getPill(container)
    expect(text).not.toBeNull()
    expect(text!.textContent).toBe('78%')
  })

  it('renders "0%" when value=0 and "100%" when value=100', (): void => {
    const { container: zero } = render(<Donut value={0} variants={[0, 0, 0]} />)
    expect(getPill(zero)!.textContent).toBe('0%')

    const { container: full } = render(<Donut value={100} variants={[100, 0, 0]} />)
    expect(getPill(full)!.textContent).toBe('100%')
  })

  it('font-family resolves to the --font-display cascade (inline style or attribute)', (): void => {
    const { container } = render(<Donut value={50} variants={[50, 30, 20]} />)
    const text = getPill(container)!
    const inlineStyle = text.getAttribute('style') ?? ''
    const fontFamilyAttr = text.getAttribute('font-family') ?? ''
    const combined = `${inlineStyle} ${fontFamilyAttr}`
    expect(combined).toContain('var(--font-display)')
  })

  it('fill is var(--ink)', (): void => {
    const { container } = render(<Donut value={42} variants={[40, 30, 20]} />)
    const text = getPill(container)!
    expect(text.getAttribute('fill')).toBe('var(--ink)')
  })

  it('is centered: text-anchor="middle" and dominant-baseline set for vertical centering', (): void => {
    const { container } = render(<Donut value={42} variants={[40, 30, 20]} />)
    const text = getPill(container)!
    expect(text.getAttribute('text-anchor')).toBe('middle')
    // dominant-baseline="middle" is the canonical way to vertically center
    // SVG text around (x, y). Accept "middle" or "central" — both center.
    const baseline = text.getAttribute('dominant-baseline') ?? ''
    expect(['middle', 'central']).toContain(baseline)
  })
})
