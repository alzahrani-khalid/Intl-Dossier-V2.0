/**
 * AppShell.test.tsx — Wave 0 RED scaffold (Phase 36 SHELL-04).
 *
 * Wave 1 Plan 04 will implement the real assertions by importing:
 *   import { AppShell } from './AppShell'
 *
 * Test titles below are referenced verbatim by VALIDATION.md §Per-Task
 * Verification Map (-t grep patterns). Do NOT rename without updating
 * the validation matrix AND the Wave 2 --grep commands.
 */

import { describe, it, expect } from 'vitest'
// Wave 1 will add: import { render } from '@testing-library/react'
// Wave 1 will add: import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('responsive drawer mode — renders hamburger and hides sidebar column at <=1024px', () => {
    // RED: Wave 1 renders AppShell at matchMedia 1024, asserts hamburger present
    // + grid column collapsed to single 1fr track.
    expect(true).toBe(false)
  })

  it('drawer open close — backdrop click + ESC both dismiss', () => {
    // RED: Wave 1 opens drawer, clicks backdrop, expects closed; reopens, ESC.
    expect(true).toBe(false)
  })

  it('drawer rtl flip — html[dir=rtl] flips translateX sign', () => {
    // RED: Wave 1 asserts drawer placement="left" under dir=rtl flips to right edge.
    expect(true).toBe(false)
  })

  it('phone layout — at <=640px topbar wraps + drawer is 100vw', () => {
    // RED: Wave 1 renders at 640px viewport, asserts drawer width === 100vw.
    expect(true).toBe(false)
  })
})
