/**
 * Topbar.test.tsx — Wave 0 RED scaffold (Phase 36 SHELL-02).
 *
 * Wave 1 Plan 02 will implement real assertions by importing:
 *   import { Topbar } from './Topbar'
 *
 * Titles match VALIDATION.md §Per-Task Verification Map task ids
 * 36-02-01 / 36-02-02 / 36-02-03. Do NOT rename.
 */

import { describe, it, expect } from 'vitest'
// Wave 1 will add: import { render, screen } from '@testing-library/react'
// Wave 1 will add: import { Topbar } from './Topbar'

describe('Topbar', () => {
  it('item order — renders the 7 controls in the JSX order documented in UI-SPEC', () => {
    // RED: Wave 1 renders Topbar, reads children order, asserts it matches the
    // UI-SPEC §"Topbar Anatomy" reading order (RTL-aware via forceRTL rule 1).
    expect(true).toBe(false)
  })

  it('kbd hint responsive — hides the ⌘K hint under the sm breakpoint', () => {
    // RED: Wave 1 mounts at 360px viewport, asserts data-testid="kbd-hint" hidden.
    expect(true).toBe(false)
  })

  it('tweaks trigger — opening the Topbar tweaks button calls useTweaksOpen().open', () => {
    // RED: Wave 1 spies on TweaksDisclosureProvider, clicks the trigger, asserts open().
    expect(true).toBe(false)
  })
})
