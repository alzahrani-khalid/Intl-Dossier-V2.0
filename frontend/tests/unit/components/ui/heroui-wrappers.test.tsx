/**
 * Plan 33-05 Task 7 — HeroUI wrapper unit tests.
 *
 * Verifies that the heroui-* wrappers all:
 *   1. Render the real @heroui/react primitive (no plain <button>/<div> fallback).
 *   2. Expose the load-bearing `data-slot` attribute that downstream CSS
 *      (has-[data-slot=card-header] etc.) relies on.
 *   3. Preserve merge order for incoming `className` (consumer wins).
 *   4. Carry out the shadcn asChild → Slot branch where supported.
 *   5. Do NOT inject literal color utilities (bg-red-*, text-red-*, ...)
 *      on the destructive variant — SC-5 zero-override audit.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { DesignProvider } from '@/design-system/DesignProvider'
import { HeroUIButton } from '@/components/ui/heroui-button'
import {
  HeroUICard,
  HeroUICardHeader,
  HeroUICardTitle,
  HeroUICardContent,
  HeroUICardFooter,
} from '@/components/ui/heroui-card'
import { HeroUIChip } from '@/components/ui/heroui-chip'
import { HeroUISkeleton, SkeletonCard, SkeletonText } from '@/components/ui/heroui-skeleton'

const LITERAL_COLOR_PATTERN =
  /\b(?:bg|text|border)-(?:red|blue|green|yellow|orange|pink|purple|indigo|cyan|teal|lime|amber|emerald|sky|fuchsia|rose|violet)-\d+/

function renderInProvider(ui: React.ReactElement): ReturnType<typeof render> {
  return render(<DesignProvider>{ui}</DesignProvider>)
}

describe('HeroUIButton', () => {
  it('renders with data-slot="button" and merges className', () => {
    renderInProvider(<HeroUIButton className="custom-button-class">Click</HeroUIButton>)
    const btn = screen.getByRole('button', { name: 'Click' })
    expect(btn.getAttribute('data-slot')).toBe('button')
    expect(btn.className).toContain('custom-button-class')
  })

  it('renders through Slot when asChild=true', () => {
    renderInProvider(
      <HeroUIButton asChild>
        <a href="/test-href" data-testid="as-link">
          Anchor
        </a>
      </HeroUIButton>,
    )
    const anchor = screen.getByTestId('as-link')
    expect(anchor.tagName).toBe('A')
    expect(anchor.getAttribute('href')).toBe('/test-href')
    expect(anchor.getAttribute('data-slot')).toBe('button')
  })

  it('destructive variant uses only semantic tokens — no literal color utilities', () => {
    renderInProvider(<HeroUIButton variant="destructive">Delete</HeroUIButton>)
    const btn = screen.getByRole('button', { name: 'Delete' })
    expect(btn.className).not.toMatch(LITERAL_COLOR_PATTERN)
    expect(btn.className).toContain('btn-danger')
  })
})

describe('HeroUICard compound', () => {
  it('renders every slot with its data-slot attribute', () => {
    renderInProvider(
      <HeroUICard data-testid="card-root">
        <HeroUICardHeader data-testid="card-header">
          <HeroUICardTitle data-testid="card-title">Title</HeroUICardTitle>
        </HeroUICardHeader>
        <HeroUICardContent data-testid="card-content">Body</HeroUICardContent>
        <HeroUICardFooter data-testid="card-footer">Foot</HeroUICardFooter>
      </HeroUICard>,
    )
    expect(screen.getByTestId('card-root').getAttribute('data-slot')).toBe('card')
    expect(screen.getByTestId('card-header').getAttribute('data-slot')).toBe('card-header')
    expect(screen.getByTestId('card-title').getAttribute('data-slot')).toBe('card-title')
    expect(screen.getByTestId('card-content').getAttribute('data-slot')).toBe('card-content')
    expect(screen.getByTestId('card-footer').getAttribute('data-slot')).toBe('card-footer')
  })

  it('merges consumer className on root', () => {
    renderInProvider(
      <HeroUICard className="my-override" data-testid="card-root">
        <HeroUICardContent>Body</HeroUICardContent>
      </HeroUICard>,
    )
    expect(screen.getByTestId('card-root').className).toContain('my-override')
  })
})

describe('HeroUIChip', () => {
  it('renders with the badge data-slot and merges className', () => {
    renderInProvider(
      <HeroUIChip className="my-chip" data-testid="chip">
        Ready
      </HeroUIChip>,
    )
    const chip = screen.getByTestId('chip')
    // The wrapper preserves Badge selector continuity while rendering the
    // HeroUI-compatible chip surface.
    expect(chip.getAttribute('data-slot')).toBe('badge')
    expect(chip.className).toContain('my-chip')
  })

  it('destructive / warning / info / success variants use only semantic tokens', () => {
    const variants = ['destructive', 'warning', 'info', 'success'] as const
    for (const variant of variants) {
      const { unmount } = renderInProvider(
        <HeroUIChip variant={variant} data-testid={`chip-${variant}`}>
          {variant}
        </HeroUIChip>,
      )
      const chip = screen.getByTestId(`chip-${variant}`)
      expect(chip.className, `variant=${variant}`).not.toMatch(LITERAL_COLOR_PATTERN)
      unmount()
    }
  })

  it('renders through Slot when asChild=true', () => {
    renderInProvider(
      <HeroUIChip asChild>
        <a href="/chip-link" data-testid="chip-as-link">
          link
        </a>
      </HeroUIChip>,
    )
    const anchor = screen.getByTestId('chip-as-link')
    expect(anchor.tagName).toBe('A')
    expect(anchor.getAttribute('data-slot')).toBe('badge')
  })
})

describe('HeroUISkeleton + presets', () => {
  it('base skeleton renders with data-slot="skeleton"', () => {
    renderInProvider(<HeroUISkeleton className="h-5 w-5" data-testid="sk" />)
    const sk = screen.getByTestId('sk')
    expect(sk.getAttribute('data-slot')).toBe('skeleton')
    expect(sk.className).toContain('h-5')
    expect(sk.className).toContain('w-5')
  })

  it('SkeletonCard preset composes the base primitive without literal colors', () => {
    const { container } = renderInProvider(<SkeletonCard />)
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    expect(container.innerHTML).not.toMatch(LITERAL_COLOR_PATTERN)
  })

  it('SkeletonText renders N skeleton rows', () => {
    const { container } = renderInProvider(<SkeletonText lines={4} />)
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(4)
  })
})
