/**
 * ClassificationBar.test.tsx — Wave 0 RED scaffold (Phase 36 SHELL-03).
 *
 * Wave 1 Plan 03 will implement real assertions by importing:
 *   import { ClassificationBar } from './ClassificationBar'
 *
 * Titles match VALIDATION.md §Per-Task Verification Map task ids
 * 36-03-01 / 36-03-02 / 36-03-03 / 36-03-04. Do NOT rename.
 */

import { describe, it, expect } from 'vitest'
// Wave 1 will add: import { render, screen } from '@testing-library/react'
// Wave 1 will add: import { ClassificationBar } from './ClassificationBar'

describe('ClassificationBar', () => {
  it('visibility gate — renders nothing when useClassification().classification is false', () => {
    // RED: Wave 1 wraps with DesignProvider classification=false, asserts null render.
    expect(true).toBe(false)
  })

  it('chancery marginalia — renders top + bottom strips with workspace label', () => {
    // RED: Wave 1 asserts [data-direction="chancery"] emits 2 strip elements + label.
    expect(true).toBe(false)
  })

  it('situation ribbon — renders a single sticky ribbon under the topbar', () => {
    // RED: Wave 1 asserts [data-direction="situation"] emits exactly 1 ribbon.
    expect(true).toBe(false)
  })

  it('chip variants — renders ministerial + bureau as inline Chips per direction', () => {
    // RED: Wave 1 asserts Chip children differ per direction with correct variant class.
    expect(true).toBe(false)
  })
})
