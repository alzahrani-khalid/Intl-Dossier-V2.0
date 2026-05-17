/**
 * Phase 37 — `<Sparkline>` math + rendering tests (VALIDATION row 37-06-01).
 *
 * Covers: polyline points math (min-max normalized), trailing dot position,
 * default dimensions, edge cases (empty array, single point → min===max guard),
 * stroke + className passthrough.
 */
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/design-system/hooks', async (): Promise<typeof import('@/design-system/hooks')> => {
  const actual =
    await vi.importActual<typeof import('@/design-system/hooks')>('@/design-system/hooks')
  return {
    ...actual,
    useLocale: (): { locale: 'ar' | 'en'; setLocale: (l: 'ar' | 'en') => void } => ({
      locale: 'en',
      setLocale: vi.fn(),
    }),
  }
})

import { Sparkline } from '../Sparkline'

const parsePoints = (pointsAttr: string): Array<{ x: number; y: number }> =>
  pointsAttr
    .trim()
    .split(/\s+/)
    .map((pair): { x: number; y: number } => {
      const [xStr, yStr] = pair.split(',')
      return { x: Number(xStr), y: Number(yStr) }
    })

describe('Sparkline — math + rendering', (): void => {
  it('renders an svg with default width=80 and height=22 (VIZ-05 locked)', (): void => {
    const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('width')).toBe('80')
    expect(svg!.getAttribute('height')).toBe('22')
    expect(svg!.getAttribute('viewBox')).toBe('0 0 80 22')
  })

  it('normalizes [1,2,3,4,5] to polyline first=(0,22) last=(80,0) monotonically', (): void => {
    const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} />)
    const polyline = container.querySelector('polyline')
    expect(polyline).not.toBeNull()
    const pts = parsePoints(polyline!.getAttribute('points') ?? '')
    expect(pts).toHaveLength(5)
    // First point: x=0, y=22 (min value → bottom)
    expect(pts[0].x).toBeCloseTo(0, 1)
    expect(pts[0].y).toBeCloseTo(22, 1)
    // Last point: x=80, y=0 (max value → top)
    expect(pts[4].x).toBeCloseTo(80, 1)
    expect(pts[4].y).toBeCloseTo(0, 1)
    // Monotonic: x strictly increasing, y strictly decreasing
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].x).toBeGreaterThan(pts[i - 1].x)
      expect(pts[i].y).toBeLessThan(pts[i - 1].y)
    }
  })

  it('places the trailing dot at the last polyline point', (): void => {
    const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} />)
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(1)
    const cx = Number(circles[0].getAttribute('cx'))
    const cy = Number(circles[0].getAttribute('cy'))
    expect(cx).toBeCloseTo(80, 1)
    expect(cy).toBeCloseTo(0, 1)
  })

  it('renders no polyline and no NaN for empty data={[]}', (): void => {
    const { container } = render(<Sparkline data={[]} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(container.querySelector('polyline')).toBeNull()
    expect(container.querySelector('circle')).toBeNull()
    // No NaN anywhere in the SVG tree
    expect(svg!.outerHTML).not.toContain('NaN')
  })

  it('handles single-point data={[5]} without divide-by-zero (min===max)', (): void => {
    const { container } = render(<Sparkline data={[5]} />)
    const svg = container.querySelector('svg')!
    expect(svg.outerHTML).not.toContain('NaN')
    // No polyline for a single point — only the trailing dot is meaningful.
    expect(container.querySelector('polyline')).toBeNull()
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(1)
    const cy = Number(circles[0].getAttribute('cy'))
    // Pinned to vertical center (height/2) per plan to avoid misleading top/bottom placement.
    expect(cy).toBeCloseTo(11, 1)
  })

  it('applies custom stroke to polyline and circle', (): void => {
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#Sparkline.test
    const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} stroke="#ff0000" />)
    const polyline = container.querySelector('polyline')!
    const circle = container.querySelector('circle')!
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#Sparkline.test
    expect(polyline.getAttribute('stroke')).toBe('#ff0000')
    // Circle fill matches stroke color so the dot reads as a terminator.
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#Sparkline.test
    expect(circle.getAttribute('fill')).toBe('#ff0000')
  })

  it('passes className through to the root svg', (): void => {
    const { container } = render(
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#Sparkline.test
      <Sparkline data={[1, 2, 3]} className="text-emerald-500" />,
    )
    const svg = container.querySelector('svg')!
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#Sparkline.test
    expect(svg.getAttribute('class')).toContain('text-emerald-500')
  })

  it('accepts custom width and height', (): void => {
    const { container } = render(<Sparkline data={[1, 2, 3, 4]} width={160} height={44} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('160')
    expect(svg.getAttribute('height')).toBe('44')
    expect(svg.getAttribute('viewBox')).toBe('0 0 160 44')
  })
})
